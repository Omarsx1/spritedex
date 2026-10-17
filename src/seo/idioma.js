// Idioma en el SEO: una sola forma de elegir texto por idioma y de nombrar los locales de Open Graph.
//
// Lo usan el prerender (Node), el gestor de <head> en el navegador y las pruebas, asi que no toca
// el DOM ni depende de datos. Las ramas binarias `lang === 'en' ? ingles : espanol` hacian caer el
// portugues al espanol; aqui cada texto declara sus idiomas y solo cae a espanol si falta la clave.
import { IDIOMAS, conIdioma } from '../i18n/core.js';
import ptBR from '../i18n/locales/pt-BR.js';
import es from '../i18n/locales/es.js';
import en from '../i18n/locales/en.js';

export const OG_LOCALE = { es: 'es_MX', en: 'en_US', 'pt-BR': 'pt_BR' };

export const NOMBRE_IDIOMA = {
  es: 'Español',
  en: 'English',
  'pt-BR': 'Português (Brasil)'
};

// porIdioma('pt-BR', { es, en, 'pt-BR' }) -> el valor de pt-BR. Solo cae a espanol cuando
// el idioma no tiene clave propia, nunca porque el idioma sea distinto de 'en'.
export function porIdioma(lang, opciones) {
  return Object.prototype.hasOwnProperty.call(opciones, lang) ? opciones[lang] : opciones.es;
}

export function ogLocale(lang) {
  return porIdioma(lang, OG_LOCALE);
}

// Las otras versiones del mismo contenido, en el orden de IDIOMAS.
export function ogLocalesAlternos(lang) {
  return IDIOMAS.filter((l) => l !== lang).map(ogLocale);
}

// og:locale y sus alternos, en el orden en que se escriben en el HTML estatico. Los alternos solo
// se declaran cuando la pagina tiene versiones en otros idiomas (mismo criterio en todos lados).
export function lineasOgLocale(lang, conAlternos = true) {
  return [
    '<meta property="og:locale" content="' + ogLocale(lang) + '" />',
    ...(conAlternos ? ogLocalesAlternos(lang) : []).map((l) => '<meta property="og:locale:alternate" content="' + l + '" />')
  ];
}

// Juego hreflang completo de una ruta: los tres idiomas con autorreferencia y x-default en espanol.
// Si falta cualquiera, Google descarta el cluster.
export function hreflangsDe(sitio, ruta, idiomas = IDIOMAS) {
  return [
    ...idiomas.map((lang) => ({ hreflang: lang, href: sitio + conIdioma(ruta, lang) })),
    { hreflang: 'x-default', href: sitio + conIdioma(ruta, 'es') }
  ];
}

// Porcentajes y cifras con decimal: el portugues escribe 1,50% donde espanol e ingles escriben 1.50%.
// Solo toca digito.digito, asi que no altera nombres ni texto.
export function numeroEnIdioma(texto, lang) {
  const s = String(texto);
  return lang === 'pt-BR' ? s.replace(/(\d)\.(\d)/g, '$1,$2') : s;
}

const DICCIONARIOS_RAREZA = { es, en, 'pt-BR': ptBR };

// La etiqueta de rareza que VE el usuario, en mayusculas: la misma clave que ya usan los badges de
// las tarjetas de la app (`rareza.<clase>.nombre`).
//
// Antes esta funcion conservaba el codigo del juego ('Special') en espanol e ingles, y solo
// traducía en portugues. Eso hacia que la guia y las tarjetas dijeran cosas distintas de la misma
// rareza en la misma pantalla: la tabla decia 'Special' y el badge de la tarjeta 'ESPECIAL'.
export function nombreRareza(codigo, lang) {
  if (!codigo) return codigo;
  const clave = 'rareza.' + String(codigo).trim().toLowerCase() + '.nombre';
  const diccionario = DICCIONARIOS_RAREZA[lang] || DICCIONARIOS_RAREZA.es;
  return diccionario[clave] || codigo;
}
