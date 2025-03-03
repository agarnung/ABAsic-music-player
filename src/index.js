const { app, BrowserWindow, ipcMain, Menu } = require('electron'); 
const path = require('node:path');

let startWindow;
let songWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Configuración común para las ventanas
function getWindowConfig() {
  return {
    width: 400,
    height: 500,
    resizable: false,
    frame: false, // Sin marco de ventana
    center: false, // No centrar la ventana automáticamente
    maximizable: false, // Deshabilita la maximización
    fullscreenable: false, // Deshabilita el modo pantalla completa
    icon: path.join(__dirname, '../assets/icons/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  };
}

// Crear ventana principal (startWindow)
function createStartWindow() {
  startWindow = new BrowserWindow(getWindowConfig());
  startWindow.loadFile(path.join(__dirname, 'index.html')); // Cargar la página HTML de la ventana principal

  // Ocultar la barra de menús
  Menu.setApplicationMenu(null);

  startWindow.on('closed', () => {
    startWindow = null;
  });

  // startWindow.webContents.openDevTools();
}

// Crear ventana secundaria (songWindow)
function createSongWindow() {
  songWindow = new BrowserWindow(getWindowConfig());
  songWindow.loadFile(path.join(__dirname, 'songWindow.html')); // Cargar la página HTML de la ventana secundaria

  songWindow.on('closed', () => {
    songWindow = null;
  });
}

// Eventos IPC

// En main.js (modificar estos listeners)
ipcMain.on('open-song-window', () => {
  if (!songWindow) {
      createSongWindow();
  }
  startWindow.hide();
});

ipcMain.on('close-song-window', () => {
  if (songWindow) {
      songWindow.close();
      songWindow = null;
  }
  startWindow.show();
});

ipcMain.on('minimize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.minimize();
});

ipcMain.on('close-window', () => {
  if (startWindow) {
    startWindow.close();
  }
  if (songWindow) {
    songWindow.close(); 
  }
});

// Este método se llama cuando Electron ha terminado de inicializar
app.whenReady().then(() => {
  createStartWindow(); // Crear la ventana principal al iniciar

  // On OS X it's common to re-create a window in the app when the dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createStartWindow(); // Re-crear la ventana principal si no hay ventanas abiertas
    }
  });
});

// Cerrar la aplicación cuando todas las ventanas se cierren
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
