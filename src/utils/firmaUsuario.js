import { safeStorage } from './safeStorage';

export const CLAVE_USUARIO = 'spritedex_fortnite_user';
export const CLAVE_MOSTRAR_USUARIO = 'spritedex_fortnite_user_visible';
export const LARGO_USUARIO = 24;

export function usuarioGuardado() {
  const valor = safeStorage.getItem(CLAVE_USUARIO);
  return typeof valor === 'string' ? valor : '';
}

export function mostrarUsuarioGuardado() {
  return safeStorage.getItem(CLAVE_MOSTRAR_USUARIO) !== 'false';
}

// La firma es la que pinta la lona: la precarga y la vista de compartir tienen que usar la
// misma, o la captura precalculada no se reutiliza al abrir la vista.
export function firmaGuardada() {
  return mostrarUsuarioGuardado() ? usuarioGuardado().trim() : '';
}
