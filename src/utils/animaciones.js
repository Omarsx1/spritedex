import { safeStorage } from './safeStorage';

// Preferencia de animaciones: vive en un solo sitio para que el arranque de la app y la
// pagina de Ajustes no puedan divergir.
export const CLAVE_ANIMACIONES = 'spritedex_animations_enabled';

export function leerAnimaciones() {
  const valor = safeStorage.getItem(CLAVE_ANIMACIONES);
  return valor === null ? true : valor === 'true';
}

export function aplicarAnimaciones(activas) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('motion-disabled', !activas);
  document.body.classList.toggle('motion-disabled', !activas);
  safeStorage.setItem(CLAVE_ANIMACIONES, activas ? 'true' : 'false');
}
