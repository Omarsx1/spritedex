// Nucleo de idioma: funciones puras, sin React ni DOM, para poder probarlas con node --test.
// El idioma activo se guarda en un modulo propio porque el canvas y los helpers lo necesitan
// fuera de React. Cambiar de idioma recarga la pagina, asi que nunca queda un idioma a medias.
import { safeStorage } from '../utils/safeStorage.js';

export const IDIOMAS = ['es', 'en', 'pt-BR'];
export const IDIOMA_POR_DEFECTO = 'es';
export const CLAVE_IDIOMA = 'spritedex_lang';
export const PREFIJOS = { en: '/en', 'pt-BR': '/pt-br' };

// 'es-MX' -> 'es', 'en-US' -> 'en', 'pt', 'pt-BR' y 'pt-PT' -> 'pt-BR', 'fr' -> 'en'.
// Sin pais, sin IP, sin zona horaria.
export function normalizarIdioma(etiqueta) {
  const partes = String(etiqueta || '').trim().toLowerCase().split(/[-_]/);
  if (!partes[0]) return null;
  if (partes[0] === 'es') return 'es';
  if (partes[0] === 'pt') return 'pt-BR';
  return 'en';
}

export function idiomaGuardado() {
  const valor = safeStorage.getItem(CLAVE_IDIOMA);
  return IDIOMAS.indexOf(valor) !== -1 ? valor : null;
}

export function guardarIdioma(lang) {
  safeStorage.setItem(CLAVE_IDIOMA, lang);
}

// Decide la PRIMERA etiqueta del navegador que sea reconocible (es, pt-BR o en).
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
  for (const lang of Object.keys(PREFIJOS)) {
    const prefijo = PREFIJOS[lang];
    if (p === prefijo || p.startsWith(prefijo + '/')) return lang;
  }
  return IDIOMA_POR_DEFECTO;
}

export function rutaSinIdioma(pathname) {
  const p = String(pathname || '/');
  const lang = idiomaDeRuta(p);
  if (lang === IDIOMA_POR_DEFECTO) return p;
  const prefijo = PREFIJOS[lang];
  return p === prefijo ? '/' : p.slice(prefijo.length);
}

// conIdioma('/amigos/SDEX-1', 'en') -> '/en/amigos/SDEX-1'; conIdioma('/en', 'es') -> '/'.
// Conserva query y hash si vienen pegados a la ruta.
export function conIdioma(ruta, lang) {
  const s = String(ruta || '/');
  const corte = s.search(/[?#]/);
  const pathname = corte === -1 ? s : s.slice(0, corte);
  const cola = corte === -1 ? '' : s.slice(corte);
  const base = rutaSinIdioma(pathname) || '/';
  const prefijo = PREFIJOS[lang];
  const conPrefijo = prefijo ? (base === '/' ? prefijo : prefijo + base) : base;
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
  const porRuta = idiomaDeRuta(pathname);
  if (porRuta !== IDIOMA_POR_DEFECTO) return { lang: porRuta, destino: null };
  const eleccion = guardado === undefined ? idiomaGuardado() : guardado;
  if (eleccion) return { lang: eleccion, destino: null };
  const navegador = idiomaDelNavegador(langs);
  if (navegador !== IDIOMA_POR_DEFECTO) {
    return { lang: navegador, destino: conIdioma(pathname, navegador) + search + hash };
  }
  return { lang: IDIOMA_POR_DEFECTO, destino: null };
}
