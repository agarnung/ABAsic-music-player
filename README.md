__Acoording to [URL](https://developer.spotify.com/documentation/web-playback-sdk/howtos/web-app-player), Web Playback SDK requires Spotify Premium, so we discontinue this branch at the moment__

Rama para intentar poner a funcionar Spotify en la app.

- Connect to Spotify to play a playlist given its URL.

To connect to Spotify and play a playlist, follow these steps: (https://chat.deepseek.com/a/chat/s/adff0462-079b-409b-8bf8-3868ea08af47)

Cuenta de Spotify Developer:
   Registra tu aplicación en [Spotify Developer Dashboard](https://developer.spotify.com/)
   En "Redirect URIs" agrega: http://localhost:3000/callback y your-app://callback. Mejor, en lugar de usar localhost, se puede utilizar un URI personalizado como protocolo (por ejemplo, myapp://callback) para manejar la redirección sin necesidad de un servidor local, pues esto es una aplicación de escritorio.
   Marca la casilla "Web Playback SDK"
   Guarda los cambios y copia tu Client ID (en Settings)

Deberá haber un modo de leer el token de spotify para usarlo y también de guardarlo y, naturalmente, de manejar los controles de spotify usando nuestra app GUI como "intermediario". Para esto se exponen esas funciones en `preload.js`.

Como es necesario especificar el clientId y el clientSecret, se usa `dotenv` para proporcionarlo al código de manera segura:
1. `npm install dotenv`
2. Crea un archivo `.env` en la raíz de tu proyecto y agrega tus credenciales:
```
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
```
3. Ahora se puede acceder desde el index.js se manera segura:
```js
require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});
```
4. Asegurarse de no subir el archivo `.env` a Github! Añadirlo al `.gitignore`.

- Registrar el protocolo: npx electron . --register-protocol=abasic-music-player

Se recomienda también consultar la libería `react-spotify-web-playback-sdk`. Instalar dependencias: `npm install react-spotify-web-playback-sdk spotify-web-api-node @react-oauth/google`.

# Troubleshooting

Limpia caché de Electron: `rm -rf node_modules` y luego puedes volver a la normalidad con `npm install`.

# References 

- https://developer.spotify.com/documentation/web-playback-sdk/howtos/web-app-player

- https://github.com/spotify/spotify-web-playback-sdk-example/tree/main?tab=readme-ov-file