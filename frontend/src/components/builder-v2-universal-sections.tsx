import {Children,cloneElement,isValidElement,type CSSProperties,type ReactNode} from "react";
import {resolveUniversalSection} from "../lib/builder-v2-universal-targets";
import type {UniversalSectionEvent,UniversalSectionReference} from "../lib/builder-v2-universal-operations";

/** Reorder approved React sections as whole units. No DOM mutation or replacement layouts. */
export function UniversalTemplateSections({site,children,customSectionTheme}:{site:{universalSectionStyles?:Record<string,{backgroundColor?:string;headingColor?:string;cardTitleColor?:string;heroCenter?:boolean;entryAnimation?:string;cardRadius?:number}>;universalSectionEvents?:UniversalSectionEvent[];universalBanners?:{id:string;afterSection:string;beforeSection:string;text:string;backgroundColor:string;textColor:string}[];motion?:{sections?:Record<string,{effect?:string}>};blocks?:{id?:string;section?:string;type?:string;text?:string;src?:string;href?:string;align?:string;background?:string;color?:string;layout?:string}[]};children:ReactNode;customSectionTheme?:{background:string;color:string;accent:string}}){
 const events=site.universalSectionEvents;

 const nodes=Children.toArray(children);
 const keyOf=(node:ReactNode)=>isValidElement<{"data-universal-section"?:string}>(node)?node.props["data-universal-section"]:undefined;
 // Sections created through chat are real blocks, not a silent data-only update.
 const customKeys=[...new Set((site.blocks||[]).map(b=>b.section).filter((v):v is string=>typeof v==="string"&&v.startsWith("custom-")))];
 const addedSections=customKeys.map(section=>{
  const parts=(site.blocks||[]).filter(b=>b.section===section);
  const cardParts=parts.filter(b=>b.type==="paragraph"&&b.layout==="grid"&&typeof b.text==="string"&&b.text.includes(":"));
  const editorialParts=parts.filter(b=>!cardParts.includes(b));
  const hasPhotos=parts.some(b=>b.type==="image"&&b.src);
  return <section key={section} data-universal-section={section} id={section} style={{padding:"clamp(3rem,7vw,6rem) 7%",background:customSectionTheme?.background||"#f7f5f0",color:customSectionTheme?.color||"#232b34",width:"100%",borderTop:"1px solid rgba(100,100,100,.10)"}}>
   <div style={{maxWidth:1200,margin:"0 auto",display:"grid",gridTemplateColumns:hasPhotos?"repeat(auto-fit,minmax(min(100%,280px),1fr))":"1fr",gap:"clamp(1.5rem,4vw,4rem)",alignItems:"center"}}>
    <div style={{display:"flex",flexDirection:"column",gap:20}}>{editorialParts.filter(b=>b.type!=="image").map((b,i)=>{
     if(b.type==="heading")return <h2 key={b.id||i} style={{fontFamily:"inherit",fontWeight:650,letterSpacing:"-.045em",fontSize:"clamp(2rem,4vw,4.1rem)",lineHeight:1.08,margin:0}}>{b.text}</h2>;
     if(b.type==="paragraph")return <p key={b.id||i} style={{fontSize:"clamp(1rem,1.4vw,1.15rem)",lineHeight:1.75,margin:0}}>{b.text}</p>;
     if(b.type==="button"&&b.href)return <a key={b.id||i} href={b.href} style={{display:"inline-block",alignSelf:"flex-start",padding:"16px 24px",background:customSectionTheme?.accent||"#34261d",color:"#fff7eb",fontWeight:700,textDecoration:"none"}}>{b.text}</a>;
     return null;
    })}</div>
    {parts.filter(b=>b.type==="image"&&typeof b.src==="string"&&/^https:\/\//i.test(b.src)).map((b,i)=><img key={b.id||i} src={b.src} alt={b.text||"Fotografia editorial ilustrativa"} loading="lazy" style={{width:"100%",height:"auto",maxHeight:570,aspectRatio:"4/3",objectFit:"cover",borderRadius:12}}/>)}
    {cardParts.length>0&&<div data-universal-custom-cards={section} style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,235px),1fr))",gap:"clamp(14px,2vw,24px)",width:"100%"}}>
     {cardParts.map((b,i)=>{const label=String(b.text||"");const colon=label.indexOf(":");return <article key={b.id||i} style={{background:"rgba(255,255,255,.88)",border:"1px solid rgba(100,100,100,.14)",borderRadius:18,padding:"clamp(26px,3vw,38px)",minWidth:0,boxShadow:"0 18px 42px rgba(0,0,0,.045)"}}>
      <span aria-hidden="true" style={{display:"block",fontSize:12,letterSpacing:".18em",opacity:.55,marginBottom:22}}>{String(i+1).padStart(2,"0")}</span><h3 style={{fontSize:"clamp(1.25rem,2vw,1.75rem)",lineHeight:1.2,margin:"0 0 14px",letterSpacing:"-.025em"}}>{label.slice(0,colon).trim()}</h3><p style={{fontSize:15,lineHeight:1.7,margin:0}}>{label.slice(colon+1).trim()}</p>
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
  const rules=[
   background&&/^#[0-9a-f]{6}$/i.test(background)?scope+'{background-color:'+background+'!important}':'',
   headingColor&&/^#[0-9a-f]{6}$/i.test(headingColor)?scope+' h1,'+scope+' h2,'+scope+' h3{color:'+headingColor+'!important}':'',
   sectionStyles?.cardTitleColor&&/^#[0-9a-f]{6}$/i.test(sectionStyles.cardTitleColor)?scope+' article h3,'+scope+' article h4{color:'+sectionStyles.cardTitleColor+'!important}':'',
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
