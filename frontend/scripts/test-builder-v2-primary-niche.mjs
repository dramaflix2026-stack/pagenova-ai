import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {BRIEFING_TEMPLATE_FAMILIES,resolvePrimaryBriefingNiche,positiveBusinessBrief,resolveBriefingFamily,isDentalNicheIdentity,APPROVED_DENTAL_NICHE,isPhysioNicheIdentity,APPROVED_PHYSIO_NICHE} from "../src/lib/briefing-template-families.ts";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));

test("same florist brief must remain floricultura despite excluded makeup references",()=>{
 const brief=[
  "Crie um site completo para Jardim de Amélia, uma floricultura boutique especializada em buquês personalizados, arranjos florais e decoração de eventos.",
  "Identidade visual: verde oliva, creme e rosa antigo.",
  "Não utilizar imagens de maquiagem, roupas ou barbearia.",
  "As fotografias devem representar exclusivamente flores e buquês.",
 ].join("\n");
 assert.equal(resolvePrimaryBriefingNiche(brief),"Floricultura");
 assert.equal(resolveBriefingFamily(resolvePrimaryBriefingNiche(brief)),6);
 assert.doesNotMatch(positiveBusinessBrief(brief),/maquiagem|roupas|barbearia/);
});

test("explicit niche wins over forbidden unrelated industries",()=>{
 const brief="**Nicho:** Floricultura\nNão usar imagens de maquiagem.\nEvite fotos de lojas de roupas.";
 assert.equal(resolvePrimaryBriefingNiche(brief),"Floricultura");
});

test("short Fluency Hub briefing selects the TP10 Schools of Languages template",()=>{
 const brief="Crie um site premium para uma escola de inglês chamada Fluency Hub. Utilize azul-marinho e branco, com design moderno, imagens reais, serviços, diferenciais, depoimentos e contato pelo WhatsApp.";
 const niche=resolvePrimaryBriefingNiche(brief);
 assert.equal(niche,"Escolas de idiomas");
 assert.equal(resolveBriefingFamily(niche),10);
 for(const phrase of ["Escola de inglês","Escolas de inglês","Instituto de idiomas","Centro de idiomas","Escola de línguas","Curso de inglês"]){
  assert.equal(resolveBriefingFamily(phrase),10,phrase);
  assert.equal(resolvePrimaryBriefingNiche("Crie um site para "+phrase+"."),"Escolas de idiomas",phrase);
 }
});

test("language-school exclusions must not overwrite another positive niche",()=>{
 const brief="Crie um site para uma floricultura boutique.\nNão usar fotografias de escolas de inglês ou cursos de idiomas.";
 assert.equal(resolvePrimaryBriefingNiche(brief),"Floricultura");
 assert.equal(resolveBriefingFamily(resolvePrimaryBriefingNiche(brief)),6);
});

