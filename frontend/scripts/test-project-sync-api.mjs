import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile} from 'node:fs/promises';
import {NextRequest} from 'next/server.js';
const source=await readFile(new URL('../src/app/api/builder-v2/projects/route.ts',import.meta.url),'utf8');
const transformed=source.replace('"next/server"',JSON.stringify(import.meta.resolve('next/server.js')))
  .replace('import { createClient } from "@/lib/supabase/server";','const createClient=()=>globalThis.__projectSyncDb;')
  .replace('"@/lib/project-sync-contract"',JSON.stringify(new URL('../src/lib/project-sync-contract.ts',import.meta.url).href));
const code=ts.transpileModule(transformed,{compilerOptions:{target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext}}).outputText;
const {GET,POST}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const user='11111111-1111-4111-a111-111111111111';
let rpcCalls=0;
const payload={title:'API test',background:'#fff',blocks:[{id:'one',type:'heading',text:'Hello'}]};
function db(id=user){return {auth:{getUser:async()=>({data:{user:id?{id}:null},error:null})},rpc:async(_fn,args)=>{rpcCalls++;return {data:{revision:args.p_operation,conflict:false},error:null};}};}
const request=(body,origin='https://example.com')=>new NextRequest('https://example.com/api/builder-v2/projects',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
const body=()=>({userId:user,projectId:'studio:test',operationId:crypto.randomUUID(),baseRevision:null,kind:'studio',payload});
await test('API requires authentication for reads and writes',async()=>{
  globalThis.__projectSyncDb=db(null);
  assert.equal((await GET(new NextRequest('https://example.com/api/builder-v2/projects'))).status,401);
  assert.equal((await POST(request(body()))).status,401);assert.equal(rpcCalls,0);
});
await test('API rejects cross-origin, wrong-account, malformed and empty updates without calling CAS',async()=>{
  globalThis.__projectSyncDb=db();
  assert.equal((await POST(request(body(),'https://attacker.example'))).status,403);
  assert.equal((await POST(request({...body(),userId:'other'}))).status,409);
  assert.equal((await POST(request({...body(),baseRevision:'stale-non-uuid'}))).status,422);
  assert.equal((await POST(request({...body(),payload:{...payload,blocks:[]}}))).status,422);
  assert.equal((await POST(request({...body(),kind:'indexeddb',payload:{pages:{},id:'empty'}}))).status,422);
  assert.equal(rpcCalls,0);
});
await test('API commits complete payload and returns uncached owner-bound acknowledgement',async()=>{
  const input=body();globalThis.__projectSyncDb=db();
  const response=await POST(request(input));assert.equal(response.status,200);
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.deepEqual(await response.json(),{userId:user,revision:input.operationId,conflict:false});assert.equal(rpcCalls,1);
});
await test('API service failures do not acknowledge a save',async()=>{
  globalThis.__projectSyncDb={...db(),rpc:async()=>({data:null,error:{message:'network'}})};
  const response=await POST(request(body()));assert.equal(response.status,503);
  assert.equal((await response.json()).revision,undefined);
});

await test('API handles null and scalar JSON without accepting a backup',async()=>{
  globalThis.__projectSyncDb=db();
  for(const value of [null,[],"invalid",42])assert.equal((await POST(request(value))).status,400);
});
