const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { pathToFileURL } = require('url');
const fs = require('fs');
const path = require('node:path');

// Manejar eventos de Squirrel (instalación/actualización)
if (require('electron-squirrel-startup')) app.quit(); // https://stackoverflow.com/questions/78999493/how-to-create-a-windows-executable-with-electron-forge-that-adds-a-desktop-short

const handleSquirrelEvent = () => {
  if (process.argv.length > 1) {
    const arg = process.argv[1];

    if (arg === '--squirrel-installed' || arg === '--squirrel-updated') {
      // Mostrar el diálogo de instalación completada
      showInstallDialog();
      return true; // Indica que se manejó un evento Squirrel
    } else if (arg === '--squirrel-uninstall') {
      // Aquí puedes agregar lógica para la desinstalación si es necesario
      app.quit();
      return true;
    } else if (arg === '--squirrel-obsolete') {
      // Aquí puedes agregar lógica para la obsolescencia si es necesario
      app.quit();
      return true;
    }
  }
  return false; // No se manejó ningún evento Squirrel
};

// Crear un archivo de configuración para almacenar el estado de la primera ejecución
// En Windows, se guardará en C:\Users\<Usuario>\AppData\Roaming\<NombreDeApp>
const configPath = path.join(app.getPath('userData'), 'config.json');
console.log('Ruta del archivo config.json:', configPath);

// Función para cargar la configuración
const loadConfig = () => {
  if (fs.existsSync(configPath)) {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  }
  return { firstRun: true }; // Por defecto, es la primera ejecución
};

// Función para guardar la configuración
const saveConfig = (config) => {
  fs.writeFileSync(configPath, JSON.stringify(config), 'utf-8');
};

if (handleSquirrelEvent()) {
  app.quit();
}

// Mostrar el diálogo de instalación completada
const showInstallDialog = () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Installation Complete',
    message: 'The app has been successfully installed!\n\nShortcuts have been created on the desktop and start menu.\nYou can delete the file ABAsicMusicPlayerSetup.exe.',
    buttons: ['OK']
  });
};

// Verificar si es la primera ejecución
app.whenReady().then(() => {
    if (handleSquirrelEvent()) {
    // Si se manejó un evento Squirrel, no continuar con la lógica normal
    return;
  }

  const config = loadConfig();

  if (config.firstRun) {
    // Mostrar el diálogo
    showInstallDialog();

    // Actualizar la configuración para indicar que ya no es la primera ejecución
    config.firstRun = false;
    saveConfig(config);
  }

  // Crear la ventana principal
  createStartWindow();
});

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
  if (currentMode === 'youtube') query.url = modeData;
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

// Cerrar la aplicación cuando todas las ventanas se cierren
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
