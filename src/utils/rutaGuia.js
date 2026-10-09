// La ruta de la guia de espiritus, como regla suelta y pura.
//
// Vive aqui, y no dentro de App.jsx, porque es la unica regla que decide si la guia se dibuja
// DENTRO de la aplicacion o si la pantalla sigue siendo el catalogo. Suelta se puede probar sin
// montar la app (tests/rutaGuia.test.js), igual que src/utils/visitaEnlace.js.
//
// La ruta que recibe ya viene SIN el prefijo de idioma: la aplicacion la calcula con
// rutaSinIdioma (src/i18n/core.js), asi que /en/guia-espiritus llega aqui como
// /guia-espiritus y los dos idiomas deciden lo mismo.

export const RUTA_GUIA = '/guia-espiritus';

/** ¿La ruta de la app (ya sin el prefijo de idioma) es la guia de espiritus? */
export function esRutaGuia(rutaApp) {
  const ruta = String(rutaApp || '');
  // La barra final es la misma pagina, asi que /guia-espiritus/ entra. Un texto MAS LARGO que
  // empiece igual no es la guia: /guia-espiritus-vieja y /guia-espiritus/algo son otra cosa.
  const limpia = ruta.length > 1 && ruta.endsWith('/') ? ruta.slice(0, -1) : ruta;
  return limpia === RUTA_GUIA;
}
