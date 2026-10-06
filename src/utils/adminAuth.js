export const ADMIN_AUTH_KEY = 'spritedex_admin_session_v1';

export function isUserAdminAuthenticated() {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.authenticatedAt);
  } catch {
    return false;
  }
}

// Deja la marca de la sesion del CMS. Vive en sessionStorage a proposito: aguanta la recarga
// dentro de la pestaña y muere al cerrarla. La escribia a mano el formulario de correo, y el
// camino de 'ya tengo sesion de administrador' no la ponia: por eso recargar dentro del CMS
// devolvia a la pantalla de entrada aunque la sesion siguiera abierta. La marca no protege
// nada (el permiso lo comprueba el servidor contra la tabla admins), asi que no hay riesgo en
// dejarla puesta hasta cerrar la pestaña.
export function marcarAdminAutenticado(email = '') {
  if (typeof window === 'undefined') return false;
  try {
    sessionStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({
      mode: 'supabase',
      email,
      authenticatedAt: Date.now()
    }));
    return true;
  } catch {
    return false;
  }
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  } catch {}
}
