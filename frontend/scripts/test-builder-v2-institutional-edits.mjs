import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {applyInstitutionalEdit} from "../src/lib/builder-v2-institutional-edits.ts";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(file)=>readFileSync(path.join(root,file),"utf8");
function fixture(){
 return {title:"Arquitetura & Design",background:"#fff",blocks:[
  {id:"hero-title",section:"inicio",type:"heading",text:"Arquitetura que transforma vidas",color:"#fff",align:"left"},
  {id:"hero-description",section:"inicio",type:"paragraph",text:"Criamos espaços modernos.",color:"#fff",align:"left"},
  {id:"hero-button",section:"inicio",type:"button",text:"Conheça nossos serviços",color:"#ffcc00",align:"left",href:"https://example.com"},
  {id:"services-title",section:"servicos",type:"heading",text:"Nossos Serviços",align:"left",color:"#000"},
  ...["Arquitetura Residencial","Design de Interiores","Projetos Comerciais","Consultoria Técnica"].map((name,i)=>({id:"service-"+i,section:"servicos",type:"paragraph",text:name+": Atendimento cuidadoso e profissional.",color:"#26382f",align:"left"})),
  {id:"contact-title",section:"contato",type:"heading",text:"Entre em contato",color:"#26382f",align:"left"},
  {id:"contact-desc",section:"contato",type:"paragraph",text:"Fale com a equipe",color:"#26382f",align:"left"}
 ]};
}
function edit(site,prompt){
 const result=applyInstitutionalEdit(site,prompt);
 assert.ok(result&&"site" in result,result?.error||"Unknown instruction");
 return result.site;
}
const get=(site,id)=>site.blocks.find(b=>b.id===id);
const cards=site=>site.blocks.filter(b=>b.section==="servicos"&&b.type==="paragraph");

test("T02 — description changes only the paragraph, never H1, images or CTA",()=>{
 const original=fixture();
 const site=edit(original,"Substitua somente a descrição abaixo do título principal por 'Criamos soluções personalizadas com qualidade, inovação e atenção a cada detalhe.' Não altere o H1, a imagem nem o botão.");
 assert.equal(get(site,"hero-description").text,"Criamos soluções personalizadas com qualidade, inovação e atenção a cada detalhe.");
 assert.deepEqual(get(site,"hero-title"),get(original,"hero-title"));
 assert.deepEqual(get(site,"hero-button"),get(original,"hero-button"));
 assert.deepEqual(cards(site),cards(original));
});

test("T04/T05 — complete hero alignment, then independent description",()=>{
 const original=fixture();
 const center=edit(original,"Centralize o título, a descrição e o botão principal da capa, mantendo os três perfeitamente alinhados entre si. Não altere conteúdos, imagens ou cores.");
 for(const id of ["hero-title","hero-description","hero-button"])assert.equal(get(center,id).align,"center");
 const left=edit(center,"Agora alinhe somente a descrição da capa à esquerda. Preserve o alinhamento centralizado do título e do botão.");
 assert.equal(get(left,"hero-description").align,"left");
 assert.equal(get(left,"hero-title").align,"center");
 assert.equal(get(left,"hero-button").align,"center");
});

test("T08/T11 — isolated font family and button radius persist in block data",()=>{
 const original=fixture();
 const font=edit(original,"Altere somente a família tipográfica dos títulos da seção de serviços para Poppins. Não altere as fontes de outras seções.");
 assert.ok(cards(font).every(b=>b.fontFamily==="Poppins"));
 assert.deepEqual(get(font,"hero-title"),get(original,"hero-title"));
 const radius=edit(font,"Deixe somente o botão principal da capa com cantos arredondados de 30px. Não altere altura, largura, cores ou posição.");
 assert.equal(get(radius,"hero-button").radius,30);
 assert.equal(get(radius,"hero-button").href,"https://example.com");
 assert.deepEqual(cards(radius),cards(font));
});

test("T12 — internal contact CTA cannot navigate to a random page",()=>{
 const original=fixture();
 const site=edit(original,"Configure o botão principal da capa para levar à seção de Contato do próprio site, com rolagem suave. Preserve o visual do botão.");
 assert.equal(get(site,"hero-button").href,"#contato");
 assert.deepEqual(get(site,"hero-title"),get(original,"hero-title"));
 assert.deepEqual(cards(site),cards(original));
});

