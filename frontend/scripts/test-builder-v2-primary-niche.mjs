import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
import {BRIEFING_TEMPLATE_FAMILIES,resolvePrimaryBriefingNiche,positiveBusinessBrief,resolveBriefingFamily} from "../src/lib/briefing-template-families.ts";

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
  assert.equal(recognized,niche,"Primary industry drifted for "+niche);
  assert.equal(resolveBriefingFamily(recognized),family,"Incorrect family for "+niche);
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
