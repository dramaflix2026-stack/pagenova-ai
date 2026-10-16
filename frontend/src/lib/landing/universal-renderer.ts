import {UNIVERSAL_TEMPLATE_HTML,UNIVERSAL_TEMPLATE_CSS} from "./universal-template";
import {UNIVERSAL_TEMPLATE_UTILITIES_CSS} from "./universal-generated-css";
import type {LandingProject} from "./engine";
import {withLandingInlineEditor} from "./inline-editor";

/**
 * Sales-page renderer based directly on the user's supplied TanStack/Lovable
 * template: DOM order, Tailwind CSS, artwork, typography and breakpoints.
 * Only factual, product-specific text and optional real proof are replaced.
 * Works both client-side for iframe preview and server-side for publication.
 */
const esc=(v:unknown)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;")
 .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const listItems=(values:string[],good:boolean)=>
 values.slice(0,5).map((value,i)=>'<li class="flex items-start gap-3">'+
  '<span class="ring mt-0.5 '+(good?'bg-success/15 text-success':'border border-destructive/25 bg-destructive/10 text-destructive')+'">'+(i+1)+'</span>'+
  '<span class="'+(good?'font-medium':'text-muted-foreground')+'">'+esc(value)+'</span></li>').join("");
const safeCheckout=(v:string)=>{
 try{const u=new URL(v);return u.protocol==="https:"?u.href:"";}catch{return "";}
};
function swapText(value:string,from:string,to:string){return value.replaceAll(from,esc(to));}
function replaceSection(html:string,index:number,transform:(section:string)=>string){
 const rx=/<section\b[^>]*>[\s\S]*?<\/section>/g;
 return html.replace(rx,section=>
   section.startsWith('<section data-pn-template-index="'+index+'"')?transform(section):section
 );
}
export function renderUniversalLanding(input:LandingProject,preview=false){
 const p=input,checkout=safeCheckout(p.ctaUrl),hasCheckout=!!checkout;
 const cta=hasCheckout?checkout:"#oferta";
 const btnLabel=hasCheckout?(p.ctaLabel&&/compr|adquir|garant/i.test(p.ctaLabel)?p.ctaLabel:"Quero acessar a oferta"):"Ver detalhes da oferta";
 const subject=p.name||"Produto digital";
 const before=(p.before||[]).filter(Boolean);
 const after=(p.after||[]).filter(Boolean);
 let index=0;
 let html=UNIVERSAL_TEMPLATE_HTML.replace(/<section\b/g,()=>'<section data-pn-template-index="'+index+++'"');
 if(p.heroImage&&(/^(?:https:\/\/|data:image\/(?:png|jpe?g|webp);base64,)/i).test(p.heroImage)){
  html=html.replace('src="/landing-universal/hero.webp"','src="'+esc(p.heroImage)+'"');
 }
 // First-class template text replacement (not a visually similar redraw).
 // Preserve the original heading node and highlighted underline instead
 // of concatenating the sample headline with the product-specific headline.
 const headline=p.headline||"Conheça "+subject;
 const words=headline.split(/\s+/);
 const headStart=words.length>5?words.slice(0,-3).join(" "):headline;
 const headMark=words.length>5?words.slice(-3).join(" "):"";
 html=html.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/,
  (_all,start,end)=>start+esc(headStart)+(headMark?' <span class="mark">'+esc(headMark)+'</span>':"")+end);
 html=swapText(html,
  "Sub-headline explicando como seu infoproduto resolve o problema do cliente de forma simples, rápida e sem enrolação.",
  p.subtitle||p.description);
 html=swapText(html,"Nome do Infoproduto",subject);
 html=swapText(html,"Nome da Empresa",subject);
 html=swapText(html,"Quero começar agora",btnLabel);
 html=html.replaceAll('href="#oferta"', 'href="'+esc(cta)+'"'+(hasCheckout?' target="_blank" rel="noopener noreferrer"':""));
 html=swapText(html,"Compra 100% segura · Acesso imediato · Garantia de 7 dias",
  hasCheckout?"Confira os termos e condições na página de pagamento.":"O link de pagamento será informado pelo responsável da oferta.");
 html=swapText(html,"MÉTODO COMPROVADO · +3.400 ALUNOS",p.eyebrow||"CONHEÇA O MATERIAL DIGITAL");
 html=swapText(html,"Oferta por tempo limitado","CONHEÇA A OFERTA");
 html=html.replace(/50% OFF encerra em\s*<span[^>]*>[\s\S]*?<\/span>/,"Confira detalhes e condições");
 html=html.replaceAll("+3.400","Conteúdo").replaceAll("pessoas transformadas","produto digital")
  .replaceAll("4,9/5",esc(p.price||"Oferta")).replaceAll("nota média dos alunos","preço informado");
 // Never display invented enrollment figures, conversion metrics or false urgency.
 html=html.replaceAll("MÉTODO COMPROVADO","CONTEÚDO DIGITAL");
 html=html.replaceAll("87% das vagas ocupadas","Confira as condições");
 html=html.replaceAll("MAIS VENDIDO","OFERTA DIGITAL");
 html=html.replaceAll("12 módulos em vídeo, passo a passo","Conteúdo descrito na oferta");
 html=html.replaceAll("Acesso vitalício ao conteúdo completo","Consulte o formato de acesso");
 html=html.replaceAll("Material de apoio em PDF para imprimir","Confira os arquivos incluídos");
 html=html.replaceAll("Todos os 3 bônus inclusos sem custo","Bônus somente quando confirmados");
 html=html.replaceAll("Suporte próximo durante 12 meses","Condições de suporte no checkout");
 html=html.replaceAll("12</b>","Produto</b>").replaceAll("módulos em vídeo","material anunciado");
 html=html.replaceAll("4,9 de 5 · avaliação de quem já comprou","Informações da oferta");
 html=swapText(html,"Tudo isso, liberado hoje",p.offer||"Conheça o que está incluído");
 html=swapText(html,"Acesso completo, vitalício e com todos os bônus.","Confira a descrição e as condições para acessar o material.");
 html=html.replace(/<p class="text-sm text-muted-foreground">De <s>R\$ 497<\/s> por apenas<\/p>[\s\S]*?<p class="mt-2 text-sm text-muted-foreground">ou R\$ 247 à vista no Pix<\/p>/,
  '<p class="text-sm text-muted-foreground">Preço informado</p><p class="mt-3 font-display text-5xl font-extrabold text-primary">'+esc(p.price||"Consulte o valor")+'</p>');
 html=html.replaceAll("Pix · Cartão em até 12x · Boleto","Consulte meios de pagamento e condições no checkout");
 html=html.replaceAll("Aulas diretas","Conheça o produto").replaceAll("em média 9 min cada","veja a descrição");
 html=html.replaceAll("Acesso imediato","Detalhes de acesso").replaceAll("liberado após o pagamento","consulte as condições");
 html=html.replaceAll("Passo a passo comprovado","Conteúdo apresentado");
 html=html.replaceAll("Compra 100% segura","Confira o checkout");
 html=swapText(html,"O que muda a partir da primeira semana","Antes e depois de conhecer o material");
 html=swapText(html,"Compare onde você está hoje com onde o método te leva — sem depender de sorte.",
  "Compare as situações e analise se o conteúdo faz sentido para você.");
 // Keep original 2-column comparison composition and replace only list items.
 html=replaceSection(html,2,section=>{
  let i=0;return section.replace(/<ul class="(?:relative )?mt-7 space-y-4">[\s\S]*?<\/ul>/g,()=>{
   const items=i++===0?(before.length?before:["Buscar referências em diferentes lugares","Comparar opções de conteúdos e materiais"]):
      (after.length?after:["Conhecer a proposta de "+subject,"Analisar os detalhes e as condições de acesso"]);
   return '<ul class="'+(i===1?"mt-7 space-y-4":"relative mt-7 space-y-4")+'">'+listItems(items,i!==1)+'</ul>';
  });
 });
 html=replaceSection(html,4,section=>{
  const items=(p.benefits||[]).filter(Boolean).slice(0,5);
  if(items.length){
   let n=0;
   section=section.replace(/<ul class="mt-7 space-y-4">[\s\S]*?<\/ul>/,()=>{
    return '<ul class="mt-7 space-y-4">'+items.map(x=>
     '<li class="flex items-start gap-3"><span class="mt-0.5 grid size-6 place-items-center rounded-full bg-success/15">'+
     '<span class="text-success">✓</span></span><span class="font-medium">'+esc(x)+'</span></li>').join("")+'</ul>';
   });
  }
  return section;
 });
 // Bonus cards and testimonials remain exactly in their template positions.
 // Unverified bonuses or invented social proof are never published.
 html=replaceSection(html,3,section=>{
  const bonuses=(p.bonuses||[]).filter(Boolean);
  if(!bonuses.length){
    if(!preview)return "";
    // The original example gifts must never be mistaken for a real offer.
    // A compact empty state preserves the section position without four
    // screens of giant demo icons before merchant content is supplied.
    return '<section class="border-y bg-muted/70 px-5 py-12">'+
      '<div class="mx-auto max-w-2xl text-center">'+
      '<span class="kicker kicker-center">BÔNUS EXCLUSIVOS</span>'+
      '<h2 class="mt-4 text-3xl font-extrabold">Bônus da sua oferta</h2>'+
      '<p class="mt-4 text-base leading-relaxed text-muted-foreground">Adicione bônus reais no editor para exibir os cards originais do template.</p>'+
      '</div></section>';
  }
  const article=/\<article\b[^>]*\>[\s\S]*?<\/article>/g;let i=0;
  section=section.replace(article,original=>{
   const value=bonuses[i++];
   if(!value)return "";
   return original.replace(/<h3[^>]*>[\s\S]*?<\/h3>/,'<h3 class="mt-6 text-xl font-extrabold">'+esc(value)+'</h3>')
    .replace(/<p class="mt-2 leading-relaxed text-muted-foreground">[\s\S]*?<\/p>/,
      '<p class="mt-2 leading-relaxed text-muted-foreground">Bônus informado pelo responsável pela oferta.</p>')
    .replace(/<s class="text-sm text-muted-foreground">[\s\S]*?<\/s>/,'')
    .replace(/GRÁTIS/g,"INCLUSO");
  });
  section=section.replace(/Valor total dos bônus:[\s\S]*?todos inclusos sem custo extra/,
   "Bônus incluídos conforme a descrição da oferta");
  return section;
 });
 html=replaceSection(html,5,section=>{
  const reviews=(p.testimonials||[]).filter(t=>t.confirmed&&t.photo&&t.quote&&t.city&&
    /^[A-Z]{2}$/.test(t.state||"")&&/^\S+\s+\S+/.test(t.author));
  if(!reviews.length){
    if(!preview)return "";
    return '<section class="px-5 py-12"><div class="mx-auto max-w-2xl text-center">'+
      '<span class="kicker kicker-center">DEPOIMENTOS</span>'+
      '<h2 class="mt-4 text-3xl font-extrabold">Experiências dos clientes</h2>'+
      '<p class="mt-4 text-base leading-relaxed text-muted-foreground">Adicione fotos e depoimentos verdadeiros autorizados no editor para preencher os cards de avaliações do template.</p>'+
      '</div></section>';
  }
  let n=0;return section.replace(/<article\b[^>]*>[\s\S]*?<\/article>/g,()=>{
   const t=reviews[n++];if(!t)return "";
   return '<article class="surface lift flex flex-col rounded-3xl p-8">'+
    '<p class="grow leading-relaxed italic">“'+esc(t.quote)+'”</p><div class="mt-6 flex items-center gap-3 border-t border-dashed pt-5">'+
    '<img class="size-12 rounded-full object-cover" src="'+esc(t.photo)+'" alt="Foto autorizada de '+esc(t.author)+'" loading="lazy">'+
    '<div><p class="font-bold">'+esc(t.author)+'</p><p class="text-sm text-muted-foreground">'+esc(t.city)+', '+esc(t.state)+'</p></div></div></article>';
  }).replaceAll("Quem aplicou, conta","O que os clientes relatam")
   .replaceAll("Histórias reais de alunos que estavam exatamente onde você está agora.","Depoimentos compartilhados com autorização dos clientes.");
 });
 html=replaceSection(html,6,section=>{
  if(p.guaranteeDays!==7)return "";
  section=swapText(section,"Garantia incondicional de 7 dias","Informações sobre a garantia de 7 dias");
  section=swapText(section,
   "Se por qualquer motivo você não gostar, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia, sem precisar explicar.",
   p.guaranteeText||"Consulte os termos e condições aplicáveis à garantia de 7 dias.");
  section=swapText(section,"Risco zero","Garantia da oferta");
  return section;
 });
 // Original artwork is illustrative, not fabricated product proof.
 html=html.replaceAll("Foto de aluno","Imagem ilustrativa do template");
 html=html.replaceAll("Curso online aberto em um notebook e em um celular sobre uma mesa","Imagem ilustrativa do produto digital");
 html=html.replaceAll("Contato: contato@seudominio.com",
  p.email?"Contato: "+esc(p.email):"Informações de contato disponíveis no checkout");
 html=html.replaceAll("Termos de Uso","Condições da oferta").replaceAll("Política de Privacidade","Privacidade");
 html=html.replaceAll('href="#"','href="#oferta"');
 html=html.replaceAll("Garantia incondicional","Garantia conforme condições aplicáveis");
 html=html.replace(/ data-pn-template-index="\d+"/g,"");
 // If the merchant has not provided a checkout, keep CTA as an offer anchor.
 // Don't imply that any purchase has happened.
 const fonts='<link rel="preconnect" href="https://fonts.googleapis.com">'+
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
  '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=DM+Sans:wght@400;500;700&family=Instrument+Serif:ital@0;1&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">';
 const css=UNIVERSAL_TEMPLATE_CSS+'\n'+UNIVERSAL_TEMPLATE_UTILITIES_CSS+
  '\nhtml{scroll-behavior:smooth}body{overflow-x:clip} .reveal{opacity:1!important;transform:none!important}'+
  '\n@media(max-width:640px){.btn-cta{max-width:100%;text-align:center;white-space:normal}}';
 const meta=esc(p.subtitle||p.description||subject);
 return withLandingInlineEditor('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta name="description" content="'+meta+'"><title>'+esc(subject)+'</title>'+fonts+
 '<style>'+css.replace(/<\/style/gi,"<\\/style")+'</style>'+ 
 '</head>'+
 '<body class="bg-background text-foreground">'+html+'</body></html>',p.inlineEdits,preview);
}
