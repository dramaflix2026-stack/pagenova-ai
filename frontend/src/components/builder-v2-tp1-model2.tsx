"use client";
import {useState} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-tp1-model2.css";

const photoSet=[
 {pattern:/fotograf|photograph/i,photo:"https://images.pexels.com/photos/3584996/pexels-photo-3584996.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/3062545/pexels-photo-3062545.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"FOTOGRAFIA AUTORAL",fallback:"Histórias que merecem ser vistas."},
 {pattern:/maquiagem|makeup/i,photo:"https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"BELEZA E EXPRESSÃO",fallback:"Sua beleza, sua assinatura."},
 {pattern:/psicolog|terapia/i,photo:"https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/17640381/pexels-photo-17640381.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"ACOLHIMENTO E CUIDADO",fallback:"Um espaço para você."},
 {pattern:/fisioterap/i,photo:"https://images.pexels.com/photos/4506109/pexels-photo-4506109.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/6111616/pexels-photo-6111616.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"MOVIMENTO E BEM-ESTAR",fallback:"Cuidado em cada movimento."},
 {pattern:/odontolog/i,photo:"https://images.pexels.com/photos/6627534/pexels-photo-6627534.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"ODONTOLOGIA ESTÉTICA",fallback:"Sorrisos com personalidade."},
 {pattern:/sal[aã]o|cabel|hair/i,photo:"https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"BELEZA CONTEMPORÂNEA",fallback:"Seu estilo em primeiro lugar."},
 {pattern:/consultoria de imagem|estilista/i,photo:"https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"IMAGEM E IDENTIDADE",fallback:"Estilo que comunica quem você é."},
 {pattern:/spa|bem.est[aá]r/i,photo:"https://images.pexels.com/photos/9335966/pexels-photo-9335966.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/11774389/pexels-photo-11774389.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"RITUAIS DE BEM-ESTAR",fallback:"Seu momento de reconexão."},
 {pattern:/dermatolog|est[eé]tica|beleza/i,photo:"https://images.pexels.com/photos/5659049/pexels-photo-5659049.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/6899549/pexels-photo-6899549.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"CUIDADO E ESTÉTICA",fallback:"O cuidado começa em você."}
];
export function BuilderV2TP1Model2Hero({site}:{site:BuilderV2SiteData}){
 const [menuOpen,setMenuOpen]=useState(false);
 const niche=site.niche||"Beleza e Serviços Premium";
 const photo=photoSet.find(item=>item.pattern.test(niche))||photoSet[photoSet.length-1];
 const brand=site.header?.brand?.trim()||site.title||"Seu Espaço";
 const heading=site.blocks.find(b=>b.type==="heading"&&b.text?.trim())?.text?.trim()||photo.fallback;
 const description=site.blocks.find(b=>b.type==="paragraph"&&b.text?.trim())?.text?.trim()||"Uma experiência pensada para valorizar cada detalhe do seu atendimento.";
 const rawHref=site.header?.ctaHref?.trim()||site.blocks.find(b=>b.type==="button"&&b.href)?.href?.trim()||"";
 const safeHref=rawHref.startsWith("#")||/^https:\/\//i.test(rawHref)||/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(rawHref)?rawHref:null;
 const cta=site.header?.ctaLabel?.trim()||"Fale com a equipe";
 return <div className="tp1v2" id="inicio">
  <header className="tp1v2-header">
   <a className="tp1v2-brand" href="#inicio">{brand}<span className="tp1v2-brand-dot">.</span></a>
   <button className="tp1v2-menu-toggle" type="button" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"Fechar":"Menu"} <span aria-hidden="true">{menuOpen?"×":"☰"}</span></button>
   <nav className={"tp1v2-nav"+(menuOpen?" is-open":"")} aria-label="Navegação principal"><a href="#inicio" onClick={()=>setMenuOpen(false)}>Início</a><a href="#sobre" onClick={()=>setMenuOpen(false)}>Sobre</a><a href="#servicos" onClick={()=>setMenuOpen(false)}>Serviços</a><a href="#contato" onClick={()=>setMenuOpen(false)}>Contato</a></nav>
   {safeHref?<a className="tp1v2-header-cta" href={safeHref}>{cta}<span aria-hidden="true">↗</span></a>:<span className="tp1v2-header-cta tp1v2-header-cta-muted" aria-label="Contato ainda não configurado">Contato a configurar</span>}
  </header>
  <section className="tp1v2-hero" aria-labelledby="tp1v2-heading">
   <div className="tp1v2-copy"><div className="tp1v2-eyebrow"><span className="tp1v2-line"/> {photo.eyebrow}</div><h1 id="tp1v2-heading">{heading}</h1><p>{description}</p><div className="tp1v2-actions">{safeHref?<a className="tp1v2-primary" href={safeHref}>{cta} <span aria-hidden="true">↗</span></a>:null}<a className="tp1v2-secondary" href="#sobre">Conheça nosso espaço <span aria-hidden="true">→</span></a></div><div className="tp1v2-index"><span>01</span><span className="tp1v2-index-rule"/><span>BELEZA & SERVIÇOS PREMIUM</span></div></div>
   <div className="tp1v2-visual"><div className="tp1v2-visual-back" aria-hidden="true"/><figure className="tp1v2-primary-photo"><img src={photo.photo} alt={"Fotografia ilustrativa de "+niche} loading="eager"/></figure><figure className="tp1v2-secondary-photo"><img src={photo.secondary} alt={"Ambiente ou detalhe ilustrativo de "+niche} loading="lazy"/></figure><div className="tp1v2-vertical-note">BEAUTY • WELLNESS • EXPERIENCE</div><div className="tp1v2-photo-caption">UMA NOVA PERSPECTIVA SOBRE O CUIDADO <span>✳</span></div></div>
  </section>
 </div>;
}
