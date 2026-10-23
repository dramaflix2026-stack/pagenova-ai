"use client";
import { useEffect, useRef } from "react";
import nichePhotoCatalog from "@/lib/niche-photo-catalog.json";
import { attachSiteMotion, type SiteMotion } from "@/lib/site-builder-animation";
import "@/app/app/builder-v2/motion.css";
const nichePhotoBase="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";

type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; mobileSrc?: string; section?: string; fontSize?: number; radius?: number; spacing?: number; href?: string; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
export type BuilderV2SiteData = { title: string; background: string; blocks: Block[]; id?: string; niche?: string; publishedUrl?: string; motion?: SiteMotion; footer?: { cnpj?: string; address?: string; email?: string; instagram?: string; facebook?: string; youtube?: string; whatsapp?: string; showMenu?: boolean } };
type ChatMessage = { role: "user" | "assistant"; text: string };
type SavedVersion = { id: string; at: string; label: string; site: Site };
const initial: Site = { title: "Novo projeto", background: "#ffffff", blocks: [], motion: {preset:"professional"} };
const premiumThemes = {
  legal: {dark:"#101d33",accent:"#c9b782",light:"#f7f5ef"},
  health: {dark:"#164b3b",accent:"#d7e9df",light:"#f6f9f7"},
  creative: {dark:"#202327",accent:"#e5cbb3",light:"#f7f5f1"}
};
function readableColor(color:string,background:string) {
  const rgb=(value:string)=>{const v=value.trim().replace("#","");if(!/^[0-9a-f]{6}$/i.test(v))return null;return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));};
  const fg=rgb(color),bg=rgb(background);
  if(!fg||!bg)return color;
  const l=(v:number[])=>v[0]*.2126+v[1]*.7152+v[2]*.0722;
  const contrast=(a:number,b:number)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  if(contrast(l(fg),l(bg))>=4.5)return color;
  return l(bg)>.4?"#24332e":"#f8f5e9";
}
const designPresets = [
 {id:"legal",match:/advoga|jurid|direito|escritorio/i,hero:"editorial",card:"bordered",accent:"#c9b782"},
 {id:"health",match:/clinic|odonto|medic|saude|terapia/i,hero:"split",card:"soft",accent:"#a6cbb9"},
 {id:"commerce",match:/loja|moda|produto|ecommerce|roupa/i,hero:"split",card:"soft",accent:"#e2a86c"},
 {id:"general",match:/.*/,hero:"editorial",card:"bordered",accent:"#c9b782"}
] as const;

