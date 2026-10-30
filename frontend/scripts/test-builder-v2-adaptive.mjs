import test from "node:test";
import assert from "node:assert/strict";
import {briefCardCounts,briefHeadingAlignment,adaptivePalette} from "../src/lib/builder-v2-brief-contract.ts";

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
