// Piezas puras del enlace de compartir. Sin nada del navegador ni de Supabase: las usan
// el modulo de amigos, la pagina y las pruebas de node.
//
// Con token, el enlace concede SOLO ver la coleccion y se puede revocar rotandolo.
// Sin token (usuario que aun no tiene fila en la nube) cae al enlace por codigo.

/**
 * Normalizes friend code input:
 * - Extracts code from full URLs (?code=... or ?friend=...)
 * - Strips leading '#', spaces, symbols
 * - Handles 4-character short codes (e.g. 'XXXX' -> 'SDEX-XXXX')
 * - Fixes missing hyphens (e.g. 'SDEXXXXX' or 'sdex xxxx' -> 'SDEX-XXXX')
 */
export function normalizeFriendCode(input) {
  if (!input) return '';
  let str = input.trim();

  // If user pasted a full URL
  if (str.includes('code=') || str.includes('CODE=')) {
    const match = str.match(/[?&]code=([^&#\s]+)/i);
    if (match) str = decodeURIComponent(match[1]);
  } else if (str.includes('friend=') || str.includes('FRIEND=')) {
    const match = str.match(/[?&]friend=([^&#\s]+)/i);
    if (match) str = decodeURIComponent(match[1]);
  }

  // Remove leading #, symbols, clean spaces and uppercase
  str = str.replace(/^[#@]+/, '').trim().toUpperCase();
  str = str.replace(/\s+/g, '-');

  // Handle 'SDEXXXXX' without hyphen
  if (/^SDEX[A-Z0-9]{4}$/.test(str)) {
    str = 'SDEX-' + str.slice(4);
  }

  // Handle 4-alphanumeric character code (e.g. 'XXXX' -> 'SDEX-XXXX')
  if (/^[A-Z0-9]{4}$/.test(str)) {
    str = 'SDEX-' + str;
  }

  return str;
}

/**
 * Arma el enlace de compartir. Puro y comprobable: recibe la base ya montada.
 * Con token, el enlace concede SOLO ver la coleccion y se puede revocar rotandolo.
 * Sin token (usuario que aun no tiene fila en la nube) cae al enlace por codigo.
 */
export function buildShareUrl(base, token, friendCode) {
  const url = new URL(base);
  if (token) url.searchParams.set('share', String(token));
  else url.searchParams.set('code', normalizeFriendCode(friendCode));
  return url.toString();
}
