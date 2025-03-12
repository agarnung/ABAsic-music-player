/// preload.js

// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Exponer de manera segura las APIs de Electron al contexto de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
    closeSongWindow: () => ipcRenderer.send('close-song-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    setMode: (mode, data) => {
        console.log(`[PRELOAD] setMode: ${mode}`, data);
        ipcRenderer.send('set-mode', { mode, data });
    },
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getMode: () => ipcRenderer.invoke('get-mode'),
    openSongWindow: () => ipcRenderer.send('open-song-window'),
    getSongsFromFolder: (folder) => ipcRenderer.invoke('get-songs-from-folder', folder),
    getImagesFromFolder: (folder) => ipcRenderer.invoke('get-images-from-folder', folder),
    openSpotifyAuth: () => {
        console.log('[PRELOAD] Invocando openSpotifyAuth');
        return ipcRenderer.invoke('open-spotify-auth');
    },
    onSpotifyAuthSuccess: (callback) => {
        console.debug('[PRELOAD] Registrando listener para spotify-auth-success');
        ipcRenderer.on('spotify-auth-success', (event, token) => {
            console.debug('[PRELOAD] Evento spotify-auth-success recibido');
            try {
                if (!token) {
                    throw new Error('Token vacío recibido');
                }
                callback(token);
            } catch (error) {
                console.error('[PRELOAD] Error en callback de autenticación:', error);
            }
        });
    },
    getPlaylistInput: () => ipcRenderer.invoke('get-playlist-input'),
    getSpotifyToken: () => ipcRenderer.invoke('get-spotify-token'),
    storeSpotifyToken: (token) => ipcRenderer.invoke('store-spotify-token', token),
    spotifyControl: (action, data) => ipcRenderer.invoke('spotify-control', action, data),
    parseSpotifyUri: (input) => ipcRenderer.invoke('parse-spotify-uri', input),
    sendSpotifyDeviceId: (deviceId) => ipcRenderer.send('set-spotify-device-id', deviceId),
    onPlayerStateChanged: (callback) => ipcRenderer.on('player-state-changed', callback),
    getSpotifyPlaylistTracks: (uri, token) => ipcRenderer.invoke('get-spotify-playlist-tracks', uri, token)
});
