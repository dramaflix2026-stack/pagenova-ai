import test from "node:test";
import assert from "node:assert/strict";
import {isExplicitImageChangeRequest} from "../src/lib/builder-v2-image-intent.ts";
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
