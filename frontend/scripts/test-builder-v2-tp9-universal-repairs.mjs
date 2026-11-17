import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isAutomotiveHeroPhotoIntent,applyAutomotiveHeroPhoto,automotiveMechanicWorkshopPhoto} from "../src/lib/builder-v2-automotive-hero-photo.ts";
import {applyUniversalNaturalLanguage} from "../src/lib/builder-v2-universal-language.ts";
import {planUniversalPreviewMove} from "../src/lib/builder-v2-universal-preview-postconditions.ts";
import {planUniversalVisualProof} from "../src/lib/builder-v2-editor-visual-proof.ts";

const promptPhoto="Substitua somente a imagem principal da primeira seção por uma fotografia real de um mecânico trabalhando em um veículo dentro de uma oficina automotiva moderna. Preserve o texto, os botões, as cores e todas as outras imagens.";
const promptTeam='Adicione uma nova seção chamada "Nossa Equipe" imediatamente antes da seção de contato, contendo três cards com fotografia, nome e especialidade de cada profissional. Utilize identidade visual compatível com o site. Não duplique nenhuma seção e mantenha o rodapé na última posição.';
const site={niche:"Auto centers",briefingLayoutVariant:"02",blocks:[
 {id:"hero-title",type:"heading",section:"hero",text:"Título principal"},
 {id:"hero-photo",type:"image",section:"hero",src:"https://images.unsplash.com/photo-1486262715619-67b85e0b08d3"},
 {id:"services-title",type:"heading",section:"services",text:"Nossos serviços"},
 {id:"faq-title",type:"heading",section:"faq",text:"Perguntas Frequentes"},
 {id:"contact-title",type:"heading",section:"contact",text:"Entre em Contato"},
 {id:"footer-title",type:"heading",section:"footer",text:"Rodapé"}
]};
test("TP9 image: accepts user's single hero intent without preservation false positives",()=>{
 assert.equal(isAutomotiveHeroPhotoIntent(promptPhoto),true);
 assert.equal(isAutomotiveHeroPhotoIntent("Preserve todas as outras imagens."),false);
 assert.equal(isAutomotiveHeroPhotoIntent("Substitua todas as imagens do site por fotos novas"),false);
 assert.equal(isAutomotiveHeroPhotoIntent("Substitua somente a imagem da seção de depoimentos por uma foto"),false);
});
test("TP9 image: applies only safe, explicit override, leaving approved photo and all blocks intact",()=>{
 const result=applyAutomotiveHeroPhoto(site,automotiveMechanicWorkshopPhoto);
 assert.equal(result.ok,true);
 assert.deepEqual(result.site.blocks,site.blocks);
 assert.equal(result.site.universalHeroImageOverride,automotiveMechanicWorkshopPhoto);
 assert.deepEqual(result.changedIds,["hero-photo-override"]);
 const again=applyAutomotiveHeroPhoto(result.site,automotiveMechanicWorkshopPhoto);
 assert.equal(again.ok,false);
 assert.equal(applyAutomotiveHeroPhoto(site,"javascript:alert(1)").ok,false);
});
test("TP9 section: creates three photographic demo personnel before contact without touching footer",()=>{
 const result=applyUniversalNaturalLanguage(site,promptTeam);
 assert.ok(result?.ok,JSON.stringify(result));
 const section="custom-nossa-equipe";
 const items=result.site.blocks.filter(b=>b.section===section);
 assert.equal(items.filter(x=>x.type==="heading").length,4);
 assert.equal(items.filter(x=>x.type==="paragraph"&&/^https:\/\//.test(x.src||"")).length,3);
 assert.ok(items.filter(x=>x.type==="heading").slice(1).every(b=>b.text.includes("(exemplo)")));
 assert.ok(items.filter(x=>x.type==="paragraph").every(b=>b.text.includes("Especialidade:")));
 assert.ok(result.site.blocks.findIndex(b=>b.section===section)<result.site.blocks.findIndex(b=>b.section==="contact"));
 assert.equal(result.site.blocks.at(-1).section,"footer");
 assert.equal(result.site.blocks.filter(b=>b.section===section&&b.type==="heading").length,4);
 assert.equal(planUniversalPreviewMove(site,result.site),null,"new section should not be counted as a moved existing one");
 const proof=planUniversalVisualProof(site,result.site,result.changedIds);
 assert.equal(proof.ok,true,JSON.stringify(proof));
 const newTask=proof.contract.tasks.find(task=>task.kind==="section-new");
 assert.equal(newTask.section,section);
 assert.equal(newTask.following,"contact");
 assert.equal(newTask.cardTitles.length,3);
 assert.equal(newTask.cardImages.length,3);
});
test("TP9 section: cannot produce a duplicate new section on repeated command",()=>{
 const result=applyUniversalNaturalLanguage(site,promptTeam);
 assert.ok(result?.ok);
 const again=applyUniversalNaturalLanguage(result.site,promptTeam);
 assert.ok(again&&!again.ok);
});
test("TP9 preview/publication integration uses opt-in bridge outside frozen templates",()=>{
 const bridge=readFileSync(new URL("../src/components/builder-v2-hero-photo-override.tsx",import.meta.url),"utf8");
 const preview=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const published=readFileSync(new URL("../src/app/site/[slug]/page.tsx",import.meta.url),"utf8");
 for(const selector of [".tp9m2-heroimg","#tp9-inicio .vh-photo img",".pn-t9-hero img","#tp9m3-home > img",".tp9v3-hero .tp9v3-cover"])
  assert.ok(bridge.includes(selector),selector);
 assert.match(bridge,/data-universal-hero-photo/);
 assert.match(preview,/<UniversalIsolatedHeroPhoto src=/);
 assert.match(published,/<UniversalIsolatedHeroPhoto src=/);
 assert.match(published,/automotive={publishedFamily===9}/);
});
test("TP9 custom sections: real template anchor aliases and preview-gated three photos",()=>{
 const wrapper=readFileSync(new URL("../src/components/tp10-universal-custom-sections.tsx",import.meta.url),"utf8");
 const proof=readFileSync(new URL("../src/lib/builder-v2-editor-visual-proof.ts",import.meta.url),"utf8");
 assert.match(wrapper,/tp9-contato/);
 assert.match(wrapper,/tp9v3-contact/);
 assert.match(wrapper,/card.image/);
 assert.match(proof,/cardImages/);
 assert.match(proof,/image.naturalWidth<=0/);
});
