"use client";
import {useState} from "react";
import "./builder-v2-tp6-model3.css";
type Props={brand:string;niche:string;headline?:string;description?:string;photos:string[];ctaHref?:string};
const tags:Record<string,string>={"Loja de roupas":"MODA & EXPRESSÃO","Loja de calçados":"CADA PASSO CONTA","Joalheria e semijoias":"JOIAS & IDENTIDADE","Ótica":"UM NOVO OLHAR","Perfumaria e cosméticos":"BELEZA & ATITUDE","Pet shop":"ESTILO PARA SEU PET","Loja de eletrônicos":"TECNOLOGIA EM FOCO","Loja de celulares e acessórios":"CONEXÕES & ESTILO","Loja de móveis e decoração":"DESIGN PARA VIVER","Floricultura":"FLORES & EXPRESSÃO","Papelaria":"IDEIAS EM MOVIMENTO","Loja de brinquedos":"IMAGINE MAIS","Loja de artigos esportivos":"MOVIMENTO & ENERGIA","Loja de presentes e personalizados":"PRESENTES COM SENTIDO","E-commerce multimarcas":"ESCOLHAS SEM LIMITES"};
const titles:Record<string,string>={"Loja de roupas":"Vista sua própria história.","Loja de calçados":"Seu próximo passo começa aqui.","Joalheria e semijoias":"Seu brilho. Suas regras.","Ótica":"Um olhar muda tudo.","Perfumaria e cosméticos":"Beleza sem fórmulas.","Pet shop":"Amor em cada detalhe.","Loja de eletrônicos":"O novo é agora.","Loja de celulares e acessórios":"Conecte o seu mundo.","Loja de móveis e decoração":"Habite seu estilo.","Floricultura":"Flores para sentir.","Papelaria":"Ideias fora da caixa.","Loja de brinquedos":"Brincar é descobrir.","Loja de artigos esportivos":"Vá além do comum.","Loja de presentes e personalizados":"Surpreenda de verdade.","E-commerce multimarcas":"Descubra o inesperado."};
export function BuilderV2TP6Model3Hero({brand,niche,headline,description,photos,ctaHref}:Props){
 const [open,setOpen]=useState(false);
 const main=photos[0];const detail=photos[1]||main;
 return <div className="tp6m3" data-tp6-model3="hero">
  <header className="tp6m3-header">
   <a href="#inicio" className="tp6m3-logo">{brand}</a>
   <nav className={open?"tp6m3-nav open":"tp6m3-nav"} aria-label="Navegação"><a href="#inicio" onClick={()=>setOpen(false)}>Início</a><a href="#produtos" onClick={()=>setOpen(false)}>Coleções</a><a href="#sobre" onClick={()=>setOpen(false)}>Sobre</a><a href="#contato" onClick={()=>setOpen(false)}>Contato</a></nav>
   <a className="tp6m3-header-action" href={ctaHref||"#produtos"}>EXPLORAR <span aria-hidden="true">↗</span></a>
   <button type="button" className="tp6m3-toggle" aria-expanded={open} aria-label={open?"Fechar menu":"Abrir menu"} onClick={()=>setOpen(!open)}>{open?"✕":"☰"}</button>
  </header>
  <section className="tp6m3-hero" id="inicio">
   <div className="tp6m3-hero-left">
    <div className="tp6m3-topline"><span>ESTÚDIO / SELEÇÃO</span><span>01 — 03</span></div>
    <div className="tp6m3-copy"><span className="tp6m3-eyebrow">{tags[niche]||tags["E-commerce multimarcas"]}</span><h1>{headline||titles[niche]||titles["E-commerce multimarcas"]}</h1><p>{description||"Uma seleção feita para descobrir novos favoritos e expressar o que torna cada escolha única."}</p><a className="tp6m3-cta" href={ctaHref||"#produtos"}><span>DESCUBRA A SELEÇÃO</span><span aria-hidden="true">↗</span></a></div>
    <div className="tp6m3-bottomline"><span>UMA NOVA PERSPECTIVA</span><span>↓ DESLIZE PARA EXPLORAR</span></div>
   </div>
   <div className="tp6m3-hero-right">{main?<img className="tp6m3-main-photo" src={main} alt={"Fotografia editorial de "+niche} fetchPriority="high"/>:<div className="tp6m3-empty"/>}<span className="tp6m3-image-index">01 / EDITORIAL</span><div className="tp6m3-photo-inset">{detail&&<img src={detail} alt={"Detalhe de "+niche}/>}</div><span className="tp6m3-vertical-label">CURADORIA INDEPENDENTE • ESTILO CONTEMPORÂNEO</span></div>
  </section>
 </div>
}