test("fresh generation preserves both recognized niche and selected visual model",()=>{
 const page=readFileSync(resolve(root,"src/app/app/builder-v2/page.tsx"),"utf8");
 const api=readFileSync(resolve(root,"src/app/api/builder-v2/chat/route.ts"),"utf8");
 assert.match(page,/if\(shouldCreateProject\)\{\s*incoming\.id=requestSite\.id;\s*incoming\.niche=effectiveBriefNiche/);
 assert.match(page,/incoming\.briefingLayoutVariant=requestSite\.briefingLayoutVariant\|\|"01"/);
 assert.match(api,/const generationVariant=requestedVariant==="02"\|\|requestedVariant==="03"/);
 assert.match(api,/briefingLayoutVariant:generationVariant/);
});

test("actual makeup and barbershop remain independently recognizable",()=>{
 assert.equal(resolvePrimaryBriefingNiche("Crie um site para estúdio de maquiagem. Não use imagens de flores."),"Estúdio de maquiagem");
 assert.equal(resolvePrimaryBriefingNiche("Crie um site de barbearia premium. Não usar fotos de maquiadora."),"Barbearia");
 assert.equal(resolvePrimaryBriefingNiche("Crie um site para pizzaria. Não mostrar fotos de padaria."),"Pizzaria");
 assert.equal(resolvePrimaryBriefingNiche("Crie um site para joalheria e semijoias. Não usar fotos de roupas."),"Joalheria e semijoias");
});

test("all 133+ registered niches remain stable against negative image references",()=>{
 const entries=BRIEFING_TEMPLATE_FAMILIES.flatMap(f=>f.niches.map(niche=>({niche,family:f.id})));
 assert.ok(entries.length>=133);
 for(const {niche,family} of entries){
  const brief="Crie um site profissional para "+niche+".\nNão utilizar imagens de maquiagem, floricultura ou roupas de outros segmentos.";
  const recognized=resolvePrimaryBriefingNiche(brief);
  const expectedNiche=isDentalNicheIdentity(niche)?APPROVED_DENTAL_NICHE:isPhysioNicheIdentity(niche)?APPROVED_PHYSIO_NICHE:niche;
  const expectedFamily=isDentalNicheIdentity(niche)||isPhysioNicheIdentity(niche)?4:family;
  assert.equal(recognized,expectedNiche,"Primary industry drifted for "+niche);
  assert.equal(resolveBriefingFamily(recognized),expectedFamily,"Incorrect family for "+niche);
 }
});

test("Studio and API use the same isolated fresh-site niche; images cannot use stale selected category",()=>{
 const page=readFileSync(resolve(root,"src/app/app/builder-v2/page.tsx"),"utf8");
 const api=readFileSync(resolve(root,"src/app/api/builder-v2/chat/route.ts"),"utf8");
 assert.match(page,/const recognizedNiche=resolvePrimaryBriefingNiche\(prompt\)/);
 assert.match(page,/const creatingMakeupSite=shouldCreateProject&&recognizedNiche==="Estúdio de maquiagem"/);
 assert.match(page,/const photoNiche=current\.niche\|\|selectedNiche/);
 assert.match(page,/prepareTP1MakeupSite\(incoming,shouldCreateProject\?incoming\.niche:selectedNiche\)/);
 assert.match(api,/const primaryNiche=resolvePrimaryBriefingNiche\(instruction\)/);
 assert.match(api,/content:system\+nicheGuard/);
});


test("odontologia freeze: all positive dental briefing aliases resolve to the SAME canonical TP4 templates",()=>{
 const positive=[
  "Crie um site para clínica odontológica, com atendimento humanizado.",
  "Faça um site para Odonto Essenza com serviços de prevenção.",
  "Desenvolva um site para dentista e consultório particular.",
  "Preciso de um site para consultório dentário de alto padrão.",
  "Crie uma landing page para Clínica Dental Prime.",
  "Monte um site de odontologia estética e clareamento.",
  "Gere um site para clínica de ortodontia e aparelhos.",
  "Crie uma página para implantodontia premium.",
  "Site profissional de endodontia.",
  "Site institucional para periodontia.",
  "Crie um site para odontopediatria.",
  "Nicho: saúde bucal\nServiços de odontologia preventiva.",
  "Segmento: Harmonização orofacial\nSite de clínica especializada.",
  "**Nicho:** Odontologia estética\nQuero três modelos.",
  "Nicho: Clínica odontológica\nSem fotografias inadequadas.",
 ];
 for(const brief of positive){
  assert.equal(resolvePrimaryBriefingNiche(brief),APPROVED_DENTAL_NICHE,brief);
  assert.equal(resolveBriefingFamily(resolvePrimaryBriefingNiche(brief)),4,brief);
 }
 assert.equal(resolveBriefingFamily("Odontologia estética"),4);
 assert.equal(resolveBriefingFamily("Clínica odontológica"),4);
 assert.equal(resolveBriefingFamily("Clínica de estética"),1);
});
test("dental exclusions never change floriculture, cosmetics, barbershop, SaaS or other chosen niches",()=>{
 const negatives=[
  ["Crie um site para floricultura.\nNão usar fotos de dentistas ou odontologia.","Floricultura"],
  ["Site para estúdio de maquiagem; sem imagens de consultório odontológico.","Estúdio de maquiagem"],
  ["Crie um site para barbearia. Não utilize fotos de clínica dentária.","Barbearia"],
  ["Nicho: Clínica de estética\nNão usar fotos odontológicas.","Clínica de estética"],
  ["Crie site para SaaS de gestão de consultórios odontológicos.","SaaS"],
  ["**Nicho:** Loja de roupas\nNão quero imagens de dentista.","Loja de roupas"],
 ];
 for(const [brief,expected] of negatives)assert.equal(resolvePrimaryBriefingNiche(brief),expected,brief);
});
test("Studio/API and preview always honor approved dental niche, frozen visual variants and pre-existing static choices",()=>{
 const page=readFileSync(resolve(root,"src/app/app/builder-v2/page.tsx"),"utf8");
 const api=readFileSync(resolve(root,"src/app/api/builder-v2/chat/route.ts"),"utf8");
 const renderer=readFileSync(resolve(root,"src/components/builder-v2-site.tsx"),"utf8");
 assert.match(page,/recognizedNiche==="Clínica odontológica"\?"Clínica odontológica"/);
 assert.match(page,/incoming\.niche=effectiveBriefNiche\|\|explicitNiche/);
 assert.match(api,/const primaryNiche=resolvePrimaryBriefingNiche\(instruction\)/);
 assert.match(renderer,/const approvedDentalSite=isDentalNicheIdentity/);
 assert.match(renderer,/if\(activeStaticTemplate==="prompt-adaptive"&&approvedDentalSite\)/);
 assert.match(renderer,/const dentalSite=props\.site\.niche===APPROVED_DENTAL_NICHE/);
 for(const id of ["01","02","03"])assert.ok(renderer.includes('briefingLayoutVariant==="'+id+'"')||id==="01");
 assert.match(renderer,/BuilderV2TP4Model3 site=\{site\}/);
 assert.match(renderer,/BuilderV2TP4Model2 site=\{site\}/);
 assert.match(renderer,/BuilderV2TP4Model1 site=\{site\}/);
});
