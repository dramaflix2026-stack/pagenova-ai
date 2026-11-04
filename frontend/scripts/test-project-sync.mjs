import {test} from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB,IDBKeyRange} from 'fake-indexeddb';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {captureBackup,localRevisions,prepareUpload,acknowledgeUpload,claimLocalSource} from '../src/lib/project-sync-local.ts';
import {validBackupPayload,backupDigest} from '../src/lib/project-sync-contract.ts';
import {savePageNovaProject,readPageNovaProject,listPageNovaProjectEntries} from '../src/lib/pagenova-project-store.ts';
globalThis.indexedDB=indexedDB;globalThis.IDBKeyRange=IDBKeyRange;
const site=(title)=>({title,background:'#ffffff',blocks:[{id:'b1',type:'heading',text:title}],templateId:'prompt-adaptive',extras:{custom:'preserved'}});
await test('local snapshots survive empty states, mutable references, refresh and retry',async()=>{
  const p=site('Original');
  const first=captureBackup('user-a','studio:one','studio',p);p.title='Mutated after save';await first;
  await captureBackup('user-a','studio:one','studio',site('Latest'));
  await captureBackup('user-a','studio:one','studio',{title:'Blank',background:'#fff',blocks:[]});
  const revisions=await localRevisions('user-a');assert.equal(revisions.length,2);
  assert.equal(revisions[0].payload.title,'Original');assert.equal(revisions[1].payload.title,'Latest');
  const sent=await prepareUpload(revisions[0]);assert.equal(sent.sentBase,null);
  assert.deepEqual(await prepareUpload(sent),sent);
  await acknowledgeUpload(sent,{revision:sent.operationId,conflict:false});
  const second=await prepareUpload(revisions[1]);assert.equal(second.sentBase,sent.operationId);
  await acknowledgeUpload(second,{revision:second.operationId,conflict:true});
  const retained=await localRevisions('user-a');assert.equal(retained[1].status,'conflict');assert.equal(retained[0].payload.extras.custom,'preserved');
  await assert.rejects(acknowledgeUpload(second,{revision:crypto.randomUUID(),conflict:false}));
});
await test('rapid saves preserve order and content, with duplicate migration and account isolation',async()=>{
  await Promise.all(Array.from({length:30},(_,i)=>captureBackup('rapid','studio:rapid','studio',site('Edit '+i))));
  const r=await localRevisions('rapid');assert.equal(r.length,30);assert.equal(r.at(-1).payload.title,'Edit 29');
  await captureBackup('rapid','studio:rapid','studio',site('Edit 29'));assert.equal((await localRevisions('rapid')).length,30);
  await captureBackup('rapid','studio:rapid','studio',site('Legacy'),true);
  await captureBackup('rapid','studio:rapid','studio',site('Legacy'),true);
  assert.equal((await localRevisions('rapid')).length,31);
  assert.equal(await claimLocalSource('rapid','source-1'),true);
  assert.equal(await claimLocalSource('other','source-1'),false);
  assert.equal((await localRevisions('other')).length,0);
  await assert.rejects(captureBackup('other','studio:rapid','studio',site('Wrong account')));
  assert.equal((await localRevisions('other')).length,0);
});
await test('legacy IndexedDB originals and keys remain byte-for-byte intact during migration',async()=>{
  const legacy={id:'original-project',name:'Existing customer',pages:{home:{title:'Home'}},createdAt:'2026-10-01',unknown:{must:'survive'}};
  await savePageNovaProject(legacy.id,legacy);
  const before=await listPageNovaProjectEntries();
  for(const {key,project} of before)await captureBackup('migration','indexeddb:'+key,'indexeddb',project,true);
  assert.deepEqual(await listPageNovaProjectEntries(),before);
  assert.deepEqual(await readPageNovaProject(legacy.id),legacy);
  const copy={...legacy,id:'recovered-copy'};await savePageNovaProject(copy.id,copy);
  assert.deepEqual(await readPageNovaProject(legacy.id),legacy);
  assert.equal((await listPageNovaProjectEntries()).length,2);
});
await test('canonical digest ignores property order and rejects empty Studio payloads',async()=>{
  assert.equal(await backupDigest({a:1,b:2}),await backupDigest({b:2,a:1}));
  assert.equal(validBackupPayload({...site('File'),asset:new Blob(['bytes'])},'studio'),false);
  const mutable={id:'frozen-save',name:'Before',pages:{home:{title:'Before'}}};
  const saving=savePageNovaProject(mutable.id,mutable);mutable.name='After';await saving;
  assert.equal((await readPageNovaProject(mutable.id)).name,'Before');
  for(const x of [null,{},[],{title:'Empty',background:'#fff',blocks:[]}])assert.equal(validBackupPayload(x,'studio'),false);
});
await test('Postgres CAS, immutable revisions, restore, idempotence, RLS, anonymous denial',async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    const a='11111111-1111-4111-a111-111111111111',b='22222222-2222-4222-a222-222222222222';
    await db.query('insert into auth.users values($1),($2)',[a,b]);
    await db.exec(await readFile(new URL('../../supabase/migrations/20261104160714_builder_project_safe_cloud_sync.sql',import.meta.url),'utf8'));
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${a}',false);`);
    const call=async(op,base,payload=site('Cloud original'),archive=false)=> (await db.query('select public.pagenova_save_project($1,$2,$3,$4,$5,$6,$7) result',['studio:test',op,base,'studio',JSON.stringify(payload),payload.title,archive])).rows[0].result;
    const first=crypto.randomUUID(),second=crypto.randomUUID(),stale=crypto.randomUUID();
    assert.equal((await call(first,null)).conflict,false);
    assert.equal((await call(first,null)).conflict,false);
    assert.equal((await call(second,first,site('New device'))).conflict,false);
    assert.equal((await call(stale,first,site('Old device'))).conflict,true);
    const head=await db.query('select revision from public.pagenova_cloud_projects');assert.equal(head.rows[0].revision,second);
    assert.equal((await db.query('select * from public.pagenova_project_revisions')).rows.length,3);
    await assert.rejects(call(crypto.randomUUID(),second,{title:'Empty',background:'#fff',blocks:[]}));
    await assert.rejects(db.query('select public.pagenova_save_project($1,$2,$3,$4,$5,$6)',
      ['indexeddb:empty',crypto.randomUUID(),null,'indexeddb',JSON.stringify({id:'empty',pages:{}}),'Empty']));
    const legacy=await db.query('select public.pagenova_save_project($1,$2,$3,$4,$5,$6,$7) result',
      ['indexeddb:valid',crypto.randomUUID(),null,'indexeddb',JSON.stringify({id:'valid',pages:{home:{title:'Legacy'}}}),'Legacy',true]);
    assert.equal(legacy.rows[0].result.conflict,true);
    await assert.rejects(db.exec(`delete from public.pagenova_project_revisions`));
    await assert.rejects(db.exec(`update public.pagenova_cloud_projects set title='overwrite'`));
    const restore=crypto.randomUUID();assert.equal((await call(restore,second,site('Cloud original'))).conflict,false);
    assert.equal((await db.query('select * from public.pagenova_project_revisions')).rows.length,5);
    await db.exec(`select set_config('request.jwt.claim.sub','${b}',false)`);
    assert.equal((await db.query('select * from public.pagenova_project_revisions')).rows.length,0);
    assert.equal((await db.query('select * from public.pagenova_cloud_projects')).rows.length,0);
    assert.equal((await call(crypto.randomUUID(),null,site('Other owner'))).conflict,false);
    await db.exec(`reset role; set role anon; select set_config('request.jwt.claim.sub','',false)`);
    await assert.rejects(call(crypto.randomUUID(),null));
  }finally{await db.close();}
});
await test('network failure does not block legacy local saves; retry drains durable queue',async()=>{
  const events=new EventTarget();let online=false;const uploads=[];
  globalThis.window={addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),
    dispatchEvent:events.dispatchEvent.bind(events),setInterval:()=>1};
  globalThis.localStorage={};
  globalThis.fetch=async(_url,options)=>{
    if(!online)throw Error('offline');
    const body=JSON.parse(options.body);uploads.push(body);
    return Response.json({userId:body.userId,revision:body.operationId,conflict:body.archive});
  };
  const {startProjectSync,backupLocalProject,flushBackups,migrateLocalProjects}=await import('../src/lib/project-sync.ts');
  const stop=startProjectSync('offline-user');
  try{
    const project={id:'offline-project',name:'Offline',pages:{home:{title:'Before'}}};
    await savePageNovaProject(project.id,project);
    await backupLocalProject('studio:offline','studio',site('Saved offline'));
    await flushBackups();
    assert.ok((await localRevisions('offline-user')).some(x=>x.status==='pending'));
    assert.deepEqual(await readPageNovaProject(project.id),project);
    const slot='pagenova-builder-v2-private-v1';
    const stored=new Map([[slot,JSON.stringify(site('Legacy studio'))],[slot+':versions',JSON.stringify([{site:site('Historical studio')}])]]);
    globalThis.localStorage={...Object.fromEntries(stored),getItem:k=>stored.get(k)??null};
    stored.set(slot+':crm:orphan:versions',JSON.stringify([{site:{title:'Invalid',blocks:[]}},{site:site('Orphan version')} ]));
    stored.set(slot+':crm:corrupt','{corrupted');
    stored.set(slot+':crm:corrupt:versions',JSON.stringify([{site:site('Recovered historical')} ]));
    globalThis.localStorage={...Object.fromEntries(stored),getItem:k=>stored.get(k)??null};
    const before=JSON.stringify([...stored]);
    await migrateLocalProjects('offline-user');await migrateLocalProjects('offline-user');
    assert.equal(JSON.stringify([...stored]),before);
    const imported=(await localRevisions('offline-user')).filter(r=>r.projectId.startsWith('studio:legacy:'));
    assert.equal(imported.length,4);assert.ok(imported.every(r=>r.archive));
    online=true;await flushBackups();
    assert.ok(uploads.length>0);
    assert.ok((await localRevisions('offline-user')).every(x=>x.status!=='pending'));
    assert.deepEqual(await readPageNovaProject(project.id),project);
  }finally{stop();delete globalThis.window;}
});

