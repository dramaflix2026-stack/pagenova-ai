"use client";
import {useEffect,useRef,useState} from "react";
import type {CSSProperties,PointerEvent} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-coffee-g3.css";

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
     <div className="g3-stage g3-photo-stage" aria-label="Composição tridimensional cinematográfica de copos e café Aurora Coffee">
      <div className="g3-photo-light" aria-hidden="true"/>
      <div className="g3-photo-frame">
       <img className="g3-coffee-photo" src="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/cafeteria/desktop-80f9ae64-79f1-4fcd-a55f-b8b4c9c52fa9.png" alt="Dois copos Aurora Coffee, tampa suspensa, explosão de café e grãos flutuantes" loading="eager"/>
      </div>
      <div className="g3-origin">TORRA ARTESANAL <span>·</span> AROMA INCONFUNDÍVEL</div>
     </div>
    </section>
    <section className="g3-specialties" id="cardapio" aria-labelledby="g3-specialties-title">
      <div className="g3-specialties-heading">
       <div><p className="g3-specialties-eyebrow"><span/> SELEÇÃO DA CASA</p><h2 id="g3-specialties-title">Nossas <em>especialidades.</em></h2></div>
       <p>Uma seleção de sabores para transformar cada pausa em um momento especial.</p>
      </div>
      <div className="g3-specialties-grid">
       {[
        {name:"Cappuccino Premium",description:"Uma experiência cremosa, intensa e delicada a cada gole.",image:"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/cafeteria/desktop-b614d27d-f66a-45a9-87a2-394460ed52d5.png",number:"01"},
        {name:"Frappuccino de Caramelo",description:"Uma combinação refrescante de café, suavidade e caramelo.",image:"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/cafeteria/desktop-66bb2780-abd6-4a7d-9f0a-f8b2046e62e9.png",number:"02"},
        {name:"Latte Macchiato",description:"Camadas de sabor e aroma em uma criação especial.",image:"https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/cafeteria/desktop-841e3cd8-fe94-4a5c-8bc5-0559d28177a6.png",number:"03"}
       ].map((item,index)=><article className={"g3-specialty-card"+(index===1?" g3-specialty-featured":"")} key={item.number}>
        <div className="g3-specialty-visual"><span className="g3-specialty-number">{item.number} / 03</span><img src={item.image} alt={item.name+" — composição 3D da cafeteria"} loading="lazy"/><span className="g3-specialty-glow" aria-hidden="true"/></div>
        <div className="g3-specialty-info"><div><h3>{item.name}</h3><p>{item.description}</p></div><a href={destination} aria-label={"Conhecer "+item.name}>↗</a></div>
       </article>)}
      </div>
     </section>
<section className="g3-essence" id="sobre"><div className="g3-essence-art"><img src="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/cafeteria/desktop-02240d6c-5928-49e6-a19a-3cc756ba78e0.png" alt="Grãos de café na torra artesanal" loading="lazy"/></div><div className="g3-essence-copy"><p className="g3-essence-eyebrow">NOSSA ESSÊNCIA</p><h2>O café começa <em>muito antes</em> da primeira xícara.</h2><p>Da seleção dos grãos ao cuidado com a torra, cada detalhe transforma o café em uma experiência cheia de aroma, textura e significado.</p><span>ORIGEM · CUIDADO · PAIXÃO</span></div></section>
   </main>
   <div className="g3-ticker" aria-label="Destaques da cafeteria"><span>CAFÉ SELECIONADO</span><span>✦</span><span>TORRA ARTESANAL</span><span>✦</span><span>FEITO COM PAIXÃO</span><span>✦</span><span>EXPERIÊNCIA PREMIUM</span></div>
  </div>
 </div>;
}
