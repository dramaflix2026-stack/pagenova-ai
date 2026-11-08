import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseUniversalCopyEdit,applyUniversalCopyEdit,universalEditedTextSlot,isIsolatedUniversalCopyResult} from "../src/lib/builder-v2-universal-copy-edits.ts";
import {applyUniversalNaturalLanguage} from "../src/lib/builder-v2-universal-language.ts";
import {institutionalImageIntent} from "../src/lib/builder-v2-institutional-images.ts";
import {isScopedBannerCopyRequest} from "../src/lib/builder-v2-hero-banner-edits.ts";

const requests={
 hero:"Altere somente o subtítulo da primeira seção para 'Tecnologia, sofisticação e cuidado em cada detalhe'. Não modifique o título principal, a imagem ou os botões.",
 button:"Troque o texto do botão principal da capa para 'Quero agendar minha avaliação'. Preserve o link e a aparência original do botão.",
 about:"Na seção Sobre a clínica, reescreva o segundo parágrafo com um tom mais sofisticado e acolhedor. Preserve o título, o primeiro parágrafo e a fotografia."
};
const site=(niche="Clínica de estética",variant="03")=>({
 id:"project-1",title:"Maison Lumière",niche,templateId:"prompt-adaptive",briefingLayoutVariant:variant,background:"#101010",
 header:{brand:"Maison Lumière",ctaLabel:"Agendar",ctaHref:"#contato"},
 blocks:[
  {id:"hero-title",type:"heading",section:"inicio",text:"Sua beleza merece um cuidado extraordinário.",align:"left",color:"#fff"},
  {id:"hero-desc",type:"paragraph",section:"inicio",text:"Cuidado e sofisticação.",align:"left"},
  {id:"hero-cta",type:"button",section:"inicio",text:"Agendar avaliação",href:"#contato",align:"left",color:"#C9A77B"},
  {id:"hero-image",type:"image",section:"inicio",src:"https://example.com/hero.jpg"},
  {id:"about-heading",type:"heading",section:"sobre",text:"Sobre a clínica"},
  {id:"about-first",type:"paragraph",section:"sobre",text:"Acolhemos cada pessoa com atenção."},
  {id:"about-second",type:"paragraph",section:"sobre",text:"Criamos experiências especiais."},
  {id:"about-image",type:"image",section:"sobre",src:"https://example.com/about.jpg"},
  {id:"footer-title",type:"heading",section:"rodape",text:"Contato"}
 ]
});
const copy=v=>structuredClone(v);
const excerpt=(path)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");

