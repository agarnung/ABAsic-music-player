/// render_mainWindow.js

document.addEventListener("DOMContentLoaded", function () {
    let currentSongIndex = 0;
    let songs = [];

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

    const localFolderBtn = document.getElementById('localFolderBtn');
    if (localFolderBtn) {
        localFolderBtn.addEventListener('click', async () => {
            const folder = await window.electronAPI.selectFolder();
            if (folder) {
                // Enviar datos a la ventana de música
                window.electronAPI.setMode('local', folder);
                window.electronAPI.openSongWindow(); // Abrir ventana de música
            }
        });
    }

    const spotifyListBtn = document.getElementById('spotifyListBtn');

    const spotifyModal = document.getElementById('spotifyModal');
    const modalClose = document.getElementById('modalClose');
    const cancelSpotify = document.getElementById('cancelSpotify');
    const confirmSpotify = document.getElementById('confirmSpotify');

    if (spotifyListBtn) {
        spotifyListBtn.addEventListener('click', () => {
            spotifyModal.classList.add('is-active');
        });
    }

    if (modalClose && cancelSpotify) {
        const closeModal = () => spotifyModal.classList.remove('is-active');
        modalClose.addEventListener('click', closeModal);
        cancelSpotify.addEventListener('click', closeModal);
    }

    if (confirmSpotify) {
        confirmSpotify.addEventListener('click', () => {
            const url = document.getElementById('spotifyUrl').value;
            if (url) {
                window.electronAPI.setMode('spotify', url);
                spotifyModal.classList.remove('is-active');
                window.electronAPI.openSongWindow();
            }
        });
    }
});