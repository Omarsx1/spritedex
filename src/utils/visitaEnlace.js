// La visita por enlace: entrar a la app por un enlace de amigo dura lo que dura la ruta
// que trae ese enlace. Al salir de ella la visita termina y la app vuelve a lo tuyo.
//
// Esto vive aqui, y no dentro de App.jsx, porque es la unica regla que decide si la ficha
// del amigo se dibuja y si la pagina de amigos abre en la pestaña de comparación. Suelta
// se puede probar sin montar la app (tests/visitaEnlace.test.js).

// Claves que trae un enlace: ?share= (enlace por token, el actual), ?code= y ?friend=
// (los formatos anteriores, que siguen circulando).
const CLAVE_DE_ENLACE = /[?&](share|code|friend)=/;

/** ¿La URL trae un enlace de amigo en sus parametros? */
export function traeEnlaceDeAmigo(search) {
  return CLAVE_DE_ENLACE.test(String(search || ''));
}

/**
 * Codigo del amigo que dibuja la ficha en la pagina de amigos. Cadena vacia si no hay
 * ninguna ficha que dibujar.
 *
 * - Codigo en la ruta (/amigos/SDEX-XXXX): manda la ruta, siempre.
 * - Enlace por token (?share=): el codigo se resuelve despues del montaje, asi que se lee
 *   de memoria. Pero solo cuenta MIENTRAS la ruta siga trayendo el enlace: si no, el codigo
 *   de una visita vieja se quedaba vivo, la ficha seguia dibujada y la pestaña de
 *   comparación se abria sola al volver a la pagina de amigos.
 */
export function codigoFichaEnRuta(rutaApp, search, codigoDeToken) {
  if (rutaApp.indexOf('/amigos/') === 0) {
    return decodeURIComponent(rutaApp.slice(8)).replace(/\/+$/, '').toUpperCase();
  }
  if (rutaApp !== '/amigos' || !traeEnlaceDeAmigo(search)) return '';
  return String(codigoDeToken || '').toUpperCase();
}