test("first screenshot: subtitle is a scoped text edit, not an image request",()=>{
 const original=site(),before=copy(original);
 const parsed=parseUniversalCopyEdit(original,requests.hero);
 assert.ok(parsed&&"intent" in parsed);
 assert.equal(parsed.intent.targetId,"hero-desc");
 assert.equal(parsed.intent.newText,"Tecnologia, sofisticação e cuidado em cada detalhe");
 assert.equal(institutionalImageIntent(requests.hero),false);
 assert.equal(isScopedBannerCopyRequest(requests.hero),false);
 const result=applyUniversalNaturalLanguage(original,requests.hero);
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.deepEqual(result.changedIds,["hero-desc"]);
 assert.equal(result.site.blocks.find(b=>b.id==="hero-desc")?.text,parsed.intent.newText);
 assert.equal(universalEditedTextSlot(result.site,"capa","paragraph"),parsed.intent.newText);
 assert.equal(isIsolatedUniversalCopyResult(original,result.site,parsed.intent),true);
 assert.equal(result.site.blocks.find(b=>b.id==="hero-image")?.src,before.blocks[3].src);
 assert.deepEqual(original,before);
});
test("second screenshot: button label changes without demanding or mutating its URL",()=>{
 const original=site(),before=copy(original);
 const parsed=parseUniversalCopyEdit(original,requests.button);
 assert.ok(parsed&&"intent" in parsed);
 assert.equal(parsed.intent.targetId,"hero-cta");
 const result=applyUniversalNaturalLanguage(original,requests.button);
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.deepEqual(result.changedIds,["hero-cta"]);
 assert.equal(result.site.blocks.find(b=>b.id==="hero-cta")?.text,"Quero agendar minha avaliação");
 assert.equal(result.site.blocks.find(b=>b.id==="hero-cta")?.href,"#contato");
 assert.deepEqual(result.site.header,before.header);
 assert.equal(universalEditedTextSlot(result.site,"capa","button"),"Quero agendar minha avaliação");
 assert.equal(isIsolatedUniversalCopyResult(original,result.site,parsed.intent),true);
 assert.deepEqual(original,before);
});
test("third screenshot: rewrite the second About paragraph, never a second banner",()=>{
 const original=site(),before=copy(original);
 const parsed=parseUniversalCopyEdit(original,requests.about);
 assert.ok(parsed&&"intent" in parsed);
 assert.equal(parsed.intent.targetId,"about-second");
 assert.equal(parsed.intent.ordinal,1);
 assert.equal(parsed.intent.generateText,true);
 assert.equal(applyUniversalNaturalLanguage(original,requests.about),null);
 assert.equal(isScopedBannerCopyRequest(requests.about),false);
 assert.equal(institutionalImageIntent(requests.about),false);
 const fresh="Cada atendimento é uma experiência acolhedora, cuidadosa e personalizada.";
 const result=applyUniversalCopyEdit(original,parsed.intent,fresh);
 assert.equal(result.ok,true);
 if(!result.ok)return;
 assert.deepEqual(result.changedIds,["about-second"]);
 assert.equal(universalEditedTextSlot(result.site,"sobre","paragraph",1),fresh);
 assert.equal(result.site.blocks.find(b=>b.id==="about-first")?.text,before.blocks[5].text);
 assert.equal(isIsolatedUniversalCopyResult(original,result.site,parsed.intent),true);
 assert.deepEqual(original,before);
});
test("universal text intent applies independently of niche and model number",()=>{
 for(const niche of ["Estética","Barbearia","Dermatologia","Cafeteria","Engenharia","Imobiliária","Loja de perfumes","Hotel","Escola","Oficina"]){
  for(const variant of ["01","02","03"]){
   const original=site(niche,variant);
   const result=applyUniversalNaturalLanguage(original,requests.hero);
   assert.equal(result?.ok,true,niche+" "+variant);
   if(result?.ok)assert.equal(result.site.blocks.find(b=>b.id==="hero-desc")?.text,"Tecnologia, sofisticação e cuidado em cada detalhe");
   assert.ok(parseUniversalCopyEdit(original,requests.about),niche);
  }
 }
});
test("visible second paragraph without a legacy block uses a declared universal visual slot",()=>{
 const original=site();
 original.blocks=original.blocks.filter(b=>b.id!=="about-second");
 const before=copy(original);
 const result=parseUniversalCopyEdit(original,requests.about);
 assert.ok(result&&"intent" in result);
 assert.equal(result.intent.virtualSlotKey,"sobre:paragraph:1");
 const applied=applyUniversalCopyEdit(original,result.intent,"Um cuidado sofisticado e acolhedor.");
 assert.equal(applied.ok,true);
 if(applied.ok){
  assert.deepEqual(applied.site.blocks,before.blocks);
  assert.equal(applied.site.universalCopyOverrides["sobre:paragraph:1"],"Um cuidado sofisticado e acolhedor.");
  assert.equal(universalEditedTextSlot(applied.site,"sobre","paragraph",1),"Um cuidado sofisticado e acolhedor.");
  assert.equal(isIsolatedUniversalCopyResult(original,applied.site,result.intent),true);
 }
 assert.deepEqual(original,before);
 const unsupported=site("Clínica de estética","02");
 unsupported.blocks=unsupported.blocks.filter(b=>b.id!=="about-second");
 const refused=parseUniversalCopyEdit(unsupported,requests.about);
 assert.ok(refused&&"error" in refused,"undeclared slots must never claim success");
});
test("rewrite requires real generated copy; never accepts a partial title or empty AI text",()=>{
 const original=site(),parsed=parseUniversalCopyEdit(original,requests.about);
 assert.ok(parsed&&"intent" in parsed);
 assert.equal(applyUniversalCopyEdit(original,parsed.intent).ok,false);
 assert.equal(applyUniversalCopyEdit(original,parsed.intent,"").ok,false);
});
test("server-side isolation guard rejects unrelated cards, changed URLs and metadata",()=>{
 const original=site(),parsed=parseUniversalCopyEdit(original,requests.about);
 assert.ok(parsed&&"intent" in parsed);
 const result=applyUniversalCopyEdit(original,parsed.intent,"Novo parágrafo");
 assert.equal(result.ok,true);
 if(!result.ok)return;
 const corrupted=copy(result.site);corrupted.blocks[3].src="https://example.com/other.jpg";
 assert.equal(isIsolatedUniversalCopyResult(original,corrupted,parsed.intent),false);
 const withHeader=copy(result.site);withHeader.header.brand="Outra";
 assert.equal(isIsolatedUniversalCopyResult(original,withHeader,parsed.intent),false);
});
test("renderer and route use the same universal display and editing helpers",()=>{
 const hero=excerpt("components/builder-v2-tp1-model3.tsx");
 const sections=excerpt("components/builder-v2-tp1-model3-sections.tsx");
 const page=excerpt("app/app/builder-v2/page.tsx");
 const route=excerpt("app/api/builder-v2/chat/route.ts");
 assert.ok(hero.includes('universalEditedTextSlot(site,"capa","paragraph",0)'));
 assert.ok(hero.includes('universalEditedTextSlot(site,"capa","button",0)'));
 assert.ok(sections.includes('universalEditedTextSlot(site,"sobre","paragraph",1)'));
 assert.ok(page.includes("isIsolatedUniversalCopyResult(site,data.site as Site,scopedCopy.intent)"));
 assert.ok(route.includes("parseUniversalCopyEdit(snapshot,instructionText)"));
 assert.ok(route.includes("applyUniversalCopyEdit(snapshot,intent,text)"));
});

