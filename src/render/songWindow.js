/// songWindow.js

// Variables globales para el estado del SDK
let spotifySDKLoaded = false;
let spotifySDKLoading = false;
let spotifyLoadAttempts = 0;
const MAX_SDK_LOAD_ATTEMPTS = 3;

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y analizado en la ventana de canciones");

    let isLoopEnabled = false;
    let isShuffleEnabled = false;
    let currentSongIndex = 0;
    let songs = [];
    let images = [];
    let playPauseIcon;

    let spotifyPlayer = null;

    // Variable para almacenar el estado actual de Spotify
    window.spotifyPlayerState = null;

    // Carga del SDK
    async function loadSpotifySDK() {
        return new Promise((resolve, reject) => {
            if (window.Spotify?.Player) {
                console.log('[SDK] Ya cargado');
                return resolve();
            }

            const script = document.createElement('script');
            // Añadir fecha para evitar caché:
            script.src = `https://sdk.scdn.co/spotify-player.js?${Date.now()}`;
            script.id = 'spotify-sdk';

            script.onload = () => {
                if (!window.Spotify) {
                    return reject(new Error('Error carga SDK'));
                }
                console.log('[SDK] Cargado correctamente');
                resolve();
            };

            script.onerror = (err) => reject(err);
            document.head.appendChild(script);
        });
    }

    // Función de inicialización del reproductor
    async function initSpotifyPlayer(token, uri) {
        try {
            console.log('[SPOTIFY] Inicializando reproductor...');

            // 1. Cargar SDK
            await loadSpotifySDK();

            // 2. Desconectar instancias previas
            if (window.spotifyPlayerInstance) {
                await window.spotifyPlayerInstance.disconnect();
            }

            // 3. Crear nueva instancia
            window.spotifyPlayerInstance = new window.Spotify.Player({
                name: 'ABasic Music Player',
                getOAuthToken: cb => cb(token),
                volume: 0.5
            });

            // 4. Configurar listeners
            setupPlayerListeners(uri);

            // 5. Conectar
            await window.spotifyPlayerInstance.connect();
            console.log('[SPOTIFY] Conexión exitosa');
        } catch (error) {
            console.error('[SPOTIFY] Error en inicialización:', error);
            throw error;
        }
    }

    function setupPlayerListeners(uri) {
        window.spotifyPlayerInstance.addListener('initialization_error', ({ message }) => {
            console.error('Error de inicialización:', message);
            alert(`Error inicializando Spotify: ${message}`);
        });

        window.spotifyPlayerInstance.addListener('authentication_error', ({ message }) => {
            console.error('Error de autenticación:', message);
            alert(`Error de autenticación: ${message}`);
        });

        window.spotifyPlayerInstance.addListener('account_error', ({ message }) => {
            console.error('Error de cuenta:', message);
            alert(`Error de cuenta Spotify: ${message}`);
        });

        // Añadir el listener 'ready' aquí para capturar la URI
        window.spotifyPlayerInstance.addListener('ready', async ({ device_id }) => {
            console.log('[SPOTIFY READY] Dispositivo listo:', device_id);

            // Enviar device_id al main process
            window.electronAPI.sendSpotifyDeviceId(device_id);

            // Esperar 2 segundos para sincronización
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                // Verificar estado del dispositivo
                const state = await window.electronAPI.getSpotifyPlaybackState();
                if (!state?.is_playing) {
                    await window.electronAPI.spotifyControl('play-playlist', {
                        uri: modeData.uri,
                        device_id: device_id
                    });
                }
            } catch (error) {
                console.error('Error al iniciar reproducción:', error);
                alert(`Error: ${error.message}`);
            }
        });
    }

    async function syncInitialState() {
        try {
            const state = await window.electronAPI.getSpotifyPlaybackState();
            if (state && state.device && state.device.id) {
                console.log('[SPOTIFY] Sincronizando estado inicial');
                window.electronAPI.sendSpotifyDeviceId(state.device.id);
                updatePlayerState(state);
                updatePlaybackInfo(state);
            }
        } catch (error) {
            console.error('[SPOTIFY] Error sincronizando estado:', error);
        }
    }

    initializePlayer().then(syncInitialState);

    window.spotifyPlayerInstance.addListener('player_state_changed', state => {
        if (!state) return;
        console.log('[SPOTIFY] Estado actualizado:', state);
        window.spotifyPlayerState = state;

        // Forzar actualización de la UI
        updatePlayerState(state);
        updatePlaybackInfo(state);

        // Si no hay canción reproduciéndose, reintentar
        if (!state.track_window?.current_track) {
            window.electronAPI.spotifyControl('play-playlist', {
                uri: modeInfo.data.uri,
                device_id: state.device?.id
            });
        }
    });

    // Actualizar información de la canción
    function updatePlaybackInfo(state) {
        const track = state?.track_window?.current_track;
        if (!track) return;

        const songNameElements = document.querySelectorAll('.song-name');
        songNameElements.forEach(el => {
            el.textContent = `${track.name} - ${track.artists.map(a => a.name).join(', ')}`;
        });

        // Actualizar progreso
        const progress = document.getElementById('progress');
        const progressPercentage = (state.position / state.duration) * 100;
        progress.style.width = `${progressPercentage}%`;
    }

    // Función para actualizar la UI con el estado de Spotify
    function updatePlayerState(state) {
        if (currentMode === 'spotify') {
            window.spotifyPlayerState = state;
        }

        const playPauseBtn = document.getElementById('playPauseBtn');
        const shuffleBtn = document.getElementById('shuffleBtn');
        const loopBtn = document.getElementById('loopBtn');

        // Estado de reproducción
        if (state.paused) {
            playPauseBtn.querySelector('img').src = '../assets/icons/Play button.svg';
        } else {
            playPauseBtn.querySelector('img').src = '../assets/icons/Pause button.svg';
        }

        // Estado de shuffle
        shuffleBtn.classList.toggle('is-active', state.shuffle);
        shuffleBtn.querySelector('img').src = state.shuffle ?
            '../assets/icons/shuffle icon on.svg' :
            '../assets/icons/shuffle icon off.svg';

        // Estado de repeat
        const repeatStates = ['off', 'context', 'track'];
        loopBtn.classList.toggle('is-active', state.repeat_mode !== 'off');
        loopBtn.querySelector('img').src = state.repeat_mode === 'off' ?
            '../assets/icons/repeat song icon off.svg' :
            '../assets/icons/repeat song icon on.svg';
    }

    async function initializePlayer() {
        try {
            const { mode, data } = await window.electronAPI.getMode();
            console.log('Modo actual:', mode, 'Datos:', data);

            if (mode === 'local') {
                await loadSongs(data);
                await loadImages();
            } else if (mode === 'spotify') {
                // Verificar token activo
                const valid = await window.electronAPI.verifySpotifyToken(data.token);
                if (!valid) throw new Error('Token expirado o inválido');

                await initSpotifyPlayer(data.token, data.uri);
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

    // Función para cargar imágenes desde la misma carpeta
    async function loadImages() {
        try {
            images = await window.electronAPI.getImagesFromFolder();
            console.log('Imágenes cargadas:', images); // Depuración
            if (images.length > 0) {
                setRandomBackgroundImage();
            } else {
                console.warn('No se encontraron imágenes en la carpeta de wallpapers.');
            }
        } catch (error) {
            console.error('[ERROR] Fallo al cargar imágenes:', error);
        }
    }

    // Función para establecer una imagen aleatoria como fondo
    function setRandomBackgroundImage() {
        if (images.length === 0) return;  // No hay imágenes disponibles

        // Seleccionar una imagen aleatoria
        const randomImage = images[Math.floor(Math.random() * images.length)];

        // Aplicar la imagen como fuente (src) de la imagen
        const progressImageElement = document.querySelector('.progress-image');
        if (progressImageElement) {
            progressImageElement.src = randomImage;
        }
    }

    // Cambiar el contenido de la función a:
    function updateAlbumPlaylistText(text) {
        const wrapper = document.querySelector('.album-playlist-wrapper');
        if (!wrapper) return;

        const isSpotify = text.startsWith('spotify:playlist:');
        let content = '';

        if (isSpotify) {
            const playlistId = text.split(':')[2];
            content = `
            <span class="album-playlist-text spotify-label">Playlist de Spotify</span>
            <span class="album-playlist-text spotify-id">ID: ${playlistId}</span>
        `;
        } else {
            content = `
            <span class="album-playlist-text">${text}</span>
            <span class="album-playlist-text">${text}</span>
        `;
        }

        wrapper.innerHTML = content;

        // Animación
        const textWidth = wrapper.firstChild.offsetWidth;
        const containerWidth = wrapper.parentElement.offsetWidth;

        if (textWidth > containerWidth) {
            const speed = 40;
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
                const playlistUri = await window.electronAPI.getPlaylistInput();
                if (playlistUri) {
                    // Se asume que el token ya está almacenado en modeData.token
                    window.electronAPI.setMode('spotify', { token: modeInfo.data.token, uri: playlistUri });
                    await initSpotifyPlayer(modeInfo.data.token, playlistUri);
                }
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
            setRandomBackgroundImage();
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
        if (currentMode === 'spotify') {
            window.electronAPI.spotifyControl('next');
        } else {
            if (isShuffleEnabled) {
                currentSongIndex = Math.floor(Math.random() * songs.length);
            } else {
                currentSongIndex = (currentSongIndex + 1) % songs.length;
            }
            playSong(currentSongIndex);
        }
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
        playPauseIcon = playPauseBtn.querySelector('img');
        playPauseBtn.addEventListener('click', () => {
            if (currentMode === 'spotify') {
                // Si el estado actual indica que está pausado, se reanuda; de lo contrario, se pausa.
                if (window.spotifyPlayerState?.paused) {
                    window.electronAPI.spotifyControl('play');
                } else {
                    window.electronAPI.spotifyControl('pause');
                }
            } else {
                if (audioElement.paused) {
                    audioElement.play();
                    playPauseIcon.src = '../assets/icons/Pause button.svg';
                    playPauseIcon.alt = 'Pause';
                } else {
                    audioElement.pause();
                    playPauseIcon.src = '../assets/icons/Play button.svg';
                    playPauseIcon.alt = 'Play';
                }
            }
        });
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentMode === 'spotify') {
                window.electronAPI.spotifyControl('next');
            } else {
                playNextSong();
            }
        });
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
        prevBtn.addEventListener('click', () => {
            if (currentMode === 'spotify') {
                window.electronAPI.spotifyControl('previous');
            } else {
                playPreviousSong();
            }
        });
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
            if (currentMode === 'spotify') {
                // Obtener el estado actual de repeat y alternar entre 'off', 'context' y 'track'
                const states = ['off', 'context', 'track'];
                const currentRepeat = window.spotifyPlayerState?.repeat_mode || 'off';
                const currentIndex = states.indexOf(currentRepeat);
                const newIndex = (currentIndex + 1) % states.length;
                window.electronAPI.spotifyControl('repeat', { state: states[newIndex] });
            } else {
                isLoopEnabled = !isLoopEnabled;
                loopBtn.classList.toggle('is-active', isLoopEnabled);
                if (isLoopEnabled) {
                    loopIcon.src = '../assets/icons/repeat song icon on.svg';
                    loopIcon.alt = 'Repeat On';
                } else {
                    loopIcon.src = '../assets/icons/repeat song icon off.svg';
                    loopIcon.alt = 'Repeat Off';
                }
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

            if (currentMode === 'spotify') {
                const duration = window.spotifyPlayerState?.track_window?.current_track?.duration_ms;
                if (duration) {
                    const newPosition = percent * duration;
                    window.electronAPI.spotifyControl('seek', { position: newPosition });
                }
            }
            else {
                // Establece el tiempo actual de la canción en función del porcentaje calculado
                // audioElement.duration es la duración total de la canción en segundos
                audioElement.currentTime = percent * audioElement.duration;
            }
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
            if (currentMode === 'spotify') {
                // Se invierte el estado actual basado en la clase 'is-active'
                const newState = !document.getElementById('shuffleBtn').classList.contains('is-active');
                window.electronAPI.spotifyControl('shuffle', { state: newState });
            } else {
                isShuffleEnabled = !isShuffleEnabled;
                shuffleBtn.classList.toggle('is-active', isShuffleEnabled);
                if (isShuffleEnabled) {
                    shuffleIcon.src = '../assets/icons/shuffle icon on.svg';
                    shuffleIcon.alt = 'Shuffle On';
                } else {
                    shuffleIcon.src = '../assets/icons/shuffle icon off.svg';
                    shuffleIcon.alt = 'Shuffle Off';
                }
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