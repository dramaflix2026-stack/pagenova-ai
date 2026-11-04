import { backupDigest, validBackupPayload, type BackupKind, type BackupPayload } from "./project-sync-contract.ts";
export type LocalRevision = {
  operationId:string; userId:string; projectId:string; kind:BackupKind; payload:BackupPayload;
  hash:string; at:string; status:"pending"|"synced"|"conflict"|"blocked"; archive:boolean;
  sentBase?:string|null; sequence:number;
};
type Head = {userId:string;projectId:string;hash?:string;baseRevision:string|null;conflict:boolean;sequence?:number};
const DB="pagenova-project-backups-v1";
function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  const r=indexedDB.open(DB,1);
  r.onupgradeneeded=()=>{
    r.result.createObjectStore("revisions",{keyPath:"operationId"});
    r.result.createObjectStore("heads",{keyPath:["userId","projectId"]});
    r.result.createObjectStore("owners");
  };
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});}
async function transaction<T>(stores:string[],mode:IDBTransactionMode,run:(tx:IDBTransaction,done:(v:T)=>void)=>void):Promise<T>{
  const db=await openDb();
  try{return await new Promise<T>((resolve,reject)=>{
    const tx=db.transaction(stores,mode);let value:T;
    tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??Error("Backup aborted"));
    try{run(tx,v=>{value=v;});}catch(e){tx.abort();reject(e);}
  });}finally{db.close();}
}
/** Ownership survives logout, so shared-browser projects cannot migrate to another account. */
export async function claimLocalSource(userId:string,source:string):Promise<boolean>{
  return transaction(["owners"],"readwrite",(tx,done)=>{
    const store=tx.objectStore("owners");const r=store.get(source);
    r.onsuccess=()=>{if(!r.result){store.add(userId,source);done(true);}else done(r.result===userId);};
  });
}
const captures = new Map<string,Promise<void>>();
export function captureBackup(userId:string,projectId:string,kind:BackupKind,payload:unknown,archive=false,hydrating=false):Promise<void>{
  const snapshot=structuredClone(payload);
  const key=`${userId}:${projectId}`;
  const pending=(captures.get(key)??Promise.resolve()).catch(()=>undefined)
    .then(()=>writeBackup(userId,projectId,kind,snapshot,archive,hydrating));
  captures.set(key,pending);
  return pending.finally(()=>{if(captures.get(key)===pending)captures.delete(key);});
}
async function writeBackup(userId:string,projectId:string,kind:BackupKind,payload:unknown,archive=false,hydrating=false):Promise<void>{
  // Clone BEFORE the first await: React state or mutable legacy objects can change.
  const snapshot=structuredClone(payload);
  if(!validBackupPayload(snapshot,kind))return;
  if(!await claimLocalSource(userId,projectId))throw Error("Este projeto local pertence a outra conta.");
  const hash=await backupDigest({userId,projectId,payload:snapshot});
  await transaction<void>(["heads","revisions"],"readwrite",(tx,done)=>{
    const heads=tx.objectStore("heads");const r=heads.get([userId,projectId]);
    r.onsuccess=()=>{
      const head:Head=r.result??{userId,projectId,baseRevision:null,conflict:false};
      if(!archive && head.hash===hash){done(undefined);return;}
      const revisions=tx.objectStore("revisions");
      // Archive imports have deterministic identities; repeating a migration is safe.
      const op=archive?`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`:crypto.randomUUID();
      const existing=revisions.get(op);
      existing.onsuccess=()=>{
        if(!existing.result)revisions.add({operationId:op,userId,projectId,kind,payload:snapshot,hash,
          at:new Date().toISOString(),status:"pending",archive,sequence:(head.sequence??0)+1} satisfies LocalRevision);
        const staleView=hydrating && !!head.hash && head.hash!==hash;
        heads.put({...head,hash:archive?head.hash:hash,sequence:(head.sequence??0)+1,
          baseRevision:staleView?null:head.baseRevision,conflict:staleView||head.conflict});done(undefined);
      };
    };
  });
}
export async function localRevisions(userId:string):Promise<LocalRevision[]>{
  return transaction(["revisions"],"readonly",(tx,done)=>{
    const r=tx.objectStore("revisions").getAll();r.onsuccess=()=>done((r.result as LocalRevision[]).filter(x=>x.userId===userId).sort((a,b)=>a.projectId.localeCompare(b.projectId)||a.sequence-b.sequence));
  });
}
export async function prepareUpload(revision:LocalRevision):Promise<LocalRevision>{
  return transaction(["heads","revisions"],"readwrite",(tx,done)=>{
    const r=tx.objectStore("heads").get([revision.userId,revision.projectId]);
    r.onsuccess=()=>{
      const head:Head=r.result??{baseRevision:null};
      const outgoing={...revision,sentBase:revision.sentBase===undefined?(head.conflict?null:head.baseRevision):revision.sentBase};
      tx.objectStore("revisions").put(outgoing);done(outgoing);
    };
  });
}
export async function acknowledgeUpload(revision:LocalRevision,result:{revision:string;conflict:boolean}):Promise<void>{
  if(result.revision!==revision.operationId)throw Error("Backup acknowledgement mismatch");
  await transaction<void>(["heads","revisions"],"readwrite",(tx,done)=>{
    tx.objectStore("revisions").put({...revision,status:result.conflict?"conflict":"synced"});
    const heads=tx.objectStore("heads");const r=heads.get([revision.userId,revision.projectId]);
    r.onsuccess=()=>{
      const head:Head=r.result??{userId:revision.userId,projectId:revision.projectId,baseRevision:null,conflict:false};
      // Imported historical snapshots never advance the sync baseline.
      if(!revision.archive)heads.put({...head,baseRevision:result.conflict||head.conflict?head.baseRevision:result.revision,conflict:result.conflict||head.conflict});
      done(undefined);
    };
  });
}

/** A permanent size/validation rejection must not starve unrelated projects. */
export async function blockUpload(revision:LocalRevision):Promise<void>{
  await transaction<void>(["revisions"],"readwrite",(tx,done)=>{
    tx.objectStore("revisions").put({...revision,status:"blocked"});done(undefined);
  });
}
