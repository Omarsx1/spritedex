// Universal Safe Storage with in-memory fallback for restricted environments
// Handles Brave Shields, cross-origin iframes, Responsive Viewer and Safari Private Browsing

const inMemoryStore = new Map();

export const safeStorage = {
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Storage blocked (e.g. iframe in Brave/Safari)
    }
    return inMemoryStore.has(key) ? inMemoryStore.get(key) : null;
  },

  setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, String(value));
        return;
      }
    } catch (e) {
      // Storage blocked
    }
    inMemoryStore.set(key, String(value));
  },

  removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      // Storage blocked
    }
    inMemoryStore.delete(key);
  },

  clear() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch (e) {}
    inMemoryStore.clear();
  }
};
