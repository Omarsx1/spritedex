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

export function clearAdminSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
  } catch {}
}
