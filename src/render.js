document.addEventListener("DOMContentLoaded", function () {
    const audioElement = document.querySelector('audio');
    if (audioElement) {
        const startBtn = document.querySelector('#startBtn');
        const stopBtn = document.querySelector('#stopBtn');

        function playMusic() {
            if (audioElement.paused) audioElement.play();
        }
        function stopMusic() {
            if (!audioElement.paused) audioElement.pause();
        }

        if (startBtn) startBtn.addEventListener("click", playMusic);
        if (stopBtn) stopBtn.addEventListener("click", stopMusic);
    }

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.electronAPI.closeSongWindow();
        });
    }

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

    const modeInfo = document.getElementById('modeInfo');
    if (modeInfo) {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        
        if (mode === 'spotify') {
            modeInfo.textContent = `Modo Spotify: ${urlParams.get('url')}`;
            modeInfo.classList.add('is-info');
            // Lógica específica de Spotify aquí
        } else if (mode === 'local') {
            modeInfo.textContent = `Modo Local: ${urlParams.get('folder')}`;
            modeInfo.classList.add('is-primary');
            // Lógica específica de carpeta local aquí
        }
    }

    const localFolderBtn = document.getElementById('localFolderBtn');
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

    if (localFolderBtn) {
        localFolderBtn.addEventListener('click', async () => {
            const folder = await window.electronAPI.selectFolder();
            if (folder) {
                window.electronAPI.setMode('local', folder);
                window.electronAPI.openSongWindow();
            }
        });
    }
});