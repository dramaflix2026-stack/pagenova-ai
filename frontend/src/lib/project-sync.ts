import { captureBackup, claimLocalSource, localRevisions, prepareUpload, acknowledgeUpload } from "./project-sync-local.ts";
import { validBackupPayload, type BackupKind } from "./project-sync-contract.ts";
import { listPageNovaProjectEntries } from "./pagenova-project-store.ts";
let owner:string|null=null;
let stopped=false;
let running:Promise<void>|null=null;
const STUDIO="pagenova-builder-v2-private-v1";
export function currentBackupUser(){return owner;}
export function syncNotice(message:string){window.dispatchEvent(new CustomEvent("pagenova-sync-status",{detail:message}));}
export async function backupLocalProject(projectId:string,kind:BackupKind,payload:unknown,archive=false){
  const userId=owner;
  const snapshot=structuredClone(payload);
  if(!userId)return;
  if(!validBackupPayload(snapshot,kind))throw Error("Cópia inválida ou com arquivo local não serializável. Original preservado.");
  if(!await claimLocalSource(userId,projectId))throw Error("Este projeto local está vinculado a outra conta.");
  await captureBackup(userId,projectId,kind,snapshot,archive);
  if(owner===userId)void flushBackups();
}
export function studioProjectId(site:{id?:string},key:string){return `studio:${site.id||`legacy:${key}`}`;}
export async function migrateLocalProjects(userId:string){
  for(const entry of await listPageNovaProjectEntries<unknown>()){
    if(stopped||owner!==userId)return;
    try{await backupLocalProject(`indexeddb:${String(entry.key)}`,"indexeddb",entry.project,true);}catch{syncNotice("Um projeto local não pôde ser migrado. Original preservado.");}
  }
  const keys=Object.keys(localStorage).filter(k=>k===STUDIO||k.startsWith(STUDIO+":crm:"));
  for(const key of keys.filter(k=>!k.endsWith(":versions"))){
    if(stopped||owner!==userId)return;
    // Claim the source slot as well as each project identity, before reading it.
    if(!await claimLocalSource(userId,key))continue;
    try{
      const raw=localStorage.getItem(key);const site=raw?JSON.parse(raw):null;
      let versions:unknown=[];
      try{versions=JSON.parse(localStorage.getItem(key+":versions")||"[]");}catch{syncNotice("Histórico inválido; rascunho original preservado.");}
      if(Array.isArray(versions))for(const v of versions){
        if(v?.site)await backupLocalProject(studioProjectId(v.site,key),"studio",v.site,true);
      }
      if(site)await backupLocalProject(studioProjectId(site,key),"studio",site,true);
    }catch{syncNotice("Um rascunho não pôde ser copiado. Original preservado.");}
  }
}
export function flushBackups():Promise<void>{
  if(running)return running;
  const userId=owner;
  if(!userId||stopped)return Promise.resolve();
  const run=async():Promise<void>=>{
    for(const revision of (await localRevisions(userId)).filter(x=>x.status==="pending")){
      if(stopped||owner!==userId)return;
      const outgoing=await prepareUpload(revision);
      const response:Response=await fetch("/api/builder-v2/projects",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({userId,projectId:outgoing.projectId,operationId:outgoing.operationId,
          baseRevision:outgoing.sentBase,kind:outgoing.kind,payload:outgoing.payload,archive:outgoing.archive}),signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw Error("cloud unavailable");
      const result:{userId:string;revision:string;conflict:boolean}=await response.json();
      if(result.userId!==userId||typeof result.conflict!=="boolean")throw Error("Account changed");
      await acknowledgeUpload(outgoing,result);
      syncNotice(result.conflict&&!outgoing.archive?"Conflito entre dispositivos — ambas as versões preservadas no histórico.":"Backup automático salvo na nuvem");
    }
  };
  // The lock spans network requests across tabs; local capture never waits for it.
  const task:Promise<void>=(navigator.locks?navigator.locks.request(`pagenova-sync:${userId}`,run).then(()=>undefined):run())
    .catch(()=>syncNotice("Sem conexão com a nuvem — alterações locais preservadas; nova tentativa automática."))
    .finally(()=>{running=null;});
  running=task;
  return task;
}
export function startProjectSync(userId:string){
  owner=userId;stopped=false;
  let scanning=false;
  const tick=()=>{
    if(scanning)return;scanning=true;
    void migrateLocalProjects(userId).then(()=>flushBackups())
      .catch(()=>syncNotice("Backup local pendente. Os projetos originais foram preservados."))
      .finally(()=>{scanning=false;});
  };
  const edited=(event:Event)=>{const d=(event as CustomEvent).detail;void backupLocalProject(`indexeddb:${d.id}`,"indexeddb",d.project).catch(()=>syncNotice("Não foi possível criar a cópia de segurança local."));};
  tick();const timer=window.setInterval(tick,30000);
  window.addEventListener("online",tick);window.addEventListener("focus",tick);window.addEventListener("pagenova-project-saved",edited);
  return()=>{stopped=true;owner=null;clearInterval(timer);window.removeEventListener("online",tick);window.removeEventListener("focus",tick);window.removeEventListener("pagenova-project-saved",edited);};
}
