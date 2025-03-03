# ABAsic-music-player
A basic nice music player

- Compartir la app con amigos pulsando botón
- Conectar con spotify para reproducir la lista dada la URL 

# Usage

Descarga [este zip](ENLACE) y crea un enlace directo al escritorio (por ejemplo) de ``abasic-music-player-win32-x64/abasic-music-player.exe`, ejecutalo y, ¡ya puedes disfrutar de tu reproductor de música favorito!

# Tools

- Usamos Electron JS para construir nuestra aplicación. Es una alternativa comúnmente criticada en términos de huella de memoria y rendimiento, pero es innegable que de cara a desarrolladores web a veces esto no es relevante, y la experiencia de usuario que proporciona el framework es innegablemente aceptable.
- Usamos Electron Forge para distribuir nuestra aplicación al resto de usuarios, una vez completada.
- Usamos el framework CSS [Bulma](https://versions.bulma.io/0.7.0/documentation/overview/start/) para el desarrollo de CSS.
- Usamos la fuente variable [Pixelify Sans](https://gwfh.mranftl.com/fonts/pixelify-sans?subsets=latin) [Variable Font](https://fonts.google.com/selection) para mayor flexibilidad y poner modificar el peso de la fuente `wght`.
- Usamos [electron-icon-maker](https://www.npmjs.com/package/electron-icon-maker) para que nuestra app use un favicon.ico propio.

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

Ahora bien, hay que distinguir las limitaciones: Electron Forge puede crear un únic EXe file con el propósito de instalarse en el sistema del ususario, pero lo que no puede hcaer (debido a las limitaciones de Chromium) es, una vez instalado, tener únicamente un solo EXE que ejecute la aplicación. Debe estar acompañado de las librerías necesarias. Sin embergo, hay alternativas que compilarn un .exe de Windows portabler usando  [electron-builder](https://www.electron.build/)'s portable target (NSIS) under the hood (ver https://github.com/rabbit-hole-syndrome/electron-forge-maker-portable).

# References
- https://www.youtube.com/watch?v=3yqDxhR2XxE&ab_channel=Fireship
- https://www.youtube.com/@nashallery