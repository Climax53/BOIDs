const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mouseJiggler', {
  start: () => ipcRenderer.send('mouse-jiggle-start'),
  stop: () => ipcRenderer.send('mouse-jiggle-stop'),
  move: (x, y) => ipcRenderer.send('mouse-jiggle-move', { x, y })
});
