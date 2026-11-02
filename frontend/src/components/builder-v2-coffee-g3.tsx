"use client";
import {useEffect,useRef,useState} from "react";
import type {CSSProperties,PointerEvent} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-coffee-g3.css";

export function BuilderV2CoffeeG3({site}:{site:BuilderV2SiteData}){
 const [menuOpen,setMenuOpen]=useState(false);
 const [testimonialIndex,setTestimonialIndex]=useState(0);
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
        {name:"Cappuccino Premium",description:"Uma experiência cremosa, intensa e delicada a cada gole.",image:"https://images.pexels.com/photos/5112651/pexels-photo-5112651.jpeg?auto=compress&cs=tinysrgb&w=1100",number:"01"},
        {name:"Frappuccino de Caramelo",description:"Uma combinação refrescante de café, suavidade e caramelo.",image:"https://images.pexels.com/photos/15086187/pexels-photo-15086187.jpeg?auto=compress&cs=tinysrgb&w=1100",number:"02"},
        {name:"Latte Macchiato",description:"Camadas de sabor e aroma em uma criação especial.",image:"https://images.pexels.com/photos/16147917/pexels-photo-16147917.jpeg?auto=compress&cs=tinysrgb&w=1100",number:"03"}
       ].map((item,index)=><article className={"g3-specialty-card"+(index===1?" g3-specialty-featured":"")} key={item.number}>
        <div className="g3-specialty-visual"><span className="g3-specialty-number">{item.number} / 03</span><img src={item.image} alt={item.name+" — fotografia real de café"} loading="lazy"/><span className="g3-specialty-glow" aria-hidden="true"/></div>
        <div className="g3-specialty-info"><div><h3>{item.name}</h3><p>{item.description}</p></div><a href={destination} aria-label={"Conhecer "+item.name}>↗</a></div>
       </article>)}
      </div>
     </section>
