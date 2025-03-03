document.addEventListener("DOMContentLoaded", function () {
    let isShuffleEnabled = false;
    let currentSongIndex = 0;
    let songs = [];

    // Función para cargar la lista de canciones desde la carpeta local
    async function loadSongs(folder) {
        const response = await window.electronAPI.getSongsFromFolder(folder);
        songs = response;
        if (songs.length > 0) {
            audioElement.src = songs[currentSongIndex];
            audioElement.play();
        }
    }

    // Función para avanzar a la siguiente canción
    function playNextSong() {
        if (isShuffleEnabled) {
            currentSongIndex = Math.floor(Math.random() * songs.length);
        } else {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }
        audioElement.src = songs[currentSongIndex];
        audioElement.play();
    }

    // Funciones de formato de tiempo
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Actualizar barra de progreso
    function updateProgress() {
        const percent = (audioElement.currentTime / audioElement.duration) * 100;
        progress.style.width = `${percent}%`;
        currentTime.textContent = formatTime(audioElement.currentTime);
    }

    const audioElement = document.querySelector('audio');
    if (audioElement) {
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (audioElement.paused) {
                    audioElement.play();
                    playPauseBtn.innerHTML = '<span class="icon"><i class="fas fa-pause"></i></span>';
                } else {
                    audioElement.pause();
                    playPauseBtn.innerHTML = '<span class="icon"><i class="fas fa-play"></i></span>';
                }
            });
        }
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

    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');

    // Event listeners para el audio
    if (audioElement) {
        audioElement.addEventListener('timeupdate', updateProgress);
        audioElement.addEventListener('loadedmetadata', () => {
            duration.textContent = formatTime(audioElement.duration);
        });

        // Control de la barra de progreso
        progressBar.addEventListener('click', (e) => {
            const rect = progressBar.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const width = rect.width;
            const percent = offsetX / width;
            audioElement.currentTime = percent * audioElement.duration;
        });

        // Cambiar el ícono cuando la canción termina
        audioElement.addEventListener('ended', () => {
            playPauseBtn.innerHTML = '<span class="icon"><i class="fas fa-play"></i></span>';
        });

        // Event listener para cuando la canción termina
        audioElement.addEventListener('ended', playNextSong);
    }

    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        isShuffleEnabled = !isShuffleEnabled;
        shuffleBtn.classList.toggle('is-active', isShuffleEnabled);
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
    if (localFolderBtn) {
        localFolderBtn.addEventListener('click', async () => {
            const folder = await window.electronAPI.selectFolder();
            if (folder) {
                window.electronAPI.setMode('local', folder);
                loadSongs(folder);
                window.electronAPI.openSongWindow();
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