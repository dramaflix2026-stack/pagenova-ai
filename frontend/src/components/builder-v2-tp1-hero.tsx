"use client";
import type { BuilderV2SiteData } from "@/components/builder-v2-site";
import "./builder-v2-tp1-hero.css";

export function BuilderV2TP1Hero({site}:{site:BuilderV2SiteData}){
 const brand=site.header?.brand||site.title||"Burger";
 const heading=site.blocks.find(b=>b.type==="heading")?.text||"O SABOR QUE NASCE DA BRASA";
 const summary=site.blocks.find(b=>b.type==="paragraph")?.text||"Hambúrgueres artesanais preparados com ingredientes selecionados.";
 return <div className="tp1-new">
  <header className="tp1-new-header">
   <a className="tp1-new-brand" href="#inicio"><span className="tp1-new-brand-icon">✳</span><span>{brand}</span></a>
   <nav aria-label="Navegação"><a href="#inicio">INÍCIO</a><a href="#produtos">CARDÁPIO</a><a href="#sobre">SOBRE NÓS</a><a href="#pedidos">CONTATO</a></nav>
   <a className="tp1-new-order" href="#pedidos">PEDIR AGORA <span>↗</span></a>
  </header>
  <main><section className="tp1-new-hero" id="inicio">
   <div className="tp1-new-noise" aria-hidden="true"/>
   <div className="tp1-new-copy"><span className="tp1-new-label"><b/> BURGER EXPERIENCE / 001</span><h1>{heading}</h1><p>{summary}</p><div className="tp1-new-actions"><a className="tp1-new-main-button" href="#produtos">EXPLORAR CARDÁPIO <span>↗</span></a><a className="tp1-new-outline-button" href="#pedidos">FAZER PEDIDO</a></div><span className="tp1-new-signature">ARTESANAL. INTENSO. INESQUECÍVEL.</span></div>
   <div className="tp1-new-visual" role="img" aria-label="Hambúrguer tridimensional com ingredientes flutuando em camadas">
    <span className="tp1-new-visual-word" aria-hidden="true">BURGER</span><div className="tp1-new-back-glow"/>
    <div className="tp1-new-burger">
     <div className="tp1-new-bun-top"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
     <div className="tp1-new-lettuce"/>
     <div className="tp1-new-tomato"/>
     <div className="tp1-new-cheese"/>
     <div className="tp1-new-patty"/>
     <div className="tp1-new-sauce"/>
     <div className="tp1-new-bun-bottom"/>
    </div>
    <span className="tp1-new-float tp1-new-float-a">✳</span><span className="tp1-new-float tp1-new-float-b">✦</span><span className="tp1-new-float tp1-new-float-c">✳</span>
   </div>
   <div className="tp1-new-bottom"><span>01 / FEITO COM PAIXÃO</span><a href="#produtos">DESLIZE PARA EXPLORAR ↓</a></div>
  </section></main>
 </div>;
}
