const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { pathToFileURL } = require('url');
const fs = require('fs');
const path = require('node:path');

require('dotenv').config();

const SpotifyWebApi = require('spotify-web-api-node');
let spotifyPlayer = null;
let spotifyDeviceId = null;

let startWindow;
let songWindow;
let currentMode = 'local';
let modeData = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Registrar el protocolo personalizado
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('abasic-music-player', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('abasic-music-player');
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

  startWindow.webContents.openDevTools();
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

// Configuración de Spotify
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

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

ipcMain.handle('open-spotify-auth', async () => {
  const authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Manejar redirección al protocolo personalizado
  authWindow.webContents.on('will-redirect', (event, url) => {
    if (url.startsWith(process.env.SPOTIFY_REDIRECT_URI)) {
      event.preventDefault();
      const hash = new URL(url).hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (accessToken) {
        authWindow.close();
        return accessToken;
      }
    }
  });

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}&scope=user-read-playback-state user-modify-playback-state&show_dialog=true`;

  await authWindow.loadURL(authUrl);

  return new Promise((resolve, reject) => {
    authWindow.on('closed', () => {
      reject(new Error('Auth window closed'));
    });

    authWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
      reject(new Error(errorDesc));
    });
  });
});

// Handlers para Spotify
ipcMain.handle('store-spotify-token', async (_, token) => {
  spotifyApi.setAccessToken(token);
  return true;
});

ipcMain.handle('spotify-control', async (_, action) => {
  if (!spotifyPlayer) return;

  switch (action) {
    case 'play':
      await spotifyApi.play({ device_id: spotifyDeviceId });
      break;
    case 'pause':
      await spotifyApi.pause({ device_id: spotifyDeviceId });
      break;
    case 'next':
      await spotifyApi.skipToNext({ device_id: spotifyDeviceId });
      break;
    case 'previous':
      await spotifyApi.skipToPrevious({ device_id: spotifyDeviceId });
      break;
    case 'shuffle':
      const shuffleState = !(await spotifyApi.getShuffle()).body;
      await spotifyApi.setShuffle(shuffleState, { device_id: spotifyDeviceId });
      break;
    case 'loop':
      const currentState = (await spotifyApi.getRepeatMode()).body;
      const newState = currentState === 'context' ? 'off' : 'context';
      await spotifyApi.setRepeat(newState, { device_id: spotifyDeviceId });
      break;
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


