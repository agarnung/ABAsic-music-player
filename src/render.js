/// File used to run JavaScript in our fornt-end (it like our front-end code)

// Stablish a reference to all our elements in the HTML
// Buttons
const audioElement = document.querySelector('audio');
const startBtn = document.querySelector('#startBtn');
const stopBtn = document.querySelector('#stopBtn');
const restartBtn = document.querySelector('#restartBtn');


// Esperar a que cargue el DOM, para asegurar que el script se ejecute después de que el HTML se haya cargado completamente y no haya errores por elementos que no existan y se quieran usar (auqnue el atributo defer hace lo mismo)
document.addEventListener("DOMContentLoaded", function () {
    // Función para reproducir música
    function playMusic() {
        if (audioElement.paused) {
            audioElement.play();
        }
    }

    // Función para detener música
    function stopMusic() {
        if (audioElement.paused)
            return;
        audioElement.pause();
    }

    // Función para detener música
    function restartMusic() {
        audioElement.currentTime = 0; // Reinicia la música al inicio
    }

    // Asignar eventos a los botones
    startBtn.addEventListener("click", playMusic);
    stopBtn.addEventListener("click", stopMusic);
    restartBtn.addEventListener("click", restartMusic);
});
