"use client";
import {useEffect,useRef,useState} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import {attachSiteMotion} from "@/lib/site-builder-animation";
import {SiteWhatsAppButton} from "@/components/site-whatsapp-button";
import "./builder-v2-immersive-3d.css";

type B=BuilderV2SiteData["blocks"][number];
const bakeryHeroAssets=[{"src":"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/padaria-e-confeitaria/desktop-7f2bc3d0-91f7-4e91-9340-0e853fc8f67a.png","mobileSrc":"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/padaria-e-confeitaria/mobile-312c9a37-22bc-4421-b461-5e4e9a38f08f.png"},{"src":"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/padaria-e-confeitaria/desktop-7676d9bc-df4c-492a-9ef9-2c206fa00117.png","mobileSrc":"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/padaria-e-confeitaria/mobile-07b80773-0787-4d1e-9125-d01d4cf56dbb.png"},{"src":"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/padaria-e-confeitaria/desktop-d3d3bc5a-0d76-48bf-b1ed-b1a3c0ba9261.png","mobileSrc":"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/padaria-e-confeitaria/mobile-3385b267-bda7-4f83-9fc8-dd2463145a37.png"}];

export function BuilderV2Immersive3D({site}:{site:BuilderV2SiteData}){
 const root=useRef<HTMLDivElement>(null);
 const [bakeryFrame,setBakeryFrame]=useState(0);
 useEffect(()=>{if(typeof window==="undefined"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const id=window.setInterval(()=>setBakeryFrame(v=>(v+1)%bakeryHeroAssets.length),5500);return()=>window.clearInterval(id)},[]);
 useEffect(()=>attachSiteMotion(root.current,site.motion),[site]);
 const groups:{id:string;blocks:B[]}[]=[];
 for(const block of site.blocks){const id=block.section||"inicio";let g=groups.find(x=>x.id===id);if(!g){g={id,blocks:[]};groups.push(g)}g.blocks.push(block)}
 const brand=site.header?.brand||site.title;
 const nav=groups.filter(g=>g.id!=="inicio").slice(0,5);
 const niche=(site.niche||site.title).toLowerCase();
 const warm=/padaria|confeitaria|caf[eé]|restaurante|pizza|doce|hamburg/i.test(niche);
 const health=/cl[ií]nica|odont|medic|psico|est[eé]tica/i.test(niche);
 const accent=warm?"#d69d58":health?"#76b4a3":"#a5c78c";
 const background=warm?"#241c19":health?"#102c2b":"#152520";
 const photo=(b:B)=>b.mobileSrc||b.src||"";
 // Capas exclusivas do modo 3D; demais seções continuam usando as imagens existentes.
 const bakery=/padaria|confeitaria/i.test(niche);
 const heroImages=groups[0]?.blocks.filter(b=>b.type==="image"&&photo(b)).slice(0,3)||[];
 const text=(b:B)=>b.text||"";
 const media=(b:B,index:number)=><figure className={"pn3-photo pn3-photo-"+index} key={b.id}><picture>{b.mobileSrc&&<source media="(max-width: 640px)" srcSet={b.mobileSrc}/>}<img src={b.src||b.mobileSrc||""} alt={text(b)||"Fotografia do negócio"} loading={index===0?"eager":"lazy"} /></picture></figure>;
 return <div ref={root} className="pn3-root pn-motion-site" style={{"--pn3-accent":accent,"--pn3-bg":background} as React.CSSProperties}>
  {site.header?.enabled!==false&&<header className="pn3-header"><a href="#inicio" className="pn3-brand">{site.header?.logoUrl?<img src={site.header.logoUrl} alt={brand}/>:brand}</a><nav aria-label="Navegação">{nav.map(g=><a key={g.id} href={"#"+g.id}>{text(g.blocks.find(b=>b.type==="heading")||g.blocks[0]).slice(0,24)}</a>)}</nav><a className="pn3-header-cta" href={site.header?.ctaHref||"#contato"}>{site.header?.ctaLabel||"Entre em contato"} ↗</a></header>}
  <main>{groups.map((g,i)=>{const headings=g.blocks.filter(b=>b.type==="heading"),paragraphs=g.blocks.filter(b=>b.type==="paragraph"),buttons=g.blocks.filter(b=>b.type==="button"),images=g.blocks.filter(b=>b.type==="image"&&photo(b));const hero=i===0||g.id==="inicio";if(hero&&bakery){return <section key={g.id} id={g.id} className="pn3-bakery-storefront" style={{background:"#e8e4db",color:"#321e16",padding:"12px clamp(12px,3vw,48px) 0",fontFamily:"Arial,sans-serif"}}>
 <div style={{maxWidth:1160,margin:"0 auto",background:"#f4f1eb",borderRadius:"24px 24px 0 0",overflow:"hidden"}}>
 <div style={{position:"relative",height:"clamp(300px,58vw,560px)",overflow:"hidden",borderRadius:"24px 24px 0 0"}}>
{bakeryHeroAssets.map((asset,index)=><picture key={index} aria-hidden={index!==bakeryFrame} style={{position:"absolute",inset:0,display:"block",opacity:index===bakeryFrame?1:0,transition:"opacity 1.4s ease-in-out",animation:index===bakeryFrame?"pn3-bakery-kenburns 6.8s ease-out both":"none"}}><source media="(max-width: 640px)" srcSet={asset.mobileSrc}/><img src={asset.src} alt={index===bakeryFrame?"Pães e doces artesanais":""} style={{display:"block",width:"100%",height:"100%",objectFit:"cover"}} loading={index===0?"eager":"lazy"}/></picture>)}
 <div className="pn3-steam-scene" aria-hidden="true">
 {[{x:29,y:71},{x:43,y:62},{x:61,y:76},{x:78,y:68}].map((p,j)=><div key={j} className="pn3-steam-origin" style={{left:p.x+"%",top:p.y+"%"}}>
 {[0,1,2].map(i=><svg key={i} className="pn3-steam-ribbon" viewBox="0 0 70 210" preserveAspectRatio="none" style={{animationDelay:(i*.85+j*.37)+"s",animationDuration:(4.2+i*.6)+"s"}}><path d={i%2===0?"M34 205 C 2 172,65 144,31 111 S 55 51,35 5":"M33 205 C 65 171,5 139,37 103 S 13 45,32 5"} fill="none" stroke="rgba(255,255,245,.68)" strokeWidth="12" strokeLinecap="round"/></svg>)}
 </div>)}
 </div>
 <div aria-hidden="true" style={{position:"absolute",bottom:0,left:0,right:0,height:58,background:"repeating-linear-gradient(90deg,#321e16 0 36px,#f4f1eb 36px 72px)"}}/>
 </div>
 <div style={{padding:"clamp(38px,6vw,75px) 22px 85px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
 {site.header?.logoUrl&&<img src={site.header.logoUrl} alt={brand} style={{height:105,width:105,objectFit:"contain",borderRadius:"50%"}}/>}
 <h1 style={{fontSize:"clamp(42px,8vw,90px)",lineHeight:1.04,letterSpacing:"-.055em",fontWeight:900,maxWidth:780,margin:0,color:"#321e16"}}>{headings[0]?.text||brand}</h1>
 {paragraphs.map(b=><p key={b.id} style={{fontSize:"clamp(19px,2.2vw,26px)",lineHeight:1.5,maxWidth:660,margin:0}}>{text(b)}</p>)}
 <div style={{display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center",marginTop:10}}>{buttons.map(b=><a key={b.id} href={b.href||"#contato"} style={{display:"inline-flex",padding:"20px 32px",borderRadius:26,background:"#d58c17",color:"#24180f",fontSize:19,fontWeight:800,textDecoration:"none"}}>{text(b)} ↗</a>)}</div>
 </div></div></section>};return <section key={g.id} id={g.id} className={"pn3-section "+(hero?"pn3-hero":i%2?"pn3-left":"pn3-right")+(images.length?" pn3-with-image":"")}><div className="pn3-section-inner"><div className="pn3-copy"><span className="pn3-eyebrow">{hero?"Uma nova experiência":String(i).padStart(2,"0")+" / "+(site.niche||"Conheça mais")}</span>{headings.map((b,j)=>hero&&j===0?<h1 key={b.id}>{text(b)}</h1>:<h2 key={b.id}>{text(b)}</h2>)}<div className="pn3-texts">{paragraphs.map(b=><p key={b.id}>{text(b)}</p>)}</div><div className="pn3-actions">{buttons.map(b=><a key={b.id} href={b.href||"#contato"} className="pn3-button">{text(b)} <span>↗</span></a>)}</div></div>{hero&&bakery&&<div className="pn3-bakery-hero" aria-hidden="true">{bakeryHeroAssets.map((asset,index)=><picture key={index} className={"pn3-bakery-layer pn3-bakery-layer-"+index}>{asset.mobileSrc&&<source media="(max-width: 640px)" srcSet={asset.mobileSrc}/>}<img src={asset.src||asset.mobileSrc} alt="" loading={index===0?"eager":"lazy"}/></picture>)}<div className="pn3-bakery-shade"/></div>}{images.length>0&&<div className="pn3-visual"><div className="pn3-halo"/>{images.slice(0,4).map(media)}<span className="pn3-ornament" aria-hidden="true">✳</span></div>}</div></section>})}</main>
  <footer className="pn3-footer"><strong>{brand}</strong><span>{site.niche||"Uma experiência feita para você"}</span><div>{nav.slice(0,4).map(g=><a href={"#"+g.id} key={g.id}>{g.id.replace(/-/g," ")}</a>)}</div></footer>
  {site.footer?.whatsapp&&<SiteWhatsAppButton numberOrUrl={site.footer.whatsapp}/>}
 </div>
}
