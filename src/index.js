const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { pathToFileURL } = require('url');
const path = require('node:path');
const fs = require('fs');

let startWindow;
let songWindow;
let currentMode = 'local';
let modeData = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Configuración común para las ventanas
function getWindowConfig() {
  return {
    width: 400,
    height: 500,
    resizable: true,
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

  startWindow.webContents.openDevTools();
}

// Crear ventana secundaria (songWindow)
function createSongWindow() {
  songWindow = new BrowserWindow(getWindowConfig());

  const query = { mode: currentMode };
  if (currentMode === 'spotify') query.url = modeData;
  if (currentMode === 'local') query.folder = modeData;

  songWindow.loadFile(path.join(__dirname, 'songWindow.html'), { query });

  songWindow.on('closed', () => {
    songWindow = null;
  });

  songWindow.webContents.openDevTools();
}

function getSongsFromFolder(folder) {
  console.log("Buscando canciones en la carpeta:", folder); // Log para verificar la carpeta
  const files = fs.readdirSync(folder);
  const songs = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.ogg'].includes(ext);
  }).map(file => {
    const songPath = pathToFileURL(path.join(folder, file)).href;
    console.log("Canción encontrada:", songPath); // Log para verificar cada canción
    return songPath;
  });
  console.log("Total de canciones encontradas:", songs.length); // Log para verificar el total
  return songs;
}

// Eventos IPC

ipcMain.on('open-song-window', () => {
  createSongWindow();
  if (startWindow) startWindow.hide();
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

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.on('set-mode', (_, { mode, data }) => {
  console.log(`Modo establecido: ${mode}, Datos: ${data}`); // Log para verificar el modo y los datos
  currentMode = mode;
  modeData = data;

  if (mode === 'local') {
    const songs = getSongsFromFolder(data);
    console.log("Canciones encontradas:", songs); // Log para verificar las canciones
    if (songWindow) {
      console.log("Enviando canciones a la ventana de reproducción..."); // Log para verificar el envío
      songWindow.webContents.send('update-songs', { songs });
    } else {
      console.error("La ventana de reproducción no está abierta"); // Log para verificar si la ventana está abierta
    }
  }
});

ipcMain.handle('get-mode', () => ({ mode: currentMode, data: modeData }));

ipcMain.handle('get-songs-from-folder', async (event, folder) => {
  console.log("Obteniendo canciones de la carpeta:", folder);
  const files = fs.readdirSync(folder);
  const songs = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.ogg'].includes(ext);
  }).map(file =>
      pathToFileURL(path.join(folder, file)).href
  );
  console.log("Canciones encontradas:", songs);
  return songs;
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
