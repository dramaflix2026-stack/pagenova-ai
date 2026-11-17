import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditFamilyTransfers,destinationFamilyTransferKey} from "../src/lib/builder-v2-family-transfer-audit.ts";
import {selectApprovedExecutionTechnique} from "../src/lib/builder-v2-universal-solution-reuse.ts";
const uuid=n=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const sourceId=uuid(200);
const source={id:sourceId,niche:"Auto centers",model:"02",review_status:"approved",
 execution_status:"applied",reviewed_at:"2026-11-17T09:00:00Z"};
const memory={event_id:sourceId,schema_version:2,verification:"visual",
 context:{niche:"Auto centers",model:"02",family:"9",template:"prompt-adaptive"}};
const edge=n=>({event_id:uuid(n),source_event_id:sourceId,technique:"section-background",
 created_at:new Date(Date.UTC(2026,10,17,10,n,10)).toISOString()});
const target=(n,niche="Oficinas mecânicas",review_status="approved")=>({
 id:uuid(n),niche,model:"02",section_key:"services",
 request_id:uuid(n),operation_index:1,
 submitted_at:new Date(Date.UTC(2026,10,17,10,n,0)).toISOString(),
 created_at:new Date(Date.UTC(2026,10,17,10,n,2)).toISOString(),
 reviewed_at:new Date(Date.UTC(2026,10,17,10,n,30)).toISOString(),
 review_status,execution_status:"applied"
});
const audit=(names,reviews)=>auditFamilyTransfers(names.map((_,i)=>edge(i+1)),[source],[memory],
 names.map((niche,i)=>target(i+1,niche,reviews[i])));
const caseData={event_id:sourceId,intent:"style",target:"services",section_key:"services",
 strategy:"universal-visual-verified",review_status:"approved",execution_status:"applied",
 verification:"visual",context:memory.context,
 deltas:[{kind:"section-style",section:"services",field:"backgroundColor",before:"#ffffff",after:"#123456"}]};
const context={intent:"style",target:"services",sectionKey:"services",niche:"Oficinas mecânicas",
 model:"02",family:"9",template:"prompt-adaptive",instruction:"Pinte o fundo da seção Serviços de laranja"};

test("Delivery 12: same-niche reuse is never counted as family transfer",()=>{
 const stats=audit(["Auto centers","Auto centers"],["approved","approved"]);
 assert.equal(stats.recordedSameNiche,2);
 assert.equal(stats.recordedCrossNiche,0);
 assert.equal(stats.verifiedSameNicheApproved,2);
 assert.equal(stats.verifiedCrossNicheApproved,0);
});
test("Delivery 12: reviewed TP9 to TP9 transfer has source approval before submission",()=>{
 const stats=audit(["Oficinas mecânicas"],["approved"]);
 assert.equal(stats.verifiedCrossNicheApproved,1);
 assert.equal(stats.unverifiable,0);
});
test("Delivery 12: two same-destination rejections block just that destination",()=>{
 const stats=audit(["Oficinas mecânicas","Oficinas mecânicas","Autoelétricas"],
  ["rejected","rejected","approved"]);
 const block=destinationFamilyTransferKey(sourceId,"section-background","Oficinas mecânicas","02","services");
 assert.equal(stats.verifiedCrossNicheRejected,2);
 assert.equal(stats.blockedDestinations.has(block),true);
 assert.equal(selectApprovedExecutionTechnique([{...caseData,blockedTransferDestinations:[block]}],context),null);
 assert.equal(selectApprovedExecutionTechnique([{...caseData,blockedTransferDestinations:[block]},
 ],{...context,niche:"Autoelétricas"})?.scope,"family");
 assert.equal(selectApprovedExecutionTechnique([{...caseData,blockedTransferDestinations:[block]},
 ],{...context,niche:"Auto centers"})?.scope,"niche");
});
test("Delivery 12: no cross-family transfer can count as verified",()=>{
 const stats=audit(["Pizzaria","Clínica veterinária"],["approved","rejected"]);
 assert.equal(stats.verifiedCrossNicheApproved,0);
 assert.equal(stats.verifiedCrossNicheRejected,0);
 assert.equal(stats.unverifiable,2);
});
test("Delivery 12: unconfirmed older submissions and pending reviews do not masquerade as wins",()=>{
 const stats=auditFamilyTransfers([edge(1),edge(2),edge(3)],[source],[memory],[
  {...target(1),submitted_at:null},
  {...target(2),review_status:"pending",reviewed_at:null},
  {...target(3),submitted_at:"2026-11-17T08:59:00Z"}
 ]);
 assert.equal(stats.verifiedCrossNicheApproved,0);
 assert.equal(stats.pending,1);
 assert.equal(stats.unverifiable,2);
});
test("Delivery 12: forged memory metadata, unverified source and model mismatch are excluded",()=>{
 const edges=[edge(1)],targets=[target(1)];
 const check=(src,mem,tar)=>auditFamilyTransfers(edges,[src],[mem],[tar]).verifiedCrossNicheApproved;
 assert.equal(check({...source,review_status:"rejected"},memory,targets[0]),0);
 assert.equal(check(source,{...memory,verification:"model"},targets[0]),0);
 assert.equal(check(source,{...memory,context:{...memory.context,family:"3"}},targets[0]),0);
 assert.equal(check(source,memory,{...targets[0],model:"03"}),0);
});
test("Delivery 12: incomplete reads fail closed",()=>{
 const stats=auditFamilyTransfers([edge(1)],[source],[memory],[target(1)],false);
 assert.equal(stats.usable,false);
 assert.equal(stats.blockedDestinations.size,0);
 assert.equal(stats.verifiedCrossNicheApproved,0);
});
test("Delivery 12: family guard and private metrics are wired through owner-scoped queries",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/components/builder-v2-learning-metrics.tsx",import.meta.url),"utf8");
 assert.match(page,/auditFamilyTransfers\(edges,reviews as FamilySourceReview\[\],/);
 assert.match(page,/\.eq\("user_id",user\.id\)/);
 assert.match(page,/blockedTransferDestinations:/);
 assert.match(ui,/Transferência entre nichos · Entrega 12/);
 assert.match(ui,/if\(!enabled\)return null/);
 assert.match(ui,/auditFamilyTransfers\(reuseEdges as/);
});
