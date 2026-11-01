"use client";
import {useState} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-tp1-hero.css";
const mediaBase="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";
const images=["f8eada23-211a-47a7-b96f-6d3bf2d2c217","d96c66fe-0e41-4edf-b1aa-facbcbfbe420","a33f5384-69b3-4be1-883d-9e8732ab98c2"];
export function BuilderV2TP1Hero({site}:{site:BuilderV2SiteData}){
 const [active,setActive]=useState(0);
 const brand=site.header?.brand||site.title||"Burger";
 const heading=site.blocks.find(b=>b.type==="heading")?.text||"O SABOR QUE NASCE DA BRASA";
 const summary=site.blocks.find(b=>b.type==="paragraph")?.text||"Hambúrgueres artesanais preparados com ingredientes selecionados.";
 const nav=site.header?.navItems?.length?site.header.navItems:[{label:"Home",href:"#inicio"},{label:"Menu",href:"#produtos"},{label:"About",href:"#sobre"},{label:"Shop",href:"#produtos"},{label:"Contact us",href:"#pedidos"}];
 const primary=site.blocks.find(b=>b.type==="button");
 const cta=site.header?.ctaHref||primary?.href||"#pedidos";
 const select=(index:number)=>setActive((index+images.length)%images.length);
 return <div className="tp1-new"><header className="tp1-new-header"><a className="tp1-new-brand" href="#inicio">{brand}</a><nav aria-label="Navegação principal">{nav.map((item,i)=><a key={i} href={item.href} className={i===0?"tp1-new-active":""}>{item.label}</a>)}</nav><div className="tp1-new-header-tools"><a href={cta}>♙ &nbsp; Sign Up/Sign In</a><span aria-hidden="true">│</span><a href={cta}>🛒 &nbsp; Cart</a></div></header><main><section className="tp1-new-hero" id="inicio"><div className="tp1-new-copy"><h1>{heading}</h1><p>{summary}</p><div className="tp1-new-actions"><a className="tp1-new-main-button" href={cta}>{site.header?.ctaLabel||"Order Now"}</a><a className="tp1-new-outline-button" href="#produtos">View Menu</a></div></div><div className="tp1-new-visual"><img src={mediaBase+images[active]+".png"} alt="Hambúrguer artesanal em destaque" loading="eager"/></div><div className="tp1-new-gallery"><button type="button" onClick={()=>select(active-1)} aria-label="Hambúrguer anterior">‹</button>{images.map((id,i)=><button key={id} type="button" onClick={()=>select(i)} className={"tp1-new-thumb "+(active===i?"is-active":"")} aria-label={"Selecionar hambúrguer "+(i+1)}><img src={mediaBase+id+".png"} alt=""/></button>)}<button type="button" onClick={()=>select(active+1)} aria-label="Próximo hambúrguer">›</button><div className="tp1-new-dots">{images.map((id,i)=><button key={id} type="button" aria-label={"Slide "+(i+1)} className={active===i?"is-active":""} onClick={()=>select(i)}/>)}</div></div></section></main></div>;
}