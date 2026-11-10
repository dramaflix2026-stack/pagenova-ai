import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import ts from "typescript";
import {resolveBriefingFamily,resolvePrimaryBriefingNiche,isVeterinaryNicheIdentity,CANONICAL_VETERINARY_NICHE,APPROVED_DENTAL_NICHE,APPROVED_PHYSIO_NICHE} from "../src/lib/briefing-template-families.ts";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const read=path=>readFileSync(resolve(root,path),"utf8");

test("natural veterinary clinics and hospitals route to TP4 with canonical identity",()=>{
 for(const brief of [
  "Crie um site para uma clínica veterinária chamada Vet Aurora.",
  "Monte um site para hospital veterinário.",
  "Gere site para consultório veterinário focado em cães e gatos.",
  "Crie uma landing page para veterinária com vacinação e exames.",
  "Nicho: Veterinária\nCores azul-petróleo e verde-sálvia.",
  "**Nicho:** Medicina veterinária\nAtendimento a cães e gatos.",
  "# Vet Aurora — Clínica Veterinária\nAtendimento humanizado a pets.",
 ]){
  assert.equal(resolvePrimaryBriefingNiche(brief),CANONICAL_VETERINARY_NICHE,brief);
  assert.equal(resolveBriefingFamily(resolvePrimaryBriefingNiche(brief)),4,brief);
 }
 for(const n of ["Clínica veterinária","Veterinária","Hospital veterinário","Consultório veterinário","Medicina veterinária"])assert.equal(resolveBriefingFamily(n),4,n);
 assert.ok(isVeterinaryNicheIdentity("Clínica veterinária"));
});

test("retail pet shops and approved human health clinics are never hijacked",()=>{
 for(const n of ["Pet shop","petshop"])assert.equal(resolveBriefingFamily(n),6,n);
 const control=[
  ["Crie um site para Pet Shop. Não usar fotos de veterinários.","Pet shop"],
  ["Nicho: Pet shop\nProdutos para cães e gatos.","Pet shop"],
  ["Crie um site para clínica odontológica. Não usar imagens veterinárias.",APPROVED_DENTAL_NICHE],
  ["Crie um site para clínica de fisioterapia. Sem fotos de veterinários.",APPROVED_PHYSIO_NICHE],
  ["Nicho: Clínica de psicologia\nNão usar fotos veterinárias.","Clínica de psicologia"],
  ["Crie um site SaaS de gestão veterinária.","SaaS"],
 ];
 for(const [brief,niche] of control)assert.equal(resolvePrimaryBriefingNiche(brief),niche,brief);
});

test("three veterinary visual models have safe JSX, unique curated photos and premium sections",()=>{
 const src=read("src/components/builder-v2-tp4-veterinary.tsx");
 const css=read("src/components/builder-v2-tp4-veterinary.css");
 const parsed=ts.createSourceFile("veterinary.tsx",src,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.deepEqual(parsed.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[]);
 const ids=[...src.matchAll(/"(?:\d{7,8})"/g)].map(m=>m[0].slice(1,-1));
 // Photo IDs in the curated pool exclude demo portrait thumbnails.
 const pool=src.match(/TP4_VETERINARY_IMAGE_IDS=\[([\s\S]*?)\] as const;/)?.[1]||"";
 const photoIds=[...pool.matchAll(/"\d+"/g)].map(m=>m[0].slice(1,-1));
 assert.equal(photoIds.length,15);
 assert.equal(new Set(photoIds).size,15);
 assert.match(src,/images\.pexels\.com\/photos\//);
 assert.match(src,/pn-vet-hero-editorial/);
 assert.match(src,/pn-vet-hero-digital/);
 assert.match(src,/pn-vet-hero-art/);
 for(const section of ["inicio","sobre","servicos","diferenciais","processo","galeria","equipe","numeros","depoimentos","faq","contato"])
  assert.ok(src.includes('data-universal-section="'+section+'"'),section);
 assert.doesNotMatch(src,/fisioterap|reabilita[cç][aã]o|tratamento dental|barbearia|maquiagem/i);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test("no invented published patient reviews or business numbers; all three variants select correctly",()=>{
 const src=read("src/components/builder-v2-tp4-veterinary.tsx");
 const renderer=read("src/components/builder-v2-site.tsx");
 assert.match(src,/examples=!publishedMode&&!verified\.length/);
 assert.match(src,/EXEMPLOS FICTÍCIOS PARA EDIÇÃO/);
 assert.match(src,/reviews\.slice\(0,6\)/);
 assert.match(src,/Números de animais atendidos.*reais e verificáveis/);
 assert.match(renderer,/if\(activeStaticTemplate==="prompt-adaptive"&&isVeterinaryProject\)/);
 assert.match(renderer,/BuilderV2TP4Veterinary site=\{veterinarySite\} variant=\{v\}/);
 assert.ok(renderer.indexOf('if(activeStaticTemplate==="prompt-adaptive"&&isVeterinaryProject)')<renderer.indexOf("const isPhysioProject="));
 assert.match(renderer,/veterinarySavedFamily===undefined/);
 assert.match(renderer,/veterinarySavedFamily===4/);
 const approvedLock=JSON.parse(read("config/tp4-odontologia-approved-lock.json"));
 assert.equal(approvedLock.status,"frozen");
});

test("all three veterinarian footers stay full width without vertical letter wrapping",()=>{
 const src=read("src/components/builder-v2-tp4-veterinary.tsx");
 const css=read("src/components/builder-v2-tp4-veterinary.css");
 assert.match(css,/\.pn-vet-footer\{display:block;width:100%;max-width:none/);
 assert.match(css,/\.pn-vet-footer-title\{[^}]*overflow-wrap:normal!important;word-break:normal!important/);
 assert.doesNotMatch(src,/pn-vet-footer-inner|pn-vet-footer-hero/);
 assert.match(src,/<footer className="pn-vet-footer">/);
 assert.match(src,/pn-vet-footer-title/);
 assert.match(src,/href="#pn-vet-services"/);
 assert.match(src,/href="#pn-vet-process"/);
 assert.match(src,/href="#pn-vet-contact"/);
 assert.match(css,/\.pn-vet--02 \.pn-vet-footer\{background:#061522\}/);
 assert.match(css,/\.pn-vet--03 \.pn-vet-footer\{background:#302b29\}/);
});

test("proof cards have no bright full-width ribbon and M1 hero callout cannot start outside image",()=>{
 const src=read("src/components/builder-v2-tp4-veterinary.tsx");
 const css=read("src/components/builder-v2-tp4-veterinary.css");
 assert.doesNotMatch(src,/pn-vet-proof-card-top/);
 assert.match(css,/\.pn-vet-proof article \.pn-vet-proof-index\{[^}]*background:transparent!important/);
 assert.match(css,/\.pn-vet-proof article::before\{[^}]*width:3px;height:56px/);
 assert.doesNotMatch(css,/left:-35px/);
 assert.match(css,/\.pn-vet-hero-float\{[^}]*left:clamp\(16px/);
 assert.match(src,/\[1,2,5,9,11,12\]\[i\]/);
 assert.match(css,/\.pn-vet--01 \.pn-vet-service-photo img/);
 assert.match(css,/\.pn-vet-service-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(src,/reviews\.slice\(0,6\)/);
});