test("T12.1 — named services CTA navigates to existing Services section without changing text",()=>{
 const original=fixture();
 const prompt="Configure o botão 'Conheça nossos serviços' da capa para rolar até o início da seção 'Nossos Serviços' neste mesmo site. Não abra outra página, não altere o texto do botão e preserve todos os demais elementos.";
 const updated=edit(original,prompt);
 assert.equal(get(updated,"hero-button").href,"#servicos");
 assert.equal(get(updated,"hero-button").text,get(original,"hero-button").text);
 for(const block of original.blocks.filter(b=>b.id!=="hero-button")){
   assert.deepEqual(get(updated,block.id),block);
 }
});
test("T12.2 — same CTA can point to Contato even though its label mentions serviços",()=>{
 const original=fixture();
 const services=edit(original,"Configure o botão 'Conheça nossos serviços' da capa para rolar até o início da seção 'Nossos Serviços' neste mesmo site. Não altere o texto.");
 const contact=edit(services,"Configure o botão principal da capa para levar à seção de Contato do próprio site, com rolagem suave. Preserve o visual do botão.");
 assert.equal(get(contact,"hero-button").href,"#contato");
 const switched=edit(contact,"Configure o botão 'Conheça nossos serviços' da capa para rolar até o início da seção 'Nossos Serviços' neste mesmo site. Não abra outra página.");
 assert.equal(get(switched,"hero-button").href,"#servicos");
});
test("T12.3 — services links use the real nonstandard section ID",()=>{
 const original=fixture();
 const services=original.blocks.map(b=>({...b,section:b.section==="servicos"?"nossos-servicos":b.section}));
 const site=edit({...original,blocks:services},"Configure o botão 'Conheça nossos serviços' da capa para rolar até o início da seção 'Nossos Serviços' neste mesmo site.");
 assert.equal(get(site,"hero-button").href,"#nossos-servicos");
});
test("T12.4 — unknown destination cannot produce a false success",()=>{
 const original=fixture();
 const stripped={...original,blocks:original.blocks.filter(b=>b.section!=="servicos")};
 const result=applyInstitutionalEdit(stripped,"Configure o botão 'Conheça nossos serviços' da capa para rolar até o início da seção 'Nossos Serviços' neste mesmo site.");
 assert.ok(result&&"error" in result);
 assert.equal(get(stripped,"hero-button").href,"https://example.com");
});
test("T12.5 — named second CTA is selected instead of the first CTA",()=>{
 const original=fixture();
 const amended={...original,blocks:original.blocks.map(b=>({...b}))};
 amended.blocks.splice(3,0,{id:"hero-secondary",section:"inicio",type:"button",text:"Ver portfólio",color:"#ffcc00",align:"left",href:"#portfolio"});
 const result=edit(amended,"Configure o botão 'Conheça nossos serviços' da capa para rolar até o início da seção 'Nossos Serviços' neste mesmo site. Não altere o outro botão.");
 assert.equal(get(result,"hero-button").href,"#servicos");
 assert.deepEqual(get(result,"hero-secondary"),get(amended,"hero-secondary"));
});

test("T13 — add second hero CTA without losing original",()=>{
 const original=fixture();
 const site=edit(original,"Adicione um segundo botão na capa chamado 'Conhecer serviços', direcionado à seção de Serviços. Preserve o botão principal e os demais elementos.");
 const actions=site.blocks.filter(b=>b.section==="inicio"&&b.type==="button");
 assert.equal(actions.length,2);
 assert.deepEqual(actions[0],get(original,"hero-button"));
 assert.equal(actions[1].href,"#servicos");
});

test("T17/T18/T19 — fifth service card is added, moved and deleted transactionally",()=>{
 const original=fixture();
 const added=edit(original,"Adicione à seção de Serviços um novo card chamado 'Consultoria Especializada', com a descrição 'Atendimento individualizado para encontrar a melhor solução para cada cliente.' Preserve todos os cards existentes.");
 assert.equal(cards(added).length,5);
 assert.ok(cards(added)[4].text.startsWith("Consultoria Especializada:"));
 assert.deepEqual(cards(added).slice(0,4),cards(original));
 const moved=edit(added,"Mova o card 'Consultoria Especializada' para a primeira posição da seção de Serviços. Preserve seu conteúdo e os demais cards.");
 assert.equal(cards(moved).length,5);
 assert.ok(cards(moved)[0].text.startsWith("Consultoria Especializada:"));
 const removed=edit(moved,"Remova exclusivamente o card 'Consultoria Especializada' da seção de Serviços. Preserve todos os outros cards, imagens e seções.");
 assert.deepEqual(cards(removed),cards(original));
 assert.deepEqual(get(removed,"hero-title"),get(original,"hero-title"));
});

test("T20 — multiple commands apply together, never just first matching operation",()=>{
 const original=fixture();
 const site=edit(original,"Execute somente estas três mudanças: 1) Centralize o título da seção de Serviços. 2) Altere a cor do botão principal da capa para #C9A66B. 3) Aumente levemente as sombras dos cards de Serviços. Preserve todo o restante do site.");
 assert.equal(get(site,"services-title").align,"center");
 assert.equal(get(site,"hero-button").color,"#C9A66B");
 assert.ok(cards(site).every(card=>typeof card.cardShadow==="string"&&card.cardShadow.includes("0 14px 34px")));
 assert.deepEqual(get(site,"hero-title"),get(original,"hero-title"));
});

test("multi-operation failures preserve the whole original instead of committing a partial edit",()=>{
 const original=fixture();
 const before=structuredClone(original);
 const result=applyInstitutionalEdit(original,"1) Centralize o título da seção de Serviços. 2) Remova um card misterioso não identificado.");
 assert.ok(result&&"error" in result);
 assert.deepEqual(original,before);
});

test("unknown service cards cannot be declared deleted when they were never found",()=>{
 const result=applyInstitutionalEdit(fixture(),"Remova somente o card 'Serviço Não Cadastrado' da seção de Serviços.");
 assert.ok(result&&"error" in result);
});

test("renderer uses all service cards; styles and links are actually rendered",()=>{
 const renderer=read("src/components/builder-v2-site.tsx");
 assert.match(renderer,/cardItems=isGallery\?galleryImages:\(\/servic\|tratament\|modalidad/);
 assert.match(renderer,/editorialCards\.slice\(0,isTreatments\?undefined:4\)/);
 assert.match(renderer,/b\.textColor\|\|readableColor/);
 assert.match(renderer,/borderRadius:.[^}]*b\.radius/);
 assert.match(renderer,/fontFamily:item\.fontFamily/);
 assert.match(renderer,/fontFamily:b\.fontFamily\|\|displayFont/);
 const api=read("src/app/api/builder-v2/chat/route.ts");
 assert.match(api,/const localized=applyInstitutionalEdit/);
 assert.ok(api.indexOf("const localized=applyInstitutionalEdit")<api.indexOf("if(!isFresh&&Array.isArray(editingSite?.blocks)&&/cards?"));
});
