/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MaterialAnalysis } from './material-schema.ts';

const DB_NAME = 'matter_material_intelligence_db';
const DB_VERSION = 1;
const STORE_NAME = 'specimens';

/**
 * Open or create the IndexedDB database for persistent client storage.
 * IndexedDB has ample quota (hundreds of MBs) and avoids localStorage 5MB quota exhaustion.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'specimenId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Load all specimens from IndexedDB
 */
export async function loadSpecimensFromIDB(): Promise<MaterialAnalysis[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as MaterialAnalysis[];
        // Sort descending by timestamp (newest first)
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results);
      };

      req.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('IDB read warning:', err);
    return [];
  }
}

/**
 * Save a single specimen to IndexedDB
 */
export async function saveSpecimenToIDB(specimen: MaterialAnalysis): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(specimen);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB save warning:', err);
  }
}

/**
 * Delete a single specimen from IndexedDB
 */
export async function deleteSpecimenFromIDB(specimenId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(specimenId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB delete warning:', err);
  }
}

/**
 * Clear all specimens in IndexedDB
 */
export async function clearAllSpecimensFromIDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB clear warning:', err);
  }
}
