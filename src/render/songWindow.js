/// songWindow.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y analizado en la ventana de canciones");

    let isLoopEnabled = false;
    let isShuffleEnabled = false;
    let currentSongIndex = 0;
    let songs = [];
    let playPauseIcon;

    async function initializePlayer() {
        try {
            const { mode, data } = await window.electronAPI.getMode();
            console.log('Modo actual:', mode, 'Datos:', data);

            if (mode === 'local') {
                await loadSongs(data);
            } else if (mode === 'spotify') {
                console.log('Modo Spotify, URL:', data);
                // ...
            }
        } catch (error) {
            console.error('Error inicializando reproductor:', error);
        }
    }

    // Función para cargar canciones desde una carpeta local
    async function loadSongs(folder) {
        console.log('[DEBUG] Cargando canciones desde:', folder);
        try {
            updateAlbumPlaylistText(folder);
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

    function updateAlbumPlaylistText(text) {
        const wrapper = document.querySelector('.album-playlist-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';
        for (let i = 0; i < 2; i++) {
            const span = document.createElement('span');
            span.className = 'album-playlist-text';
            span.textContent = text;
            wrapper.appendChild(span);
        }

        // Calcular duración de la animación
        const textWidth = wrapper.firstChild.offsetWidth;
        const containerWidth = wrapper.parentElement.offsetWidth;

        // Solo animar si el texto es más largo que el contenedor
        if (textWidth > containerWidth) {
            const speed = 40; // Pixeles por segundo 
            const duration = textWidth / speed;
            wrapper.style.animationDuration = `${duration}s`;
        } else {
            wrapper.style.animation = 'none';
        }
    }

    const albumPlaylistBtn = document.getElementById('albumPlaylistBtn');
    if (albumPlaylistBtn) {
        albumPlaylistBtn.addEventListener('click', async () => {
            const { mode } = await window.electronAPI.getMode();
            if (mode === 'local') {
                const folder = await window.electronAPI.selectFolder();
                if (folder) {
                    // Primero establecer el modo
                    window.electronAPI.setMode('local', folder);
                    // Luego cargar las canciones
                    await loadSongs(folder);
                }
            } else if (mode === 'spotify') {
                //...
            }
        });
    }

    const audioElement = document.getElementById('audioElement');
    if (!audioElement) {
        console.error("Audio element no encontrado");
        return;
    }

    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            const clickSound = document.getElementById('click-sound');
            clickSound.play().catch((error) => {
                console.error('Error al reproducir el sonido:', error);
            });

            setTimeout(() => {
                window.electronAPI.closeWindow();
            }, 200);
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
            playPauseIcon.src = '../assets/icons/Pause button.svg';
            playPauseIcon.alt = 'Pause';
            updateSongName(songs[index]);
        } else {
            console.error('[ERROR] Índice inválido o canción no existe');
        }
    }

    function updateSongName(songPath) {
        const decodedPath = decodeURIComponent(songPath);
        const songName = decodedPath.split('/').pop();

        const wrapper = document.querySelector('.song-name-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';
        for (let i = 0; i < 2; i++) {
            const span = document.createElement('span');
            span.className = 'song-name';
            span.textContent = songName;
            wrapper.appendChild(span);
        }

        // Calcular duración basada en el ancho real del texto
        const textWidth = wrapper.firstChild.offsetWidth;

        // Ajustar velocidad para mantener ritmo constante
        const speed = 40; // Pixeles por segundo 
        const duration = textWidth / speed;

        wrapper.style.animationDuration = `${duration}s`;
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
        const progressPercentage = (audioElement.currentTime / audioElement.duration) * 100;
        progress.style.width = `${progressPercentage}%`;
        currentTime.textContent = formatTime(audioElement.currentTime);
        progressIcon.style.left = `calc(${progressPercentage}% - 12px)`; // Ajuste para que el ícono esté centrado
    }

    const playPauseBtn = document.getElementById('playPauseBtn');
    if (playPauseBtn) {
        playPauseIcon = playPauseBtn.querySelector('img'); // Asignar la referencia
        playPauseBtn.addEventListener('click', () => {
            if (audioElement.paused) {
                audioElement.play();
                playPauseIcon.src = '../assets/icons/Pause button.svg';
                playPauseIcon.alt = 'Pause'; // Corregir texto alternativo
            } else {
                audioElement.pause();
                playPauseIcon.src = '../assets/icons/Play button.svg';
                playPauseIcon.alt = 'Play'; // Corregir texto alternativo
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
            const clickSound = document.getElementById('click-sound');
            clickSound.play().catch((error) => {
                console.error('Error al reproducir el sonido:', error);
            });

            setTimeout(() => {
                window.electronAPI.closeSongWindow();
            }, 200);
        });
    }

    const loopBtn = document.getElementById('loopBtn');
    const loopIcon = loopBtn.querySelector('img');
    if (loopBtn) {
        loopBtn.addEventListener('click', () => {
            isLoopEnabled = !isLoopEnabled;
            loopBtn.classList.toggle('is-active', isLoopEnabled);
            if (isLoopEnabled) {
                loopIcon.src = '../assets/icons/repeat song icon on.svg';
                loopIcon.alt = 'Repeat On';
            } else {
                loopIcon.src = '../assets/icons/repeat song icon off.svg';
                loopIcon.alt = 'Repeat Off';
            }
        });
    }

    const progressBar = document.getElementById('progressBar');
    const progressIcon = document.getElementById('progressIcon');
    const progress = document.getElementById('progress');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');

    // Event listeners para el audio
    if (audioElement) {
        audioElement.addEventListener('timeupdate', updateProgress);

        // Cuando el audio esté listo para reproducirse, configuramos la duración
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
            if (isLoopEnabled) {
                audioElement.currentTime = 0;
                audioElement.play();
            } else {
                console.log("Canción terminada, reproduciendo siguiente canción");
                playPauseIcon.src = '../assets/icons/Pause button.svg';
                playPauseIcon.alt = 'Play';
                playNextSong();
            }
        });
    }

    const shuffleBtn = document.getElementById('shuffleBtn');
    const shuffleIcon = shuffleBtn.querySelector('img');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => {
            isShuffleEnabled = !isShuffleEnabled;
            shuffleBtn.classList.toggle('is-active', isShuffleEnabled);
            if (isShuffleEnabled) {
                shuffleIcon.src = '../assets/icons/shuffle icon on.svg';
                shuffleIcon.alt = 'Shuffle On';
            } else {
                shuffleIcon.src = '../assets/icons/shuffle icon off.svg';
                shuffleIcon.alt = 'Shuffle Off';
            }
        });
    }

    // Obtener todos los botones en la página
    const buttons = document.querySelectorAll('button');
    const clickSound = document.getElementById('click-sound');
    clickSound.addEventListener('canplaythrough', () => {
        console.log('Sonido cargado y listo para reproducirse');
    });
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            clickSound.play().catch((error) => {
                console.error('Error al reproducir el sonido:', error);
            });
        });
    });
});