import {createPortableArchive,readPortableArchive,type PortableEntry} from "./project-portable-archive.ts";
import {listPageNovaProjectEntries} from "./pagenova-project-store.ts";
import {localSourceOwner,isUnclaimedOwner} from "./project-sync-local.ts";
import {studioProjectId} from "./project-sync.ts";
export const STUDIO_LEGACY_KEY="pagenova-builder-v2-private-v1";
function studioKeys(){return Object.keys(localStorage).filter(k=>k===STUDIO_LEGACY_KEY||k.startsWith(STUDIO_LEGACY_KEY+":"));}
export async function pendingLegacySources(userId:string){
 const found=new Set<string>();
 for(const {key} of await listPageNovaProjectEntries()){const source=`indexeddb:${String(key)}`;if(isUnclaimedOwner(await localSourceOwner(source)))found.add(source);}
 for(const key of studioKeys().filter(k=>!k.includes(":recovery-original:"))){
  const slot=key.endsWith(":versions")?key.slice(0,-9):key;
  const owner=await localSourceOwner(slot);if(owner!==userId&&!isUnclaimedOwner(owner))continue;
  if(isUnclaimedOwner(owner))found.add(slot);
  try{const value=JSON.parse(localStorage.getItem(key)||"null");const sites=key.endsWith(":versions")?(Array.isArray(value)?value.map(v=>v?.site):[]):[value];
   for(const site of sites)if(site&&typeof site==="object"){const source=studioProjectId(site,slot);if(isUnclaimedOwner(await localSourceOwner(source)))found.add(source);}
  }catch{/* corrupt raw strings remain available in the portable archive */}
 }
 return [...found];
}
export async function exportLocalArchive(userId:string){
 const entries:PortableEntry[]=[];
 for(const row of await listPageNovaProjectEntries()){if(await localSourceOwner(`indexeddb:${String(row.key)}`)===userId)entries.push({storage:"indexeddb",key:row.key,value:row.project});}
 for(const key of studioKeys()){const slot=key.endsWith(":versions")?key.slice(0,-9):key;if(await localSourceOwner(slot)===userId)entries.push({storage:"localStorage",key,value:localStorage.getItem(key)});}
 if(!entries.length)throw Error("Nenhum projeto confirmado para esta conta. Confirme os projetos antigos antes de exportar.");
 return createPortableArchive(entries,location.origin);
}
export type PortableImport={id:string;userId:string;sourceOrigin:string;createdAt:string;entries:PortableEntry[]};
function openVault():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open("pagenova-portable-recovery-v1",1);r.onupgradeneeded=()=>r.result.createObjectStore("imports",{keyPath:["userId","id"]});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function stagePortableImport(userId:string,text:string):Promise<{id:string;count:number;created:boolean}>{
 const parsed=await readPortableArchive(text);const record={id:parsed.id,userId,sourceOrigin:parsed.sourceOrigin,createdAt:parsed.createdAt,archiveText:text};
 const db=await openVault();try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction("imports","readwrite"),store=tx.objectStore("imports");let created=false;
  const r=store.get([userId,record.id]);r.onsuccess=()=>{if(!r.result){store.add(record);created=true;}};
  tx.oncomplete=()=>resolve({id:record.id,count:parsed.entries.length,created});tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });}finally{db.close();}
}
export async function listPortableImports(userId:string):Promise<PortableImport[]>{
 const db=await openVault();
 try{
  const records=await new Promise<Array<PortableImport&{archiveText?:string}>>((resolve,reject)=>{const tx=db.transaction("imports","readonly"),r=tx.objectStore("imports").getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const result:PortableImport[]=[];
  for(const record of records.filter(v=>v.userId===userId)){
   if(record.archiveText){const parsed=await readPortableArchive(record.archiveText);if(parsed.id!==record.id)throw Error("Arquivo local inconsistente. Originais preservados.");result.push({...parsed,userId});}
   else result.push(record); // Compatibility with the first isolated vault format.
  }
  return result;
 }finally{db.close();}
}
export function portableProjects(records:PortableImport[]){
 const projects:Array<{id:string;title:string;kind:"studio"|"indexeddb";payload:Record<string,unknown>;sourceOrigin:string;createdAt:string}>=[];
 for(const record of records)record.entries.forEach((entry,index)=>{
  const add=(payload:unknown,kind:"studio"|"indexeddb",suffix="")=>{if(payload&&typeof payload==="object"&&!Array.isArray(payload)){const p=payload as Record<string,unknown>;projects.push({id:`${record.id}:${index}:${suffix}`,title:String(p.title||p.name||"Projeto importado"),kind,payload:p,sourceOrigin:record.sourceOrigin,createdAt:record.createdAt});}};
  if(entry.storage==="indexeddb")add(entry.value,"indexeddb");
  else if(typeof entry.value==="string"){try{const v=JSON.parse(entry.value);if(String(entry.key).endsWith(":versions")&&Array.isArray(v))v.forEach((x,i)=>add(x?.site,"studio",String(i)));else add(v,"studio");}catch{/* raw corrupt data is kept, never activated */}}
 });
 return projects;
}
