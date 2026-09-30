// Nucleo de idioma: funciones puras, sin React ni DOM, para poder probarlas con node --test.
// El idioma activo se guarda en un modulo propio porque el canvas y los helpers lo necesitan
// fuera de React. Cambiar de idioma recarga la pagina, asi que nunca queda un idioma a medias.
import { safeStorage } from '../utils/safeStorage.js';

export const IDIOMAS = ['es', 'en'];
export const IDIOMA_POR_DEFECTO = 'es';
export const CLAVE_IDIOMA = 'spritedex_lang';
export const PREFIJO_EN = '/en';

// 'es-MX' -> 'es', 'en-US' -> 'en', 'fr' -> 'en'. Sin pais, sin IP, sin zona horaria.
export function normalizarIdioma(etiqueta) {
  const limpio = String(etiqueta || '').trim().toLowerCase();
  if (!limpio) return null;
  return limpio.split(/[-_]/)[0] === 'es' ? 'es' : 'en';
}

export function idiomaGuardado() {
  const valor = safeStorage.getItem(CLAVE_IDIOMA);
  return IDIOMAS.indexOf(valor) !== -1 ? valor : null;
}

export function guardarIdioma(lang) {
  safeStorage.setItem(CLAVE_IDIOMA, lang);
}

// Decide la PRIMERA etiqueta del navegador: es* -> es, cualquier otra cosa -> en.
export function idiomaDelNavegador(langs) {
  const lista = Array.isArray(langs) && langs.length
    ? langs
    : (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])
      ? navigator.languages || [navigator.language]
      : []);
  for (const etiqueta of lista) {
    const normal = normalizarIdioma(etiqueta);
    if (normal) return normal;
  }
  return 'en';
}

// La eleccion explicita del usuario siempre gana sobre la deteccion.
export function detectarIdioma(langs) {
  return idiomaGuardado() || idiomaDelNavegador(langs);
}

export function idiomaDeRuta(pathname) {
  const p = String(pathname || '/');
  return p === PREFIJO_EN || p.startsWith(PREFIJO_EN + '/') ? 'en' : 'es';
}

export function rutaSinIdioma(pathname) {
  const p = String(pathname || '/');
  if (p === PREFIJO_EN) return '/';
  if (p.startsWith(PREFIJO_EN + '/')) return p.slice(PREFIJO_EN.length);
  return p;
}

// conIdioma('/amigos/SDEX-1', 'en') -> '/en/amigos/SDEX-1'; conIdioma('/en', 'es') -> '/'.
// Conserva query y hash si vienen pegados a la ruta.
export function conIdioma(ruta, lang) {
  const s = String(ruta || '/');
  const corte = s.search(/[?#]/);
  const pathname = corte === -1 ? s : s.slice(0, corte);
  const cola = corte === -1 ? '' : s.slice(corte);
  const base = rutaSinIdioma(pathname) || '/';
  const conPrefijo = lang === 'en' ? (base === '/' ? PREFIJO_EN : PREFIJO_EN + base) : base;
  return conPrefijo + cola;
}

export function interpolar(texto, vars) {
  if (!vars) return texto;
  return String(texto).replace(/\{(\w+)\}/g, (todo, clave) => (
    vars[clave] === undefined || vars[clave] === null ? todo : String(vars[clave])
  ));
}

// Orden de resolucion: idioma activo -> espanol -> la propia clave.
export function traducir(diccionarios, lang, clave, vars) {
  const activo = (diccionarios && diccionarios[lang]) || {};
  const espanol = (diccionarios && diccionarios.es) || {};
  const texto = activo[clave] !== undefined ? activo[clave] : espanol[clave];
  if (texto === undefined || texto === null) return clave;
  return interpolar(texto, vars);
}

// Un solo lugar decide con que idioma arranca la pagina y si hay que mover la URL.
// Devuelve { lang, destino }; destino es null cuando no hay que tocar la barra de direcciones.
export function planDeArranque({ pathname = '/', search = '', hash = '', langs, guardado } = {}) {
  if (idiomaDeRuta(pathname) === 'en') return { lang: 'en', destino: null };
  const eleccion = guardado === undefined ? idiomaGuardado() : guardado;
  if (eleccion) return { lang: eleccion, destino: null };
  const navegador = idiomaDelNavegador(langs);
  if (navegador === 'en') {
    return { lang: 'en', destino: conIdioma(pathname, 'en') + search + hash };
  }
  return { lang: IDIOMA_POR_DEFECTO, destino: null };
}
