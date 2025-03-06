/// mainWindow.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y analizado");

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

    // Movimiento del personaje en la pantalla inicial

    const draggableSvg = document.getElementById('draggable-svg');
    const dragArea = document.querySelector('.drag-area');

    // Coordenadas del personaje dentro del SVG
    const rectX = 3;
    const rectY = 77.9571;
    const rectWidth = 115.458;
    const rectHeight = 146.043;

    if (draggableSvg && dragArea) {
        let isDragging = false;
        let offsetX = 0, offsetY = 0;

        // Cambiar el cursor a "grab" cuando el mouse esté sobre la zona específica
        draggableSvg.addEventListener('mousemove', (e) => {
            const svgRect = draggableSvg.getBoundingClientRect();
            const xInSvg = e.clientX - svgRect.left;
            const yInSvg = e.clientY - svgRect.top;

            if (xInSvg >= rectX && xInSvg <= rectX + rectWidth && yInSvg >= rectY && yInSvg <= rectY + rectHeight) {
                draggableSvg.style.cursor = 'grab';
            } else {
                draggableSvg.style.cursor = 'default';
            }

            // Mientras esté arrastrando, mantener el cursor "grabbing"
            if (isDragging) {
                draggableSvg.style.cursor = 'grabbing';
            }
        });

        // Iniciar el arrastre al hacer clic en el SVG, solo si está dentro del área definida
        draggableSvg.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const svgRect = draggableSvg.getBoundingClientRect();
            const xInSvg = e.clientX - svgRect.left;
            const yInSvg = e.clientY - svgRect.top;

            if (xInSvg >= rectX && xInSvg <= rectX + rectWidth && yInSvg >= rectY && yInSvg <= rectY + rectHeight) {
                isDragging = true;
                const rect = draggableSvg.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                draggableSvg.style.cursor = 'grabbing';  // Cambia el cursor mientras se arrastra
            }
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
            draggableSvg.style.cursor = 'grab';  // Restaurar el cursor a "grab"
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

    const spotifyBtn = document.getElementById('spotifyBtn');
    if (spotifyBtn) {
      spotifyBtn.addEventListener('click', async () => {
        try {
          const accessToken = await window.electronAPI.openSpotifyAuth();
          if (accessToken) {
            // Pedir URL de la playlist
            const playlistUri = await window.electronAPI.getPlaylistInput();
            
            if (playlistUri) {
              // Guardar ambos datos
              window.electronAPI.setMode('spotify', {
                token: accessToken,
                uri: playlistUri
              });
              window.electronAPI.openSongWindow();
            }
          }
        } catch (error) {
          console.error('Error:', error);
          alert(`Error: ${error.message}`);
        }
      });
    }
});