test("header-only primary CTA is updated without inventing a button or changing destination",()=>{
 const original=site();
 original.blocks=original.blocks.filter(b=>b.id!=="hero-cta");
 const before=copy(original);
 const parsed=parseUniversalCopyEdit(original,requests.button);
 assert.ok(parsed&&"intent" in parsed);
 assert.equal(parsed.intent.headerTarget,true);
 const result=applyUniversalNaturalLanguage(original,requests.button);
 assert.equal(result?.ok,true);
 if(!result?.ok)return;
 assert.equal(result.site.header.ctaLabel,"Quero agendar minha avaliação");
 assert.equal(result.site.header.ctaHref,before.header.ctaHref);
 assert.deepEqual(result.site.blocks,before.blocks);
 assert.equal(isIsolatedUniversalCopyResult(original,result.site,parsed.intent),true);
});

test("explicit copy and renderer-slot overrides survive JSON save/reload",()=>{
 const base=site();
 const subtitle=parseUniversalCopyEdit(base,requests.hero);
 assert.ok(subtitle&&"intent" in subtitle);
 const first=applyUniversalCopyEdit(base,subtitle.intent);
 assert.equal(first.ok,true);
 if(!first.ok)return;
 const missing=copy(first.site);
 missing.blocks=missing.blocks.filter(b=>b.id!=="about-second");
 const about=parseUniversalCopyEdit(missing,requests.about);
 assert.ok(about&&"intent" in about);
 const second=applyUniversalCopyEdit(missing,about.intent,"Texto restaurado após atualizar a página.");
 assert.equal(second.ok,true);
 if(!second.ok)return;
 const restored=JSON.parse(JSON.stringify(second.site));
 assert.equal(universalEditedTextSlot(restored,"capa","paragraph",0),"Tecnologia, sofisticação e cuidado em cada detalhe");
 assert.equal(universalEditedTextSlot(restored,"sobre","paragraph",1),"Texto restaurado após atualizar a página.");
 assert.equal(restored.header.ctaHref,base.header.ctaHref);
});
test("ordinary image edits are still routed to photo controls, not text",()=>{
 assert.equal(institutionalImageIntent("Troque a imagem principal da capa por uma fotografia nova."),true);
 assert.equal(isScopedBannerCopyRequest("Troque o título do segundo banner para 'Nova chamada'."),true);
});

test("scoped AI rewrite sends the original project to the server, not a reclassified niche",()=>{
 const page=excerpt("app/app/builder-v2/page.tsx");
 assert.ok(page.includes('scopedCopy&&"intent" in scopedCopy&&scopedCopy.intent.generateText?site:'));
});
