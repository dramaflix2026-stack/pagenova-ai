"use client";
import {useState} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-tp1-model3.css";
import {BuilderV2TP1Model3Sections} from "./builder-v2-tp1-model3-sections";

const niches=[
 {pattern:/consultoria de imagem|consultor(?:a|ia).*imagem|personal stylist/i,label:"CONSULTORIA DE IMAGEM",headline:"Sua imagem. Sua essência. Seu estilo.",description:"Uma experiência de estilo construída a partir de quem você é.",image:"https://images.pexels.com/photos/9775892/pexels-photo-9775892.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Editorial de moda com composição sofisticada"},
 {pattern:/fotograf/i,label:"FOTOGRAFIA PROFISSIONAL",headline:"Histórias vistas por outro olhar.",description:"Fotografia com identidade, intenção e sensibilidade.",image:"https://images.pexels.com/photos/3584996/pexels-photo-3584996.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Ensaio fotográfico editorial"},
 {pattern:/maquiagem/i,label:"ESTÚDIO DE MAQUIAGEM",headline:"A beleza está nos detalhes.",description:"Expressão pessoal e criatividade em cada produção.",image:"https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Maquiagem editorial em retrato"},
 {pattern:/sal[aã]o|cabeleireir/i,label:"SALÃO DE BELEZA PREMIUM",headline:"Um novo olhar sobre a beleza.",description:"Estilo, cuidado e expressão em cada detalhe.",image:"https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Atendimento de beleza em salão"},
 {pattern:/spa|bem-estar/i,label:"SPA E BEM-ESTAR",headline:"O luxo de cuidar de si.",description:"Uma pausa para se reconectar com seu bem-estar.",image:"https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Ambiente de spa e bem-estar"},
 {pattern:/odontolog/i,label:"ODONTOLOGIA ESTÉTICA",headline:"Seu sorriso, sua expressão.",description:"Atenção individual e estética com naturalidade.",image:"https://images.pexels.com/photos/6627534/pexels-photo-6627534.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Retrato com sorriso natural"},
 {pattern:/dermatolog/i,label:"DERMATOLOGIA",headline:"Sua pele, sua identidade.",description:"Cuidado dermatológico com atenção à individualidade.",image:"https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Retrato de beleza e cuidados com a pele"},
 {pattern:/fisioterap/i,label:"FISIOTERAPIA",headline:"Movimento com propósito.",description:"Atenção ao corpo, ao movimento e à qualidade de vida.",image:"https://images.pexels.com/photos/4506109/pexels-photo-4506109.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Atendimento de fisioterapia"},
 {pattern:/psicolog|terapias/i,label:"PSICOLOGIA E TERAPIAS",headline:"Um espaço para ser você.",description:"Escuta, acolhimento e respeito à sua trajetória.",image:"https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Ambiente acolhedor de terapia"},
 {pattern:/est[eé]tica/i,label:"CLÍNICA DE ESTÉTICA",headline:"Beleza que respeita sua essência.",description:"Uma experiência de cuidado e atenção aos detalhes.",image:"https://images.pexels.com/photos/3985332/pexels-photo-3985332.jpeg?auto=compress&cs=tinysrgb&w=1600",alt:"Atendimento em clínica de estética"}
];
export function BuilderV2TP1Model3Hero({site}:{site:BuilderV2SiteData}){
 const [menuOpen,setMenuOpen]=useState(false);
 const niche=site.niche||"Consultoria de imagem";
 const content=niches.find(item=>item.pattern.test(niche))||niches[0];
 const brand=site.header?.brand?.trim()||site.title?.trim()||"Sua Marca";
 const heading=site.blocks.find(b=>b.type==="heading"&&b.text?.trim())?.text?.trim()||content.headline;
 const description=site.blocks.find(b=>b.type==="paragraph"&&b.text?.trim())?.text?.trim()||content.description;
 const raw=site.header?.ctaHref?.trim()||site.blocks.find(b=>b.type==="button"&&b.href)?.href?.trim()||"";
 const href=/^https:\/\//i.test(raw)||/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(raw)||/^#[a-z\w-]+$/i.test(raw)?raw:null;
 const image=site.blocks.find(b=>b.type==="image"&&b.src&&/^https:\/\//i.test(b.src))?.src||content.image;
 const cta=site.header?.ctaLabel?.trim()||"Agende uma conversa";
 return <div className="tp1m3" id="inicio" data-tp1-model="03">
  <header className="tp1m3-header">
   <a className="tp1m3-logo" href="#inicio">{brand}<span aria-hidden="true">.</span></a>
   <button className="tp1m3-menu-button" type="button" aria-expanded={menuOpen} aria-controls="tp1m3-menu" onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"Fechar":"Menu"} <span aria-hidden="true">{menuOpen?"×":"☰"}</span></button>
   <nav className={menuOpen?"tp1m3-nav open":"tp1m3-nav"} id="tp1m3-menu" aria-label="Navegação principal"><a href="#inicio" onClick={()=>setMenuOpen(false)}>Início</a><a href="#conceito" onClick={()=>setMenuOpen(false)}>Conceito</a><a href="#experiencia" onClick={()=>setMenuOpen(false)}>Experiência</a><a href="#contato" onClick={()=>setMenuOpen(false)}>Contato</a></nav>
   {href?<a className="tp1m3-header-action" href={href}>{cta}<span aria-hidden="true">↗</span></a>:<span className="tp1m3-header-action is-disabled" aria-label="Link de agendamento não configurado">Contato a configurar</span>}
  </header>
  <main><section className="tp1m3-hero" aria-labelledby="tp1m3-title">
   <div className="tp1m3-hero-copy"><div className="tp1m3-eyebrow"><span/> {content.label} <span className="tp1m3-edition">/ EDIÇÃO 03</span></div><h1 id="tp1m3-title">{heading}</h1><p>{description}</p><div className="tp1m3-hero-links">{href?<a href={href} className="tp1m3-primary">{cta} <span aria-hidden="true">↗</span></a>:<a href="mailto:" className="tp1m3-primary tp1m3-disabled" onClick={e=>e.preventDefault()} aria-disabled="true">Contato a configurar</a>}<span className="tp1m3-note">ESTILO É EXPRESSÃO.</span></div><div className="tp1m3-bottom-line"><span>ESTÉTICA • IDENTIDADE • EXPERIÊNCIA</span><span>01 / 11</span></div></div>
   <div className="tp1m3-hero-photo"><img src={image} alt={content.alt} fetchPriority="high"/><span className="tp1m3-photo-caption">UMA NOVA PERSPECTIVA SOBRE {content.label}</span><span className="tp1m3-photo-mark" aria-hidden="true">✳</span></div>
  </section><BuilderV2TP1Model3Sections site={site} brand={brand}/></main>
 </div>;
}
