// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
let { ipcRenderer } = require('electron');

ipcRenderer.on('web', function(evev, arg) {
  if (arg.type === 'data') {
    let data = getData({ type: 'get_data'});
    replaceHtmlChild(data);
  }
})

function replaceHtmlChild(data) {
  const element = document.getElementById('prop');
  let _html = '';
  for (let item of data) {
    _html += `<li class="flex">
                <div>${item.name}</div>
                <div class="del-btn" data-code="${item.code}" onclick="delItem(this)">移除</div>
              </li>`
  }
  element.innerHTML = _html
}

function getData(arg) {
  if (arg['async'] !== undefined && arg['async'] === false) {
    ipcRenderer.send('db', arg);
  } else {
    return ipcRenderer.sendSync('db', arg);
  }
}

function replaceHtml(data) {
  const element = document.getElementById('main');
  let _html = '';
  for (let item of data) {
    _html += `<div><span>${item.name.substring(0,2)}</span><span>${item.price}</span><span>${item.rate}%</span></div>`
  }
  element.innerHTML = _html
}

window.addEventListener('DOMContentLoaded', () => {
  let data = getData({ type: 'get_data'});
  replaceHtml(data);
  setInterval(() => {
    data = getData({ type: 'get_data'});
    replaceHtml(data);
  }, 3000);

  document.getElementById('main').ondblclick = function(e) {
    getData({ type: 'open_child'});
  }
})



window.addEventListener("load", () => {
  document.getElementById('add').onclick = function(e) {
    let val = document.getElementById('ipt').value
    if (!val) {
      alert('请输入代码');
      return
    }
    let data = getData({ type: 'set_data', value: val});
  }

  delItem = function(e) {
    let code = e.getAttribute('data-code');
    let data = getData({ type: 'del_data', value: code});
  }
  
})


