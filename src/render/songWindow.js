/// render_songWindow.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y analizado en la ventana de canciones");

    let isShuffleEnabled = false;
    let currentSongIndex = 0;
    let songs = [];

    async function initializePlayer() {
        try {
            const { mode, data } = await window.electronAPI.getMode();
            console.log('Modo actual:', mode, 'Datos:', data);

            if (mode === 'local') {
                await loadSongs(data);
            } else if (mode === 'spotify') {
                // Lógica para Spotify (si es necesario)
                console.log('Modo Spotify, URL:', data);
            }
        } catch (error) {
            console.error('Error inicializando reproductor:', error);
        }
    }

    // Función para cargar canciones desde una carpeta local
    async function loadSongs(folder) {
        console.log('[DEBUG] Cargando canciones desde:', folder);
        try {
            const response = await window.electronAPI.getSongsFromFolder(folder);
            console.log('[DEBUG] Canciones recibidas:', response);
            songs = response;
            if (songs.length > 0) {
                console.log('[DEBUG] Reproduciendo primera canción');
                playSong(currentSongIndex);
            } else {
                console.warn('[DEBUG] Carpeta vacía - No hay canciones');
            }
        } catch (error) {
            console.error('[ERROR] Fallo al cargar canciones:', error);
        }
    }

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

    // Función para reproducir una canción específica
    function playSong(index) {
        console.log('[DEBUG] Intentando reproducir índice:', index);
        if (!audioElement) {
            console.error('[ERROR] Elemento audio no encontrado');
            return;
        }
        
        if (songs[index]) {
            console.log('[DEBUG] Estableciendo fuente:', songs[index]);
            audioElement.src = songs[index];
            audioElement.play().catch(error => {
                console.error('[ERROR] Error de reproducción:', error);
            });
            updateSongName(songs[index]);
        } else {
            console.error('[ERROR] Índice inválido o canción no existe');
        }
    }

    // Función para actualizar el nombre de la canción
    function updateSongName(songPath) {
        // Decodificar la URL (por ejemplo, convierte "%20" de nuevo a espacios)
        const decodedPath = decodeURIComponent(songPath);
    
        // Extraer el nombre del archivo (eliminar la ruta completa)
        const songName = decodedPath.split('/').pop(); // Obtener el nombre del archivo
    
        // Actualizar el texto del elemento
        const songNameElement = document.getElementById('songName');
        if (songNameElement) {
            songNameElement.textContent = songName;
        } else {
            console.error('Elemento songName no encontrado');
        }
    }

    initializePlayer();

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
                console.log("Reproduciendo canción");
                audioElement.play();
                playPauseBtn.innerHTML = '<span class="icon"><i class="fas fa-pause"></i></span>';
            } else {
                console.log("Pausando canción");
                audioElement.pause();
                playPauseBtn.innerHTML = '<span class="icon"><i class="fas fa-play"></i></span>';
            }
        });
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', playNextSong);
    }

    // Función para retroceder a la canción anterior o reiniciar
    function playPreviousSong() {
        if (audioElement.currentTime > 5) {
            // Reiniciar la canción actual si está avanzada más de 5 segundos
            audioElement.currentTime = 0;
        } else {
            // Retroceder a la canción anterior
            if (isShuffleEnabled) {
                currentSongIndex = Math.floor(Math.random() * songs.length); // Canción aleatoria
            } else {
                currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length; // Canción anterior
            }
            playSong(currentSongIndex);
        }
    }

    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', playPreviousSong);
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
            console.log("Canción terminada, reproduciendo siguiente canción");
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