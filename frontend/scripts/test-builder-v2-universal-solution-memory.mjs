import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureVerifiedEditorSolution,memoryCanGuideExecution} from "../src/lib/builder-v2-universal-solution-memory.ts";

const before={
 niche:"Fisioterapia",blocks:[
  {id:"hero-title",type:"heading",section:"hero",text:"Atendimento especializado",color:"#111111"},
  {id:"services-title",type:"heading",section:"services",text:"Serviços",color:"#111111"},
  {id:"cta",type:"button",section:"hero",text:"Contato",color:"#eeeeee",href:"https://example.com/private?token=xyz"}
 ]};
const ctx={niche:"Fisioterapia",model:"02",family:"4",template:"institutional-complete"};

test("stores real verified before/after color and context, no raw command",()=>{
 const next=structuredClone(before);next.blocks[1].color="#1A2B3C";
 const result=captureVerifiedEditorSolution(before,next,["services-title"],ctx);
 assert.ok(result);
 assert.equal(result.schemaVersion,2);
 assert.equal(result.verification,"model");
 assert.deepEqual(result.context,ctx);
 assert.ok(result.deltas.some(d=>d.kind==="block-field"&&d.blockId==="services-title"&&d.field==="color"&&d.before==="#111111"&&d.after==="#1A2B3C"));
 assert.ok(!JSON.stringify(result).includes("altere a cor"));
});
test("rejects an unchanged or undeclared mutation; does not fabricate reusable solutions",()=>{
 assert.equal(captureVerifiedEditorSolution(before,before,["services-title"],ctx),null);
 const next=structuredClone(before);next.blocks[0].color="#ff00ff";
 assert.equal(captureVerifiedEditorSolution(before,next,["services-title"],ctx),null);
});
test("records short copy changes, redacts sensitive contact data",()=>{
 const next=structuredClone(before);next.blocks[0].text="Clínica especializada e acolhedora";
 const result=captureVerifiedEditorSolution(before,next,["hero-title"],ctx);
 assert.equal(result?.deltas.find(d=>d.field==="text")?.after,"Clínica especializada e acolhedora");
 const withEmail=structuredClone(before);withEmail.blocks[0].text="Fale comigo em secret-person@example.com";
 const sensitive=captureVerifiedEditorSolution(before,withEmail,["hero-title"],ctx);
 assert.equal(sensitive?.deltas.find(d=>d.field==="text")?.after,"<content-redacted>");
 assert.ok(!JSON.stringify(sensitive).includes("secret-person@example.com"));
});
test("never persists signed media URLs or private contact links in solution memory",()=>{
 const after=structuredClone(before);after.blocks[2].href="https://example.com/private?secret-token=abc";
 const memory=captureVerifiedEditorSolution(before,after,["cta"],ctx);
 assert.ok(memory);
 assert.equal(memory.deltas.find(d=>d.field==="href")?.after,"<public-web-url>");
 assert.ok(!JSON.stringify(memory).includes("secret-token"));
});
test("records verified section background colors, not unrelated site content",()=>{
 const site={...structuredClone(before),universalSectionStyles:{services:{backgroundColor:"#ffffff"},hero:{backgroundColor:"#101010"}}};
 const next=structuredClone(site);next.universalSectionStyles.services.backgroundColor="#e5e5e5";
 const memory=captureVerifiedEditorSolution(site,next,["section-style:services"],ctx,"visual");
 assert.equal(memory?.verification,"visual");
 assert.ok(memory?.deltas.some(d=>d.kind==="section-style"&&d.section==="services"&&d.field==="backgroundColor"&&d.after==="#e5e5e5"));
});
test("tracks block additions/removals and section movement without fabricating block content",()=>{
 const add=structuredClone(before);add.blocks.push({id:"faq-added",type:"paragraph",section:"faq",text:"resposta",color:"#111111"});
 const added=captureVerifiedEditorSolution(before,add,["faq-added"],ctx);
 assert.ok(added?.deltas.some(d=>d.kind==="block-added"&&d.blockId==="faq-added"&&d.section==="faq"));
 const remove=structuredClone(before);remove.blocks.splice(1,1);
 const removed=captureVerifiedEditorSolution(before,remove,["services-title"],ctx);
 assert.ok(removed?.deltas.some(d=>d.kind==="block-removed"&&d.blockId==="services-title"));
 const move=structuredClone(before);const [first]=move.blocks.splice(0,1);move.blocks.splice(1,0,first);
 const moved=captureVerifiedEditorSolution(before,move,["hero-title"],ctx);
 assert.ok(moved?.deltas.some(d=>d.kind==="block-moved"&&d.blockId==="hero-title"));
});
test("rejects enormous changes and caps memory size",()=>{
 const site=structuredClone(before);
 site.blocks[0].text="m".repeat(30000);
 const original={...structuredClone(before),blocks:[{...before.blocks[0],text:"original"},...before.blocks.slice(1)]};
 const result=captureVerifiedEditorSolution(original,site,["hero-title"],ctx);
 assert.ok(result);
 assert.equal(result.deltas.find(d=>d.field==="text")?.after,"<content-redacted>");
 assert.ok(JSON.stringify(result).length<18000);
});
test("rejected, pending and failed execution memory cannot guide future edits",()=>{
 assert.equal(memoryCanGuideExecution({review_status:"approved",execution_status:"applied",verification:"visual"}),true);
 assert.equal(memoryCanGuideExecution({review_status:"rejected",execution_status:"applied",verification:"visual"}),false);
 assert.equal(memoryCanGuideExecution({review_status:"pending",execution_status:"applied",verification:"model"}),false);
 assert.equal(memoryCanGuideExecution({review_status:"approved",execution_status:"rejected",verification:"model"}),false);
});
test("production Builder binds memory to an exact event UUID and does not save raw prompts",()=>{
 const file=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const schema=readFileSync(new URL("../supabase/migrations/20261116_builder_editor_solution_memories.sql",import.meta.url),"utf8");
 assert.match(file,/from\("builder_editor_solution_memories"\)\.insert\(/);
 assert.match(file,/event_id:event.id,user_id:user.id/);
 assert.match(file,/captureVerifiedEditorSolution\(site,result.site,result.changedIds/);
 assert.match(file,/pending.solution\?\{\.\.\.pending.solution,verification:"visual"\}/);
 assert.doesNotMatch(schema,/raw_prompt|instruction\s+text/);
 assert.match(schema,/primary key references public\.builder_editor_learning_events\(id\)/);
 assert.match(schema,/using \(\(select auth\.uid\(\)\)=user_id\)/);
 assert.match(schema,/event\.execution_status='applied'/);
 assert.match(schema,/revoke all on table public\.builder_editor_solution_memories from public,anon,authenticated/);
 assert.doesNotMatch(schema,/grant .*update/i);
});
