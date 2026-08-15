import { supabase, isSupabaseConfigured } from './supabase';

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
export function getMyFriendCode(userId = null) {
  try {
    let code = localStorage.getItem(STORAGE_MY_CODE_KEY);
    if (!code) {
      if (userId) {
        // Derive clean 4-char suffix from user id
        const clean = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        code = `SDEX-${clean.slice(0, 4)}`;
      } else {
        code = generateRandomFriendCode();
      }
      localStorage.setItem(STORAGE_MY_CODE_KEY, code);
    }
    return code;
  } catch {
    return generateRandomFriendCode();
  }
}

/**
 * Normalizes friend code input (strips spaces, URLs, leading #)
 */
export function normalizeFriendCode(input) {
  if (!input) return '';
  let str = input.trim().toUpperCase();

  // If user pasted a full URL with ?code= or ?friend=
  if (str.includes('CODE=')) {
    const match = str.match(/[?&]CODE=([^&#\s]+)/i);
    if (match) str = decodeURIComponent(match[1]).toUpperCase();
  }

  // Remove leading # or spaces
  str = str.replace(/^#/, '').trim();
  return str;
}

/**
 * Fetches friend collection from Supabase by Friend Code
 */
export async function fetchCollectionByFriendCode(friendCode) {
  if (!isSupabaseConfigured || !supabase || !friendCode) return null;

  const normalized = normalizeFriendCode(friendCode);

  try {
    // 1. Try querying by friend_code column
    const { data, error } = await supabase
      .from('user_collections')
      .select('user_id, friend_code, user_state, updated_at')
      .eq('friend_code', normalized)
      .maybeSingle();

    if (data && data.user_state) {
      return {
        userId: data.user_id,
        friendCode: data.friend_code || normalized,
        userState: data.user_state,
        updatedAt: data.updated_at
      };
    }

    // 2. Fallback: query by user_id if input was a UUID
    if (normalized.length >= 30) {
      const { data: byId } = await supabase
        .from('user_collections')
        .select('user_id, friend_code, user_state, updated_at')
        .eq('user_id', friendCode)
        .maybeSingle();

      if (byId && byId.user_state) {
        return {
          userId: byId.user_id,
          friendCode: byId.friend_code || normalized,
          userState: byId.user_state,
          updatedAt: byId.updated_at
        };
      }
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
  if (!isSupabaseConfigured || !supabase || !friendUserId) {
    return () => {};
  }

  try {
    const channelId = `realtime-friend-${friendUserId.slice(0, 8)}-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_collections',
          filter: `user_id=eq.${friendUserId}`
        },
        (payload) => {
          if (payload.new && payload.new.user_state) {
            onUpdate(payload.new.user_state, payload.new.friend_code);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to setup Realtime friend channel:', err);
    return () => {};
  }
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
  try {
    if (friendCode) {
      localStorage.setItem(STORAGE_CONNECTED_FRIEND_CODE_KEY, friendCode);
    } else {
      localStorage.removeItem(STORAGE_CONNECTED_FRIEND_CODE_KEY);
    }
  } catch (e) {
    console.error(e);
  }
}

export function getLastConnectedFriendCode() {
  try {
    return localStorage.getItem(STORAGE_CONNECTED_FRIEND_CODE_KEY) || null;
  } catch {
    return null;
  }
}