await test('permanent upload rejection preserves the snapshot and does not block other projects',async()=>{
  const events=new EventTarget();
  globalThis.window={addEventListener:events.addEventListener.bind(events),removeEventListener:events.removeEventListener.bind(events),
    dispatchEvent:events.dispatchEvent.bind(events),setInterval:()=>1};
  globalThis.localStorage={};
  globalThis.fetch=async(_url,options)=>{
    const body=JSON.parse(options.body);
    return body.projectId==='studio:a-rejected'?Response.json({error:'too large'},{status:413}):
      Response.json({userId:body.userId,revision:body.operationId,conflict:false});
  };
  const {startProjectSync,backupLocalProject,flushBackups}=await import('../src/lib/project-sync.ts');
  const stop=startProjectSync('rejected-user');
  try{
    await backupLocalProject('studio:a-rejected','studio',site('Retained locally'));
    await backupLocalProject('studio:b-valid','studio',site('Valid cloud backup'));
    await flushBackups();await flushBackups();
    const records=await localRevisions('rejected-user');
    assert.equal(records.find(r=>r.projectId==='studio:a-rejected').status,'blocked');
    assert.equal(records.find(r=>r.projectId==='studio:a-rejected').payload.title,'Retained locally');
    assert.equal(records.find(r=>r.projectId==='studio:b-valid').status,'synced');
  }finally{stop();delete globalThis.window;}
});

await test('an older hydrated draft cannot inherit a newer cloud acknowledgement',async()=>{
  const user='stale-view-user',project='studio:stale-view';
  await captureBackup(user,project,'studio',site('Newest synced'));
  const latest=(await localRevisions(user))[0];
  const sent=await prepareUpload(latest);
  await acknowledgeUpload(sent,{revision:sent.operationId,conflict:false});
  await captureBackup(user,project,'studio',site('Old local view'),true,true);
  // A delayed duplicate acknowledgement must not reset the invalidated baseline.
  await acknowledgeUpload(sent,{revision:sent.operationId,conflict:false});
  await captureBackup(user,project,'studio',site('Edited from old local view'));
  const edited=(await localRevisions(user)).find(r=>r.payload.title==='Edited from old local view');
  const outgoing=await prepareUpload(edited);
  assert.equal(outgoing.sentBase,null);
  assert.ok((await localRevisions(user)).some(r=>r.payload.title==='Newest synced'));
});
