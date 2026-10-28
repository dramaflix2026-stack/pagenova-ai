import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import ts from "typescript";
import vm from "node:vm";
import path from "node:path";

const root = path.resolve(import.meta.dirname,"../src/lib/commercial");
const cache = new Map();
function load(name) {
  if(cache.has(name))return cache.get(name);
  const source=fs.readFileSync(path.join(root,name+".ts"),"utf8");
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  const module={exports};
  vm.runInNewContext(compiled,{exports,module,require:(ref)=>load(ref.replace("./","")),Set,Map,Date,Error,Number,String,Array,Object,console});
  cache.set(name,module.exports);
  return module.exports;
}
const mapping=load("kiwify-product-mapping");
const planner=load("kiwify-event-planner");
const access=load("modular-access");
const config={"studio.forms":"forms-1","studio.sites":"sites-1","bundle.studio":"studio-1","crm.search":"search-1"};

test("unknown product and missing product ID are rejected",()=>{
 assert.equal(mapping.resolveNewKiwifyProduct("fake",config),null);
 assert.equal(mapping.resolveNewKiwifyProduct(null,config),null);
});
test("individual product never grants the entire family",()=>{
 assert.deepEqual(Array.from(mapping.resolveNewKiwifyProduct("forms-1",config).modules),["studio.forms"]);
});
test("bundle grants its included modules",()=>{
 assert.equal(mapping.resolveNewKiwifyProduct("studio-1",config).modules.length,7);
});
test("duplicate IDs fail closed",()=>{
 assert.throws(()=>mapping.resolveNewKiwifyProduct("x",{"studio.forms":"x","crm.search":"x"}));
});
test("approval requires paid order",()=>{
 const payload={order_id:"o1",order_status:"pending",webhook_event_type:"order_approved",Product:{product_id:"forms-1"},Customer:{email:"TEST@EXAMPLE.COM"}};
 assert.equal(planner.planNewKiwifyEvent(payload,config).action,"ignore");
 payload.order_status="paid";
 const decision=planner.planNewKiwifyEvent(payload,config);
 assert.equal(decision.action,"activate");
 assert.equal(decision.email,"test@example.com");
});
test("cancellation deferred, refund revokes",()=>{
 const payload={order_id:"o1",webhook_event_type:"subscription_canceled",Product:{product_id:"forms-1"},Customer:{email:"a@b.com"}};
 assert.equal(planner.planNewKiwifyEvent(payload,config).action,"defer");
 payload.webhook_event_type="order_refunded";
 assert.equal(planner.planNewKiwifyEvent(payload,config).action,"revoke");
});
test("overlapping grants preserve access",()=>{
 const now=new Date("2026-10-28T00:00:00Z");
 const grants=[{module_code:"studio",state:"revoked",valid_from:null,valid_until:null},{module_code:"studio.forms",state:"active",valid_from:null,valid_until:null},{module_code:"crm.search",state:"active",valid_from:null,valid_until:null}];
 assert.equal(access.hasModularAccess(grants,"studio.forms",now),true);
 assert.equal(access.hasModularAccess(grants,"studio.sites",now),false);
 assert.equal(access.hasModularAccess(grants,"crm.search",now),true);
});
test("expired grants and future development tools do not authorize",()=>{
 const grants=[{module_code:"studio.sites",state:"active",valid_from:null,valid_until:"2026-10-27T00:00:00Z"},{module_code:"apps",state:"active",valid_from:null,valid_until:null}];
 assert.equal(access.hasModularAccess(grants,"studio.sites",new Date("2026-10-28T00:00:00Z")),false);
 assert.equal(access.hasModularAccess(grants,"development.apps",new Date("2026-10-28T00:00:00Z")),false);
});
