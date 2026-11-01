"use client";
import {useState} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-pizzeria-g2.css";

const pizzaImage="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/pizzaria/desktop-3ca9141d-3308-4022-97e6-11ec7344b7da.png";

export function BuilderV2PizzeriaG2({site}:{site:BuilderV2SiteData}){
 const [open,setOpen]=useState(false);
 const brand=site.header?.brand||site.title||"Pizzaria Artesanal";
 const raw=site.blocks?.find(b=>b.type==="heading")?.text||"A tradição italiana em cada fatia.";
 const title=raw.toLocaleLowerCase("pt-BR").replace(/^./,c=>c.toLocaleUpperCase("pt-BR"));
 const subtitle=site.blocks?.find(b=>b.type==="paragraph")?.text||"Massa de fermentação lenta, ingredientes selecionados e pizzas artesanais preparadas com paixão.";
 const order=site.header?.ctaHref||site.blocks?.find(b=>b.type==="button"&&b.href&&!b.href.startsWith("#"))?.href||"#contato";
 const links=[["Início","#inicio"],["Cardápio","#produtos"],["Sobre nós","#sobre"],["Contato","#contato"]];
 return <div className="g2-pizzeria">
  <header className="g2-header">
   <a href="#inicio" className="g2-brand"><span className="g2-brand-icon" aria-hidden="true">◉</span><span>{brand}</span></a>
   <nav aria-label="Navegação principal">{links.map(([label,href])=><a href={href} key={href}>{label}</a>)}</nav>
   <a className="g2-header-order" href={order}>Fazer pedido ↗</a>
   <button className="g2-menu-button" type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label={open?"Fechar menu":"Abrir menu"}>{open?"✕":"☰"}</button>
  </header>
  {open&&<nav className="g2-mobile-menu" aria-label="Menu móvel">{links.map(([label,href])=><a href={href} key={href} onClick={()=>setOpen(false)}>{label}</a>)}</nav>}
  <main><section id="inicio" className="g2-hero">
   <div className="g2-hero-image" aria-hidden="true"><img src={pizzaImage} alt=""/></div>
   <div className="g2-hero-shade" aria-hidden="true"/>
   <div className="g2-hero-content"><span className="g2-kicker">TRADIÇÃO · FORNO · PAIXÃO</span><h1>{title}</h1><p>{subtitle}</p><a className="g2-hero-cta" href="#produtos">Explorar cardápio <span aria-hidden="true">→</span></a></div>
  </section>
  <div id="produtos" aria-hidden="true"/>
  <div id="sobre"/><div id="contato"/>
  </main>
 </div>;
}
