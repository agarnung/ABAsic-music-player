/// mainWindow.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y analizado");

    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });
    }

    const minimizeBtn = document.getElementById('minimizeBtn');
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });
    }

    // render_mainWindow.js (al seleccionar carpeta)
    localFolderBtn.addEventListener('click', async () => {
        const folder = await window.electronAPI.selectFolder();
        if (folder) {
            // Primero establecer el modo
            window.electronAPI.setMode('local', folder);
            // Luego abrir la ventana
            window.electronAPI.openSongWindow();
        }
    });

    const spotifyModal = document.getElementById('spotifyModal');
    const modalClose = document.getElementById('modalClose');
    const cancelSpotify = document.getElementById('cancelSpotify');

    const spotifyListBtn = document.getElementById('spotifyListBtn');
    if (spotifyListBtn) {
        spotifyListBtn.addEventListener('click', () => {
            console.log("Botón de lista de Spotify clickeado");
            spotifyModal.classList.add('is-active');
        });
    }

    if (modalClose && cancelSpotify) {
        const closeModal = () => spotifyModal.classList.remove('is-active');
        modalClose.addEventListener('click', closeModal);
        cancelSpotify.addEventListener('click', closeModal);
    }

    const confirmSpotify = document.getElementById('confirmSpotify');
    if (confirmSpotify) {
        confirmSpotify.addEventListener('click', () => {
            const url = document.getElementById('spotifyUrl').value;
            if (url) {
                console.log("URL de Spotify ingresada:", url);
                window.electronAPI.setMode('spotify', url);
                spotifyModal.classList.remove('is-active');
                window.electronAPI.openSongWindow();
            } else {
                console.log("No se ingresó ninguna URL de Spotify");
            }
        });
    }
});