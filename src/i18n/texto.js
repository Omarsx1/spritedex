// Estado del idioma activo y traduccion. Es un modulo PLANO a proposito: el canvas, los
// helpers y las pruebas de node lo importan sin React y sin Vite.
import { DICCIONARIOS } from './locales/index.js';
import {
  conIdioma,
  detectarIdioma,
  guardarIdioma,
  normalizarIdioma,
  traducir
} from './core.js';

let idiomaActual = 'es';

export function getLang() {
  return idiomaActual;
}

export function t(clave, vars) {
  return traducir(DICCIONARIOS, idiomaActual, clave, vars);
}

export function setLang(lang) {
  const normal = normalizarIdioma(lang) || 'es';
  guardarIdioma(normal);
  idiomaActual = normal;
  return normal;
}

// Fija el idioma sin tocar el almacenamiento: lo usa el arranque, que ya sabe cual toca.
export function fijarIdiomaEnMemoria(lang) {
  idiomaActual = normalizarIdioma(lang) || 'es';
  return idiomaActual;
}

// Cambia el idioma y recarga en la ruta equivalente. Recargar evita dejar media pantalla
// traducida y hace que el canvas y los helpers lean el idioma nuevo desde el primer pintado.
export function cambiarIdioma(lang) {
  const normal = setLang(lang);
  if (typeof window === 'undefined') return normal;
  const actual = window.location.pathname + window.location.search + window.location.hash;
  const destino = conIdioma(window.location.pathname, normal) + window.location.search + window.location.hash;
  if (destino !== actual) window.location.assign(destino);
  return normal;
}

export { detectarIdioma, conIdioma };
