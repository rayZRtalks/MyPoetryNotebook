/**
 * Safe LocalStorage Fallback Wrapper
 * Gracefully redirects to in-memory map if browser blocks storage access (e.g. Incognito mode).
 */

const memoryStore = new Map<string, string>();

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        return val;
      }
    } catch (e) {
      console.warn(`localStorage.getItem blocked for key "${key}". Falling back to in-memory store.`, e);
    }
    return memoryStore.get(key) ?? null;
  },

  setItem: (key: string, value: string): void => {
    // Keep in-memory store synchronized as the absolute reliable fallback
    memoryStore.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage.setItem blocked for key "${key}". Saving inline to memory fallback.`, e);
    }
  },

  removeItem: (key: string): void => {
    memoryStore.delete(key);
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`localStorage.removeItem blocked for key "${key}". Removing from memory fallback.`, e);
    }
  }
};
