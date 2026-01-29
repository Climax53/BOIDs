const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;
let robot = null;
let jiggleActive = false;

try {
  robot = require('robotjs');
} catch (error) {
  robot = null;
}

const createWindow = () => {
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0f2b1f',
    icon: path.join(__dirname, 'logo.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const startMouseJiggle = () => {
  jiggleActive = true;
};

const stopMouseJiggle = () => {
  jiggleActive = false;
};

ipcMain.on('mouse-jiggle-start', startMouseJiggle);
ipcMain.on('mouse-jiggle-stop', stopMouseJiggle);
ipcMain.on('mouse-jiggle-move', (event, payload) => {
  if (!jiggleActive || !robot || !payload) {
    return;
  }
  const { x, y } = payload;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    robot.moveMouse(x, y);
  }
});
