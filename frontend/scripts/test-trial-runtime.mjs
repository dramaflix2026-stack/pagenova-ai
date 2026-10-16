/** Trial access and quotas: deterministic zero-network regression. */
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../");
const ts=createRequire(resolve(root,"package.json"))("typescript");
const file=resolve(root,"src/lib/trial/server.ts");
const output=ts.transpileModule(readFileSync(file,"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const mod={exports:{}};
new Function("module","exports","process","console",output)(mod,mod.exports,process,console);
const {getPageNovaAccess,reserveTrialCredit,settleTrialCredit,settleTrialJob}=mod.exports;
function assert(x,m){if(!x)throw Error(m)}
const old=process.env.PAGENOVA_TRIAL_ENABLED;
process.env.PAGENOVA_TRIAL_ENABLED="1";
const trials=new Map(),emails=new Map(),ops=new Map(),jobs=new Map();
let isPaid=false,clockExpired=false;
const now=new Date("2026-10-16T10:00:00.000Z").getTime();
const admin={
 from(table){assert(table==="entitlements","Unexpected DB "+table);
  const q={select:()=>q,eq:()=>q,ilike:()=>q,limit:()=>q,
    maybeSingle:async()=>({data:isPaid?{id:"paid-subscription"}:null,error:null})};
  return q;
 },
 async rpc(name,a){
  if(name==="pagenova_trial_access"){
   const email=a.p_email.toLowerCase().trim();
   let trial=trials.get(a.p_owner_id);
   if(!trial){
    if(emails.has(email))return {data:{active:false,reason:"already_claimed"},error:null};
    if(!a.p_start)return {data:{active:false,reason:"not_started"},error:null};
    trial={owner:a.p_owner_id,email,sitesUsed:0,googleUsed:0,startedAt:new Date(now).toISOString(),
      expiresAt:new Date(now+5*864e5).toISOString()};
    trials.set(a.p_owner_id,trial);emails.set(email,a.p_owner_id);
   }
   if(trial.email!==email)return {data:{active:false,reason:"identity_changed"},error:null};
   return {data:{active:!clockExpired,reason:clockExpired?"expired":"active",
    startedAt:trial.startedAt,expiresAt:trial.expiresAt,sitesLimit:2,sitesUsed:trial.sitesUsed,
    sitesRemaining:2-trial.sitesUsed,googleLimit:5,googleUsed:trial.googleUsed,
    googleRemaining:5-trial.googleUsed},error:null};
  }
  if(name==="pagenova_trial_reserve"){
   const t=trials.get(a.p_owner_id);
   if(!t||clockExpired)return {data:{allowed:false,reason:"expired"},error:null};
   const unique=a.p_owner_id+"/"+a.p_kind+"/"+a.p_key;
   if(ops.has(unique)){const o=ops.get(unique);return {data:{allowed:o.state!=="refunded",
     created:false,operationId:o.id,state:o.state,jobId:o.jobId},error:null};}
   const kind=a.p_kind==="site_generation"?"sitesUsed":"googleUsed";
   const max=a.p_kind==="site_generation"?2:5;
   if(t[kind]>=max)return {data:{allowed:false,reason:a.p_kind==="site_generation"?"site_limit":"google_limit"},error:null};
   const id="op"+(ops.size+1),op={id,owner:a.p_owner_id,kind:a.p_kind,key:a.p_key,state:"reserved"};
   ops.set(unique,op);t[kind]++;return {data:{allowed:true,created:true,operationId:id},error:null};
  }
  if(name==="pagenova_trial_settle"){
   const o=[...ops.values()].find(v=>v.id===a.p_operation_id&&v.owner===a.p_owner_id);
   if(!o)return {data:{found:false},error:null};
   if(o.state==="refunded")return {data:{found:true,state:"refunded"},error:null};
   if(!a.p_success){o.state="refunded";const t=trials.get(o.owner);
    t[o.kind==="site_generation"?"sitesUsed":"googleUsed"]--;}
   else if(o.state==="reserved"){o.state="consumed";o.jobId=a.p_job_id;if(o.jobId)jobs.set(o.jobId,o);}
   return {data:{found:true,state:o.state},error:null};
  }
  if(name==="pagenova_trial_settle_job"){
   const o=jobs.get(a.p_job_id);
   if(!o)return {data:{found:false},error:null};
   return admin.rpc("pagenova_trial_settle",{
    p_owner_id:o.owner,p_operation_id:o.id,p_success:a.p_success,p_job_id:a.p_job_id,
   });
  }
  return {data:null,error:{code:"TEST_UNSUPPORTED_RPC"}};
 }
};
const user={id:"00000000-0000-4000-8000-000000000001",email:"first@example.org",email_confirmed_at:"2026-10-16T09:00:00Z"};
try{
 assert((await getPageNovaAccess(admin,{...user,email_confirmed_at:null},true)).kind==="none",
  "Unverified email must not start a trial");
 assert(trials.size===0,"Unverified signup inserted a trial");
 assert((await getPageNovaAccess(admin,user,false)).kind==="none",
  "Read without explicit dashboard activation must not start a trial");
 assert((await getPageNovaAccess(admin,user,true)).kind==="trial","Verified first visit did not start trial");
 assert(trials.size===1,"Unexpected number of trial records");
 assert((await getPageNovaAccess(admin,user,true)).trial?.sitesRemaining===2,
  "Reload started a new trial or altered trial limits");
 const impersonator={...user,id:"00000000-0000-4000-8000-000000000002"};
 assert((await getPageNovaAccess(admin,impersonator,true)).kind==="none",
  "A new account with an already-used email restarted the trial");
 for(let i=0;i<2;i++){
  const result=await reserveTrialCredit(admin,user.id,"site_generation","site:testproject:"+i);
  assert(result.allowed&&result.created,"Could not reserve permitted site "+i);
  await settleTrialCredit(admin,user.id,result.operationId,true,"job-"+i);
 }
 assert(!(await reserveTrialCredit(admin,user.id,"site_generation","site:testproject:2")).allowed,
  "Allowed third free AI site");
 assert((await reserveTrialCredit(admin,user.id,"site_generation","site:testproject:1")).created===false,
  "Idempotency key debited a second time");
 for(let i=0;i<5;i++){
  const result=await reserveTrialCredit(admin,user.id,"google_page","google:testpage:"+i);
  assert(result.allowed&&result.created,"Could not reserve free Google page "+i);
  await settleTrialCredit(admin,user.id,result.operationId,true);
 }
 assert(!(await reserveTrialCredit(admin,user.id,"google_page","google:testpage:5")).allowed,
  "Allowed sixth Google Places page");
 await settleTrialJob(admin,"job-0",false);
 assert((await getPageNovaAccess(admin,user,false)).trial.sitesRemaining===1,
  "Worker failure did not refund site trial credit");
 await settleTrialJob(admin,"job-0",false);
 assert((await getPageNovaAccess(admin,user,false)).trial.sitesRemaining===1,
  "Duplicate job callback refunded a site twice");
 isPaid=true;
 assert((await getPageNovaAccess(admin,user,false)).kind==="paid",
  "Paid subscription must override free trial quota");
 isPaid=false;clockExpired=true;
 assert((await getPageNovaAccess(admin,user,true)).kind==="none",
  "Reload restarted an expired evaluation");
 assert(trials.size===1,"Expired evaluation was recreated");
 assert(!(await reserveTrialCredit(admin,user.id,"site_generation","site:testproject:3")).allowed,
  "Expired user could reserve credits");
 console.log("PageNova 5-day trial PASS: confirmation, one-time activation, quotas 2/5, idempotency, job refunds, paid priority, expiry.");
}finally{
 if(old===undefined)delete process.env.PAGENOVA_TRIAL_ENABLED;
 else process.env.PAGENOVA_TRIAL_ENABLED=old;
}
