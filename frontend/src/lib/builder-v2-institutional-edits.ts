// @ts-nocheck
// Transactional edits for institutional sites. These operate only on the existing
// block inventory; they never regenerate, delete or replace unrelated sections.
export type InstitutionalBlock = Record<string, unknown>;
export type InstitutionalSite = { blocks: InstitutionalBlock[] };
export type InstitutionalEdit<T> = { site: T; summary: string } | { error: string };
const normalized=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const words=(v:unknown)=>normalized(String(v||""));
const sectionOf=(b:InstitutionalBlock)=>String(b.section||"principal");
const typeOf=(b:InstitutionalBlock)=>String(b.type||"");
const has=(v:string,re:RegExp)=>re.test(normalized(v));
const quoted=(s:string)=>[...s.matchAll(/['"“”‘’]([^'"“”‘’\n]{2,180})['"“”‘’]/g)].map(m=>m[1].trim());
const numbered=(input:string)=>{
 const matches=[...input.matchAll(/\b([1-9])\)\s*/g)];
 if(matches.length<2||matches[0][1]!=="1")return null;
 return matches.map((m,i)=>input.slice((m.index||0)+m[0].length,i+1<matches.length?matches[i+1].index:undefined).trim());
};
function chosenSection(blocks:InstitutionalBlock[],kind:"hero"|"services"|"contact"){
 const sections=[...new Set(blocks.map(sectionOf))];
 if(kind==="hero")return sectionOf(blocks.find(b=>typeOf(b)==="heading")||blocks[0]||{});
 const pattern=kind==="services"?/servic|tratament|especialidad|modalidad/:/contat|fale.conosco|agend/;
 return sections.find(s=>pattern.test(words(s+" "+blocks.filter(b=>sectionOf(b)===s&&typeOf(b)==="heading").map(b=>b.text).join(" "))));
}
function targetButton(blocks:InstitutionalBlock[],hero:string){
 const list=blocks.filter(b=>typeOf(b)==="button"&&sectionOf(b)===hero);
 return list[0];
}
function targetHero(blocks:InstitutionalBlock[],hero:string,type:"heading"|"paragraph"){
 return blocks.find(b=>typeOf(b)===type&&sectionOf(b)===hero);
}
function serviceCards(blocks:InstitutionalBlock[],service:string){
 return blocks.filter(b=>sectionOf(b)===service&&typeOf(b)==="paragraph"&&String(b.text||"").includes(":"));
}
function buttonHref(blocks:InstitutionalBlock[],target:"contact"|"services"){
 return chosenSection(blocks,target==="contact"?"contact":"services");
}
function bodyOf(input:string){return input.replace(/\s+(?:preserv[ea]\w*|mantenha|nao altere|sem alterar|nao mexa)\b[\s\S]*$/i,"").trim();}
type Operation={description:string;run:(blocks:InstitutionalBlock[])=>string|undefined};
function prepareOperation(input:string,blocks:InstitutionalBlock[]):Operation|null{
 const text=bodyOf(input);
 const norm=normalized(text);
 const hero=chosenSection(blocks,"hero");
 const service=chosenSection(blocks,"services");
 const q=quoted(text);
 const serviceMention=/servic|tratament|modalidad/i.test(norm);
 const heroMention=/\b(capa|hero|principal)\b/i.test(norm);
 const buttonMention=/\bbot[aã]o\b|\bbotao\b/i.test(norm);
 const alignment=/centraliz|alinh/i.test(norm);
 const colorCode=(text.match(/#[0-9a-fA-F]{6}\b/g)||[]).map(v=>v.toUpperCase());
 const styleAdjust=/\b(?:aument|intens|suaviz|reduz)\w*/.test(norm);
 const change=/\b(?:alter|mud|troqu|substitu|deix|defin|coloc|configure|configur|centraliz|alinhe|aument|adicione|inclua|crie|remova|exclua|mova)\w*/.test(norm);
 if(!change)return null;
 // Locate a named service card, not a generic section heading.
 if(serviceMention&&/\bcard\b/.test(norm)&&/\b(?:adicione|inclua|crie)\b/.test(norm)&&!/\b(?:colunas|sombra|borda|arredond)\b/.test(norm)){
   if(!service)return {description:"adicionar card",run:()=>undefined};
   const title=q[0]||text.match(/(?:chamad[oa]|t[ií]tulo)\s+["“]?([^,.;\n]{3,80})/i)?.[1]?.trim();
   const description=text.match(/descri[cç][aã]o\s*['"“:]?\s*['"“]?([^'"“”\n.]{12,220})/i)?.[1]?.replace(/["”']+$/,"").trim()||q[1]||"";
   if(!title||!description)return {description:"adicionar card",run:()=>undefined};
   return {description:"adicionar card",run:draft=>{
     if(serviceCards(draft,service).some(b=>words(String(b.text||"").split(":")[0])===words(title)))return "O card '"+title+"' já existe; nenhuma duplicação feita.";
     const indices=draft.map((b,i)=>sectionOf(b)===service?i:-1).filter(i=>i>=0);
     if(!indices.length)return;
     const anchor=serviceCards(draft,service).at(-1);
     const position=anchor?draft.findIndex(b=>b.id===anchor.id)+1:indices[indices.length-1]+1;
     draft.splice(position,0,{id:"added-"+crypto.randomUUID(),type:"paragraph",text:title+": "+description,section:service,color:"#26382f",align:"left",layout:"grid"});
     return "Card '"+title+"' adicionado à seção Serviços. Todos os cards anteriores preservados.";
   }};
 }
 if(serviceMention&&/\bcard\b/.test(norm)&&/\b(?:remova|exclua|apague)\b/.test(norm)){
   const title=q[0];if(!title||!service)return {description:"remover card",run:()=>undefined};
   return {description:"remover card",run:draft=>{
     const candidates=serviceCards(draft,service).filter(b=>words(String(b.text).split(":")[0])===words(title));
     if(candidates.length!==1)return;
     const i=draft.findIndex(b=>b.id===candidates[0].id);
     if(i<0)return;
     draft.splice(i,1);
     return "Somente o card '"+title+"' foi removido.";
   }};
 }
 if(serviceMention&&/\bcard\b/.test(norm)&&/\b(?:mova|mover|reposicione)\b/.test(norm)&&/\bprimeira?\b/.test(norm)){
   const title=q[0];if(!title||!service)return {description:"mover card",run:()=>undefined};
   return {description:"mover card",run:draft=>{
     const cards=serviceCards(draft,service);
     const target=cards.find(b=>words(String(b.text).split(":")[0])===words(title));
     if(!target||!cards.length)return;
     const from=draft.findIndex(b=>b.id===target.id);
     const [item]=draft.splice(from,1);
     const to=draft.findIndex(b=>b.id===cards[0].id);
     draft.splice(to>=0?to:draft.length,0,item);
     return "Card '"+title+"' movido para a primeira posição; demais cards preservados.";
   }};
 }
 // Site section alignment requested by a numbered multi-action instruction.
 if(serviceMention&&/\btitulo\b/.test(norm)&&alignment&&!/\bcard\b/.test(norm)){
   return {description:"alinhamento do título de Serviços",run:draft=>{
     if(!service)return;
     const heading=draft.find(b=>sectionOf(b)===service&&typeOf(b)==="heading");
     if(!heading)return;
     const dest=/esquerda/.test(norm)?"left":/direita/.test(norm)?"right":"center";
     heading.align=dest;return "Título de Serviços alinhado.";
   }};
 }
 if(heroMention&&/\bt[ií]tulo\b/.test(norm)&&/\bdescri[cç]ao\b/.test(norm)&&buttonMention&&alignment){
   return {description:"alinhamento conjunto da capa",run:draft=>{
     const items=draft.filter(b=>sectionOf(b)===hero&&["heading","paragraph","button"].includes(typeOf(b)));
     if(!items.length)return;
     const dest=/esquerda/.test(norm)?"left":/direita/.test(norm)?"right":"center";
     items.forEach(b=>b.align=dest);return "Título, descrição e botão da capa alinhados.";
   }};
 }
 // Hero paragraph should be independent of the title and button.
 if(heroMention&&/\bdescri[cç]ao\b/.test(norm)&&alignment){
   return {description:"alinhamento da descrição da capa",run:draft=>{
     const paragraph=targetHero(draft,hero,"paragraph");
     if(!paragraph)return;
     paragraph.align=/esquerda/.test(norm)?"left":/direita/.test(norm)?"right":"center";
     return "Somente a descrição da capa foi alinhada.";
   }};
 }
 // Caption change is selected by role, never a full-page rewrite.
 if(heroMention&&/\bdescri[cç]ao\b/.test(norm)&&/substitu|alter|mud|troqu/.test(norm)&&!alignment){
   const value=q.at(-1);
   if(!value)return {description:"texto da descrição",run:()=>undefined};
   return {description:"texto da descrição",run:draft=>{
     const paragraph=targetHero(draft,hero,"paragraph");
     if(!paragraph)return;
     paragraph.text=value;return "Descrição da capa substituída sem alterar H1, botão ou imagem.";
   }};
 }
 // Add a second CTA without deleting the first.
 if(heroMention&&buttonMention&&/segundo/.test(norm)&&/adicion|inclu|crie/.test(norm)){
   const label=q[0];if(!label)return {description:"segundo botão",run:()=>undefined};
   return {description:"segundo botão",run:draft=>{
     const first=targetButton(draft,hero);
     if(!first)return;
     const exists=draft.some(b=>sectionOf(b)===hero&&typeOf(b)==="button"&&words(b.text)===words(label));
     if(exists)return "Botão '"+label+"' já existe.";
     const target=buttonHref(draft,/servic/.test(norm)?"services":"contact");
     if(!target)return;
     const index=draft.findIndex(b=>b.id===first.id);
     draft.splice(index+1,0,{id:"added-"+crypto.randomUUID(),type:"button",section:hero,text:label,href:"#"+target,color:"#C9A66B",align:first.align||"left",radius:12});
     return "Segundo botão adicionado à capa, com navegação interna.";
   }};
 }
 // Navigation must be a real fragment with a real matching section ID.
 if(heroMention&&buttonMention&&/configure|configur|direcion|leva|levar|naveg|link|rolagem/i.test(norm)&&/\b(?:contato|servic)\b/i.test(norm)){
   const target=buttonHref(blocks,/servic/.test(norm)&&!/contato/.test(norm)?"services":"contact");
   return {description:"link do botão",run:draft=>{
     const button=targetButton(draft,hero);
     if(!button||!target)return;
     // The public renderer uses id="contato" even if its underlying section is named differently.
     button.href=target===chosenSection(draft,"contact")?"#contato":"#"+target;
     return "Botão vinculado à seção existente do próprio site.";
   }};
 }
 if(heroMention&&buttonMention&&/\bcantos\b|\barredond/.test(norm)&&/\b\d+\s*px\b/.test(norm)){
   const px=Number(norm.match(/(\d{1,2})\s*px/)?.[1]);
   return {description:"arredondamento do botão",run:draft=>{
     const button=targetButton(draft,hero);if(!button||px<0||px>48)return;
     button.radius=px;return "Arredondamento do botão aplicado: "+px+"px.";
   }};
 }
 if(serviceMention&&/familia tipografica|fonte|tipografia/.test(norm)&&/\btitulo\b|\btitulos\b/.test(norm)){
   const family=/poppins/.test(norm)?"Poppins":/inter\b/.test(norm)?"Inter":/georgia/.test(norm)?"Georgia":undefined;
   return {description:"fonte dos títulos de serviços",run:draft=>{
     if(!service||!family)return;
     const cards=serviceCards(draft,service);if(!cards.length)return;
     cards.forEach(b=>b.fontFamily=family);return "Fonte "+family+" aplicada somente aos títulos dos cards de Serviços.";
   }};
 }
 // Service shadows; paragraphs are visual cards in the institutional renderer.
 if(serviceMention&&/\bsombras?\b/.test(norm)&&styleAdjust&&/\bcards?\b/.test(norm)){
   return {description:"sombras dos cards de Serviços",run:draft=>{
     if(!service)return;
     const cards=serviceCards(draft,service);if(!cards.length)return;
     const stronger=/aument|intens/.test(norm);
     cards.forEach(b=>b.cardShadow=stronger?"0 14px 34px rgba(20,35,29,.25)":"0 5px 16px rgba(20,35,29,.06)");
     return "Sombras dos cards de Serviços atualizadas.";
   }};
 }
 if(heroMention&&buttonMention&&/\bcor\b/.test(norm)&&colorCode.length>=1){
   return {description:"cor do botão",run:draft=>{
     const button=targetButton(draft,hero);if(!button)return;
     button.color=colorCode[0];
     if(colorCode.length>=2)button.textColor=colorCode[1];
     return "Cor do botão principal atualizada.";
   }};
 }
 if(heroMention&&/\bt[ií]tulo\b/.test(norm)&&/tamanho|fonte/.test(norm)&&/\bpx\b/.test(norm)&&!buttonMention){
   const desktop=Number(norm.match(/(\d{2,3})\s*px\s+no\s+desktop/)?.[1]||norm.match(/(\d{2,3})\s*px/)?.[1]);
   const mobile=Number(norm.match(/(\d{2,3})\s*px\s+no\s+mobile/)?.[1]);
   return {description:"tamanho do H1",run:draft=>{
     const heading=targetHero(draft,hero,"heading");if(!heading||!desktop||desktop>110)return;
     heading.fontSize=desktop;
     if(mobile&&mobile>=14&&mobile<=64)heading.mobileFontSize=mobile;
     return "Tamanhos responsivos do H1 atualizados.";
   }};
 }
 return null;
}
export function applyInstitutionalEdit<T extends InstitutionalSite>(site:T,instruction:string):InstitutionalEdit<T>|null{
 if(!site?.blocks?.length)return null;
 // Do not hijack new-site prompts or generic full-site regeneration.
 if(/\b(?:crie|gere|gerar|construa)\s+(?:um\s+)?site\b/i.test(instruction))return null;
 const parts=numbered(instruction);
 if(parts){
   const draft=site.blocks.map(block=>({...block}));
   const applied:string[]=[];
   for(const part of parts){
     const operation=prepareOperation(part,draft);
     if(!operation)return {error:"Comando múltiplo parcialmente incompatível. Nenhuma alteração foi aplicada."};
     const result=operation.run(draft);
     if(!result)return {error:"Não foi possível executar "+operation.description+". O projeto foi preservado."};
     applied.push(result);
   }
   if(JSON.stringify(site.blocks)===JSON.stringify(draft))return {error:"O pedido não produziu alterações. Projeto preservado."};
   return {site:{...site,blocks:draft},summary:applied.join(" ")};
 }
 const operation=prepareOperation(instruction,site.blocks);
 if(!operation)return null;
 const draft=site.blocks.map(block=>({...block}));
 const summary=operation.run(draft);
 if(!summary)return {error:"Não foi possível executar "+operation.description+" no site atual. Nenhuma alteração foi aplicada."};
 if(JSON.stringify(draft)===JSON.stringify(site.blocks))return {site,summary:"O elemento já estava na configuração solicitada; nenhuma outra alteração foi feita."};
 return {site:{...site,blocks:draft},summary};
}
