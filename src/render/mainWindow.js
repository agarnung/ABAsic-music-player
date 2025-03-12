/// mainWindow.js

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM completamente cargado y analizado");

    const clickSound = document.getElementById('click-sound');
    const unclickSound = document.getElementById('unclick-sound');

    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
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
        clickSound.play().catch((error) => {
            console.error('Error al reproducir el sonido:', error);
        });

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
    const rectY = 57.9571;
    const rectWidth = 115.458;
    const rectHeight = 166.043;

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
    clickSound.addEventListener('canplaythrough', () => {
        console.log('Sonido cargado y listo para reproducirse');
    });

    // Botón de youtube (abrir modal)
    const modal = document.getElementById('workInProgressModal');
    if (youtubeBtn) {
        youtubeBtn.addEventListener('click', () => {
            clickSound.play().catch((error) => {
                console.error('Error al reproducir el sonido:', error);
            });

            console.log('[youtube] Botón clickeado, abriendo modal...');
            if (modal) {
                modal.classList.add('show'); // Mostrar el modal
            }
        });
    }

    // Botón de cerrar el modal
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            console.log('[MODAL] Cerrando modal...');
            modal.classList.add('hide');

            setTimeout(() => {
                modal.classList.remove('show', 'hide');
            }, 400);
        });
    }

    // Botones que usan unclick-sound (off/inactivos)
    document.querySelectorAll('#minimizeBtn, #closeBtn, #closeModal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('unclick-sound').play().catch(console.error);
        });
    });
});