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
/**
 * Find original top-level section boundaries without touching the template's
 * styles or nested DOM. The scanning stack excludes sections inside sections.
 * Script/style contents are skipped so JSX-like strings do not become anchors.
 */
function sectionAnchors(html:string):number[]{
 const tags=/<\/?([a-z][\w:-]*)\b[^>]*>/gi;
 const stack:string[]=[];const slots:number[]=[];
 let match:RegExpExecArray|null;
 while((match=tags.exec(html))){
   const raw=match[0], tag=match[1].toLowerCase();
   if(raw.startsWith('<!--'))continue;
   if(raw.startsWith('</')){
     const index=stack.lastIndexOf(tag);
     if(index>=0)stack.length=index;
     continue;
   }
   if(tag==='section'&&!stack.includes('section')&&(stack.includes('main')||!html.includes('<main'))){
     slots.push(match.index);
   }
   if(!raw.endsWith('/>')&&!['meta','link','img','input','br','hr','source','area','base','col','embed','param','track','wbr'].includes(tag)){
     stack.push(tag);
     if(tag==='script'||tag==='style'){
       const closer=new RegExp('<\\/'+tag+'\\s*>','gi');
       closer.lastIndex=tags.lastIndex;
       const found=closer.exec(html);
       if(found){tags.lastIndex=closer.lastIndex;stack.pop();}
     }
   }
 }
 return slots;
}
export function originalSectionCount(html:string):number{return sectionAnchors(html).length;}
export function appendExtraSections(html:string,raw:unknown):string{
 const sections=validExtraSections(raw);
 if(!sections.length)return html;
 const anchors=sectionAnchors(html);
 // Legacy extras without a slot remain at the end, preserving old projects.
 const last=anchors.length;
 const markers: Array<{at:number;markup:string}>=[];
 for(let slot=0;slot<=last;slot++){
  const at=slot<last?anchors[slot]:
   [...html.matchAll(/<\/main\s*>/gi)].at(-1)?.index??html.search(/<\/body>/i);
  const found=at<0?html.length:at;
  const matching=sections.filter(s=>Math.min(last,Math.max(0,Math.floor(s.slot??last)))===slot);
  if(matching.length)markers.push({at:found,markup:matching.map(renderExtraSection).join('')});
 }
 // Insert in reverse order to preserve all original offsets.
 let output=html;
 for(const marker of markers.reverse())output=output.slice(0,marker.at)+marker.markup+output.slice(marker.at);
 return output;
}
