import {applyUniversalOperations,type UniversalSite,type UniversalResult,type UniversalOperation} from "./builder-v2-universal-operations.ts";
const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const aliases:Record<string,string[]>={
 hero:["hero","capa","inicio","home","principal","banner"],
 about:["about","sobre","sobre nos","sobre a empresa","nossa essencia","essencia"],
 services:["services","servicos","nossos servicos","especialidades","nossas especialidades"],
 accommodations:["acomodacoes","acomodacao","nossas acomodacoes","hospedagens","hospedagem","quartos","suites","chales","chalés","rooms","accommodations","stays"],
 differences:["diferenciais","nossos diferenciais","diferencas","diferentials","differences"],
 process:["como-funciona","como funciona","processo","nosso processo","como trabalhamos","etapas"],
 projects:["projetos","nossos projetos","projetos em destaque","portfolio de projetos","portfolio","portfólio","obras","nossas obras","cases","projetos realizados","projects"],
 numbers:["numeros","resultados","resultados e numeros","metricas","indicadores","numbers"],
 history:["trajetoria","nossa trajetoria","historia","nossa historia","history"],
 testimonials:["testimonials","depoimentos","depoimentos dos clientes","avaliacoes"],
 gallery:["gallery","galeria","galeria de fotos","fotos"],
 faq:["faq","perguntas frequentes","duvidas frequentes"],
 contact:["contact","contato","entre em contato","fale conosco"],
 footer:["footer","rodape","rodape premium"]
};
/** Match actual section IDs/headings first, then aliases; never choose the first candidate. */
export function resolveUniversalSection(site:UniversalSite,label:string):string|null{
 const target=norm(label).replace(/^(?:a|o)\s+/,"");
 const sections=[...new Set(site.blocks.map(b=>b.section).filter((v):v is string=>typeof v==="string"&&!!v))];
 const exactIds=sections.filter(id=>norm(id)===target);
 if(exactIds.length)return exactIds.length===1?exactIds[0]:null;
 const direct=sections.filter(id=>site.blocks.some(b=>b.section===id&&b.type==="heading"&&norm(String(b.text||""))===target));
 if(direct.length)return direct.length===1?direct[0]:null;
 const family=Object.values(aliases).find(names=>names.includes(target));
 const matches=family?sections.filter(id=>family.includes(norm(id))||site.blocks.some(b=>b.section===id&&b.type==="heading"&&family.includes(norm(String(b.text||""))))):[];
 if(matches.length===1)return matches[0];
 if(matches.length>1)return null;
 // Renderer sections can carry generated IDs and editorial headings rather than
 // canonical alias IDs. Resolve only when exactly one section shares a family keyword.
 if(family){
  const keywords=family.filter(name=>name.length>=5&&!["projects","differences","diferentials"].includes(name));
  const fuzzy=sections.filter(id=>{
   const headings=site.blocks.filter(b=>b.section===id&&b.type==="heading").map(b=>norm(String(b.text||"")));
   return [norm(id),...headings].some(value=>keywords.some(keyword=>value.includes(keyword)||keyword.includes(value)&&value.length>=6));
  });
  if(fuzzy.length===1)return fuzzy[0];
 }
 return null;
}
const unquote=(value:string)=>value.trim().replace(/^["“']|["”']$/g,"");
const color=(value:string)=>({preto:"#000000",pretos:"#000000",preta:"#000000",branco:"#ffffff",brancos:"#ffffff",branca:"#ffffff",vermelho:"#ff0000",azul:"#0000ff"} as Record<string,string>)[norm(value)]||(/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)?value:null);
export function applyUniversalNamedLanguage<T extends UniversalSite>(site:T,instruction:string):UniversalResult<T>|null{
 const text=instruction.trim().replace(/\.$/,"");
 if(/(?:bloco|elemento|se[cç][aã]o)\s+(?:com\s+)?id\s+/i.test(text))return null;
 const fail=(message="Identifique uma única seção ou elemento. Nenhuma alteração aplicada."):UniversalResult<T>=>({ok:false,error:message});
 const apply=(ops:UniversalOperation[])=>applyUniversalOperations(site,ops);
 const remove=text.match(/^(?:remova|exclua|apague)\s+(?:(?:a|o|os|as)\s+)?(?:se[cç][aã]o\s+)?(.+?)\s*\.?$/i);
 if(remove){const id=resolveUniversalSection(site,remove[1]);if(!id&&!/\\bse[cç][aã]o\\b/i.test(text))return null;return id?apply([{action:"remove-section",sectionId:id}]):fail();}
 const move=text.match(/^(?:mova|reposicione|coloque)\s+(?:(?:a|o)\s+)?(?:se[cç][aã]o\s+)?(.+?)\s+(?:para\s+)?(antes|depois|ap[oó]s)\s+(?:(?:da|do|de|a|o)\s+)?(?:se[cç][aã]o\s+)?(.+?)\s*\.?$/i);
 if(move){
  const source=resolveUniversalSection(site,unquote(move[1])),destination=resolveUniversalSection(site,unquote(move[3]));
  if(!source||!destination||source===destination)return fail("Não foi possível localizar as duas seções para movimentação: origem "+unquote(move[1])+"; destino "+unquote(move[3])+". Nenhuma alteração aplicada.");
  if(norm(move[2])==="antes")return apply([{action:"move-section",sectionId:source,beforeSectionId:destination}]);
  let after=destination;
  return apply([{action:"move-section",sectionId:source,afterSectionId:after}]);
 }
 const copy=text.match(/^(?:altere|troque|mude|substitua)\s+(?:o|a)\s+(t[ií]tulo|descri[cç][aã]o|subt[ií]tulo|imagem)\s+(?:da|do)\s+(?:se[cç][aã]o\s+)?(.+?)\s+(?:para|por)\s+(.+)$/i);
 if(copy){
  const section=resolveUniversalSection(site,unquote(copy[2]));if(!section)return fail();
  const type=norm(copy[1])==="titulo"?"heading":norm(copy[1])==="imagem"?"image":"paragraph";
  const candidates=site.blocks.filter(b=>b.section===section&&b.type===type);
  if(candidates.length!==1)return fail();
  const value=unquote(copy[3]);
  if(type!=="image"&&!/^["“'][\s\S]+["”']$/.test(copy[3].trim()))return fail("Informe o novo texto entre aspas. Nenhuma alteração aplicada.");
  return apply([{action:"update",blockId:candidates[0].id,changes:type==="image"?{src:value}:{text:value}}]);
 }
 const style=text.match(/^(?:altere|troque|mude|defina)\s+(?:a|o)\s+(cor|fonte|tamanho da fonte|tamanho da fonte mobile|alinhamento)\s+(?:do|da)\s+(t[ií]tulo|descri[cç][aã]o|subt[ií]tulo)\s+(?:da|do)\s+(.+?)\s+(?:para|como)\s+(.+)$/i);
 if(style){
  const section=resolveUniversalSection(site,unquote(style[3]));if(!section)return fail();
  const candidates=site.blocks.filter(b=>b.section===section&&b.type===(norm(style[2])==="titulo"?"heading":"paragraph"));
  if(candidates.length!==1)return fail();
  const property=norm(style[1]),value=unquote(style[4]);let changes;
  if(property==="cor"){const c=color(value);if(!c)return fail("Cor não reconhecida.");changes={color:c};}
  else if(property==="fonte")changes={fontFamily:value};
  else if(property.startsWith("tamanho"))changes={[property.endsWith("mobile")?"mobileFontSize":"fontSize"]:Number(value.replace(/px$/i,""))};
  else changes={align:({centro:"center",esquerda:"left",direita:"right"} as Record<string,string>)[norm(value)]||norm(value)};
  return apply([{action:"update",blockId:candidates[0].id,changes}]);
 }
 const buttons=text.match(/^(?:deixe|torne)\s+(?:todos\s+)?os\s+bot[oõ]es\s+(.+)$/i);
 if(buttons){const c=color(unquote(buttons[1]));if(!c)return fail("Cor não reconhecida.");const targets=site.blocks.filter(b=>b.type==="button");return targets.length?apply(targets.map(b=>({action:"update",blockId:b.id,changes:{color:c}}))):fail();}
 const gallery=text.match(/^(?:adicione|crie|inclua)\s+uma\s+galeria(?:\s+["“]([^"”]+)["”])?(?:\s+(?:com|usando)\s+(.+))?$/i);
 if(gallery){
  if(!gallery[2])return fail("Informe as URLs das imagens da nova galeria. Nenhuma alteração aplicada.");
  const urls=gallery[2].split(/\s*,\s*|\s+/).filter(Boolean).map(unquote);
  if(urls.length>18)return fail("A galeria permite até 18 imagens.");
  const existing=resolveUniversalSection(site,"galeria");
  if(existing||site.blocks.some(b=>norm(b.section||"") === "galeria"))return fail("Já existe uma galeria. Indique se deseja acrescentar ou substituir imagens.");
  const unique=(base:string)=>{let id=base,i=1;while(site.blocks.some(b=>b.id===id))id=base+"-"+i++;return id;};
  const contact=resolveUniversalSection(site,"contato");
  const order=[...new Set(site.blocks.map(b=>b.section).filter((v):v is string=>!!v))];
  const previous=contact?order[order.indexOf(contact)-1]:order.at(-1);
  const last=site.blocks.filter(b=>b.section===previous).at(-1)?.id;
  const heading=unique("universal-gallery-heading");
  const ops:UniversalOperation[]=[{action:"add",block:{id:heading,type:"heading",text:gallery[1]||"Galeria",section:"galeria",layout:"gallery"},afterId:last}];
  let after=heading;
  urls.forEach((src,i)=>{const id=unique("universal-gallery-image-"+i);ops.push({action:"add",block:{id,type:"image",text:"",src,section:"galeria",layout:"gallery"},afterId:after});after=id;});
  return apply(ops);
 }
 return null;
}
