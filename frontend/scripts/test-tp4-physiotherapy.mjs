import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import ts from "typescript";
import {APPROVED_DENTAL_NICHE,APPROVED_PHYSIO_NICHE,resolvePrimaryBriefingNiche,resolveBriefingFamily,isPhysioNicheIdentity} from "../src/lib/briefing-template-families.ts";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const read=p=>readFileSync(resolve(root,p),"utf8");

test("all natural fisioterapia briefings share canonical TP4 health identity",()=>{
 const examples=[
  "Crie um site profissional para clínica de fisioterapia.",
  "Monte um site para fisioterapeuta com atendimento individual.",
  "Faça uma landing page para Fisio Movimento.",
  "Quero um site de fisioterapia esportiva e reabilitação.",
  "Gere um site para clínica de reabilitação física.",
  "Site para reabilitação motora e movimento.",
  "Desenvolva um site para centro de fisioterapia.",
  "Nicho: Fisioterapia\nIdentidade verde e branco.",
  "**Nicho:** Clínica de fisioterapia\nNão usar fotos odontológicas.",
  "Segmento: Pilates clínico\nServiços de avaliação fisioterapêutica."
 ];
 for(const instruction of examples){
  assert.equal(resolvePrimaryBriefingNiche(instruction),APPROVED_PHYSIO_NICHE,instruction);
  assert.equal(resolveBriefingFamily(resolvePrimaryBriefingNiche(instruction)),4,instruction);
 }
 assert.equal(resolveBriefingFamily("Fisioterapia"),4);
 assert.equal(resolveBriefingFamily("Clínica de fisioterapia"),4);
});
test("physiotherapy cannot hijack dentistry, unrelated clinics, fitness shops or negative examples",()=>{
 const control=[
  ["Crie site para clínica odontológica. Não usar imagens de fisioterapia.",APPROVED_DENTAL_NICHE],
  ["Nicho: Odontologia estética\nEvite fotos de fisioterapeuta.",APPROVED_DENTAL_NICHE],
  ["Crie site de academia. Não quero fotos de fisioterapia.",undefined],
  ["Crie site para clínica de psicologia. Não usar imagens de fisioterapia.","Clínica de psicologia"],
  ["Crie site para clínica de nutrição sem imagens de fisioterapia.","Clínica de nutrição"],
  ["Crie site SaaS para clínicas de fisioterapia.","SaaS"],
  ["Crie site para terapia ocupacional.","Terapia ocupacional"],
  ["Nicho: Ortopedia\nNão incluir fotos de fisioterapeutas.","Ortopedia"],
 ];
 for(const [instruction,niche] of control)assert.equal(resolvePrimaryBriefingNiche(instruction),niche,instruction);
 assert.equal(isPhysioNicheIdentity("Ortopedia"),false);
 assert.equal(isPhysioNicheIdentity("Terapia ocupacional"),false);
});
test("three physiotherapy variants are distinct isolated TSX layouts and their media are real, unique and relevant",()=>{
 const source=read("src/components/builder-v2-tp4-physiotherapy.tsx");
 const parsed=ts.createSourceFile("physio.tsx",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.deepEqual(parsed.parseDiagnostics.map(e=>ts.flattenDiagnosticMessageText(e.messageText," ")),[]);
 const photos=[...source.matchAll(/"(?:\d{7,8})"/g)].map(v=>v[0].slice(1,-1));
 assert.ok(photos.length>=15);
 assert.equal(new Set(photos).size,photos.length);
 assert.match(source,/images\.pexels\.com\/photos\//);
 assert.match(source,/pn-physio-hero-editorial/);
 assert.match(source,/pn-physio-hero-digital/);
 assert.match(source,/pn-physio-hero-art/);
 assert.match(source,/variant==="01"\?\[3,4,6,7,8,10\]/);
 assert.match(source,/variant==="02"\?\[9,5,11,12,13,14\]/);
 assert.match(source,/:\[0,4,6,8,9,10\]/);
 for(const section of ["inicio","sobre","servicos","diferenciais","processo","galeria","equipe","numeros","depoimentos","faq","contato"])assert.ok(source.includes('data-universal-section="'+section+'"'),section);
 assert.doesNotMatch(source,/odontol[oó]g|tratamento dental|clareamento dental|barbearia|maquiagem/i);
});
test("all three physio layouts have contact, FAQ, responsive images and no published fake reviews or statistics",()=>{
 const src=read("src/components/builder-v2-tp4-physiotherapy.tsx");
 const css=read("src/components/builder-v2-tp4-physiotherapy.css");
 assert.match(src,/examples=!publishedMode&&!verified\.length/);
 assert.match(src,/const reviews=examples\?demoReviews/);
 assert.match(src,/reviews\.slice\(0,5\)/);
 assert.match(src,/EXEMPLOS FICTÍCIOS PARA EDIÇÃO/);
 assert.match(src,/ENDEREÇO FICTÍCIO \/ EDITÁVEL/);
 assert.match(src,/site\.footer\?\.whatsapp/);
 assert.match(src,/realAddress\|\|\(!publishedMode\?demoAddress:""\)/);
 assert.match(src,/https:\/\/www\.google\.com\/maps\?q=/);
 assert.match(src,/resultados só devem ser publicados quando forem reais e verificáveis/);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css, /pnPhysioFloat/);
});
test("Studio routes physiotherapy to dedicated TP4 before generic models, with dental sources unchanged",()=>{
 const renderer=read("src/components/builder-v2-site.tsx");
 const studio=read("src/app/app/builder-v2/page.tsx");
 assert.match(renderer,/const isPhysioProject=physiotherapyNiche/);
 assert.match(renderer,/if\(activeStaticTemplate==="prompt-adaptive"&&isPhysioProject\)/);
 assert.match(renderer,/BuilderV2TP4Physiotherapy site=\{physioSite\} variant=\{v\}/);
 assert.ok(renderer.indexOf("if(activeStaticTemplate===\"prompt-adaptive\"&&isPhysioProject)")<renderer.indexOf("const approvedDentalSite="));
 assert.match(studio,/recognizedNiche==="Clínica de fisioterapia"\?"Clínica de fisioterapia"/);
 const lock=JSON.parse(read("config/tp4-odontologia-approved-lock.json"));
 assert.equal(Object.keys(lock.files).length,6);
 assert.equal(lock.status,"frozen");
});
