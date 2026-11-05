/** Generate a self-contained console exporter from the same portable codec used by the app. */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const source=await readFile(new URL('../src/lib/project-portable-archive.ts',import.meta.url),'utf8');
const codec=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/^export\s+/gm,'');
const reader=`
if(!confirm('Este arquivo contém os projetos deste navegador. Confirme que pertencem a você e guarde o arquivo em local seguro. Nenhum dado será enviado pela rede.'))return;
const entries=[];const known=(await indexedDB.databases()).find(d=>d.name==='pagenova-projects');
if(known){
 const db=await new Promise((resolve,reject)=>{let blocked=false;const r=indexedDB.open(known.name,known.version);r.onupgradeneeded=()=>r.transaction.abort();r.onsuccess=()=>{if(blocked)r.result.close();else resolve(r.result);};r.onerror=()=>reject(r.error);r.onblocked=()=>{blocked=true;reject(Error('Banco ocupado. Originais preservados; feche outras abas e tente novamente.'));};});
 try{if(db.objectStoreNames.contains('projects')){
  const records=await new Promise((resolve,reject)=>{const rows=[];const tx=db.transaction('projects','readonly');const r=tx.objectStore('projects').openCursor();r.onsuccess=()=>{const c=r.result;if(c){rows.push({storage:'indexeddb',key:c.key,value:c.value});c.continue();}};tx.oncomplete=()=>resolve(rows);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});entries.push(...records);
 }}finally{db.close();}
}
for(const key of Object.keys(localStorage).filter(k=>k.startsWith('pagenova-builder-v2-private-v1')))entries.push({storage:'localStorage',key,value:localStorage.getItem(key)});
if(!entries.length)throw Error('Nenhum projeto encontrado nesta origem e neste perfil. Não limpe o navegador; confira o domínio original.');
const text=await createPortableArchive(entries,location.origin);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pagenova-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
console.info(entries.length+' registros exportados com verificação SHA-256. Originais preservados. Isso não comprova sincronização na nuvem.');
`;
const output=`// PageNova original-origin exporter. No network, deletes, updates or schema upgrades.\n// Codec SHA256 ${createHash('sha256').update(source).digest('hex')}\n(async()=>{\n${codec}\n${reader}\n})().catch(error=>console.error('Exportação interrompida; originais preservados.',error));\n`;
await writeFile(new URL('../../ops/export-pagenova-local-projects.js',import.meta.url),output);
console.log('Portable original-origin exporter generated from shared codec.');
