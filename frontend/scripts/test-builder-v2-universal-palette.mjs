import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {applyUniversalPaletteEdit,parseUniversalPaletteRequest} from "../src/lib/builder-v2-universal-palette.ts";
import {isMotionOnlyInstruction} from "../src/lib/site-builder-animation.ts";

const prompt="Altere a identidade visual deste site para um estilo premium contemporâneo, utilizando preto profundo (#101010), champagne (#C9A77B) e off-white (#F7F4EF). Atualize as cores dos fundos, botões, bordas e detalhes visuais para combinar com essa identidade. Preserve absolutamente todos os textos, imagens, seções, links, animações e a estrutura original do site. Garanta que os textos continuem legíveis e que a aparência seja sofisticada tanto no desktop quanto no celular.";
const before=()=>({background:"#FFFFFF",title:"Maison Aurora",niche:"Clínica de estética",
 design:{surface:"#FFFFFF",text:"#222222",accent:"#456789"},
 motion:{preset:"professional",sections:{hero:{effect:"fade-up"}}},
 blocks:[
 {id:"h",type:"heading",section:"inicio",text:"Original",color:"#222222",align:"left"},
 {id:"image",type:"image",section:"inicio",text:"Foto original",src:"https://example.com/hero.png"},
 {id:"cta",type:"button",section:"inicio",text:"Agendar",href:"https://example.com/agendar"},
 ]});
test("the precise customer prompt resolves to a palette, NOT animations",()=>{
 assert.deepEqual(parseUniversalPaletteRequest(prompt),{background:"#101010",accent:"#C9A77B",surface:"#F7F4EF"});
 assert.equal(isMotionOnlyInstruction(prompt),false);
});
test("the universal palette updates design tokens without changing copy/media/motion",()=>{
 const original=before(),saved=structuredClone(original);
 const applied=applyUniversalPaletteEdit(original,prompt);
 assert.ok(applied);
 assert.equal(applied.site.background,"#101010");
 assert.equal(applied.site.designPaletteApplied,true);
 assert.equal(applied.site.design.accent,"#C9A77B");
 assert.equal(applied.site.design.surface,"#F7F4EF");
 assert.deepEqual(applied.site.blocks,saved.blocks);
 assert.deepEqual(applied.site.motion,saved.motion);
 assert.deepEqual(original,saved);
 const css=readFileSync(new URL("../src/components/builder-v2-universal-scroll-reveal.css",import.meta.url),"utf8");
 assert.match(css,/data-pn-palette-custom/);
 assert.match(css,/--pn-custom-accent/);
 assert.deepEqual(JSON.parse(JSON.stringify(applied.site)).design,applied.site.design);
});
test("protected motion words without a real palette request do not create a palette edit",()=>{
 assert.equal(parseUniversalPaletteRequest("Preserve as animações e as cores originais."),null);
 assert.equal(parseUniversalPaletteRequest("Troque a foto da Hero, preserve os botões e as animações."),null);
});
test("Builder and API route palette before legacy image and motion processing",()=>{
 const page=readFileSync(new URL("../src/app/app/builder-v2/page.tsx",import.meta.url),"utf8");
 const api=readFileSync(new URL("../src/app/api/builder-v2/chat/route.ts",import.meta.url),"utf8");
 assert.ok(page.indexOf("const paletteChange=")<page.indexOf("if (isExplicitImageChangeRequest(prompt)"));
 assert.ok(api.indexOf("const edited=applyUniversalPaletteEdit(")<api.indexOf("isMotionOnlyInstruction(instructionText)"));
});
