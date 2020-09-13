// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url');
const _ = require('lodash');
const util = require('util');
const fs = require('fs');
const request = require('request');
const iconv = require('iconv-lite');

const URL_API = 'http://qt.gtimg.cn/q='

const PATH_USER_DATA = app.getPath('userData');

let mainWindow;

let stock_list = [];

function checkPath(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
}

async function getJsonStorage(k) {
  let filePath = path.join(PATH_USER_DATA, `./${k}.json`);
  if (!checkPath(filePath)) return null;
  try {
    return JSON.parse(await util.promisify(fs.readFile)(filePath, 'utf-8'));
  } catch (e) {
    fs.unlinkSync(filePath);
  }
}

async function setJsonStorage(k, v) {
  try {
    await util.promisify(fs.writeFile)(path.join(PATH_USER_DATA, `./${k}.json`), JSON.stringify(v, null, 2));
  } catch (e) {
  }
}

async function HttpGet(code) {
  let _http = async () => {
    return await util.promisify(request)({
      url: `${URL_API}${code}`,
      method: 'get',
      headers: {
        "content-type": "application/json",
      },
      encoding: null,
      json: false
    });
  };
  try {
    let data = await _http();
    if (_.get(data, 'statusCode') !== 200) data = await _http();
    if (_.get(data, 'statusCode') !== 200) data = await _http();
    if (_.get(data, 'statusCode') !== 200) data = await _http();
    if (_.get(data, 'statusCode') === 200) {
      return iconv.decode(_.get(data, 'body'), 'gb2312').toString();
    } else {
      logger.error(`HTTPGET_ERROR:${url}`);
    }
  } catch (e) {
    return null;
    logger.error(`HTTPGET_ERROR:${url}`);
  }
}

async function getData() {
  let stockArr = await getJsonStorage('stock_data') || ['sh000001'];
  let list = [];
  let url = '';
  for (let item of stockArr) {
    url += `${item},`
  }
  try {
    const data = await HttpGet(url);
    let list_arr = data.split(';') || [];
    for (let item of list_arr.slice(0, list_arr.length - 1)) {
      let arr = item.split('~');
      const stock_name = arr[1];
      const stock_code = _.trim(arr[0]).substring(2,10);
      const now_price = arr[3];
      const yesterday_price = arr[4];
      const today_price = arr[5];
      const rate = ((now_price - yesterday_price) / yesterday_price * 100).toFixed(2);
      if (stock_name) {
        list.push({
          name: stock_name,
          code: stock_code,
          price: now_price,
          rate: rate
        })
      }
    }
    if (list.length === 0 || (list.length === 1 && !list[0].name)) {
      await setJsonStorage('stock_data', ['sh000001']);
      await getData()
    }
    stock_list = list
    return list;
  } catch (e) {}
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'stock',
    x: 0,
    y: 0,
    width: 284,
    height: 30,
    transparent: true,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegrationInSubFrames: true,
      nodeIntegration: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let child
app.whenReady().then(async () => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('db', async (event, arg) => {
  try {
    if (arg.type === 'get_data') {
      event.returnValue = await getData();
    } else if (arg.type === 'open_child') {
      child = new BrowserWindow({
        title: 'stock',
        parent: 'top',
        show: false,
        width: 300,
        height: 400,
        webPreferences: {
          nodeIntegrationInSubFrames: true,
          nodeIntegration: true,
          webviewTag: true,
          preload: path.join(__dirname, 'preload.js')
        }
      })
      child.loadFile('child.html')
      child.once('ready-to-show', () => {
        child.show()
        child.webContents.send('web',{type:'data'});
      })
    } else if (arg.type === 'set_data') {
      let _data = await getJsonStorage('stock_data') || [];
      if (_data && _data.length) {
        _data.push(arg.value)
      } else {
        _data = [arg.value]
      }
      await setJsonStorage('stock_data', _data);
      child.webContents.send('web',{type:'data'});
      event.returnValue = await getData();
    } else if (arg.type === 'del_data') {
      let _data = await getJsonStorage('stock_data') || [];
      if (_data && _data.length) {
        _data = _.filter(_data, function(o) { return o !== arg.value })
      }
      await setJsonStorage('stock_data', _data);
      child.webContents.send('web',{type:'data'});
      event.returnValue = await getData();
    }
  } catch (e) {}
})