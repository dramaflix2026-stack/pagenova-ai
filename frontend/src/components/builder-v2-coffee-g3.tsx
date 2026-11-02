"use client";
import {useEffect,useRef,useState} from "react";
import type {CSSProperties,PointerEvent} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-coffee-g3.css";

const beanPositions=[[-29,-34,-28],[-12,-50,21],[21,-40,39],[37,-14,-19],[-37,12,30],[26,28,-35],[-7,39,16],[43,43,44],[-44,-13,-32]] as const;
export function BuilderV2CoffeeG3({site}:{site:BuilderV2SiteData}){
 const [menuOpen,setMenuOpen]=useState(false);
 const [motion,setMotion]=useState({x:0,y:0});
 const frame=useRef<number|null>(null);
 const title=site.header?.brand||site.title||"United Coffee";
 const brand=/caf[eé]|coffee|espresso|gr[aã]o/i.test(title)?title:"United Coffee";
 const nav=[{label:"Início",href:"#inicio"},{label:"Sobre",href:"#sobre"},{label:"Cardápio",href:"#cardapio"},{label:"Galeria",href:"#galeria"},{label:"Contato",href:"#contato"}];
 const destination=site.header?.ctaHref||site.blocks.find(b=>b.type==="button"&&b.href)?.href||"#cardapio";
 const move=(event:PointerEvent<HTMLDivElement>)=>{
   if(event.pointerType==="touch")return;
   const bounds=event.currentTarget.getBoundingClientRect();
   const x=(event.clientX-bounds.left)/bounds.width-.5;
   const y=(event.clientY-bounds.top)/bounds.height-.5;
   if(frame.current!==null)cancelAnimationFrame(frame.current);
   frame.current=requestAnimationFrame(()=>setMotion({x:x*2,y:y*2}));
 };
 useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current)},[]);
 const perspective={"--g3-mx":motion.x,"--g3-my":motion.y} as CSSProperties;
 return <div className="g3-coffee" id="inicio" onPointerMove={move} onPointerLeave={()=>setMotion({x:0,y:0})} style={perspective}>
  <div className="g3-ambient" aria-hidden="true"/>
  <div className="g3-shell">
   <header className="g3-header">
    <a className="g3-brand" href="#inicio" aria-label={brand+" — início"}><span className="g3-monogram">U</span><span><strong>{brand}</strong><small>CRAFTED WITH INTENTION</small></span></a>
    <nav className={menuOpen?"g3-nav g3-nav-open":"g3-nav"} aria-label="Menu principal">{nav.map(item=><a key={item.label} href={item.href} onClick={()=>setMenuOpen(false)}>{item.label}</a>)}</nav>
    <div className="g3-header-actions"><a className="g3-search" href="#cardapio" aria-label="Ver cardápio"><span aria-hidden="true">⌕</span></a><a className="g3-header-cta" href={destination}>Fazer pedido <span aria-hidden="true">↗</span></a></div>
    <button className="g3-menu" type="button" aria-expanded={menuOpen} aria-label={menuOpen?"Fechar menu":"Abrir menu"} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"✕":"☰"}</button>
   </header>
   <main>
    <section className="g3-hero" aria-labelledby="g3-hero-title">
     <div className="g3-steam g3-steam-one" aria-hidden="true"/><div className="g3-steam g3-steam-two" aria-hidden="true"/>
     <div className="g3-hero-copy">
      <p className="g3-eyebrow"><span/> CAFÉ ESPECIAL · EXPERIÊNCIA ÚNICA</p>
      <h1 id="g3-hero-title">Um ritual <span className="g3-mini-cup" aria-hidden="true">☕</span> de sabor,<br/><em>feito com intenção.</em></h1>
      <p className="g3-description">Cada grão conta uma história. Descubra o prazer de um café preparado com tempo, cuidado e paixão.</p>
      <div className="g3-buttons"><a className="g3-button-main" href="#cardapio">Explorar cardápio <span>↗</span></a><a className="g3-button-secondary" href={destination}>Fazer pedido <span>↗</span></a></div>
     </div>
     <div className="g3-stage" aria-label="Composição tridimensional de copos de café e grãos suspensos">
      <div className="g3-stage-aura"/>
      <div className="g3-splash" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/></div>
      <div className="g3-cup g3-cup-back" aria-hidden="true"><div className="g3-cup-lid"/><div className="g3-cup-body"><div className="g3-cup-sleeve"><b>UNITED</b><small>COFFEE</small></div></div><div className="g3-cup-base"/></div>
      <div className="g3-cup g3-cup-front" aria-hidden="true"><div className="g3-cup-lid"/><div className="g3-cup-body"><div className="g3-cup-sleeve"><b>{brand}</b><small>COFFEE ROASTERS</small></div></div><div className="g3-cup-base"/></div>
      {beanPositions.map(([x,y,r],i)=><span className={"g3-bean g3-bean-"+i} key={i} style={{"--bx":x+"%","--by":y+"%","--br":r+"deg","--bd":(i%4)*-.6+"s"} as CSSProperties} aria-hidden="true"/>)}
      <div className="g3-origin">TORRA ARTESANAL <span>·</span> AROMA INCONFUNDÍVEL</div>
     </div>
    </section>
   </main>
   <div className="g3-ticker" aria-label="Destaques da cafeteria"><span>CAFÉ SELECIONADO</span><span>✦</span><span>TORRA ARTESANAL</span><span>✦</span><span>FEITO COM PAIXÃO</span><span>✦</span><span>EXPERIÊNCIA PREMIUM</span></div>
  </div>
 </div>;
}
