import shareSpritesOrder from '../data/share_sprites_order.json';

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Utility for encoding and decoding collection states into ultra-compressed shareable URL parameters.
 * Uses 6-bit URL-safe bitpacking (2 sprites per character) resulting in tiny, short links (~15-70 chars).
 */
export function encodeCollectionState(userState) {
  try {
    if (!userState || typeof userState !== 'object') return '';

    let chars = [];
    for (let i = 0; i < shareSpritesOrder.length; i += 2) {
      const id1 = shareSpritesOrder[i];
      const id2 = shareSpritesOrder[i + 1];

      const lvl1 = (userState[id1]?.owned ? (userState[id1]?.level || 1) : 0) & 7;
      const lvl2 = id2 ? ((userState[id2]?.owned ? (userState[id2]?.level || 1) : 0) & 7) : 0;

      const val = lvl1 | (lvl2 << 3);
      chars.push(B64_CHARS[val]);
    }

    // Trim trailing zeroes ('A' represents 0)
    let payload = chars.join('');
    while (payload.endsWith('A')) {
      payload = payload.slice(0, -1);
    }

    return 'v1.' + payload;
  } catch (e) {
    console.error('Failed to encode collection state:', e);
    return '';
  }
}

export function decodeCollectionState(encodedString) {
  try {
    if (!encodedString || typeof encodedString !== 'string') return {};
    const cleanStr = encodedString.trim();

    // 1. Ultra-compact v1 format
    if (cleanStr.startsWith('v1.')) {
      const payload = cleanStr.slice(3);
      const result = {};
      for (let cIdx = 0; cIdx < payload.length; cIdx++) {
        const char = payload[cIdx];
        const val = B64_CHARS.indexOf(char);
        if (val === -1) continue;

        const lvl1 = val & 7;
        const lvl2 = (val >> 3) & 7;

        const i1 = cIdx * 2;
        const i2 = cIdx * 2 + 1;

        if (i1 < shareSpritesOrder.length && lvl1 > 0) {
          result[shareSpritesOrder[i1]] = { owned: true, level: lvl1 };
        }
        if (i2 < shareSpritesOrder.length && lvl2 > 0) {
          result[shareSpritesOrder[i2]] = { owned: true, level: lvl2 };
        }
      }
      return result;
    }

    // 2. Legacy fallback for old long links
    try {
      const rawString = decodeURIComponent(atob(cleanStr));
      const result = {};
      rawString.split(',').forEach((item) => {
        if (!item) return;
        const [id, levelStr] = item.split(':');
        if (id) {
          result[id] = {
            owned: true,
            level: parseInt(levelStr, 10) || 1
          };
        }
      });
      if (Object.keys(result).length > 0) return result;
    } catch {
      // Ignore legacy decode errors
    }

    return {};
  } catch (e) {
    console.error('Failed to decode collection state:', e);
    return {};
  }
}

export function generateShareableLink(userState) {
  const code = encodeCollectionState(userState);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('friend', code);
  return url.toString();
}
