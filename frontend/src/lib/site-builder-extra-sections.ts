export type ExtraSectionKind="services"|"benefits"|"about"|"gallery"|"products"|"testimonials"|"pricing"|"process"|"faq"|"contact"|"cta"|"custom";
export type ExtraSection={id:string;kind:ExtraSectionKind;title:string;body:string;slot?:number};
export const EXTRA_SECTION_OPTIONS:ReadonlyArray<{kind:ExtraSectionKind;label:string;title:string;body:string}>=[
{kind:"services",label:"Serviços",title:"Nossos serviços",body:"Conheça como podemos ajudar você."},
{kind:"benefits",label:"Benefícios",title:"Por que escolher nossa empresa?",body:"Atendimento, qualidade e soluções para suas necessidades."},
{kind:"about",label:"Sobre nós",title:"Quem somos",body:"Conheça nossa história e nosso propósito."},
{kind:"gallery",label:"Galeria",title:"Nosso trabalho",body:"Adicione imagens de projetos e experiências."},
{kind:"products",label:"Produtos",title:"Conheça nossos produtos",body:"Explore as soluções que oferecemos."},
{kind:"testimonials",label:"Depoimentos",title:"O que nossos clientes dizem",body:"Adicione aqui apenas depoimentos reais e autorizados."},
{kind:"pricing",label:"Preços",title:"Nossos planos",body:"Apresente as opções e os valores disponíveis."},
{kind:"process",label:"Como funciona",title:"Como trabalhamos",body:"Conheça as etapas de nosso atendimento."},
{kind:"faq",label:"Perguntas frequentes",title:"Dúvidas frequentes",body:"Responda às principais perguntas de seus clientes."},
{kind:"contact",label:"Contato",title:"Vamos conversar?",body:"Fale conosco para saber mais."},
{kind:"cta",label:"Chamada para ação",title:"Pronto para começar?",body:"Entre em contato e descubra o próximo passo."},
{kind:"custom",label:"Texto livre",title:"Nova seção",body:"Clique duas vezes aqui para personalizar seu conteúdo."}
];
export function validExtraSections(raw:unknown):ExtraSection[]{
 if(!Array.isArray(raw))return [];
 const kinds=new Set(EXTRA_SECTION_OPTIONS.map(o=>o.kind));
 return raw.slice(0,24).filter((v):v is ExtraSection=>Boolean(v)&&typeof v==="object"&&
 typeof v.id==="string"&&/^[a-zA-Z0-9_-]{4,80}$/.test(v.id)&&
 kinds.has(v.kind)&&typeof v.title==="string"&&v.title.length<=180&&
 typeof v.body==="string"&&v.body.length<=1800&&(v.slot===undefined||(Number.isInteger(v.slot)&&v.slot>=0&&v.slot<=100)));
}
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));}
export function extraSectionsMarkup(raw:unknown):string{
 const sections=validExtraSections(raw);
 return sections.map(renderExtraSection).join("");
}
function renderExtraSection(s:ExtraSection):string{
 return '<section data-pn-extra-id="'+escapeHtml(s.id)+'" style="box-sizing:border-box;max-width:100%;padding:clamp(36px,6vw,86px) 20px;text-align:center;background:#f2f6f2;color:#183024;border-top:1px solid #d8e5d8"><div style="max-width:900px;margin:auto"><h2 style="font-size:clamp(26px,4vw,44px);line-height:1.15;margin:0 0 16px;font-weight:750">'+escapeHtml(s.title)+'</h2><p style="margin:auto;max-width:650px;white-space:pre-line;font-size:clamp(15px,2vw,19px);line-height:1.75">'+escapeHtml(s.body)+'</p></div></section>';
}

/** Count top-level sections, excluding nested cards and subsections. */
function sectionOffsets(markup:string):number[]{
 const offsets:number[]=[];
 let depth=0;
 for(const match of markup.matchAll(/<\/?section\b[^>]*>/gi)){
  if(/^<\/section/i.test(match[0])) depth=Math.max(0,depth-1);
  else {if(depth===0)offsets.push(match.index!);depth++;}
 }
 return offsets;
}
function mainBounds(html:string):{from:number,to:number}|null{
 const open=/<main\b[^>]*>/i.exec(html);
 if(!open)return null;
 const close=/<\/main\s*>/gi;
 close.lastIndex=open.index+open[0].length;
 const end=close.exec(html);
 if(!end)return null;
 return {from:open.index+open[0].length,to:end.index};
}
export function originalSectionCount(html:string):number{
 const bounds=mainBounds(html);
 return bounds?sectionOffsets(html.slice(bounds.from,bounds.to)).length:0;
}
export function appendExtraSections(html:string,raw:unknown):string{
 const sections=validExtraSections(raw);
 if(!sections.length)return html;
 const bounds=mainBounds(html);
 if(!bounds){
  const extra=extraSectionsMarkup(sections);
  return /<\/body>/i.test(html)?html.replace(/<\/body>/i,extra+"</body>"):html+extra;
 }
 const core=html.slice(bounds.from,bounds.to);
 const originals=sectionOffsets(core);
 const groups=new Map<number,ExtraSection[]>();
 for(const section of sections){
  const slot=Math.min(originals.length,Math.max(0,section.slot??originals.length));
  groups.set(slot,[...(groups.get(slot)||[]),section]);
 }
 const inserts=[...groups.entries()].map(([slot,list])=>({
  at:slot===originals.length?core.length:originals[slot],
  html:extraSectionsMarkup(list)
 })).sort((a,b)=>b.at-a.at);
 let composed=core;
 for(const insertion of inserts)composed=composed.slice(0,insertion.at)+insertion.html+composed.slice(insertion.at);
 return html.slice(0,bounds.from)+composed+html.slice(bounds.to);
}
