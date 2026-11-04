/** Real browser/IndexedDB/Postgres; HTTP authentication is a fixture, NOT Supabase Auth. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {chromium as pw} from 'playwright-core';
import chromium from '@sparticuz/chromium';
import {validBackupPayload} from '../src/lib/project-sync-contract.ts';
const a='11111111-1111-4111-a111-111111111111',b='22222222-2222-4222-a222-222222222222';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`);
await db.query('insert into auth.users values($1),($2)',[a,b]);
await db.exec(await readFile(new URL('../../supabase/migrations/20261104160714_builder_project_safe_cloud_sync.sql',import.meta.url),'utf8'));
let queue=Promise.resolve();
function asUser(user,run){const task=queue.catch(()=>{}).then(async()=>{
 await db.exec('begin;set local role authenticated');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);const out=await run();await db.exec('commit');return out;}catch(e){await db.exec('rollback');throw e;}
});queue=task;return task;}
const modules=new Map();
for(const name of ['project-sync','project-sync-local','project-sync-contract','pagenova-project-store']){
 const s=await readFile(new URL(`../src/lib/${name}.ts`,import.meta.url),'utf8');modules.set(`/modules/${name}.js`,ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replaceAll('.ts"','.js"'));
}
const html=`<!doctype html><title>Isolated backup QA</title><h1>Isolated backup QA</h1><script type="module">
import * as s from '/modules/project-sync.js';import * as p from '/modules/pagenova-project-store.js';import * as l from '/modules/project-sync-local.js';
window.qa={...s,...p,...l};const user=document.cookie.split('; ').find(x=>x.startsWith('qa-user='))?.slice(8);if(user)window.qa.stop=s.startProjectSync(user);window.ready=true;</script>`;
const errors=[];
const server=createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost');
 if(modules.has(u.pathname)){res.setHeader('content-type','text/javascript');res.end(modules.get(u.pathname));return;}
 if(!u.pathname.startsWith('/api/')){res.setHeader('content-type','text/html');res.end(html);return;}
 res.setHeader('content-type','application/json');const user=(req.headers.cookie??'').split('; ').find(x=>x.startsWith('qa-user='))?.slice(8);
 if(![a,b].includes(user)){res.statusCode=401;res.end('{}');return;}
 if(req.method==='POST'){
  const chunks=[];for await(const c of req)chunks.push(c);const v=JSON.parse(Buffer.concat(chunks));
  if(v.userId!==user){res.statusCode=409;res.end('{}');return;}if(!validBackupPayload(v.payload,v.kind)){res.statusCode=422;res.end('{}');return;}
  const r=await asUser(user,async()=> (await db.query('select public.pagenova_save_project($1,$2,$3,$4,$5,$6,$7) result',[v.projectId,v.operationId,v.baseRevision,v.kind,JSON.stringify(v.payload),String(v.payload.title??v.payload.name),v.archive??false])).rows[0].result);
  res.end(JSON.stringify({userId:user,...r}));return;
 }
 const project=u.searchParams.get('project');const rows=await asUser(user,async()=> (await db.query('select * from public.pagenova_project_revisions where ($1::text is null or project_id=$1)',[project])).rows);res.end(JSON.stringify({userId:user,projects:rows}));
}catch(e){errors.push(String(e));res.statusCode=500;res.end('{}');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const root=await mkdtemp(path.join(tmpdir(),'pagenova-backup-browser-'));
const executablePath=process.env.PAGENOVA_QA_CHROMIUM_EXECUTABLE??await chromium.executablePath();
const launch=dir=>pw.launchPersistentContext(dir,{executablePath,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader'],headless:true});
let ca=await launch(path.join(root,'a')),cb=await launch(path.join(root,'b'));
const cookie=(c,user)=>c.addCookies([{name:'qa-user',value:user,url:origin,expires:Math.floor(Date.now()/1000)+3600}]);await cookie(ca,a);await cookie(cb,a);
const open=async c=>{const p=await c.newPage();await p.goto(origin);await p.waitForFunction(()=>window.ready);return p;};let pa=await open(ca);const pb=await open(cb);
let checks=0;const pass=n=>{checks++;console.log('PASS '+n);};
const poll=async fn=>{const deadline=Date.now()+20000;while(Date.now()<deadline){const r=await fn();if(r)return r;await new Promise(r=>setTimeout(r,100));}throw Error('Browser QA timeout');};
const legacy={id:'qa-legacy-project',name:'Original synthetic',pages:{home:{title:'Home'}},unknown:{preserved:'all fields'}};const project='indexeddb:'+legacy.id;
const records=user=>asUser(user,async()=> (await db.query('select * from public.pagenova_project_revisions where project_id=$1',[project])).rows);
const localSaved=(name,status)=>pa.evaluate(async({a,name,status})=>(await window.qa.localRevisions(a)).some(r=>r.payload.name===name&&(!status||r.status===status)),{a,name,status});
try{
 await pa.evaluate(p=>window.qa.savePageNovaProject(p.id,p),legacy);await poll(()=>localSaved(legacy.name,'synced'));
 assert.deepEqual(await pa.evaluate(id=>window.qa.readPageNovaProject(id),legacy.id),legacy);pass('real IndexedDB creation and automatic backup');
 await pa.reload();await pa.waitForFunction(()=>window.ready);assert.deepEqual(await pa.evaluate(id=>window.qa.readPageNovaProject(id),legacy.id),legacy);pass('F5 preserves original data');
 const newest={...legacy,name:'Newer device A'};await pa.evaluate(p=>window.qa.savePageNovaProject(p.id,p),newest);await poll(()=>localSaved(newest.name,'synced'));
 await pb.evaluate(p=>window.qa.savePageNovaProject(p.id,p),legacy);await poll(async()=> (await records(a)).some(r=>r.payload.name===legacy.name&&r.conflict));
 const head=await asUser(a,async()=> (await db.query('select revision from public.pagenova_cloud_projects where project_id=$1',[project])).rows[0]);assert.equal((await records(a)).find(r=>r.revision===head.revision).payload.name,newest.name);pass('two browser profiles retain conflicts without replacing newer head');
 await ca.setOffline(true);const offline={...newest,name:'Offline durable'};await pa.evaluate(p=>window.qa.savePageNovaProject(p.id,p),offline);await poll(()=>localSaved(offline.name));
 await ca.close();ca=await launch(path.join(root,'a'));pa=await open(ca);await poll(()=>localSaved(offline.name,'synced'));assert.deepEqual(await pa.evaluate(id=>window.qa.readPageNovaProject(id),legacy.id),offline);pass('offline save survives closing and reopening browser process');
 const copy={...(await records(a)).find(r=>r.payload.name===offline.name).payload,id:'recovered-copy'};await pb.evaluate(p=>window.qa.savePageNovaProject(p.id,p),copy);assert.deepEqual(await pb.evaluate(id=>window.qa.readPageNovaProject(id),legacy.id),legacy);assert.deepEqual(await pb.evaluate(id=>window.qa.readPageNovaProject(id),copy.id),copy);pass('recovery into other profile uses new key and keeps its original');
 let dropped=false;await pa.route('**/api/builder-v2/projects',async route=>{if(!dropped&&route.request().method()==='POST'){dropped=true;await route.fetch();await route.abort();}else await route.continue();});
 const lost={...offline,name:'Lost acknowledgement'};await pa.evaluate(p=>window.qa.savePageNovaProject(p.id,p),lost);await poll(async()=>dropped&&(await records(a)).some(r=>r.payload.name===lost.name));
 await ca.close();ca=await launch(path.join(root,'a'));pa=await open(ca);await poll(()=>localSaved(lost.name,'synced'));assert.equal((await records(a)).filter(r=>r.payload.name===lost.name&&!r.conflict).length,1);pass('lost HTTP acknowledgement plus process restart retries idempotently');
 const before=(await records(b)).length;await cb.clearCookies();await cookie(cb,b);await pb.reload();await pb.waitForFunction(()=>window.ready);await pb.evaluate(async user=>{await window.qa.migrateLocalProjects(user);await window.qa.flushBackups();},b);
 assert.equal((await records(b)).length,before);assert.deepEqual(await pb.evaluate(id=>window.qa.readPageNovaProject(id),legacy.id),legacy);pass('account switching cannot upload previous owner projects');
 assert.equal(errors.length,0,errors.join('\n'));console.log(JSON.stringify({checks,realChromium:true,realIndexedDB:true,realPostgres:true,supabaseAuth:'fixture only',productionTouched:false}));
}finally{await ca.close();await cb.close();await new Promise(r=>server.close(r));await db.close();}
