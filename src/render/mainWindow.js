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

    const draggableSvg = document.getElementById('draggable-svg');
    const dragArea = document.querySelector('.drag-area');
    
    if (draggableSvg && dragArea) {
        let isDragging = false;
        let offsetX = 0, offsetY = 0;
    
        // Iniciar el arrastre al hacer clic en el SVG
        draggableSvg.addEventListener('mousedown', (e) => {
            // Evitar que se propague el evento de arrastre
            e.preventDefault();
    
            isDragging = true;
            const rect = draggableSvg.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            draggableSvg.style.cursor = 'grabbing';  // Cambia el cursor mientras se arrastra
        });
    
        // Mover el SVG mientras el ratón se mueve
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dragAreaRect = dragArea.getBoundingClientRect();
                const maxX = dragAreaRect.width - draggableSvg.offsetWidth;
                const maxY = dragAreaRect.height - draggableSvg.offsetHeight;
    
                let newX = e.clientX - offsetX - dragAreaRect.left;
                let newY = e.clientY - offsetY - dragAreaRect.top;
    
                // Limitar el arrastre del SVG a los bordes del área de arrastre
                newX = Math.max(0, Math.min(maxX, newX));
                newY = Math.max(0, Math.min(maxY, newY));
    
                draggableSvg.style.left = `${newX}px`;
                draggableSvg.style.top = `${newY}px`;
            }
        });
    
        // Detener el arrastre cuando se suelta el ratón
        document.addEventListener('mouseup', () => {
            isDragging = false;
            draggableSvg.style.cursor = 'grab';  // Restaurar el cursor
        });
    }

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