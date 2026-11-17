import test from "node:test";
import assert from "node:assert/strict";
import {isExplicitImageChangeRequest} from "../src/lib/builder-v2-image-intent.ts";
import {isExplicitFloriculturePeonyHeroIntent} from "../src/lib/builder-v2-floriculture-hero-photo.ts";
test("T02: changing hero description while preserving image must not regenerate image bank",()=>{
 const input="Substitua somente a descrição abaixo do título principal por 'Criamos soluções personalizadas com qualidade, inovação e atenção a cada detalhe.' Não altere o H1, a imagem nem o botão.";
 assert.equal(isExplicitImageChangeRequest(input),false);
});
test("Editing text, color or layout with preservation clauses never requests new images",()=>{
 const commands=[
 "Troque o título para 'Arquitetura de alto padrão'. Preserve todas as imagens.",
 "Mude a descrição e mantenha a foto da capa.",
 "Centralize o título e o botão, sem alterar fotos.",
 "Substitua o texto do primeiro card. Não troque nenhuma imagem.",
 "Altere somente o fundo, mas preserve a fotografia."
 ];
 for(const prompt of commands)assert.equal(isExplicitImageChangeRequest(prompt),false,prompt);
});
test("Specific real image replacement commands continue to work",()=>{
 const commands=[
 "Troque a imagem da capa.",
 "Substitua somente a segunda foto.",
 "Gere imagens para a seção de serviços.",
 "Regere uma fotografia.",
 "Crie uma nova imagem para o portfólio.",
 "Troque a foto número 2.",
 "Substitua a foto principal. Preserve os textos."
 ];
 for(const prompt of commands)assert.equal(isExplicitImageChangeRequest(prompt),true,prompt);
});

test("Test 03: the actual unquoted prompt is recognized as one Hero image replacement",()=>{
 const request="Substitua exclusivamente a fotografia principal do Hero por uma fotografia real da internet mostrando um buquê premium de peônias rosas e brancas. Mantenha o mesmo layout, as dimensões da imagem, os textos e os botões. A nova fotografia deve aparecer corretamente na prévia, sem imagens quebradas e sem modificações nas demais seções.";
 assert.equal(isExplicitImageChangeRequest(request),true);
 assert.equal(isExplicitFloriculturePeonyHeroIntent(request),true);
});
test("Protect text/layout instructions and reject compound or wrong-flower replacements",()=>{
 const negatives=[
  "Substitua o título do Hero e preserve a fotografia principal do Hero.",
  "Altere somente a cor do fundo. Mantenha a fotografia principal do Hero.",
  "Substitua exclusivamente a fotografia principal do Hero por uma fotografia real de rosas vermelhas.",
  "Substitua exclusivamente a fotografia principal do Hero por uma fotografia de peônias rosas e brancas. Troque também o título.",
  "Substitua exclusivamente as 6 fotos do site por peônias rosas e brancas."
 ];
 for(const request of negatives)assert.equal(isExplicitFloriculturePeonyHeroIntent(request),false,request);
});
