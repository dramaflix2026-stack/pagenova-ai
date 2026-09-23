export const PAGENOVA_PROJECT_DB = "pagenova-projects";
export const PAGENOVA_PROJECT_STORE = "projects";
export const PAGENOVA_PROJECT_DB_VERSION = 1;

function openPageNovaProjectDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      PAGENOVA_PROJECT_DB,
      PAGENOVA_PROJECT_DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(PAGENOVA_PROJECT_STORE)) {
        db.createObjectStore(PAGENOVA_PROJECT_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed."));
  });
}

export async function savePageNovaProject(
  id: string,
  project: unknown,
): Promise<void> {
  const db = await openPageNovaProjectDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PAGENOVA_PROJECT_STORE, "readwrite");
      const store = tx.objectStore(PAGENOVA_PROJECT_STORE);

      store.put(project, id);

      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("IndexedDB write failed."));
      tx.onabort = () =>
        reject(tx.error ?? new Error("IndexedDB write aborted."));
    });
  } finally {
    db.close();
  }
}

export async function readPageNovaProject<T>(
  id: string,
): Promise<T | null> {
  const db = await openPageNovaProjectDb();

  try {
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(PAGENOVA_PROJECT_STORE, "readonly");
      const store = tx.objectStore(PAGENOVA_PROJECT_STORE);
      const request = store.get(id);

      request.onsuccess = () =>
        resolve((request.result as T | undefined) ?? null);

      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB read failed."));
    });
  } finally {
    db.close();
  }
}

export async function deletePageNovaProject(
  id: string,
): Promise<void> {
  const db = await openPageNovaProjectDb();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PAGENOVA_PROJECT_STORE, "readwrite");
      const store = tx.objectStore(PAGENOVA_PROJECT_STORE);

      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("IndexedDB delete failed."));
    });
  } finally {
    db.close();
  }
}