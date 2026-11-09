import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";
import {applyTP6RetailChatEdit} from "../src/lib/builder-v2-tp6-edit-bridge.ts";
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>readFileSync(path.join(dir,file),"utf8");
const site={title:"Jardim de Amélia",niche:"Loja de roupas",blocks:[{type:"heading",text:"Flores que transformam momentos",section:"inicio"},{type:"heading",text:"Sobre a floricultura",section:"sobre"},{type:"heading",text:"Nossas coleções",section:"produtos"},{type:"heading",text:"Perguntas frequentes",section:"faq"}]};
const run=(site,text)=>applyTP6RetailChatEdit(site,text);
test("text change is persisted and read by all three TP6 variants",()=>{
 const result=run(site,"Na seção Nossa História, altere somente o título principal para 'Nossa paixão floresce em cada detalhe'. Preserve o parágrafo, as fotografias e todos os outros elementos do site.");
 assert.equal(result.ok,true);assert.equal(result.site.tp6RetailEdits.historyTitle,"Nossa paixão floresce em cada detalhe");assert.deepEqual(result.site.blocks,site.blocks);
 const story=read("src/components/template6-retail-story.tsx"),m2=read("src/components/builder-v2-tp6-model2.tsx"),m3=read("src/components/builder-v2-tp6-model3.tsx");
 for(const f of [story,m2,m3])assert.match(f,/edits\?\.historyTitle/);
});
test("two colors persist and are scoped to visible collections",()=>{
 const result=run(site,"Na seção Nossas Coleções, altere o fundo para verde oliva escuro (#26382D) e os títulos para creme (#F5E9D5). Preserve as fotografias, os textos, o tamanho dos cards e todas as outras seções.");
 assert.equal(result.ok,true);assert.equal(result.site.tp6RetailEdits.collectionBackground,"#26382D");assert.equal(result.site.tp6RetailEdits.collectionHeadingColor,"#F5E9D5");assert.match(read("src/components/builder-v2-tp6-premium-shared.tsx"),/export function TP6RetailEditStyles/);
});
test("first card title and description are visible in the actual collection",()=>{
 const result=run(site,"Na seção de coleções, encontre o primeiro card e altere seu título para 'Buquês de Rosas Exclusivos'. Altere a descrição desse card para 'Composições delicadas com rosas selecionadas para tornar cada ocasião inesquecível'. Não modifique a fotografia nem os outros cards.");
 assert.equal(result.ok,true);assert.equal(result.site.tp6RetailEdits.firstCollectionCard.title,"Buquês de Rosas Exclusivos");
 assert.match(result.site.tp6RetailEdits.firstCollectionCard.description,/rosas selecionadas/);
 assert.match(read("src/components/template6-retail-collection.tsx"),/edits\?\.firstCollectionCard/);
});
test("four-card section inserts immediately before FAQ in all three variants",()=>{
 const original="Adicione uma nova seção chamada 'Flores para Cada Ocasião' imediatamente antes da seção de perguntas frequentes. Inclua o título 'Celebre com flores', um texto explicando opções para aniversários, casamentos, presentes românticos e celebrações especiais, e quatro cards: Aniversários, Casamentos, Amor e Gratidão. Cada card deve ter uma descrição relacionada à ocasião. Mantenha o estilo visual do site e preserve todas as seções existentes.";
 const result=run(site,original);
 assert.equal(result.ok,true);assert.equal(result.site.tp6RetailEdits.addedSections.length,1);
 assert.deepEqual(result.site.tp6RetailEdits.addedSections[0].cards.map(x=>x.title),["Aniversários","Casamentos","Amor","Gratidão"]);
 assert.equal(result.site.tp6RetailEdits.addedSections[0].title,"Celebre com flores");
 for(const f of ["src/components/template6-retail-story.tsx","src/components/builder-v2-tp6-model2.tsx","src/components/builder-v2-tp6-model3-reviews-faq.tsx"]){
  const code=read(f);assert.ok(code.includes("<TP6RetailCustomSections sections={edits?.addedSections}/>"),f);
  assert.ok(code.indexOf("<TP6RetailCustomSections sections={edits?.addedSections}/>")<code.lastIndexOf("className=\"pn-t6-faq\"")||code.indexOf("<TP6RetailCustomSections sections={edits?.addedSections}/>")<code.lastIndexOf("className=\"tp6m2-faq\"")||code.indexOf("<TP6RetailCustomSections sections={edits?.addedSections}/>")<code.lastIndexOf("className=\"tp6m3-faq\""),f);
 }
 const duplicate=run(result.site,original);assert.equal(duplicate.ok,false);
});
test("reject incomplete instructions rather than claim invisible success",()=>{
 assert.equal(run(site,"Na seção Nossas Coleções, altere o fundo para verde e os títulos para creme").ok,false);
 assert.equal(run(site,"Na seção de coleções, encontre o primeiro card e altere seu título para 'Rosas'.").ok,false);
});
test("modified template components parse without syntax errors",()=>{
 for(const name of ["src/components/builder-v2-site.tsx","src/components/builder-v2-tp6-premium-shared.tsx","src/components/builder-v2-tp6-model2.tsx","src/components/builder-v2-tp6-model3.tsx","src/components/builder-v2-tp6-model3-reviews-faq.tsx","src/components/template6-retail-story.tsx","src/components/template6-retail-collection.tsx"]){
  const source=ts.createSourceFile(name,read(name),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(source.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText," ")),[],name);
 }
});
