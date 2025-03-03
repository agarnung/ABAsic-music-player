// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// Exponer de manera segura las APIs de Electron al contexto de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
    closeSongWindow: () => ipcRenderer.send('close-song-window'),
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    setMode: (mode, data) => ipcRenderer.send('set-mode', { mode, data }),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    getMode: () => ipcRenderer.invoke('get-mode')
});
