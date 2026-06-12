// Simple IndexedDB wrapper for storing/retrieving attachment Blobs
// Highly robust fallback to in-memory Map for Incognito mode support

const DB_NAME = 'poetry_notebook_attachments_db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

let dbPromise: Promise<IDBDatabase> | null = null;
const inMemoryFallbackStore = new Map<string, Blob>();
let useInMemoryFallback = false;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === 'undefined') {
        useInMemoryFallback = true;
        reject(new Error('IndexedDB is not defined in this browser context'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        } catch (err) {
          reject(err);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        useInMemoryFallback = true;
        reject(request.error || new Error('Failed to open IndexedDB database'));
      };
    } catch (err) {
      useInMemoryFallback = true;
      reject(err);
    }
  });

  return dbPromise;
}

export async function storeAttachmentBlob(id: string, blob: Blob): Promise<void> {
  if (useInMemoryFallback) {
    inMemoryFallbackStore.set(id, blob);
    return;
  }
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(blob, id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.warn('IndexedDB write error, falling back to memory', request.error);
          inMemoryFallbackStore.set(id, blob);
          resolve();
        };
      } catch (innerErr) {
        console.warn('IndexedDB transaction failed, saving in memory', innerErr);
        inMemoryFallbackStore.set(id, blob);
        resolve();
      }
    });
  } catch (err) {
    console.warn('IndexedDB failed, falling back to memory for attachment ID:', id, err);
    useInMemoryFallback = true;
    inMemoryFallbackStore.set(id, blob);
  }
}

export async function getAttachmentBlob(id: string): Promise<Blob | null> {
  if (useInMemoryFallback || inMemoryFallbackStore.has(id)) {
    return inMemoryFallbackStore.get(id) || null;
  }
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || inMemoryFallbackStore.get(id) || null);
        };
        request.onerror = () => {
          resolve(inMemoryFallbackStore.get(id) || null);
        };
      } catch (innerErr) {
        resolve(inMemoryFallbackStore.get(id) || null);
      }
    });
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to memory for attachment ID:', id, err);
    return inMemoryFallbackStore.get(id) || null;
  }
}

export async function deleteAttachmentBlob(id: string): Promise<void> {
  inMemoryFallbackStore.delete(id);
  if (useInMemoryFallback) {
    return;
  }
  try {
    const db = await getDB();
    return new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (innerErr) {
        resolve();
      }
    });
  } catch (err) {
    console.warn('IndexedDB delete failed, ignored (fallback used or cleared)', err);
  }
}
