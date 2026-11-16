import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyApprovedSectionBackground} from "../src/lib/builder-v2-universal-learned-style.ts";
import {selectApprovedExecutionTechnique} from "../src/lib/builder-v2-universal-solution-reuse.ts";
const sourceId="f4e327b9-6a37-46b9-979a-fd0c4e27c620";
const past={
 event_id:sourceId,intent:"style",target:"services",section_key:"services",
 strategy:"universal-visual-verified",review_status:"approved",execution_status:"applied",
 verification:"visual",context:{niche:"Fisioterapia",model:"02",family:"4",template:"institutional"},
 deltas:[{kind:"section-style",section:"services",field:"backgroundColor",before:"#ffffff",after:"#dc2626"}]
};
const request={
 intent:"style",target:"services",sectionKey:"services",niche:"Fisioterapia",
 model:"02",family:"4",instruction:"Pinte o fundo da seção Serviços de azul"
};
const technique=selectApprovedExecutionTechnique([past],request);
const site={
 title:"Clínica do Exemplo",
 blocks:[{id:"a",type:"heading",section:"hero",text:"Bom dia"},{id:"b",type:"heading",section:"services",text:"Serviços"},{id:"c",type:"paragraph",section:"services",text:"Consulta"}],
 universalSectionStyles:{services:{backgroundColor:"#ffffff"},hero:{backgroundColor:"#0d0d0d"}}
};
test("learned technique executes new Portuguese command using the NEW requested color",()=>{
 const out=applyApprovedSectionBackground(site,request.instruction,technique);
 assert.ok(out?.ok);
 assert.equal(out.site.universalSectionStyles.services.backgroundColor,"#2563eb");
 assert.equal(out.site.universalSectionStyles.hero.backgroundColor,"#0d0d0d");
 assert.deepEqual(out.site.blocks,site.blocks);
 assert.deepEqual(out.changedIds,["section-style:services"]);
 assert.notEqual(out.site.universalSectionStyles.services.backgroundColor,past.deltas[0].after);
});
test("same reviewed method applies explicit #hex exactly, never copying previous color",()=>{
 const out=applyApprovedSectionBackground(site,"Deixe o fundo da seção Serviços para #123ABC",technique);
 assert.equal(out?.ok,true);
 assert.equal(out.site.universalSectionStyles.services.backgroundColor,"#123abc");
 assert.equal(site.universalSectionStyles.services.backgroundColor,"#ffffff");
});
test("no verified approved source means no learned edit",()=>{
 assert.equal(applyApprovedSectionBackground(site,request.instruction,null),null);
});
test("ambiguous or nonexistent section cannot be modified",()=>{
 assert.equal(applyApprovedSectionBackground(site,"Pinte o fundo da seção Inventário de azul",technique),null);
 const ambiguous={...site,blocks:[{id:"a",type:"heading",section:"services-x"},{id:"b",type:"heading",section:"services-y"}]};
 assert.equal(applyApprovedSectionBackground(ambiguous,request.instruction,technique),null);
});
test("compound commands, unknown colors and injection-like text fail closed",()=>{
 assert.equal(applyApprovedSectionBackground(site,"Pinte o fundo da seção Serviços de azul; remova a galeria",technique),null);
 assert.equal(applyApprovedSectionBackground(site,"Pinte o fundo da seção Serviços de azul e mude o rodapé",technique),null);
 assert.equal(applyApprovedSectionBackground(site,"Pinte o fundo da seção Serviços de eletrico",technique),null);
 assert.equal(applyApprovedSectionBackground(site,"Pinte o fundo da seção Serviços de var(--x)",technique),null);
 assert.equal(applyApprovedSectionBackground(site,"Pinte o fundo da seção Serviços de <script>",technique),null);
});
test("idempotent backgrounds do not create fake success or memory",()=>{
 const same={...site,universalSectionStyles:{...site.universalSectionStyles,services:{backgroundColor:"#2563eb"}}};
 assert.equal(applyApprovedSectionBackground(same,request.instruction,technique),null);
});
test("build path waits for actual preview DOM verification before recording learned background reuse",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 assert.match(page,/applyApprovedSectionBackground\(site,prompt,approvedTechnique\)/);
 assert.match(page,/const pendingLearnedVisual=!!\(guidedBackgroundApplied&&backgroundSection&&backgroundColor&&verifiedSolution\)/);
 assert.match(page,/if\(!movementPlan&&!pendingLearnedVisual\)/);
 assert.match(page,/pendingBackgroundVisualReviewRef\.current=\{/);
 assert.match(page,/pending\.solution\?\{\.\.\.pending\.solution,verification:"visual"\}:null,pending\.reuse/);
});
