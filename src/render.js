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
  
    const openSongWindowBtn = document.getElementById('openSongWindowBtn');
    if (openSongWindowBtn) {
      openSongWindowBtn.addEventListener('click', () => {
        window.electronAPI.openSongWindow();
      });
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
  });