export function BuilderV2Site({site,selectedNiche="",publishedMode=false}:{site:BuilderV2SiteData;selectedNiche?:string;publishedMode?:boolean}) {
  const previewRef=useRef<HTMLDivElement>(null);
  useEffect(()=>attachSiteMotion(previewRef.current,site.motion),[site]);
  const stripLayoutMetadata = (value:string) => value.replace(/\b(?:hero|tratamentos?|apresenta[cç][aã]o|diferenciais|galeria|contato|faq)\s+layout\s+(?:hero|grid|split|banner|faq|gallery|standard)?\s*(?:com\s+)?(?:fundo\s+)?(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto)?/giu,"").replace(/\b(?:layout\s+(?:hero|grid|split|banner|faq|gallery|standard)|fundo\s+(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto))\b/giu,"").replace(/\s{2,}/g," ").trim();
  // Presentation metadata is not customer-facing content.
  const removeVisualDirectives = (value:string) => value
    .replace(/(?:\s*[-–—,;]\s*)?(?:background|fundo)\s*:?\s*(?:#[0-9a-f]{3,8}\b|white\b|black\b|transparent\b|branco\b|preto\b)/giu,"")
    .replace(/\s*[-–—,;]\s*$/u,"").replace(/\s*[,;]\s*$/u,"").trim();
  const publicHeading = (value:string,section:string) => {
    const cleaned=removeVisualDirectives(stripLayoutMetadata(value)).replace(/\s*[-–—,;]\s*$/u,"").trim();
    const title=/galeria|gallery|portf[oó]lio/i.test(section)
      ? cleaned.replace(/\s+(?:claro|escuro)\s*$/iu,"").trim()
      : cleaned;
    if(title&&!/^(?:hero|grid|split|banner|standard|gallery|faq)$/i.test(title))return title;
    return /tratament|servi[cç]/i.test(section)?"Nossos tratamentos":/apresent|sobre|cl[ií]nica/i.test(section)?"Conheça nosso espaço":/diferenc|escolh/i.test(section)?"Por que nos escolher":/galeria|resultad/i.test(section)?"Galeria de imagens":/contato|agend/i.test(section)?"Entre em contato":/faq|pergunt/i.test(section)?"Dúvidas frequentes":"Conheça nossos serviços";
  };
  const isDesignInstruction = (value:string) => /(?:hero\\s+layout|background\\s*#(?:[0-9a-f]{3,8})|layout\\s+(?:grid|split|standard)|fundo\\s+(?:marfim|branco|azul.marinho)|bordas?\\s+douradas?|[ií]cones?\\s+dourados?|imagem\\s+(?:a adicionar|impactante)|t[ií]tulo principal impactante|subt[ií]tulo suave|cabe[cç]alho elegante e responsivo)/i.test(value);
  const previewBlocks = site.blocks.filter(b=>(b.type==="heading"||!isDesignInstruction(b.text)) && (b.type!=="image" || !!b.src)).map(b=>({...b,section:b.section||"principal"}));
  const missingContact = previewBlocks.length>0 && !site.blocks.some(b=>/contato|agendamento|whatsapp/i.test(b.section||""));
  const sections = previewBlocks.reduce<Array<{id:string;blocks:Block[]}>>((acc,block)=>{
    const id = block.section || "principal";
    const existing = acc.find(group=>group.id===id);
    if(existing) existing.blocks.push(block);
    else acc.push({id,blocks:[block]});
    return acc;
  },[]);
  // A single source of truth for preview and footer navigation. Do not hide
  // service cards simply because the AI wrote a short (but valid) description.
  const visibleSections=sections.filter(group=>{
    const id=group.id.toLowerCase();
    const heading=group.blocks.find(b=>b.type==="heading")?.text||"";
    const label=id+" "+heading;
    const paragraphs=group.blocks.filter(b=>b.type==="paragraph"&&removeVisualDirectives(b.text).trim().length>12);
    const pictures=group.blocks.filter(b=>b.type==="image"&&!!b.src);
    const meaningful=paragraphs.filter(b=>!/^\s*(?:acompanhe|saiba mais|conheça mais|em breve|descubra)/i.test(b.text)).length;
    if(/conte[uú]do|artigo|blog|not[ií]cia|publica[cç][aã]o|sa[uú]de mental/i.test(label)&&meaningful<2)return false;
    const buttons=group.blocks.filter(b=>b.type==="button");
    const contact=/contato|agend|fale.conosco|fale-conosco/i.test(label);
    const faq=/faq|perguntas|d[uú]vidas/i.test(label);
    const gallery=/galeria|portf[oó]lio|fotos|imagens/i.test(label);
    const editorial=/conte[uú]do|artigo|blog|not[ií]cia|publica[cç][aã]o|dicas|recursos/i.test(label);
    if(editorial&&(paragraphs.length<2||pictures.length===0))return false;
    if(gallery&&pictures.length===0)return false;
    if(faq&&paragraphs.length===0)return false;
    if(!contact&&paragraphs.length===0&&pictures.length===0&&buttons.length===0)return false;
    return true;
  }).filter((group,index,all)=>{
    const contact=(item:{id:string;blocks:Block[]})=>/contato|agend|fale.conosco|fale-conosco/i.test(item.id+" "+item.blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "));
    return !contact(group)||all.findIndex(contact)===index;
  });
  const footerCandidates=visibleSections.filter(g=>!/rodape|footer|faq/i.test(g.id));
  const footerContact=footerCandidates.find(g=>/contato|agend|fale.conosco|fale-conosco/i.test(g.id+" "+g.blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" ")));
  const footerNavSections=[
    ...footerCandidates.filter(g=>g!==footerContact).slice(0,footerContact?5:6),
    ...(footerContact?[footerContact]:[])
  ];

  return (
        <section className={publishedMode ? "w-full bg-white text-black" : "overflow-hidden rounded-2xl border border-white/15 bg-white text-black"}>{!publishedMode&&<div className="flex items-center justify-between border-b border-black/10 px-6 py-4"><span className="font-bold">{site.title}</span><span className="text-xs text-gray-500">Animações: {site.motion?.preset==="none"?"desligadas":site.motion?.preset==="dynamic"?"dinâmicas":"profissionais"} · Prévia responsiva</span></div>}<div ref={previewRef} className="pn-motion-site" style={{backgroundColor:site.background}}>{!site.blocks.length && <div className="flex min-h-[420px] flex-col items-center justify-center px-8 py-16 text-center"><p className="text-2xl font-bold text-slate-900">Seu site ainda não foi gerado</p><p className="mt-3 max-w-md text-slate-600">Escreva no chat, por exemplo: Faça um site premium para advogados. Depois clique em Enviar e aplicar.</p></div>}{visibleSections.map((group,index)=>{
          const blocks=group.blocks;
          const first=blocks[0];
          const id=group.id.toLowerCase();
          const layout=(/pergunt|faq/i.test(id+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "))?"faq":undefined) || (/galeria|foto|portf[oó]lio/i.test(id)?"gallery":undefined) || first?.layout || (/servic|tratament|especialidade|benefic|diferencia|atuacao|atua[cç][aã]o|processo|etapas/.test(id)?"grid":/pergunt|faq/.test(id)?"faq":/galeria|foto/.test(id)?"gallery":/equipe|estrutura|sobre|institucional/.test(id)?"split":index===0?"hero":"standard");
          const preset=designPresets.find(p=>p.match.test(site.title))||designPresets[3];
          const theme = /advoga|jurid|direito|escritorio/i.test(site.title) ? premiumThemes.legal : /clinic|odonto|medic|saude/i.test(site.title) ? premiumThemes.health : premiumThemes.creative;
          // Incomplete editorial sections must not reserve empty space in the published page.
          if(/conte[uú]do|artigo|blog|not[ií]cia|publica[cç][aã]o/i.test(id) && blocks.filter(b=>b.type==="paragraph"&&removeVisualDirectives(b.text).trim().length>80).length<2)return null;
          const sectionBackground=first?.background||(index===0?theme.dark:index%2?theme.light:site.background);
          if(blocks.filter(b=>b.type==="heading").some(b=>/conte[uú]dos? sobre|artigos? sobre/i.test(b.text)) && !blocks.some(b=>b.type==="image"&&b.src)) return null;
          
          const heading=blocks.filter(b=>b.type==="heading").slice(0,1);
          const images=blocks.filter(b=>b.type==="image"&&!!b.src);
          const paragraphs=blocks.filter(b=>b.type==="paragraph");
          const buttons=blocks.filter(b=>b.type==="button");
          const visualLayout=layout==="standard"&&paragraphs.length>=3?"grid":layout;
          const editorialTone=/est[eé]tica|beleza|spa|luxo|premium|arquitetura|interior|moda/i.test(site.title+" "+group.id);
          const displayFont=editorialTone?"Georgia, Times New Roman, serif":"inherit";
          const isGallery=visualLayout==="gallery"||/portf[oó]lio|galeria/i.test(id+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "));
          const clean=(value:string)=>removeVisualDirectives(value).replace(/\s*[-–—]\s*(?:(?:grid|hero|faq|banner|split|standard|gallery)|(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto))(?:\s*[-–—]\s*(?:(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto)))*/giu,"").replace(/\s*[-–—,;]?\s*(?:layout|design|background|fundo)\s*:\s*[^,;]+/giu,"").replace(/\s*[-–—]\s*$/u,"").trim();
          const textItems=paragraphs.filter(b=>!/^\s*\(?(apresente|adicione|insira|coloque|crie)\s.+layout/i.test(b.text));
          const galleryImages:Block[]=isGallery?(()=>{
            const existing=images.filter((b,i,all)=>!!b.src&&all.findIndex(p=>p.src===b.src)===i).slice(0,6);
            if(existing.length>=3)return existing;
            // Fill only missing gallery slots with the already generated photo bank; never overwrite an uploaded photo.
            const bankCatalog=nichePhotoCatalog as Record<string,{desktop:string[];mobile:string[]}>;
            const titleAndHeadings=(site.title+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" ")).toLocaleLowerCase("pt-BR");
            const bankKey=(selectedNiche&&bankCatalog[selectedNiche]?selectedNiche:undefined)
              ||Object.keys(bankCatalog).find(name=>titleAndHeadings.includes(name.toLocaleLowerCase("pt-BR")))
              ||(/psicolog/i.test(titleAndHeadings)?"Psicologia":undefined);
            const bank=bankKey?bankCatalog[bankKey]:undefined;
            const fallback:Block[]=bank?[3,4,5,2,1,0].filter(i=>!!bank.desktop[i]&&!!bank.mobile[i]).map(i=>({id:"gallery-niche-"+i,type:"image",text:"Fotografia ilustrativa",color:"#ffffff",align:"center",section:group.id,src:nichePhotoBase+bank.desktop[i]+".png",mobileSrc:nichePhotoBase+bank.mobile[i]+".png"})):[];
            return [...existing,...fallback].filter((b,i,all)=>!!b.src&&all.findIndex(p=>p.src===b.src)===i).slice(0,3);
          })():images;
          const cardItems=isGallery?galleryImages:textItems.slice(0,6);
          const isProcess=/etapas|processo|passos|como-funciona|atendimento|metodologia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const isPrinciples=/princip|diferencia|valores|filosofia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const processPhotos=isProcess?Array.from(new Map(previewBlocks.filter(b=>b.type==="image"&&!!b.src).map(b=>[b.src,b])).values()).slice(0,6):[];
          const cardText=(b:Block)=>{const parts=clean(b.text).split(/:\s|\s[—–]\s/);const description=parts.length>1?parts.slice(1).join(" — ").trim():clean(b.text);const name=parts.length>1?parts[0].trim():"";return {name,description:name&&description.toLocaleLowerCase("pt-BR").startsWith(name.toLocaleLowerCase("pt-BR"))?description.slice(name.length).replace(/^[\s,.:—–-]+/,"").trim()||description:description};};
          const safeColor=(color:string)=>{const c=readableColor(color,sectionBackground);const lightBackground=/^#(?:[cdef][0-9a-f]|f[0-9a-f]|[a-f]{3})/i.test(sectionBackground)||/^(white|#fff(?:fff)?)$/i.test(sectionBackground);if(lightBackground&&(/^#(?:[cdef][0-9a-f]|f[0-9a-f])/i.test(c)||/^(?:white|#fff(?:fff)?)$/i.test(c)))return "#26382f";const dark=/^#(?:1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(sectionBackground);return dark&&/^#(?:0[0-9a-f]|1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(c)?"#f7f4eb":c;};
          const render=(b:Block)=> {
            if(b.type==="heading") return <h2 key={b.id} data-block-id={b.id} style={{textAlign:b.align,color:safeColor(b.color),fontFamily:displayFont,fontSize:b.fontSize?`${b.fontSize}px`:undefined}} className={visualLayout==="hero"?"max-w-3xl text-[clamp(2rem,4.2vw,3.9rem)] font-medium leading-[1.04] tracking-[-.05em]":"max-w-3xl text-[clamp(1.75rem,3.2vw,3rem)] font-medium leading-[1.1] tracking-[-.045em]"}>{publicHeading(b.text,id)}</h2>;
            if(b.type==="paragraph") return <p key={b.id} data-block-id={b.id} style={{textAlign:b.align,color:readableColor(safeColor(b.color),sectionBackground),fontSize:b.fontSize?`${b.fontSize}px`:undefined}} className="max-w-2xl text-[15px] leading-[1.65] md:text-lg">{clean(b.text).replace(/(?:telefone\s*:\s*)?\(?11\)?\s*1234[-\s]?5678/gi,"")}</p>;
            if(b.type==="image") return b.src?<picture key={b.id} data-block-id={b.id}>{b.mobileSrc&&<source media="(max-width: 767px)" srcSet={b.mobileSrc}/>}<img src={b.src} alt={b.text||"Fotografia do negócio"} loading="lazy" onError={event=>{const img=event.currentTarget;if(img.dataset.fallbackAttempted)return;img.dataset.fallbackAttempted="true";const niche=Object.keys(nichePhotoCatalog).find(name=>site.title.toLocaleLowerCase("pt-BR").includes(name.toLocaleLowerCase("pt-BR")))||(/psicolog|terap/i.test(site.title)?"Psicologia":undefined);const entry=niche?(nichePhotoCatalog as Record<string,{desktop:string[];mobile:string[]}>)[niche]:undefined;const candidates=entry?.desktop||[];if(candidates.length){const source=img.parentElement?.querySelector("source");source?.remove();img.src=nichePhotoBase+candidates[Math.abs(b.id.split("").reduce((n,c)=>n+c.charCodeAt(0),0))%candidates.length]+".png";}else{img.style.display="none";}}} className="aspect-[4/3] w-full rounded-2xl object-cover"/></picture>:null;
            return <span key={b.id} className="flex w-full" style={{justifyContent:b.align==="center"?"center":b.align==="right"?"flex-end":"flex-start"}}><a data-block-id={b.id} href={b.href&&/^(https?:\/\/|mailto:|tel:|#)/.test(b.href)?b.href:(/agend|contato|convers|consulta|orçamento|saiba mais/i.test(b.text)?"#contato":undefined)} style={{backgroundColor:b.color,color:readableColor("#ffffff",b.color)}} className="inline-flex min-h-12 items-center justify-center rounded-xl px-7 py-3 text-sm font-semibold">{clean(b.text)}</a></span>;
          };
          const isContact=/contato|agend|fale.conosco/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const hasContactAction=buttons.some(b=>!!b.href&&/^(https?:\/\/|mailto:|tel:)/i.test(b.href));
          const sectionImages=isPrinciples?[]:isGallery?galleryImages:images;
          const uniqueImages=sectionImages.filter((b,i,all)=>!!b.src&&all.findIndex(other=>other.src===b.src)===i);
          const visualCards=cardItems.filter(b=>b.type==="paragraph").filter(b=>b.text.trim().length>0).filter(b=>!/^solu[cç][oõ]es sofisticadas/i.test(b.text.trim())).filter(b=>!/^\s*(?:conheça|descubra|oferecemos|apresentamos|explore)\b/i.test(b.text.trim())||/[:—–]/.test(b.text));
          const seenCardTitles=new Set<string>();
          const uniqueVisualCards=visualCards.filter(item=>{const title=cardText(item).name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ");if(!title)return true;if(seenCardTitles.has(title))return false;seenCardTitles.add(title);return true;});
          const sectionHasPhotos=uniqueImages.length>0&&visualCards.length>0;
          const isTreatments=/tratament|servi[cç]os|procediment/i.test(id);
          const isDifferentials=/diferencia|por.que|vantagen|escolher|escolha|excel[eê]ncia|compromisso|jornada|valores|filosofia|hist[oó]ria|ess[eê]ncia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const editorialCards=uniqueVisualCards.filter(item=>{const card=cardText(item);return card.description.length>8;});
          const editorialTitle=(item:Block,i:number)=>{const card=cardText(item);return card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(isDifferentials?["Atenção aos detalhes","Experiência acolhedora","Cuidado em cada etapa","Compromisso com você","Um espaço para você"][i%5]:["Cuidado personalizado","Conheça nossos serviços","Sua experiência","Nosso atendimento"][i%4]);};
          const useEditorialGrid=visualLayout==="grid"&&(isTreatments||isDifferentials)&&editorialCards.length>=2;
          const treatmentHasCompletePhotos=uniqueImages.length>=editorialCards.slice(0,6).length;
          const useTextOnlyTreatments=isTreatments&&!treatmentHasCompletePhotos;
          // Skip AI-generated sections without usable customer-facing content.
          const contentParagraphs=paragraphs.filter(b=>clean(b.text).length>35 && !isDesignInstruction(b.text));
          if(!images.length && !buttons.length && contentParagraphs.length===0 && !/faq|perguntas|d[uú]vidas|contato|agend/i.test(id))return null;
          const visibleHeading=heading.some(b=>publicHeading(b.text,id).trim().length>0);
          if(!visibleHeading && !images.length && !buttons.length) return null;
          const headingNode=<div className="mb-6 max-w-3xl space-y-3 md:mb-8">{heading.map(b=>isGallery&&b.type==="heading"&&/resultados/i.test(b.text)?render({...b,text:b.text.replace(/resultados/gi,"Imagens")}):render(b))}</div>;
          const imageNode=(b:Block,i:number)=><div key={b.id} className={i===0?"overflow-hidden rounded-[1.75rem]":"overflow-hidden rounded-2xl"}>{b.src?render(b):<div data-block-id={b.id} className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[#c5cbbf] bg-[#f1f1e9] text-center text-sm text-[#52615a]">{b.text||"Adicionar imagem"}</div>}</div>;
          if(isGallery&&galleryImages.length===0&&textItems.length===0&&buttons.length===0)return null;
          return <section id={isContact?"contato":group.id} key={group.id+"-"+index} data-section-id={group.id} style={{backgroundColor:sectionBackground}} className="scroll-mt-20 overflow-hidden px-5 py-9 sm:px-8 sm:py-12 md:px-14 md:py-14">
            <div className="mx-auto max-w-6xl">
              {isGallery?<>{headingNode}<div className="grid grid-cols-2 gap-3 md:hidden">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className={i===0?"col-span-2":""}>{imageNode(b,i)}</div>)}</div><div className="hidden md:grid md:grid-cols-2 md:gap-6">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className="grid min-w-0 items-center gap-4 rounded-2xl border border-[#e7e4dd] bg-white/70 p-4 lg:gap-5"><div className="">{imageNode(b,i)}</div><div className="min-w-0"><h3 className="mb-2 text-lg font-semibold leading-snug text-[#24332e]">{textItems[i]&&cardText(textItems[i]).name&&!/^(nossa atuação|conheça mais|saiba mais)$/i.test(cardText(textItems[i]).name)?cardText(textItems[i]).name:["Nosso espaço","Atendimento próximo","Cuidado em cada detalhe","Nossa equipe","Experiência e acolhimento","Conheça nosso trabalho"][i]}</h3><p className="text-sm leading-relaxed text-[#52615a]">{textItems[i]&&!/^(conheça mais sobre nosso trabalho|conheça nossa abordagem|nossa atuação)/i.test(cardText(textItems[i]).description)?cardText(textItems[i]).description:["Conheça os ambientes e os detalhes do nosso trabalho.","Uma experiência pensada para atender você com atenção.","Cada detalhe faz parte da nossa forma de trabalhar.","Pessoas e processos dedicados a um atendimento cuidadoso.","Compromisso com qualidade em cada etapa.","Descubra como podemos ajudar você."][i]}</p></div></div>)}</div></>:
              (visualLayout==="faq"||/faq|perguntas.frequentes/i.test(id))?<>{headingNode}<div className="mx-auto max-w-3xl space-y-3">{textItems.map(b=>{const at=b.text.indexOf("?");return <details key={b.id} className="group rounded-xl border border-[#e9e4da] bg-white px-5 py-4 text-[#24332e]"><summary className="cursor-pointer list-none font-semibold leading-snug">{at>=0?b.text.slice(0,at+1):b.text}<span className="float-right ml-3 text-lg">+</span></summary>{at>=0&&b.text.slice(at+1).trim()&&<p className="mt-3 border-t border-[#eee9e0] pt-3 text-sm leading-relaxed">{b.text.slice(at+1).trim()}</p>}</details>})}</div></>:
              (visualLayout==="hero"||visualLayout==="split")&&!isPrinciples?<div className={sectionImages.length?"grid items-center gap-6 md:grid-cols-2 md:gap-10":"mx-auto max-w-3xl"}>
                <div className="space-y-5">{blocks.filter(b=>b.type==="heading"||b.type==="button"||(b.type==="paragraph"&&textItems.slice(0,3).some(item=>item.id===b.id))).map(render)}</div>
                {sectionImages.length>0&&<div className="relative">{sectionImages.slice(0,1).map(imageNode)}</div>}
              </div>:
              useEditorialGrid?<div className="space-y-8 md:space-y-12">
                <div className="flex flex-col gap-4">{headingNode}</div>
                {(id==="servicos"||id==="diferenciais")?<div className="grid items-stretch gap-4 md:grid-cols-2">{editorialCards.slice(0,4).map((item,i)=>{const card=cardText(item);const photo=treatmentHasCompletePhotos?uniqueImages[i]:undefined;return <article key={item.id} data-block-id={item.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e7e4dd] bg-white shadow-[0_8px_30px_rgba(20,35,29,0.045)]">{photo&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{render(photo)}</div>}<div className="space-y-3 p-6 md:p-8"><span className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#718066]">{id==="servicos"?"Serviço":"Diferencial"} {String(i+1).padStart(2,"0")}</span><h3 className="font-serif text-[clamp(1.5rem,2vw,2rem)] leading-tight text-[#24332e]">{editorialTitle(item,i)}</h3><p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>:<div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">{!useTextOnlyTreatments&&uniqueImages[0]&&<div className="relative overflow-hidden rounded-[2rem] shadow-[22px_24px_0_-8px_rgba(113,128,102,.15)] [&_img]:aspect-[4/5] [&_img]:w-full [&_img]:object-cover">{render(uniqueImages[0])}</div>}<div className="divide-y divide-[#8a907e]/25">{editorialCards.slice(0,isTreatments?6:5).map((item,i)=>{const card=cardText(item);return <div key={item.id} data-block-id={item.id} className="grid grid-cols-[2.5rem_1fr] gap-4 py-5 first:pt-0"><span className="pt-1 text-xs font-semibold tracking-widest text-[#778567]">{String(i+1).padStart(2,"0")}</span><div><h3 className="font-serif text-[clamp(1.4rem,2vw,2rem)] leading-snug text-[#24332e]">{editorialTitle(item,i)}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></div>})}</div></div>}
                {buttons.length>0&&<div className="flex flex-wrap gap-3">{buttons.map(render)}</div>}
              </div>:
              (visualLayout==="grid"||isProcess||isPrinciples)&&!isContact?<>{headingNode}<div className="grid auto-rows-auto items-start gap-4 md:grid-cols-2 lg:grid-cols-3">{uniqueVisualCards.map((item,i)=>{const card=cardText(item);const photo=isPrinciples?undefined:isProcess?processPhotos[i%Math.max(1,processPhotos.length)]:sectionHasPhotos?uniqueImages[i]:undefined;return <article key={item.id} className={`group h-fit self-start overflow-hidden border border-[#e7e4dd] bg-white shadow-[0_8px_30px_rgba(20,35,29,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-lg ${isProcess?"rounded-lg border-l-4 border-l-[#9c947b]":"rounded-2xl"}`}>{photo&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:rounded-none [&_img]:object-cover">{render(photo)}</div>}<div className="p-5 md:p-7">{isProcess&&!/^\s*\d{1,2}\s*$/.test(card.name)&&<span className="mb-4 inline-flex rounded-lg bg-[#f5f0e4] px-3 py-2 text-xs font-semibold text-[#92773b]">{String(i+1).padStart(2,"0")}</span>}<h3 data-block-id={item.id} style={{color:/^#[0-9a-fA-F]{6}$/.test(item.color||"")?item.color:"#24332e"}} className="mb-2 text-lg font-bold leading-snug">{card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(card.description.split(/[,.]/)[0].trim().split(" ").slice(0,5).join(" ")||"Nossa proposta")}</h3><p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>{buttons.length>0&&<div className="mt-7 flex flex-wrap gap-3">{buttons.map(render)}</div>}</>:
              isContact||visualLayout==="banner"?<div className="mx-auto max-w-3xl space-y-5 text-center [&_h2]:mx-auto [&_h2]:text-center [&_p]:mx-auto [&_p]:text-center">{heading.map(render)}{textItems.filter(b=>!/\b(?:xx|xxx|rua principal|contato@clinic)/i.test(b.text)).slice(0,2).map(b=>isContact?render({...b,text:b.text.replace(/Use o formulário abaixo[^.]*\.?/gi,"Envie sua mensagem pelos canais de atendimento disponíveis.").replace(/formulário abaixo/gi,"canal de atendimento")}):render(b))}{buttons.map(render)}{isContact&&<form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const subject=encodeURIComponent("Contato pelo site "+site.title);const body=encodeURIComponent("Nome: "+data.get("name")+"\nE-mail: "+data.get("email")+"\nMensagem: "+data.get("message"));if(site.footer?.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.footer.email)){window.location.href="mailto:"+site.footer.email+"?subject="+subject+"&body="+body;}else{window.location.href="mailto:?subject="+subject+"&body="+body;}}} className="mx-auto mt-6 grid max-w-xl gap-4 rounded-2xl border border-[#e2dfd5] bg-white p-5 text-left shadow-sm sm:p-8"><p className="text-sm text-[#46534b]">Preencha os dados para preparar sua mensagem no aplicativo de e-mail. Configure o e-mail de destino para receber contatos diretamente.</p><label className="grid gap-2 text-sm font-medium text-[#24332e]">Nome<input name="name" required maxLength={100} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">E-mail<input name="email" type="email" required maxLength={160} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">Mensagem<textarea name="message" required maxLength={3000} rows={4} className="rounded-lg border border-[#d9ddd5] px-4 py-3 text-[#24332e]"/></label><button type="submit" className="min-h-12 rounded-xl bg-[#243e32] px-6 font-semibold text-white">Preparar mensagem</button></form>}</div>:
              <div className={sectionImages.length?"grid items-center gap-6 md:grid-cols-2 md:gap-10":"mx-auto max-w-3xl space-y-5"}><div className="space-y-5">{heading.map(render)}{textItems.slice(0,3).map(render)}{buttons.map(render)}</div>{sectionImages.slice(0,1).map(imageNode)}</div>}
            </div>
          </section>;
        })}{site.blocks.length>0&&<footer className="bg-[#102a22] px-6 py-12 text-[#f7f5ed] md:px-10 md:py-16 lg:px-16"><div className={`mx-auto grid max-w-6xl items-start gap-x-12 gap-y-10 border-b border-white/15 pb-12 ${site.footer?.cnpj||site.footer?.address||site.footer?.instagram||site.footer?.facebook||site.footer?.youtube||site.footer?.whatsapp?"md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,.9fr)]":"md:grid-cols-2"}`}><div className="min-w-0"><div className="mb-5 h-1 w-12 rounded-full bg-[#d4c19b]"/><p className="max-w-sm text-2xl font-bold leading-tight tracking-tight">{site.title.split(/\s+[–—-]\s+/)[0].trim()}</p><p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{/advoca|jur[ií]dic|direito/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Atuação jurídica com clareza e responsabilidade.":/arquitet|interior|atelier/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Arquitetura e interiores pensados para cada espaço.":/cl[ií]nica|sa[uú]de|est[eé]tica/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Informações e atendimento em um só lugar.":"Conheça nossos serviços e entre em contato."}</p></div><nav aria-label="Menu do rodapé" className="min-w-0"><h3 className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#d4c19b]">Explore</h3><div className="flex min-w-0 flex-col gap-3">{footerNavSections.map((g,i)=><a key={g.id} className="block w-full min-w-0 max-w-sm text-sm leading-relaxed text-white/70 break-normal transition hover:text-white" href={/contato|agend|fale.conosco/i.test(g.id)?"#contato":"#"+g.id}>{i===0?"Início":/tratament|serviç|produto/i.test(g.id)?"Serviços":/hist[oó]ria|sobre|cl[ií]nica|ess[eê]ncia/i.test(g.id)?"Sobre nós":/diferenc|escolh/i.test(g.id)?"Diferenciais":/galeria|ambiente|resultad/i.test(g.id)?"Galeria":/contato|agend/i.test(g.id)?"Contato":publicHeading(g.blocks.find(b=>b.type==="heading")?.text||g.id,g.id).replace(/:.*/,"")}</a>)}</div></nav>{(site.footer?.cnpj||site.footer?.address||site.footer?.instagram||site.footer?.facebook||site.footer?.youtube||site.footer?.whatsapp)&&<div className="min-w-0"><h3 className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#d4c19b]">Conecte-se</h3><div className="space-y-4 text-sm text-white/70">{site.footer?.cnpj&&<p><span className="mr-2 text-[#d4c19b]">▣</span>CNPJ: {site.footer.cnpj}</p>}{site.footer?.address&&<p><span className="mr-2 text-[#d4c19b]">⌖</span>{site.footer.address}</p>}<div className="flex flex-wrap gap-2">{([["Instagram",site.footer?.instagram],["Facebook",site.footer?.facebook],["YouTube",site.footer?.youtube],["WhatsApp",site.footer?.whatsapp]] as const).filter(entry=>!!entry[1]&&entry[1].startsWith("https://")).map(([label,url])=><a key={label} aria-label={label} href={url||"#"} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-xs font-bold text-white transition hover:border-[#d4c19b] hover:bg-white/10">{label==="Instagram"?"◎":label==="Facebook"?"f":label==="YouTube"?"▶":"✆"}</a>)}</div></div></div>}</div><div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-between gap-3 text-xs text-white/45"><span>© {new Date().getFullYear()} {site.title.split(/\s+[–—-]\s+/)[0].trim()}. Todos os direitos reservados.</span><span>Criado com PageNova AI</span></div></footer>}</div></section>
  );
}
