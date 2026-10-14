import type { EbookProject } from "./schema";

const DB_NAME="pagenova-ebooks";
const STORE_NAME="books";
function database():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:"id"});
    };
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>resolve(request.result);
  });
}
function operation<T>(mode:IDBTransactionMode,run:(store:IDBObjectStore,done:(value:T)=>void)=>void):Promise<T>{
  return database().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_NAME,mode);
    const store=tx.objectStore(STORE_NAME);
    let result:T;
    run(store,value=>{result=value;});
    tx.oncomplete=()=>{db.close();resolve(result);};
    tx.onerror=()=>{db.close();reject(tx.error);};
    tx.onabort=()=>{db.close();reject(tx.error);};
  }));
}
export const saveEbook=(book:EbookProject):Promise<void>=>
  operation<void>("readwrite",(store)=>{store.put(book);});
export const deleteEbook=(id:string):Promise<void>=>
  operation<void>("readwrite",(store)=>{store.delete(id);});
export const listEbooks=():Promise<EbookProject[]>=>
  operation<EbookProject[]>("readonly",(store,done)=>{
    const req=store.getAll();
    req.onsuccess=()=>done((req.result as EbookProject[]).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
  });
