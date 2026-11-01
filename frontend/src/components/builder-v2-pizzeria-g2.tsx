"use client";
import {useState,type PointerEvent} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-pizzeria-g2.css";

const base="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/pizzaria/desktop-";
const ids=["f38be201-5002-41e5-8c15-5d989bfecad1","4675570d-8b66-49cd-b451-bb354b4c6d25","927bbda7-1fef-4795-b1d4-87869b122f5f","5b940580-4c63-42ce-9d40-c6c1eab8ed16","17733275-ddb0-4cdc-86f2-3e0f38ae1938","418c6773-0612-470e-9842-0eca0721e63e"];
const photo=(index:number)=>base+ids[index%ids.length]+".png";

export function BuilderV2PizzeriaG2({site}:{site:BuilderV2SiteData}){
 const [selected,setSelected]=useState(0);
 const [menuOpen,setMenuOpen]=useState(false);
 const [tilt,setTilt]=useState({x:0,y:0});
 const brand=site.header?.brand||site.title||"Pizzaria Artesanal";
 const heading=site.blocks.find(b=>b.type==="heading")?.text||"A TRADIÇÃO ITALIANA EM CADA FATIA.";
 const summary=site.blocks.find(b=>b.type==="paragraph")?.text||"Massa de fermentação lenta, ingredientes selecionados e pizzas preparadas com paixão.";
 const order=site.header?.ctaHref||site.blocks.find(b=>b.type==="button")?.href||"#produtos";
 const nav=[{label:"Início",href:"#inicio"},{label:"Cardápio",href:"#produtos"},{label:"Nossa história",href:"#sobre"},{label:"Contato",href:"#contato"}];
 const move=(e:PointerEvent<HTMLDivElement>)=>{if(e.pointerType==="touch"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const r=e.currentTarget.getBoundingClientRect();setTilt({x:Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),y:Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))});};
 return <div className="g2-pizzeria">
  <header className="g2-header"><a className="g2-logo" href="#inicio"><span className="g2-logo-symbol" aria-hidden="true">✳</span><span>{brand}</span></a><nav aria-label="Navegação principal">{nav.map(n=><a key={n.href} href={n.href}>{n.label}</a>)}</nav><a className="g2-header-cta" href={order}>FAZER PEDIDO <span aria-hidden="true">↗</span></a><button type="button" className="g2-menu-toggle" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"✕":"☰"}</button></header>
  {menuOpen&&<nav className="g2-mobile-nav" aria-label="Menu móvel">{nav.map(n=><a key={n.href} href={n.href} onClick={()=>setMenuOpen(false)}>{n.label}</a>)}<a href={order} onClick={()=>setMenuOpen(false)}>Fazer pedido ↗</a></nav>}
  <main><section className="g2-hero" id="inicio"><div className="g2-hero-glow" aria-hidden="true"/><div className="g2-hero-copy"><div className="g2-eyebrow"><span className="g2-eyebrow-line"/> TRADIÇÃO · FORNO · PAIXÃO</div><h1>{heading}</h1><p>{summary}</p><div className="g2-actions"><a className="g2-primary" href="#produtos">EXPLORAR CARDÁPIO <span aria-hidden="true">↗</span></a><a className="g2-secondary" href={order}>FAZER PEDIDO <span aria-hidden="true">→</span></a></div><div className="g2-hero-note"><span>✳</span> FEITA COM TEMPO. SERVIDA COM AMOR.</div></div><div className="g2-hero-art" onPointerMove={move} onPointerLeave={()=>setTilt({x:0,y:0})} style={{"--g2-tilt-x":tilt.x,"--g2-tilt-y":tilt.y} as React.CSSProperties}><div className="g2-orbit g2-orbit-one"/><div className="g2-orbit g2-orbit-two"/><span className="g2-art-kicker">ARTESANAL<br/>DESDE A PRIMEIRA FATIA</span><div className="g2-pizza-float"><img src={photo(selected)} alt="Pizza artesanal em destaque" loading="eager"/></div><div className="g2-round-stamp">✦ <span>FORNO<br/>ARTESANAL</span> ✦</div><div className="g2-pizza-selector" aria-label="Selecionar pizza em destaque">{[0,1,2].map(i=><button key={i} type="button" className={selected===i?"active":""} aria-label={"Ver pizza "+(i+1)} aria-pressed={selected===i} onClick={()=>setSelected(i)}><img src={photo(i)} alt=""/></button>)}</div></div><div className="g2-hero-bottom"><span>01 / EXPERIÊNCIA GASTRONÔMICA</span><a href="#produtos">DESCUBRA MAIS ↓</a></div></section>
  <section id="produtos" className="g2-placeholder"><span>✳ NOSSO CARDÁPIO</span><h2>Sabores que contam histórias.</h2><p>Próxima seção: aguardando aprovação da referência visual.</p></section>
  <div id="sobre" className="g2-anchor"/><div id="contato" className="g2-anchor"/>
  </main></div>;
}
