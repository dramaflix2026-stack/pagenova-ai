import {Children,cloneElement,isValidElement,type CSSProperties,type ReactNode} from "react";
import {resolveUniversalSection} from "../lib/builder-v2-universal-targets";
import type {UniversalSectionEvent,UniversalSectionReference} from "../lib/builder-v2-universal-operations";

/** Reorder approved React sections as whole units. No DOM mutation or replacement layouts. */
export function UniversalTemplateSections({site,children,customSectionTheme}:{site:{universalSectionStyles?:Record<string,{backgroundColor?:string;headingColor?:string;cardTitleColor?:string;descriptionColor?:string;cardDescriptionColor?:string;heroCenter?:boolean;entryAnimation?:string;cardRadius?:number}>;universalSectionEvents?:UniversalSectionEvent[];universalBanners?:{id:string;afterSection:string;beforeSection:string;text:string;backgroundColor:string;textColor:string}[];motion?:{sections?:Record<string,{effect?:string}>};blocks?:{id?:string;section?:string;type?:string;text?:string;src?:string;href?:string;align?:string;background?:string;color?:string;layout?:string}[]};children:ReactNode;customSectionTheme?:{background:string;color:string;accent:string}}){
 const events=site.universalSectionEvents;

 const nodes=Children.toArray(children);
 const keyOf=(node:ReactNode)=>isValidElement<{"data-universal-section"?:string}>(node)?node.props["data-universal-section"]:undefined;
 // Sections created through chat are real blocks, not a silent data-only update.
 const customKeys=[...new Set((site.blocks||[]).map(b=>b.section).filter((v):v is string=>typeof v==="string"&&v.startsWith("custom-")))];
 const templateNodes=nodes.filter(node=>keyOf(node));
 const inferredTheme=(section:string)=>{
  const first=(site.blocks||[]).findIndex(b=>b.section===section);
  const next=(site.blocks||[]).slice(first+1).find(b=>b.section&&!b.section.startsWith("custom-"))?.section;
  const candidate=templateNodes.find(node=>keyOf(node)==="processo")||templateNodes.find(node=>keyOf(node)===next)||templateNodes[0];
  const classes=isValidElement<{className?:string}>(candidate)?String(candidate.props.className||""):"";
  const background=classes.match(/(?:^|\\s)bg-\\[#([0-9a-fA-F]{6})\\]/)?.[1];
  const cardAccent=classes.match(/(?:^|\\s)border-t-\\[#([0-9a-fA-F]{6})\\]/)?.[1];
  const siteColor=(site.blocks||[]).find(b=>b.section==="processo"&&/^#[0-9a-f]{6}$/i.test(b.color||""))?.color;
  return {background:customSectionTheme?.background||(background?"#"+background:"#f8f5ef"),color:customSectionTheme?.color||"#26312c",accent:customSectionTheme?.accent||(cardAccent?"#"+cardAccent:siteColor||"#9b7951")};
 };
 const addedSections=customKeys.map(section=>{
  const parts=(site.blocks||[]).filter(b=>b.section===section);
  const theme=inferredTheme(section);
  // Natural-language section creation stores cards as heading/paragraph pairs.
  // Normalize those pairs into actual visual cards instead of rendering giant stacked headings.
  const pairedCards=parts.slice(1).flatMap((b,i)=>b.type==="heading"&&parts[i+2]?.type==="paragraph"?[{...parts[i+2],text:String(b.text||"")+": "+String(parts[i+2].text||""),layout:"grid" as const,_headingId:b.id}]:[]);
  const cardParts=pairedCards.length?pairedCards:parts.filter(b=>b.type==="paragraph"&&b.layout==="grid"&&typeof b.text==="string"&&b.text.includes(":"));
  const consumed=new Set(pairedCards.flatMap(b=>[b.id,b._headingId]));
  const editorialParts=parts.filter(b=>!consumed.has(b.id)&&!cardParts.some(c=>c.id===b.id));
  const hasPhotos=parts.some(b=>b.type==="image"&&b.src);
  return <section key={section} data-universal-section={section} data-pn-generated-premium="true" id={section} style={{padding:"clamp(3rem,7vw,6rem) 7%",background:theme.background,color:theme.color,width:"100%",borderTop:"1px solid rgba(100,100,100,.10)"}}>
   <style>{`section[data-pn-generated-premium="true"]{isolation:isolate;font-family:inherit}section[data-pn-generated-premium="true"] [data-universal-custom-cards]{align-items:stretch!important}section[data-pn-generated-premium="true"] [data-universal-custom-cards] article{display:flex!important;flex-direction:column!important;background:var(--pn-custom-card-bg)!important;color:var(--pn-custom-text)!important;border:1px solid var(--pn-custom-border)!important;border-top:3px solid var(--pn-custom-accent)!important;border-radius:14px!important;padding:clamp(18px,2.2vw,27px)!important;box-shadow:0 9px 24px rgba(16,30,45,.07)!important;min-height:0!important;transition:transform .22s ease,box-shadow .22s ease!important}section[data-pn-generated-premium="true"] [data-universal-custom-cards] article:hover{transform:translateY(-3px)!important;box-shadow:0 16px 32px rgba(16,30,45,.11)!important}section[data-pn-generated-premium="true"] [data-universal-custom-cards] article h3{font-size:clamp(1rem,1.35vw,1.2rem)!important;line-height:1.32!important;font-weight:700!important;margin:0 0 12px!important;letter-spacing:-.025em!important;min-height:2.64em!important}section[data-pn-generated-premium="true"] [data-universal-custom-cards] article p{font-size:clamp(.86rem,1.1vw,.95rem)!important;line-height:1.55!important;color:var(--pn-custom-description)!important;opacity:1!important;margin:0!important}section[data-pn-generated-premium="true"] [data-universal-custom-cards] article span{font-size:.73rem!important;line-height:1.2!important;margin-bottom:14px!important}section[data-pn-generated-premium="true"] [data-universal-custom-cards] article img{aspect-ratio:16/10!important;object-fit:cover!important;margin-bottom:16px!important} @media(max-width:600px){section[data-pn-generated-premium="true"] [data-universal-custom-cards]{grid-template-columns:1fr!important}section[data-pn-generated-premium="true"] [data-universal-custom-cards] article h3{min-height:0!important}}`}</style>
   <div style={{...({"--pn-custom-card-bg":"#f8f5ef","--pn-custom-text":theme.color,"--pn-custom-border":theme.accent+"55","--pn-custom-accent":theme.accent,"--pn-custom-description":theme.color+"cc"} as CSSProperties),maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:hasPhotos?"repeat(auto-fit,minmax(min(100%,280px),1fr))":"1fr",gap:"clamp(1.5rem,4vw,4rem)",alignItems:"center"}}>
    <div style={{display:"flex",flexDirection:"column",gap:20}}>{editorialParts.filter(b=>b.type!=="image").map((b,i)=>{
     if(b.type==="heading")return <h2 key={b.id||i} style={{fontFamily:"inherit",fontWeight:650,letterSpacing:"-.045em",fontSize:"clamp(1.9rem,3.4vw,3.3rem)",lineHeight:1.08,margin:0}}>{b.text}</h2>;
     if(b.type==="paragraph")return <p key={b.id||i} style={{fontSize:"clamp(1rem,1.4vw,1.15rem)",lineHeight:1.75,margin:0}}>{b.text}</p>;
     if(b.type==="button"&&b.href)return <a key={b.id||i} href={b.href} style={{display:"inline-block",alignSelf:"flex-start",padding:"16px 24px",background:customSectionTheme?.accent||"#34261d",color:"#fff7eb",fontWeight:700,textDecoration:"none"}}>{b.text}</a>;
     return null;
    })}</div>
    {parts.filter(b=>b.type==="image"&&typeof b.src==="string"&&/^https:\/\//i.test(b.src)).map((b,i)=><img key={b.id||i} src={b.src} alt={b.text||"Fotografia editorial ilustrativa"} loading="lazy" style={{width:"100%",height:"auto",maxHeight:570,aspectRatio:"4/3",objectFit:"cover",borderRadius:12}}/>)}
    {cardParts.length>0&&<div data-universal-custom-cards={section} style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:"clamp(14px,2vw,24px)",width:"100%"}}>
     {cardParts.map((b,i)=>{const label=String(b.text||"");const colon=label.indexOf(":");const title=label.slice(0,colon).trim();const generic=/^Etapa de .+ desenvolvida com planejamento, aten[cç][aã]o aos detalhes e acompanhamento profissional\.?$/i.test(label.slice(colon+1).trim());const architectureDescriptions:Record<string,string>={"imersão":"Escutamos suas necessidades, estudamos o espaço e identificamos oportunidades para construir um briefing preciso.","conceito":"Traduzimos suas referências em uma proposta arquitetônica com identidade, funcionalidade e coerência estética.","desenvolvimento":"Detalhamos soluções, materiais, iluminação e especificações para transformar o conceito em um projeto executável.","entrega":"Organizamos os documentos finais e orientações necessárias para que cada decisão seja implementada com segurança.","diagnóstico":"Realizamos vistoria inicial, identificamos condições estruturais e levantamos requisitos técnicos e normativos do empreendimento.","planejamento":"Definimos escopo, cronograma, recursos e etapas de engenharia para reduzir riscos e assegurar a viabilidade da obra.","execução":"Coordenamos a execução com acompanhamento técnico, controle de qualidade e atenção às normas de segurança.","entrega técnica":"Consolidamos laudos, registros e documentação técnica, verificando a conformidade dos serviços executados."};const description=generic?(architectureDescriptions[title.toLocaleLowerCase("pt-BR")]||label.slice(colon+1).trim()):label.slice(colon+1).trim();const stagePhotos:Record<string,string>={"diagnóstico":"photo-1497366754035-f200968a6e72","planejamento":"photo-1487958449943-2429e8be8625","execução":"photo-1511818966892-d7d671e672a2","entrega técnica":"photo-1600607687939-ce8a6c25118c"};const qualityIcons:Record<string,string>={"segurança":"◆","transparência":"◈","excelência técnica":"✦"};const qualityIcon=/compromisso com a qualidade/i.test(String(parts[0]?.text||""))?qualityIcons[title.toLocaleLowerCase("pt-BR")]:undefined;const stagePhoto=/metodologia/i.test(String(parts[0]?.text||""))?(stagePhotos[title.toLocaleLowerCase("pt-BR")]||["photo-1497366754035-f200968a6e72","photo-1487958449943-2429e8be8625","photo-1511818966892-d7d671e672a2","photo-1600607687939-ce8a6c25118c"][i]):undefined;const stagePhotoUrl=/metodologia/i.test(String(parts[0]?.text||""))&&typeof b.src==="string"&&/^https:\/\//i.test(b.src)?b.src:stagePhoto?"https://images.unsplash.com/"+stagePhoto+"?auto=format&fit=crop&w=850&q=82":undefined;return <article key={b.id||i} style={{background:"var(--pn-custom-card-bg)",color:"var(--pn-custom-text)",border:"1px solid var(--pn-custom-border)",borderTop:"3px solid var(--pn-custom-accent)",borderRadius:16,padding:"clamp(20px,2.2vw,30px)",minWidth:0,boxShadow:"0 9px 24px rgba(16,30,45,.07)"}}>
      {qualityIcon&&<span aria-hidden="true" style={{fontSize:32,color:"#9b805c",marginBottom:18}}>{qualityIcon}</span>}{stagePhotoUrl&&<img src={stagePhotoUrl} alt={"Fotografia ilustrativa da etapa de "+title.toLocaleLowerCase("pt-BR")} loading="lazy" style={{display:"block",width:"100%",height:"auto",aspectRatio:"4/3",objectFit:"cover",borderRadius:12,marginBottom:20}}/>}<span aria-hidden="true" style={{display:"block",fontSize:12,letterSpacing:".18em",opacity:.55,marginBottom:14}}>{String(i+1).padStart(2,"0")}</span><h3 style={{fontSize:"clamp(1.2rem,1.7vw,1.55rem)",lineHeight:1.2,margin:"0 0 14px",letterSpacing:"-.025em"}}>{title}</h3><p style={{fontSize:14,lineHeight:1.65,margin:0}}>{description}</p>
     </article>})}
    </div>}
   </div>
  </section>;
 });
 const sectionNodes=[...nodes.filter(node=>keyOf(node)),...addedSections];
 // Duplicate section identifiers make reordering ambiguous. Preserve the approved
 // composition instead of silently dropping one of the React sections.
 const keys=sectionNodes.map(node=>keyOf(node)!);
 if(new Set(keys).size!==keys.length)return <>{children}</>;
 const decorated=sectionNodes.map(node=>{
  const key=keyOf(node)!;
  if(!isValidElement<{style?:CSSProperties;children?:ReactNode}>(node))return node;
  // Generated briefs may store "servicos"/"services" while the approved
  // visual renderer exposes "especialidades". Resolve both to the same section.
  const siteInventory={blocks:(site.blocks||[]).map((b,i)=>({id:b.id||"block-"+i,type:b.type||"paragraph",section:b.section||"",text:b.text||""}))};
  const persistedKey=resolveUniversalSection(siteInventory,key);
  const sectionStyles=site.universalSectionStyles?.[key]||(persistedKey?site.universalSectionStyles?.[persistedKey]:undefined);
  const background=sectionStyles?.backgroundColor??site.blocks?.find(block=>block.section===(persistedKey||key)&&typeof block.background==="string")?.background;
  const headingColor=sectionStyles?.headingColor;
  const explicitMotion=site.motion?.sections?.[key];
  const style=background?{...node.props.style,backgroundColor:background}:node.props.style;
  const scope='[data-universal-section="'+key+'"]';
  const darkBackground=Boolean(background&&/^#[0-9a-f]{6}$/i.test(background)&&((parseInt(background.slice(1,3),16)*299+parseInt(background.slice(3,5),16)*587+parseInt(background.slice(5,7),16)*114)/1000)<145);
  const rules=[
   background&&/^#[0-9a-f]{6}$/i.test(background)?scope+'{background:'+background+'!important;background-color:'+background+'!important}'+scope+' > div:not([data-universal-custom-cards]){background-color:transparent!important}'+(darkBackground?scope+' h2,'+scope+' .tp2m2-title h2,'+scope+' .tp2m2-title em,'+scope+' .tp2m2-label,'+scope+' [class*=label],'+scope+' [class*=eyebrow],'+scope+' [class*=kicker],'+scope+' [class*=subtitle],'+scope+' > p{color:#f2eee7!important}':''):'',
   darkBackground&&key==="numeros"?scope+' article{background:#152c42!important;border:1px solid rgba(221,231,238,.25)!important;border-left:3px solid #93b6ce!important;border-radius:14px!important;color:#f5f7f9!important;box-shadow:0 14px 32px rgba(0,0,0,.14)!important}'+scope+' article h3{color:#fff!important;font-size:clamp(1rem,1.5vw,1.25rem)!important;line-height:1.3!important;font-weight:700!important;min-height:2.6em!important}'+scope+' article p{color:#d1dce4!important;font-size:clamp(.87rem,1.12vw,.98rem)!important;line-height:1.6!important}'+scope+' article span{color:#b6d0df!important}':'',
   headingColor&&/^#[0-9a-f]{6}$/i.test(headingColor)?scope+' h1,'+scope+' h2,'+scope+' h3{color:'+headingColor+'!important}':'',
   sectionStyles?.cardTitleColor&&/^#[0-9a-f]{6}$/i.test(sectionStyles.cardTitleColor)?scope+' article h3,'+scope+' article h4{color:'+sectionStyles.cardTitleColor+'!important}':'',
   // Explicit card palette must also recolor the card surface for legible contrast.
   sectionStyles?.cardTitleColor&&/^#[0-9a-f]{6}$/i.test(sectionStyles.cardTitleColor)&&darkBackground?scope+' article{background-color:#242424!important;background:#242424!important;border-color:rgba(255,255,255,.16)!important}':'',
   sectionStyles?.cardDescriptionColor&&/^#[0-9a-f]{6}$/i.test(sectionStyles.cardDescriptionColor)?scope+' article p,'+scope+' article [class*=description]{color:'+sectionStyles.cardDescriptionColor+'!important}':'',
   sectionStyles?.descriptionColor&&/^#[0-9a-f]{6}$/i.test(sectionStyles.descriptionColor)?scope+' > p,'+scope+' > div > p{color:'+sectionStyles.descriptionColor+'!important}':'',
   sectionStyles?.heroCenter?scope+' .tp2m2-hero-copy,'+scope+' .tp2m3-hero-copy{margin-inline:auto!important;text-align:center!important;align-items:center!important}'+scope+' h1,'+scope+' h1+p,'+scope+' .tp2m2-button{margin-inline:auto!important;text-align:center!important}':'',
   typeof sectionStyles?.cardRadius==='number'&&sectionStyles.cardRadius>=0&&sectionStyles.cardRadius<=64?scope+' article{border-radius:'+sectionStyles.cardRadius+'px!important;overflow:hidden}':'',
   sectionStyles?.entryAnimation==='fade'?'@keyframes pnUniversalHeroEntrance{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}'+scope+' h1{animation:pnUniversalHeroEntrance .75s ease-out both}':''
  ].filter(Boolean).join("");
  const headingOverride=rules?<style key={"universal-visual-"+key}>{rules}</style>:null;
  return cloneElement(node,{
   ...({"data-section-id":key} as object),
   ...(explicitMotion?.effect&&explicitMotion.effect!=="none"?{"data-pn-motion-auto":""}:{}),
   ...(style?{style}:{}),
   ...(headingOverride?{children:<>{node.props.children}{headingOverride}</>}: {})
  });
 });
 const byKey=new Map(decorated.map(node=>[keyOf(node)!,node]));
 const inventory={blocks:[...byKey.keys()].map(id=>({id,section:id,type:"heading",text:id}))};
 const keyFor=(reference?:UniversalSectionReference)=>reference&&typeof reference.id==="string"&&(resolveUniversalSection(inventory,reference.id)||(typeof reference.label==="string"?resolveUniversalSection(inventory,reference.label):null));
 const order=[...byKey.keys()],visible=new Set(order);
 // Custom sections follow their saved block position, not the end of the page.
 for(const custom of customKeys){
  const first=(site.blocks||[]).findIndex(b=>b.section===custom);
  if(first<0||!order.includes(custom))continue;
  const next=(site.blocks||[]).slice(first+1).find(b=>b.section&&b.section!==custom&&order.includes(b.section)&&!b.section.startsWith("custom-"))?.section;
  if(!next)continue;
  order.splice(order.indexOf(custom),1);
  order.splice(order.indexOf(next),0,custom);
 }
 for(const event of Array.isArray(events)?events:[]){
  if(!event||!event.section||typeof event.section.id!=="string")continue;
  const source=keyFor(event.section);if(!source)continue;
  if(event.action==="remove"){visible.delete(source);continue;}
  if(event.action==="restore"){visible.add(source);continue;}
  if(event.action!=="move")continue;
  const target=keyFor(event.before||event.after);
  if((event.before||event.after)&&(!target||target===source||!visible.has(target)))continue;
  // Removed sections are not valid movement anchors; retain the last safe order.
  order.splice(order.indexOf(source),1);
  const index=target?order.indexOf(target)+(event.after?1:0):0;
  order.splice(index,0,source);
 }
 const sorted=order.filter(key=>visible.has(key)).map(key=>byKey.get(key)!);
 const banners=Array.isArray(site.universalBanners)?site.universalBanners:[];
 const withBanners:ReactNode[]=[];
 for(let i=0;i<sorted.length;i++){
  const node=sorted[i],section=keyOf(node)!;
  withBanners.push(node);
  for(const banner of banners){
   if(banner.afterSection!==section||keyOf(sorted[i+1])!==banner.beforeSection)continue;
   if(!/^#[0-9a-f]{6}$/i.test(banner.backgroundColor)||typeof banner.text!=="string")continue;
   withBanners.push(<section key={banner.id} data-universal-section={banner.id} style={{backgroundColor:banner.backgroundColor,color:banner.textColor||"#FFFFFF",padding:"clamp(3rem,7vw,6rem) 7%",textAlign:"center",width:"100%"}}><p style={{fontSize:"clamp(1.4rem,3vw,2.8rem)",lineHeight:1.3,margin:0}}>{banner.text}</p></section>);
  }
 }
 let inserted=false;
 return <>{nodes.flatMap(node=>{if(!keyOf(node))return [node];if(inserted)return [];inserted=true;return withBanners;})}</>;
}
