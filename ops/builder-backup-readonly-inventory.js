/** Paste into DevTools on the ORIGINAL site origin. No writes, deletes, uploads or downloads. */
(async () => {
  const digest = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
  const canonical = value => {
    if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
    if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
    if(value&&typeof value==='object'&&(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null))return '{'+Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';
    throw Error('Binary or unsupported value: preserve the full Chrome profile backup');
  };
  const inventory={origin:location.origin,at:new Date().toISOString(),indexedDB:[],localStorage:[]};
  const known=(await indexedDB.databases()).find(d=>d.name==='pagenova-projects');
  if(known){
    const db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open(known.name,known.version);
      r.onupgradeneeded=()=>r.transaction.abort(); // Never create or upgrade a database.
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Database blocked; stop and preserve the original profile'));
    });
    try{
      if(db.objectStoreNames.contains('projects')){
        const entries=await new Promise((resolve,reject)=>{
          const rows=[];const tx=db.transaction('projects','readonly');const r=tx.objectStore('projects').openCursor();
          r.onsuccess=()=>{const c=r.result;if(c){rows.push({key:c.key,value:c.value});c.continue();}};
          tx.oncomplete=()=>resolve(rows);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
        });
        for(const row of entries){try{inventory.indexedDB.push({key:row.key,sha256:await digest(canonical(row.value))});}catch{inventory.indexedDB.push({key:row.key,sha256:null,requiresFullProfileBackup:true});}}
      }
    }finally{db.close();}
  }
  for(const key of Object.keys(localStorage).filter(k=>k.startsWith('pagenova-builder-v2-private-v1'))){inventory.localStorage.push({key,sha256:await digest(localStorage.getItem(key))});}
  console.table(inventory.indexedDB);console.table(inventory.localStorage);
  console.info('READ-ONLY INVENTORY. Contains hashes and keys only; this is not a project backup.');
  return inventory;
})();
