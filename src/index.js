const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const { pathToFileURL } = require('url');
const fs = require('fs');
const path = require('node:path');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
  return;
}

// Manejar cuando se intenta abrir una segunda instancia
app.on('second-instance', (event, commandLine) => {
  const url = commandLine.pop().replace(/^.*?abasic-music-player:\/\//, 'abasic-music-player://');
  handleAuthRedirect(url);
});

// Función para procesar la URL
function handleAuthRedirect(url) {
  console.log('[MAIN] Manejando redirección de autenticación. URL:', url);
  
  if (url.startsWith(process.env.SPOTIFY_REDIRECT_URI)) {
    try {
      const hash = new URL(url).hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      
      console.debug('[MAIN] Parámetros obtenidos:', { 
        token: !!token,
        expiresIn: params.get('expires_in'),
        tokenType: params.get('token_type')
      });

      if (!token) throw new Error('Token no presente en la URL');

      if (startWindow && !startWindow.isDestroyed()) {
        console.log('[MAIN] Enviando token a renderer');
        startWindow.webContents.send('spotify-auth-success', token);
      } else {
        console.warn('[MAIN] Ventana principal no disponible para enviar token');
      }
      
    } catch (error) {
      console.error('[MAIN] Error procesando autenticación:', error);
    }
  }
}

require('dotenv').config();

const appDataPath = app.getPath('appData');
const cachePath = path.join(appDataPath, 'ABasicMusicPlayer', 'Cache');
if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, {
    recursive: true,
    mode: 0o755 // Permisos de lectura/escritura
  });
}
app.setPath('cache', cachePath);

// Configurar rutas personalizadas
app.setPath('userData', path.join(appDataPath, 'ABasicMusicPlayer'));
app.setPath('cache', cachePath);

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
if (app.isPackaged) {
  app.setAsDefaultProtocolClient('abasic-music-player');
} else {
  // En desarrollo, usa el ejecutable de Electron explícitamente
  app.setAsDefaultProtocolClient('abasic-music-player', process.execPath, [
    path.resolve(process.argv[1])
  ]);
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
  if (currentMode === 'spotify') {
    query.token = modeData.token; // Añade el token a los query params
    query.uri = modeData.uri;
  }
  else if (currentMode === 'local') query.folder = modeData;

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

ipcMain.handle('focus-window', () => {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].focus();
  }
});

// Modificar handler para abrir songWindow
ipcMain.on('open-song-window', () => {
  if (songWindow && !songWindow.isDestroyed()) {
    songWindow.focus();
    return;
  }

  if (startWindow) startWindow.hide();
  createSongWindow();
});

ipcMain.on('close-song-window', () => {
  if (songWindow) {
    songWindow.close();
    songWindow = null;
  }

  if (startWindow) {
    startWindow.show(); // Mostrar ventana principal al cerrar songWindow
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

// Modifica el handler de autenticación de Spotify
ipcMain.handle('open-spotify-auth', async () => {
  console.log('[DEBUG] Abriendo ventana de autenticación...');
  const authWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:spotify-auth',
      sandbox: true
    },
    show: false // Ocultar ventana de auth inicialmente
  });

  return new Promise((resolve, reject) => {
    authWindow.webContents.on('will-redirect', (event, url) => {
      console.log(`[DEBUG] URL de redirección: ${url}`);
      if (url.startsWith(process.env.SPOTIFY_REDIRECT_URI)) {
        event.preventDefault();
        const hash = new URL(url).hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        console.log('[MAIN] Token extraído:', accessToken ? 'OK' : 'No encontrado');

        if (accessToken) {
          authWindow.destroy();
          resolve(accessToken);
        } else {
          reject(new Error('Token no encontrado en URL'));
        }
      }
    });

    authWindow.on('closed', () => {
      console.log('[MAIN] Ventana de auth cerrada');
      authWindow.webContents.session.clearCache();
    });

    authWindow.webContents.on('did-fail-load', (event, code, desc) => {
      console.error(`[MAIN] Error de carga: ${code} - ${desc}`);
      reject(new Error(desc));
    });

    authWindow.webContents.on('did-finish-load', () => {
      console.log('[DEBUG] Ventana de auth cargada correctamente');
    });

    // En main.js (proceso principal)
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID
      }&response_type=token&redirect_uri=${encodeURIComponent(
        process.env.SPOTIFY_REDIRECT_URI // Debe ser abasic-music-player://callback
      )}&scope=user-read-playback-state%20user-modify-playback-state&show_dialog=true`;
    authWindow.loadURL(authUrl);
    authWindow.once('ready-to-show', () => {
      console.log('[MAIN] Mostrando ventana de auth');
      authWindow.show();
    });
  });
});

ipcMain.handle('get-playlist-input', async () => {
  const { response } = await dialog.showMessageBox({
    type: 'question',
    buttons: ['Cancelar', 'Aceptar'],
    title: 'Playlist de Spotify',
    message: 'Ingresa la URL o URI de la playlist:',
    input: true
  });

  if (response) {
    return parseSpotifyUri(response); // Función para convertir a URI válido
  }
  return null;
});

function parseSpotifyUri(input) {
  // Convertir URL a URI
  const urlMatch = input.match(/open\.spotify\.com\/playlist\/(\w+)/);
  if (urlMatch) return `spotify:playlist:${urlMatch[1]}`;

  // Verificar si ya es URI
  if (input.startsWith('spotify:playlist:')) return input;

  throw new Error('Formato inválido');
}

// Handlers para Spotify
ipcMain.handle('store-spotify-token', async (_, token) => {
  spotifyApi.setAccessToken(token);
  return true;
});

ipcMain.handle('spotify-control', async (_, action, data) => {
  try {
    if (!spotifyPlayer) throw new Error('Reproductor no inicializado');

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
      case 'play-playlist':
        // Verificar token y URI
        if (!data.uri || !modeData.token) {
          throw new Error('Faltan datos para reproducir');
        }
        await spotifyApi.play({
          device_id: spotifyDeviceId,
          context_uri: data.uri
        });
        break;
    }
  } catch (error) {
    console.error('Error en Spotify:', error);
    throw error;
  }
});

ipcMain.handle('parse-spotify-uri', (_, input) => {
  // Expresión regular mejorada
  const uriPattern = /^(?:spotify:playlist:|https?:\/\/(?:open\.)?spotify\.com\/playlist\/)([a-zA-Z0-9]{22})(?:\?.*)?$/;
  const match = input.match(uriPattern);

  if (!match) throw new Error('Formato inválido. Ejemplo válido:\nhttps://open.spotify.com/playlist/5wYbKg8lO4MQVRjDh5JB4A?si=b28770f70d6c47fc');

  return `spotify:playlist:${match[1]}`;
});

// Este método se llama cuando Electron ha terminado de inicializar
app.whenReady().then(() => {
  createStartWindow(); // Crear la ventana principal al iniciar
});

// Cerrar la aplicación cuando todas las ventanas se cierren
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


