// La ruta del contador de cofres de Spritedex. Vive suelta, como rutaGuia, para probarla
// sin montar la app. La ruta llega SIN el prefijo de idioma (/en/cofres -> /cofres).
export const RUTA_COFRES = '/cofres';

export function esRutaCofres(rutaApp) {
  const ruta = String(rutaApp || '');
  const limpia = ruta.length > 1 && ruta.endsWith('/') ? ruta.slice(0, -1) : ruta;
  return limpia === RUTA_COFRES;
}
