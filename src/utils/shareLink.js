/**
 * Utility for encoding and decoding collection states into compressed shareable URL parameters.
 */

export function encodeCollectionState(userState) {
  try {
    const entries = [];
    Object.entries(userState || {}).forEach(([id, info]) => {
      if (info && info.owned) {
        entries.push(`${id}:${info.level || 1}`);
      }
    });

    const rawString = entries.join(',');
    // Encode to base64
    const b64 = btoa(encodeURIComponent(rawString));
    return b64;
  } catch (e) {
    console.error('Failed to encode collection state:', e);
    return '';
  }
}

export function decodeCollectionState(encodedString) {
  try {
    if (!encodedString) return {};
    const rawString = decodeURIComponent(atob(encodedString));
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

    return result;
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
