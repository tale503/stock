// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
let { ipcRenderer } = require('electron');
// ipcRenderer.on('web', function(evev, arg) {
//   if (arg.type === 'data') {
//     const replaceText = (selector, text) => {
//       const element = document.getElementById(selector)
//       if (element) element.innerText = text
//     }
//     for (const type of ['name', 'price', 'rate']) {
//       replaceText(`${type}`, arg.value[type])
//     }
//   }
// })

function getData(arg) {
  if (arg['async'] !== undefined && arg['async'] === false) {
    ipcRenderer.send('db', arg);
  } else {
    return ipcRenderer.sendSync('db', arg);
  }
}

function replaceText(data) {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  for (const type of ['name', 'price', 'rate']) {
    replaceText(`${type}`, data[type])
  }
}

function replaceHtml(data) {
  const element = document.getElementById('main')
  let _html = ''
  for (let item of data) {
    _html += `<div><span>${item.price}</span><span>${item.rate}%</span></div>`
  }
  element.innerHTML = _html
}

window.addEventListener('DOMContentLoaded', () => {
  let stockArr = ['sh600754', 'sh600559']
  let data = getData({ type: 'get_data', stock: stockArr });
  replaceHtml(data);
  setInterval(() => {
    data = getData({ type: 'get_data', stock: stockArr });
    replaceHtml(data);
  }, 3000);
  
})
