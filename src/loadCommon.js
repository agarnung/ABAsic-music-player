/// loadCommon.js

/// Código para cargar contenido común en diferentes archivos HTML

// Función para cargar el contenido común del <head>
function loadHead(title) {
    // Se vería así:
    // <head>
    //     <meta charset="UTF-8" />
    //     <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    //     <title>ABAsic Music Player</title>
    //     <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">
    //     <link rel="stylesheet" href="index.css" /> <!-- AFTER linking Bulma -->
    //     <script defer src="render.js"></script> <!-- defer attribute to make the JS load AFTER the HTML -->
    // </head>

    const head = document.querySelector('head');
  
    // Crear elementos comunes del <head>
    const metaCharset = document.createElement('meta');
    metaCharset.setAttribute('charset', 'UTF-8');
  
    const metaViewport = document.createElement('meta');
    metaViewport.setAttribute('name', 'viewport');
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no');
  
    const titleElement = document.createElement('title');
    titleElement.textContent = title;
  
    const bulmaCSS = document.createElement('link');
    bulmaCSS.setAttribute('rel', 'stylesheet');
    bulmaCSS.setAttribute('href', 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css');
  
    const customCSS = document.createElement('link');
    customCSS.setAttribute('rel', 'stylesheet');
    customCSS.setAttribute('href', 'index.css');
  
    const renderJS = document.createElement('script');
    renderJS.setAttribute('src', 'render.js');
    renderJS.setAttribute('defer', true);
  
    // Agregar elementos al <head>
    head.appendChild(metaCharset);
    head.appendChild(metaViewport);
    head.appendChild(titleElement);
    head.appendChild(bulmaCSS);
    head.appendChild(customCSS);
    head.appendChild(renderJS);
  }
  
  // Función para cargar el contenido común del <header>
  function loadHeader(title) {
    const header = `
      <header>
        <div class="header-container">
          <div class="level is-mobile level-right draggable-container">
            <div class="level-right">
              <button id="minimizeBtn" class="level-item button is-light">
                <img src="../assets/icons/minimize.png" alt="Minimize" width="20" />
              </button>
              <button id="closeBtn" class="level-item button is-light">
                <img src="../assets/icons/close.png" alt="Close" width="20" />
              </button>
            </div>
          </div>
          <h1 class="has-text-centered">🎵 ${title}</h1>
        </div>
      </header>
    `;
  
    // Insertar el header en el body
    document.body.insertAdjacentHTML('afterbegin', header);
  }
  
  // Exportar funciones para usarlas en otros archivos
  window.loadCommon = {
    loadHead,
    loadHeader,
  };