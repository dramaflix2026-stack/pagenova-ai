import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import {createPortableArchive,readPortableArchive,encodePortableGraph,decodePortableGraph} from '../src/lib/project-portable-archive.ts';
import {stagePortableImport,listPortableImports,portableProjects} from '../src/lib/project-portable-recovery.ts';
import {markLegacySource,claimLocalSource,approveLegacySources,localSourceOwner} from '../src/lib/project-sync-local.ts';
import {savePageNovaProject,readPageNovaProject} from '../src/lib/pagenova-project-store.ts';
globalThis.indexedDB=indexedDB;
await test('portable archive preserves IDs, fields, binary assets, dates, maps, sets and shared references',async()=>{
 const buffer=new Uint8Array([0,1,127,255]).buffer;const value={id:'old-id',name:'Original',pages:{home:{title:'Home'}},date:new Date('2026-10-01'),file:new File([buffer],'image.bin',{type:'application/octet-stream',lastModified:42}),blob:new Blob(['bytes']),map:new Map(),set:new Set(['x']),buffer,view:new Uint8Array(buffer,1,2),nan:NaN,negativeZero:-0,big:12345678901234567890n};value.map.set('self',value);value.self=value;
 const text=await createPortableArchive([{storage:'indexeddb',key:'old-key',value}],'https://old.example');
 const archive=await readPortableArchive(text);const copy=archive.entries[0].value;
 assert.equal(copy.id,'old-id');assert.equal(archive.entries[0].key,'old-key');assert.equal(copy.self,copy);assert.equal(copy.map.get('self'),copy);assert.equal(copy.date.toISOString(),value.date.toISOString());assert.equal(await copy.file.text(),await value.file.text());assert.equal(copy.file.name,'image.bin');assert.equal(copy.file.lastModified,42);assert.equal(await copy.blob.text(),'bytes');assert.equal(copy.view.buffer,copy.buffer);assert.deepEqual([...copy.view],[1,127]);assert.ok(Number.isNaN(copy.nan));assert.ok(Object.is(copy.negativeZero,-0));assert.equal(copy.big,value.big);assert.deepEqual([...copy.set],['x']);
});
await test('tampered or malformed archives are refused before any project write',async()=>{
 const text=await createPortableArchive([{storage:'localStorage',key:'draft',value:'{corrupt raw'}],'https://old.example');const parsed=JSON.parse(text);parsed.sourceOrigin='https://altered.example';
 await assert.rejects(readPortableArchive(JSON.stringify(parsed)),/integridade/);await assert.rejects(readPortableArchive('{broken'));assert.throws(()=>decodePortableGraph({root:['ref',99],nodes:[]}));await assert.rejects(encodePortableGraph(()=>{}));
});
await test('sparse arrays and prototype-looking keys remain data',async()=>{
 const original=JSON.parse('{"__proto__":{"polluted":true},"constructor":"value"}');const sparse=[];sparse.length=3;sparse[2]=undefined;original.sparse=sparse;
 const copy=decodePortableGraph(await encodePortableGraph(original));assert.equal({}.polluted,undefined);assert.equal(Object.getOwnPropertyDescriptor(copy,'__proto__').value.polluted,true);assert.equal(copy.constructor,'value');assert.equal(copy.sparse.length,3);assert.equal(0 in copy.sparse,false);assert.equal(2 in copy.sparse,true);
});
await test('import is idempotent, user-scoped, staged separately and never overwrites a colliding original',async()=>{
 const original={id:'collision',name:'Existing',pages:{home:{title:'Untouched'}}};await savePageNovaProject(original.id,original);
 const incoming={...original,name:'Imported',file:new Blob(['asset'])};const text=await createPortableArchive([{storage:'indexeddb',key:original.id,value:incoming}],'https://old.example');
 const first=await stagePortableImport('import-user',text);assert.equal(first.created,true);assert.equal((await stagePortableImport('import-user',text)).created,false);
 assert.deepEqual(await readPageNovaProject(original.id),original);assert.equal((await listPortableImports('another-user')).length,0);
 const records=await listPortableImports('import-user');assert.equal(records.length,1);assert.equal(records[0].entries[0].value.id,'collision');assert.equal(await records[0].entries[0].value.file.text(),'asset');assert.equal(portableProjects(records)[0].title,'Imported');
});
await test('unassigned legacy records require account confirmation and cannot be reassigned to another user',async()=>{
 await markLegacySource('indexeddb:unassigned');assert.equal(await claimLocalSource('wrong-account','indexeddb:unassigned'),false);
 assert.equal(await approveLegacySources('confirmed-owner',['indexeddb:unassigned','indexeddb:unassigned']),1);assert.equal(await localSourceOwner('indexeddb:unassigned'),'confirmed-owner');
 assert.equal(await approveLegacySources('other',['indexeddb:unassigned']),0);assert.equal(await claimLocalSource('other','indexeddb:unassigned'),false);
});

await test('empty local writes cannot replace a complete original, including attached file bytes',async()=>{
 const original={id:'empty-guard',name:'Original',pages:{home:{title:'Home'}},file:new Blob(['asset'])};
 await savePageNovaProject(original.id,original);
 await assert.rejects(savePageNovaProject(original.id,{id:original.id,name:'Empty'}),/preservado/);
 const after=await readPageNovaProject(original.id);assert.equal(after.pages.home.title,'Home');assert.equal(await after.file.text(),'asset');
});
