import {validProjectShape} from "./project-sync-contract.ts";
import {currentBackupUser} from "./project-sync.ts";
import {localSourceOwner, isUnclaimedOwner} from "./project-sync-local.ts";
export const PAGENOVA_PROJECT_DB = "pagenova-projects";
export const PAGENOVA_PROJECT_STORE = "projects";
export const PAGENOVA_PROJECT_DB_VERSION = 1;

/** Keep edits in order. Two rapid saves used to race in IndexedDB and could
 * restore an older snapshot after the newest text/image/drag operation. */
const pendingProjectWrites = new Map<string, Promise<void>>();

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

async function withProjectWriteLock<T>(id:string,run:()=>Promise<T>):Promise<T>{
  if(typeof navigator!=="undefined"&&navigator.locks)return navigator.locks.request(`pagenova-project-write:${id}`,run);
  return run();
}

export async function savePageNovaProject(
  id: string,
  project: unknown,
): Promise<void> {
  const snapshot = structuredClone(project);
  // Bind the save event to the account active when the edit was initiated.
  const initiatingUserId = typeof window !== "undefined" ? currentBackupUser() : null;
  let created = false;
  const previous = pendingProjectWrites.get(id);
  const save = (previous ? previous.catch(() => undefined) : Promise.resolve())
    .then(async () => { created = await withProjectWriteLock(id,async()=>{
      if(typeof window!=="undefined"){
        const activeUser=currentBackupUser();
        if(initiatingUserId!==activeUser)throw new Error("A conta mudou durante o salvamento. Projeto anterior preservado.");
        const sourceOwner=await localSourceOwner(`indexeddb:${id}`);
        if(!isUnclaimedOwner(sourceOwner)&&sourceOwner!==activeUser)
          throw new Error("Este projeto pertence a outra conta. Original preservado.");
      }
      return writePageNovaProject(id,snapshot);
    }); });
  pendingProjectWrites.set(id, save);
  try { await save;
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("pagenova-project-saved", {detail:{id,project:snapshot,created,initiatingUserId}}));
  }
  finally { if (pendingProjectWrites.get(id) === save) pendingProjectWrites.delete(id); }
}

async function writePageNovaProject(id: string, project: unknown): Promise<boolean> {
  const db = await openPageNovaProjectDb();

  try {
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(PAGENOVA_PROJECT_STORE, "readwrite");
      const store = tx.objectStore(PAGENOVA_PROJECT_STORE);

      let created = false;
      const existing=store.get(id);
      existing.onsuccess=()=>{
        created=existing.result===undefined;
        if(!created&&validProjectShape(existing.result,"indexeddb")&&!validProjectShape(project,"indexeddb")){
          reject(new Error("Gravação vazia ou inválida recusada. O projeto anterior foi preservado."));tx.abort();return;
        }
        store.put(project,id);
      };
      tx.oncomplete = () => resolve(created);
      tx.onerror = () =>
        reject(tx.error ?? new Error("IndexedDB write failed."));
      tx.onabort = () =>
        reject(tx.error ?? new Error("IndexedDB write aborted."));
    });
  } finally {
    db.close();
  }
}

/** Wait for already queued edits without writing an older React snapshot. */
export async function waitForPageNovaProjectSaves(id: string): Promise<void> {
  await pendingProjectWrites.get(id);
}

export async function readPageNovaProject<T>(
  id: string,
): Promise<T | null> {
  // A refresh or preview opened during a pending edit must see the latest save.
  await pendingProjectWrites.get(id);
  return readRawPageNovaProject<T>(id);
}

async function readRawPageNovaProject<T>(id:string):Promise<T|null>{
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

export async function listPageNovaProjects<T>(): Promise<T[]> {
  const db = await openPageNovaProjectDb();
  try {
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(PAGENOVA_PROJECT_STORE, "readonly");
      const request = tx.objectStore(PAGENOVA_PROJECT_STORE).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed."));
    });
  } finally {
    db.close();
  }
}

export async function deletePageNovaProject(id:string):Promise<void>{
  await pendingProjectWrites.get(id)?.catch(()=>undefined);
  if(typeof navigator==="undefined"||!navigator.locks)throw Error("Exclusão suspensa: exporte o projeto em um navegador com recuperação segura.");
  await withProjectWriteLock(id,async()=>{
    const {currentBackupUser}=await import("./project-sync.ts");
    const {localSourceOwner}=await import("./project-sync-local.ts");
    const user=currentBackupUser();
    if(!user||await localSourceOwner(`indexeddb:${id}`)!==user)throw Error("Projeto preservado. Confirme a conta e o backup em Backups antes de excluir.");
    const project=await readRawPageNovaProject(id);if(project===null)return;
    const {createPortableArchive}=await import("./project-portable-archive.ts");
    const {stagePortableImport,listPortableImports}=await import("./project-portable-recovery.ts");
    const origin=typeof location!=="undefined"?location.origin:"http://localhost";
    const text=await createPortableArchive([{storage:"indexeddb",key:id,value:project}],origin);
    const saved=await stagePortableImport(user,text);
    if(!(await listPortableImports(user)).some(record=>record.id===saved.id))throw Error("Backup não confirmado; projeto preservado.");
    if(currentBackupUser()!==user)throw Error("A conta mudou. Projeto preservado.");
    const db=await openPageNovaProjectDb();
    try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(PAGENOVA_PROJECT_STORE,"readwrite");tx.objectStore(PAGENOVA_PROJECT_STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
    finally{db.close();}
  });
}

/** Read-only migration inventory. Keep original keys and records untouched. */
export async function listPageNovaProjectEntries<T>(): Promise<Array<{key:IDBValidKey;project:T}>> {
  await Promise.all([...pendingProjectWrites.values()]);
  const db=await openPageNovaProjectDb();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(PAGENOVA_PROJECT_STORE,"readonly");
    const entries:Array<{key:IDBValidKey;project:T}>=[];
    const r=tx.objectStore(PAGENOVA_PROJECT_STORE).openCursor();
    r.onsuccess=()=>{const c=r.result;if(c){entries.push({key:c.key,project:c.value});c.continue();}};
    tx.oncomplete=()=>resolve(entries);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}
