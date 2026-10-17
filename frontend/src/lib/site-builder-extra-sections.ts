export type ExtraSectionKind="services"|"benefits"|"about"|"gallery"|"products"|"testimonials"|"pricing"|"process"|"faq"|"contact"|"cta"|"custom";
export type ExtraSection={id:string;kind:ExtraSectionKind;title:string;body:string};
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
 typeof v.body==="string"&&v.body.length<=1800);
}
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));}
export function extraSectionsMarkup(raw:unknown):string{
 const sections=validExtraSections(raw);if(!sections.length)return "";
 const cards=sections.map(s=>'<section data-pn-extra-id="'+escapeHtml(s.id)+'" style="box-sizing:border-box;max-width:100%;padding:clamp(36px,6vw,86px) 20px;text-align:center;background:#f2f6f2;color:#183024;border-top:1px solid #d8e5d8"><div style="max-width:900px;margin:auto"><h2 style="font-size:clamp(26px,4vw,44px);line-height:1.15;margin:0 0 16px;font-weight:750">'+escapeHtml(s.title)+'</h2><p style="margin:auto;max-width:650px;white-space:pre-line;font-size:clamp(15px,2vw,19px);line-height:1.75">'+escapeHtml(s.body)+'</p></div></section>').join("");
 return '<div data-pn-extra-sections="true" style="width:100%;max-width:100%;overflow:hidden">'+cards+'</div>';
}
export function appendExtraSections(html:string,raw:unknown):string{
 const markup=extraSectionsMarkup(raw);if(!markup)return html;
 // Insert just before main ends when possible, or before body for bespoke templates.
 const matches=[...html.matchAll(/<\/main\s*>/gi)];
 if(matches.length){const at=matches[matches.length-1].index!;return html.slice(0,at)+markup+html.slice(at);}
 return /<\/body>/i.test(html)?html.replace(/<\/body>/i,markup+"</body>"):html+markup;
}
