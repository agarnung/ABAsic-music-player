/// render_songWindow.js

document.addEventListener("DOMContentLoaded", function () {
    let isShuffleEnabled = false;
    let currentSongIndex = 0;
    let songs = [];
    let songNameElement = document.getElementById('songName');

    window.electronAPI.receiveSongs((_, data) => {
        songs = data.songs;
        if (songs.length > 0) playSong(currentSongIndex);
    });

    const audioElement = document.getElementById('audioElement');
    if (!audioElement) {
        console.error("Audio element no encontrado");
        return;
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

    // Función para cargar la lista de canciones desde la carpeta local
    async function loadSongs(folder) {
        try {
            const response = await window.electronAPI.getSongsFromFolder(folder);
            console.log('Canciones encontradas:', response);
            songs = response;
            if (songs.length > 0) {
                playSong(currentSongIndex);
            }
        } catch (error) {
            console.error('Error al cargar las canciones:', error);
        }
    }

    // Función para reproducir una canción específica
    function playSong(index) {
        if (!audioElement) {
            console.error('Audio element no encontrado');
            return;
        }
        
        if (songs[index]) {
            audioElement.src = songs[index];
            audioElement.play().catch(error => {
                console.error('Error de reproducción:', error);
                showErrorNotification('Error al reproducir el archivo');
            });
            updateSongName(songs[index]);
        }
    }
    // Función para actualizar el nombre de la canción
    function updateSongName(songPath) {
        const songName = songPath.split('/').pop(); // Obtener el nombre del archivo
        songNameElement.textContent = songName; // Actualizar el texto del elemento
    }

    // Función para avanzar a la siguiente canción
    function playNextSong() {
        if (isShuffleEnabled) {
            currentSongIndex = Math.floor(Math.random() * songs.length);
        } else {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
        }
        playSong(currentSongIndex);
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

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.electronAPI.closeSongWindow();
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
            // Obtiene las dimensiones y la posición de la barra de progreso en la pantalla
            const rect = progressBar.getBoundingClientRect();

            // Calcula la posición horizontal del clic dentro de la barra de progreso
            // e.clientX es la coordenada X del clic en la ventana
            // rect.left es la posición izquierda de la barra de progreso en la ventana
            const offsetX = e.clientX - rect.left;

            // Obtiene el ancho total de la barra de progreso
            const width = rect.width;

            // Calcula el porcentaje de la barra de progreso donde se hizo clic
            const percent = offsetX / width;

            // Establece el tiempo actual de la canción en función del porcentaje calculado
            // audioElement.duration es la duración total de la canción en segundos
            audioElement.currentTime = percent * audioElement.duration;
        });

        // Cambiar el ícono cuando la canción termina
        audioElement.addEventListener('ended', () => {
            playPauseBtn.innerHTML = '<span class="icon"><i class="fas fa-play"></i></span>';
            playNextSong();
        });
    }

    const shuffleBtn = document.getElementById('shuffleBtn');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            isShuffleEnabled = !isShuffleEnabled;
            shuffleBtn.classList.toggle('is-active', isShuffleEnabled);
        });
    }
});