<section className="g3-essence" id="sobre"><div className="g3-essence-art"><img src="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/cafeteria/desktop-02240d6c-5928-49e6-a19a-3cc756ba78e0.png" alt="Grãos de café na torra artesanal" loading="lazy"/></div><div className="g3-essence-copy"><p className="g3-essence-eyebrow">NOSSA ESSÊNCIA</p><h2>O café começa <em>muito antes</em> da primeira xícara.</h2><p>Da seleção dos grãos ao cuidado com a torra, cada detalhe transforma o café em uma experiência cheia de aroma, textura e significado.</p><span>ORIGEM · CUIDADO · PAIXÃO</span></div></section>
    <section className="g3-secret" id="segredo" aria-labelledby="g3-secret-title">
      <div className="g3-secret-content">
       <p className="g3-secret-kicker">✦ O SEGREDO DO NOSSO CAFÉ</p>
       <h2 id="g3-secret-title">Não é só café.<br/><em>É um ritual.</em></h2>
       <p>Precisão na extração, cuidado em cada detalhe e o tempo certo para revelar aromas e sabores únicos.</p>
       <a className="g3-secret-link" href="#cardapio">Descubra nossas especialidades <span aria-hidden="true">↗</span></a>
      </div>
      <div className="g3-secret-scene g3-secret-photo" role="img" aria-label="Fotografia real de espresso sendo extraído de uma máquina de café">
       <img src="https://commons.wikimedia.org/wiki/Special:FilePath/Machine_pouring_coffee_%28Unsplash%29.jpg" alt="Extração real de espresso em xícara de porcelana" loading="lazy"/>
      </div>
     </section>
    <section className="g3-experience" id="experiencia" aria-labelledby="g3-experience-title">
      <div className="g3-experience-photo">
       <img src="https://images.pexels.com/photos/1833769/pexels-photo-1833769.jpeg?auto=compress&cs=tinysrgb&w=2000" alt="Interior aconchegante de cafeteria com madeira e iluminação quente" loading="lazy"/>
      </div>
      <div className="g3-experience-shade" aria-hidden="true"/>
      <div className="g3-experience-content">
       <p className="g3-experience-eyebrow">✦ EXPERIÊNCIA AURORA</p>
       <h2 id="g3-experience-title">Um lugar para <em>sentir o momento.</em></h2>
       <p>Entre aromas, encontros e pequenos detalhes, cada pausa ganha um novo significado. Mais do que servir café, queremos criar momentos que merecem ser vividos.</p>
       <a href="#cardapio" className="g3-experience-cta">Explore nossos sabores <span aria-hidden="true">↗</span></a>
      </div>
      <span className="g3-experience-side-note" aria-hidden="true">ACONCHEGO · AROMA · EXPERIÊNCIA</span>
     </section>
    <section className="g3-space" id="nosso-espaco" aria-labelledby="g3-space-title">
      <div className="g3-space-heading"><div><p className="g3-space-eyebrow">✦ NOSSO ESPAÇO</p><h2 id="g3-space-title">Cada canto, <em>um convite.</em></h2></div><p>Ambientes acolhedores, detalhes que encantam e a atmosfera perfeita para aproveitar o seu café.</p></div>
      <div className="g3-space-gallery">
       {[
        {src:"https://images.pexels.com/photos/31927547/pexels-photo-31927547.jpeg?auto=compress&cs=tinysrgb&w=1400",alt:"Cafeteria acolhedora com mesas de madeira e luz quente",label:"Um ambiente para ficar"},
        {src:"https://images.pexels.com/photos/37797299/pexels-photo-37797299.jpeg?auto=compress&cs=tinysrgb&w=950",alt:"Mesas e cadeiras em cafeteria aconchegante",label:"Detalhes que acolhem"},
        {src:"https://images.pexels.com/photos/31365006/pexels-photo-31365006.jpeg?auto=compress&cs=tinysrgb&w=950",alt:"Balcão e mobiliário de madeira em café acolhedor",label:"Nosso jeito de receber"},
        {src:"https://images.pexels.com/photos/35448607/pexels-photo-35448607.jpeg?auto=compress&cs=tinysrgb&w=950",alt:"Canto iluminado de cafeteria com cadeiras de madeira",label:"Sua pausa favorita"}
       ].map((item,index)=><figure className={"g3-space-tile g3-space-tile-"+(index+1)} key={item.src}><img src={item.src} alt={item.alt} loading="lazy"/><figcaption><span>0{index+1} / 04</span><strong>{item.label}</strong></figcaption></figure>)}
      </div>
     </section>
    <section className="g3-testimonials" id="depoimentos" aria-labelledby="g3-testimonials-title">
      <div className="g3-testimonials-heading"><p>✦ HISTÓRIAS QUE INSPIRAM</p><h2 id="g3-testimonials-title">Momentos que <em>ficam na memória.</em></h2></div>
      <div className="g3-testimonials-feature">
       <span className="g3-testimonials-mark" aria-hidden="true">“</span>
       <div className="g3-testimonials-quote" aria-live="polite">
        <blockquote key={testimonialIndex}>{[
         "Uma pausa no meio do dia, o aroma do café recém-preparado e um ambiente que convida a ficar mais um pouco.",
         "O cuidado aparece nos pequenos detalhes: na temperatura da xícara, no aroma e na forma como cada café é servido.",
         "Um lugar para conversar sem pressa, apreciar novos sabores e transformar o café em um momento especial."
        ][testimonialIndex]}</blockquote>
        <p className="g3-testimonials-disclaimer">Texto ilustrativo para demonstração do layout — não representa uma avaliação real de cliente.</p>
       </div>
       <div className="g3-testimonials-controls"><span aria-label={"Depoimento demonstrativo "+(testimonialIndex+1)+" de 3"}>0{testimonialIndex+1} <span className="g3-testimonials-divider">/</span> 03</span><div><button type="button" aria-label="Depoimento anterior" onClick={()=>setTestimonialIndex(i=>(i+2)%3)}>←</button><button type="button" aria-label="Próximo depoimento" onClick={()=>setTestimonialIndex(i=>(i+1)%3)}>→</button></div></div>
      </div>
      <p className="g3-testimonials-footnote">Exemplos de apresentação. Substitua por depoimentos autorizados antes da publicação para clientes finais.</p>
     </section>
   </main>
   <div className="g3-ticker" aria-label="Destaques da cafeteria"><span>CAFÉ SELECIONADO</span><span>✦</span><span>TORRA ARTESANAL</span><span>✦</span><span>FEITO COM PAIXÃO</span><span>✦</span><span>EXPERIÊNCIA PREMIUM</span></div>
  </div>
 </div>;
}
