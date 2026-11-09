import test from "node:test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
import assert from "node:assert/strict";
import {briefCardCounts,generationBriefCardCounts,briefHeadingAlignment,adaptivePalette} from "../src/lib/builder-v2-brief-contract.ts";

test("a pasted single-line brief scopes every quantity, including written numbers and punctuation",()=>{
  assert.deepEqual(Object.fromEntries(briefCardCounts("Quero quatro serviços, seis diferenciais, três etapas de atendimento, cinco depoimentos e FAQ com quatro perguntas.")),{servicos:4,diferenciais:6,processo:3,depoimentos:5,faq:4});
  assert.deepEqual(Object.fromEntries(briefCardCounts("Serviços: exatamente 5 cards. FAQ: 2 perguntas.\nEtapas: 7 itens.")),{servicos:5,faq:2,processo:7});
});
test("numbered service entries and prices never become section quantities",()=>{
  assert.deepEqual([...briefCardCounts("Serviços\n1. Terapia individual\n2. Terapia de casal\nPlano Essencial: R$ 147,00")],[]);
});
test("global heading alignment is independent from body alignment",()=>{
  assert.equal(briefHeadingAlignment("Todos os títulos devem ficar centralizados. Descrições à esquerda."),"center");
  assert.equal(briefHeadingAlignment("Alinhe todos os títulos à direita."),"right");
  assert.equal(briefHeadingAlignment("Centralize apenas o título de Serviços."),undefined);
});
test("light, beige, dark and high-saturation backgrounds get readable defaults",()=>{
  const light=adaptivePalette("#f7f2e8",{surface:"#fff",accent:"#123b2a"});
  assert.equal(light.background,"#f7f2e8");
  assert.equal(light.ink,"#24332e");
  assert.equal(light.accent,"#123b2a");
  assert.equal(adaptivePalette("#000").ink,"#f5f5f5");
  assert.equal(adaptivePalette("#00ff00").dark,false);
  assert.equal(adaptivePalette("#fff",{surface:"#111"}).cardInk,"#f5f5f5");
  assert.equal(adaptivePalette("#fff",{text:"#fff"}).ink,"#24332e");
});

test("section-first Portuguese briefs retain independent requested counts",()=>{
  assert.deepEqual(Object.fromEntries(briefCardCounts("Como funciona o atendimento: serão 4 cards, cada um com uma etapa.")),{processo:4});
  assert.deepEqual(Object.fromEntries(briefCardCounts("Serviços: 5 cards. Diferenciais: 4 cards. Como funciona o atendimento: 4 etapas. FAQ: 6 perguntas.")),{servicos:5,diferenciais:4,processo:4,faq:6});
});

test("visual testimonial card requests never require invented patient evaluations during generation",()=>{
  const physioBrief=[
    "Crie um site completo e profissional para a Clínica Movimento Vital, especializada em fisioterapia.",
    "## Serviços: seis tratamentos. Como funciona: quatro etapas.",
    "## Depoimentos",
    "Crie uma seção elegante com cinco cards de depoimentos, contendo espaço para fotografia, nome, sobrenome e relato.",
    "Na prévia, utilize apenas conteúdo demonstrativo claramente identificado como fictício, sem apresentar avaliações inventadas como reais.",
    "## Perguntas frequentes",
    "Inclua seis perguntas e respostas."
  ].join("\n");
  assert.equal(briefCardCounts(physioBrief).get("depoimentos"),5);
  assert.equal(generationBriefCardCounts(physioBrief).has("depoimentos"),false);
  assert.equal(generationBriefCardCounts(physioBrief).get("faq"),6);
  assert.equal(generationBriefCardCounts("Serviços: 6 cards. Diferenciais: 4 cards. 5 depoimentos.").get("servicos"),6);
  assert.equal(generationBriefCardCounts("Serviços: 6 cards. Diferenciais: 4 cards. 5 depoimentos.").get("diferenciais"),4);
  assert.equal(generationBriefCardCounts("Serviços: 6 cards. Diferenciais: 4 cards. 5 depoimentos.").has("depoimentos"),false);
});
test("generation route uses safe testimonial count in both generation goals and final repair checks",()=>{
  const route=readFileSync(resolve(root,"src/app/api/builder-v2/chat/route.ts"),"utf8");
  const point=route.indexOf("const briefCounts=generationBriefCardCounts(instruction);");
  assert.ok(point>=0);
  assert.ok(point<route.indexOf("for(const section of sections)",point));
  assert.match(route,/const requestedCounts=new Map\(briefCounts\)/);
  assert.match(route,/if\(added<missing\)throw new Error\("incomplete-card-repair:"\+name\)/);
  assert.match(route,/const sourceCopy=" "\+suppliedCopy\(instruction\)\+" "/);
  assert.match(route,/mutableBlocks\.splice\(index,1\)/);
});
