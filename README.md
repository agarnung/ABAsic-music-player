# ABAsic-music-player
A basic nice music player

# Usage

Descarga [este zip](ENLACE), descomprímelo y mueve toda la carpeta `abasic-music-player-win32-x64` a `C:\Program Files` o tu ruta preferida y crea un enlace directo al escritorio (por ejemplo) del ejecutable `abasic-music-player.exe`, ejecutalo. ¡Ya puedes disfrutar de tu reproductor de música favorito!

## Features

- Si se da "para atrás" y la canción están más de 5 segundos avanzada, hace las veces de "botón de reiniciar esta canción". Si lleva menos de 5 segundos avanzada, vuelve a la canción anterior. Así nos olvidamos de "botón de reiniciar esta canción".

# Tools

- Usamos Electron JS para construir nuestra aplicación. Es una alternativa comúnmente criticada en términos de huella de memoria y rendimiento, pero es innegable que de cara a desarrolladores web a veces esto no es relevante, y la experiencia de usuario que proporciona el framework es innegablemente aceptable.
- Usamos Electron Forge para distribuir nuestra aplicación al resto de usuarios, una vez completada.
- Usamos la fuente variable [Pixelify Sans](https://gwfh.mranftl.com/fonts/pixelify-sans?subsets=latin) [Variable Font](https://fonts.google.com/selection) para mayor flexibilidad y poner modificar el peso de la fuente `wght`.
- Usamos [electron-icon-maker](https://www.npmjs.com/package/electron-icon-maker) para que nuestra app use un favicon.ico propio. See https://www.youtube.com/watch?v=dtk-v5vk8iA&ab_channel=tylerlaceby.

# Tutorial (for developers)

Se han seguido los siguientes tutoriales:
- https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites (Conjunto de 6 tutoriales sobre creación de apps en Eldectron JS y prerequisitos)
- https://dev.to/arhamrumi/installing-nodejs-on-windows-a-complete-tutorial-3m6j (Instalación de Node.js)

Usamos Windows para programar la aplicación, con VSCode y [Git](https://git-scm.com/downloads/win).

Como no nos gusta trabajar a lo tonto, usamos la herramienta create-electron-app que nos facilita algunos pasos para crear nuestra aplicación:
```bash
npm install -g create-electron-app && create-electron-app ABAsic-music-player
```

- El index.js es el entry point de nuestro main process (Node). Este archivo crea el (exactamente) único main process que usa la app bajo el framework Electron.js.
- El index.html es el punto de entrada de nuestro front-end UI o render process (que es una instancia de Chromium). Puede haber múltiplies render processes al mismo tiempo pero un solo main process.

Para lanzar la aplicación en modo development, ejecutar desde CLI:
```bash
npm start
```

Cabe decir que esto no viene equipado con "hot realoading", es decir, que si hacemos cambios en el código con la aplicación en marcha, no se van a ver reflejados automáticamente en ella, si no que habría que volver a lanzar la aplicación (al contrario de lo que pasa por ejemplo con frameworks web como Bundler/Jeckyll). Pero puedes ejecutar `rs` en la terminal en que hiciste `npm start` y se recargará la aplicación sin falta de cerrarla.

¿Cómo ship our app? To package our app for different OS (Windows, Linux, MacOS), we can use Electron Forge, which does all of this automatically for us. The following command will detect our OS and build the distribuitable fild for that OS
```
npm run make
```
Now check the `out/` folder for the .exe (in Windows case) which you can distribute with your friends. Just marvelous ✨.

Ahora bien, hay que distinguir las limitaciones: Electron Forge puede crear un únic EXe file con el propósito de instalarse en el sistema del ususario, pero lo que no puede hcaer (debido a las limitaciones de Chromium) es, una vez instalado, tener únicamente un solo EXE que ejecute la aplicación. Debe estar acompañado de las librerías necesarias. Sin embergo, hay alternativas que compilarn un .exe de Windows portabler usando  [electron-builder](https://www.electron.build/)'s portable target (NSIS) under the hood (ver https://github.com/rabbit-hole-syndrome/electron-forge-maker-portable) (`npm run make` hará `electron-forge make`).

# Comments

- Se ha descubierto el útil framework CSS [Bulma](https://versions.bulma.io/0.7.0/documentation/overview/start/) para el desarrollo de estilos.

# References
- https://www.youtube.com/watch?v=3yqDxhR2XxE&ab_channel=Fireship
- https://www.youtube.com/@nashallery

# TODO 
- Compartir la app con amigos pulsando botón
- Implementar un desplegable en la ventana de canción para elegir la canción a escuchar, por orden alfabético. Y continuar en ese orden si no está el shuffle activado.
- Botón de repetir la canción actual en bucle
- Mover a la hello kitty por su cielo con el ratón pulsando en ella, solidaria a su bocadillo
- Cuando canción parada, que también se pare de mover el texto de arriba
- Integrar YouTube (con una API como youtube-api-v3 o youtube-player)

- Conectar con Spotify para reproducir la lista dada la URL

Para conectar con Spotify y reproducir una lista, sigue estos pasos:

1. **Registrar la aplicación en [Spotify Developer Dashboard](https://developer.spotify.com/):**
   - Crear una nueva aplicación en el Spotify Developer Dashboard.
   - Obtener el Client ID y Client Secret para autenticarte.

2. **Configurar la autenticación con Spotify:**
   - Implementar OAuth 2.0 para obtener un token de acceso que te permita interactuar con la API de Spotify.
   - Usar la biblioteca `spotify-web-api-node` para facilitar la integración.

3. **Obtener listas de reproducción y datos:**
   - Usar el token de acceso para interactuar con la API de Spotify y obtener las listas de reproducción del usuario.

4. **Integrar el Spotify Web Playback SDK:**
   - Usar este SDK para permitir la reproducción de las canciones directamente en tu aplicación.
   - Es necesario un token de acceso de usuario Premium para que funcione.

5. **Frontend en Electron:**
   - Solicitar el ID de la lista de reproducción a través de un modal y usa la API de Spotify para obtener las canciones.
   - Mostrar las canciones y usar el Web Playback SDK para controlarlas.

6. **Reproducir canciones:**
   - Usar el URI de las canciones y la funcionalidad del SDK para reproducirlas.

7. **Consideraciones adicionales:**
   - Asegurarse de gestionar de forma segura los tokens de acceso.
   - Manejar las limitaciones de la API (como el número máximo de solicitudes por minuto).
