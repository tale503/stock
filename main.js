// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const _ = require('lodash');
const util = require('util');
const request = require('request');

const URL_API = 'http://qt.gtimg.cn/q='

let mainWindow;

async function HttpGet(code) {
  let _http = async () => {
    return await util.promisify(request)({
      url: `${URL_API}${code}`,
      method: 'get',
      json: true
    });
  };
  try {
    let data = await _http();
    if (_.get(data, 'statusCode') !== 200) data = await _http();
    if (_.get(data, 'statusCode') !== 200) data = await _http();
    if (_.get(data, 'statusCode') !== 200) data = await _http();
    if (_.get(data, 'statusCode') === 200) {
      return _.get(data, 'body');
    } else {
      logger.error(`HTTPGET_ERROR:${url}`);
    }
  } catch (e) {
    return null;
    logger.error(`HTTPGET_ERROR:${url}`);
  }
}

async function getData(stockArr) {
  let list = [];
  for (let item of stockArr) {
    const data = await HttpGet(item);
    let arr = data.split('~');
    const stock_name = arr[1];
    const now_price = arr[3];
    const yesterday_price = arr[4];
    const today_price = arr[5];
    const rate = ((now_price - yesterday_price) / yesterday_price * 100).toFixed(2);
    list.push({
      name: stock_name,
      price: now_price,
      rate: rate
    })
  }
  return list;
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: 120,
    height: 60,
    transparent: true,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    webPreferences: {
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
app.whenReady().then(() => {
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('db', async (event, arg) => {
  try {
    if (arg.type === 'get_data') {
      event.returnValue = await getData(arg.stock);
    }
  } catch (e) {}
})