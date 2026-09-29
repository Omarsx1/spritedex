import { getSupabase, isSupabaseConfigured } from './supabase';
import { safeStorage } from './safeStorage';

const STORAGE_MY_CODE_KEY = 'spritedex_my_friend_code';
const STORAGE_CONNECTED_FRIEND_CODE_KEY = 'spritedex_connected_friend_code';

/**
 * Generates a clean 6-character alphanumeric Friend Code formatted as SDEX-XXXX
 */
export function generateRandomFriendCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars 0/O, 1/I
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SDEX-${code}`;
}

/**
 * Gets or creates the local user's permanent Friend Code
 */
export function getMyFriendCode(userId = null, esAnonimo = false) {
  // Cuenta con sesion (no invitado): el codigo se DERIVA de su id y no se reutiliza el
  // del dispositivo. El del dispositivo puede ser el de una sesion invitada anterior, y
  // reutilizarlo dejaba dos filas con el mismo codigo (y el radar de ese codigo, roto).
  if (userId && !esAnonimo) {
    return `SDEX-${userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4)}`;
  }
  let code = safeStorage.getItem(STORAGE_MY_CODE_KEY);
  if (!code) {
    if (userId) {
      // Derive clean 4-char suffix from user id
      const clean = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      code = `SDEX-${clean.slice(0, 4)}`;
    } else {
      code = generateRandomFriendCode();
    }
    safeStorage.setItem(STORAGE_MY_CODE_KEY, code);
  }
  return code;
}

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
 * Fetches friend collection from Supabase by Friend Code
 * Resilient multi-tier lookup:
 * 1. Exact match by friend_code
 * 2. Case-insensitive ilike by friend_code
 * 3. Suffix match by 4-char suffix (e.g. %XXXX)
 * 4. Fallback by user_id if input was a UUID
 */
export async function fetchCollectionByFriendCode(friendCode) {
  if (!isSupabaseConfigured || !friendCode) return null;
  const supabase = await getSupabase();

  // Supabase falla con maybeSingle() si hay dos filas con el mismo codigo. El codigo
  // pudo duplicarse (es de dispositivo), asi que se piden dos y se toma la mas
  // reciente, en vez de dejar el radar sin respuesta.
  const primeraFila = (filas) => {
    if (!Array.isArray(filas) || filas.length === 0) return null;
    if (filas.length > 1) {
      console.warn('[amigos] codigo duplicado; se usa la fila mas reciente', filas.map((f) => f && f.user_id));
    }
    return [...filas].sort((a, b) => new Date(b?.updated_at || 0) - new Date(a?.updated_at || 0))[0] || null;
  };
  if (!supabase) return null;

  const normalized = normalizeFriendCode(friendCode);
  const cleanSuffix = normalized.replace(/^SDEX-/, '').replace(/[^A-Z0-9]/g, '');

  try {
    // 1. Try querying by exact friend_code column
    let { data, error } = await supabase
      .from('user_collections')
      .select('user_id, friend_code, user_state, updated_at')
      .eq('friend_code', normalized)
      .limit(2);

    data = primeraFila(data);

    // 2. Case-insensitive ilike query fallback
    if (!data) {
      const res = await supabase
        .from('user_collections')
        .select('user_id, friend_code, user_state, updated_at')
        .ilike('friend_code', normalized)
        .limit(2);
      data = primeraFila(res.data);
      if (res.error && !error) error = res.error;
    }

    // 3. Suffix match (e.g. searching 'XXXX' or 'SDEX-XXXX' where DB has '%XXXX')
    if (!data && cleanSuffix.length === 4) {
      const res = await supabase
        .from('user_collections')
        .select('user_id, friend_code, user_state, updated_at')
        .ilike('friend_code', '%' + cleanSuffix)
        .limit(2);
      data = primeraFila(res.data);
    }

    // 4. Fallback: query by user_id if input was a UUID
    if (!data && (normalized.length >= 30 || cleanSuffix.length >= 30)) {
      const targetId = friendCode.trim();
      const { data: porId } = await supabase
        .from('user_collections')
        .select('user_id, friend_code, user_state, updated_at')
        .eq('user_id', targetId)
        .limit(2);

      const byId = primeraFila(porId);
      if (byId) {
        data = byId;
      }
    }

    if (data && data.user_state) {
      const profile = data.user_state._profile || {
        name: `Entrenador #${(data.friend_code || normalized).replace('SDEX-', '')}`,
        country_flag: '🌐',
        country_name: '',
        is_anonymous: true
      };

      return {
        userId: data.user_id,
        friendCode: data.friend_code || normalized,
        userState: data.user_state,
        profile,
        updatedAt: data.updated_at
      };
    }

    if (error) {
      console.warn('Friend code lookup notice:', error.message);
    }

    return null;
  } catch (err) {
    console.error('Failed to fetch friend collection:', err);
    return null;
  }
}

/**
 * Subscribes to Realtime updates for a friend's collection
 * Returns an unsubscribe function
 */
export function subscribeToFriendCollection(friendUserId, onUpdate) {
  if (!isSupabaseConfigured || !friendUserId) {
    return () => {};
  }

  let channel = null;
  let cancelled = false;

  (async () => {
    try {
      const supabase = await getSupabase();
      if (!supabase || cancelled) return;
      const channelId = 'realtime-friend-' + friendUserId.slice(0, 8) + '-' + Date.now();
      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_collections',
            filter: 'user_id=eq.' + friendUserId
          },
          (payload) => {
            if (payload.new && payload.new.user_state) {
              onUpdate(payload.new.user_state, payload.new.friend_code);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.error('Failed to setup Realtime friend channel:', err);
    }
  })();

  return () => {
    cancelled = true;
    if (channel) {
      getSupabase().then((sb) => sb && sb.removeChannel(channel));
    }
  };
}

/**
 * Generates permanent shareable friend URL with friend code
 */
export function generatePermanentFriendUrl(friendCode) {
  const code = normalizeFriendCode(friendCode);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('code', code);
  return url.toString();
}

export function saveLastConnectedFriendCode(friendCode) {
  if (friendCode) {
    safeStorage.setItem(STORAGE_CONNECTED_FRIEND_CODE_KEY, friendCode);
  } else {
    safeStorage.removeItem(STORAGE_CONNECTED_FRIEND_CODE_KEY);
  }
}

export function getLastConnectedFriendCode() {
  return safeStorage.getItem(STORAGE_CONNECTED_FRIEND_CODE_KEY) || null;
}
