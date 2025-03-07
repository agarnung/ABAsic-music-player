const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { pathToFileURL } = require('url');
const fs = require('fs');
const path = require('node:path');
const log = require('electron-log');
log.initialize();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// https://stackoverflow.com/questions/78999493/how-to-create-a-windows-executable-with-electron-forge-that-adds-a-desktop-short
// Si no tuvieramos un diálogo personalizado habría que descomentar esta línea, pues fuerza el cierre de la app antes de nada
// if (require('electron-squirrel-startup')) app.quit(); 

if (process.argv.some(arg => arg.startsWith('--squirrel-'))) {
  app.setAppUserModelId('abasic-music-player');
  app.allowRendererProcessReuse = false;
}

const handleSquirrelEvent = () => {
  log.info('Procesando evento Squirrel:', squirrelEvent);

  if (process.argv.length === 1) return false;

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-installed':
    case '--squirrel-updated':
      setTimeout(() => {
        const hiddenWindow = new BrowserWindow({
          show: false,
          webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
          }
        });

        hiddenWindow.loadURL('data:text/html,<script>window.close()</script>').then(() => {
          log.error('Cargando ventana oculta:');
          dialog.showMessageBox({
            type: 'info',
            title: 'Instalación Completada',
            message: '¡La aplicación se instaló correctamente!',
            detail: 'Los accesos directos se han creado en el escritorio y el menú de inicio.',
            buttons: ['OK']
          }).then(() => {
            app.quit();
          });
        });
      }, 1000); // Da tiempo a Squirrel para crear los accesos
      return true;

    case '--squirrel-uninstall':
    case '--squirrel-obsolete':
      app.quit();
      return true;

    default:
      return false;
  }
};

// Debe ser lo PRIMERO en ejecutarse
if (handleSquirrelEvent()) {
  // No continuar con la ejecución normal
  return;
}

let startWindow;
let songWindow;
let currentMode = 'local';
let modeData = null;

// Configuración común para las ventanas
function getWindowConfig() {
  return {
    width: 333,
    height: 461,
    minWidth: 333,
    minHeight: 461,
    maxWidth: 333,
    maxHeight: 461,
    useContentSize: true, // Asegura que el tamaño especificado sea solo para el contenido
    resizable: false,
    scrollBounce: false,
    frame: false, // Sin marco de ventana
    center: false, // No centrar la ventana automáticamente
    maximizable: false, // Deshabilita la maximización
    fullscreenable: false, // Deshabilita el modo pantalla completa
    transparent: true,
    backgroundColor: '#00000000',
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
  const bounds = startWindow.getBounds(); // Obtener las coordenadas y dimensiones de la ventana principal

  // Configurar la posición de la ventana secundaria
  const x = bounds.x; // Ajusta la posición X según sea necesario
  const y = bounds.y; // Ajusta la posición Y según sea necesario

  songWindow = new BrowserWindow({
    ...getWindowConfig(),
    x: x,  // Posición X
    y: y,  // Posición Y
  });

  const query = { mode: currentMode };
  if (currentMode === 'spotify') query.url = modeData;
  if (currentMode === 'local') query.folder = modeData;

  songWindow.loadFile(path.join(__dirname, 'songWindow.html'), { query });

  songWindow.on('closed', () => {
    songWindow = null;
  });

  // songWindow.webContents.openDevTools();
}

// Eventos IPC

ipcMain.on('open-song-window', () => {
  createSongWindow();
  if (startWindow) startWindow.hide();
});

ipcMain.on('close-song-window', () => {
  if (songWindow) {
    const songWindowBounds = songWindow.getBounds();

    songWindow.close();
    songWindow = null;

    if (startWindow) {
      startWindow.setBounds(songWindowBounds);
    }
  }

  if (startWindow) {
    startWindow.show();
  }
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

ipcMain.handle('get-songs-from-folder', async (event, folder) => {
  console.log('[MAIN] Obteniendo canciones de la carpeta:', folder);
  const files = fs.readdirSync(folder);
  const songs = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.ogg'].includes(ext);
  }).map(file => {
    const fullPath = path.join(folder, file);
    console.log('[MAIN] Convirtiendo a URL:', fullPath);
    return pathToFileURL(fullPath).href;
  });
  return songs;
});

ipcMain.handle('get-images-from-folder', async () => {
  // Ruta a la carpeta de wallpapers
  let wallpapersFolder;

  if (app.isPackaged) {
    // En producción: usa process.resourcesPath
    wallpapersFolder = path.join(process.resourcesPath, 'wallpapers');
  } else {
    // En desarrollo: usa __dirname para apuntar a la carpeta correcta
    wallpapersFolder = path.join(__dirname, '../assets/wallpapers');
  }

  console.log('Buscando imágenes en:', wallpapersFolder);

  // Si la carpeta no existe, la creamos
  if (!fs.existsSync(wallpapersFolder)) {
    fs.mkdirSync(wallpapersFolder, { recursive: true });
    console.log('Carpeta de wallpapers creada:', wallpapersFolder);
    return []; // Retorna un array vacío si la carpeta no existe
  }

  // Leer archivos y filtrar imágenes
  const files = fs.readdirSync(wallpapersFolder);
  const images = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    })
    .map(file => {
      const fullPath = path.join(wallpapersFolder, file);
      return `file://${fullPath}`;
    });

  console.log('Imágenes encontradas:', images);
  return images;
});

ipcMain.on('set-mode', (_, { mode, data }) => {
  console.log(`Modo establecido: ${mode}, Datos: ${data}`); // Log para verificar el modo y los datos
  currentMode = mode;
  modeData = data;
});

ipcMain.handle('get-mode', () => ({ mode: currentMode, data: modeData }));

// Este método se llama cuando Electron ha terminado de inicializar
app.whenReady().then(() => {
  // Solo crear ventana si no es un evento Squirrel
  if (!process.argv.some(arg => arg.startsWith('--squirrel-'))) {
    createStartWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && !process.argv.some(arg => arg.startsWith('--squirrel-'))) {
      createStartWindow();
    }
  });
});

// Cerrar la aplicación cuando todas las ventanas se cierren
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !process.argv.some(arg => arg.startsWith('--squirrel-'))) {
    app.quit();
  }
});