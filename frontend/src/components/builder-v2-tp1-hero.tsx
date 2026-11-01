"use client";
import type { BuilderV2SiteData } from "@/components/builder-v2-site";
import "./builder-v2-tp1-hero.css";
const mediaBase="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";
export function BuilderV2TP1Hero({site}:{site:BuilderV2SiteData}){
 const brand=site.header?.brand||site.title||"Burger";
 const heading=site.blocks.find(b=>b.type==="heading")?.text||"O SABOR QUE NASCE DA BRASA";
 const summary=site.blocks.find(b=>b.type==="paragraph")?.text||"Hambúrgueres artesanais preparados com ingredientes selecionados.";
 const nav=site.header?.navItems?.length?site.header.navItems:[{label:"Início",href:"#inicio"},{label:"Cardápio",href:"#produtos"},{label:"Sobre",href:"#sobre"},{label:"Contato",href:"#pedidos"}];
 const primary=site.blocks.find(b=>b.type==="button");
 const cta=site.header?.ctaHref||primary?.href||"#pedidos";
 const desktop=mediaBase+"f8eada23-211a-47a7-b96f-6d3bf2d2c217.png";
 const mobile=mediaBase+"94cda1b0-d8ec-4ef3-ad79-865bf228bca0.png";
 return <div className="tp1-new"><header className="tp1-new-header"><a className="tp1-new-brand" href="#inicio"><span className="tp1-new-brand-icon" aria-hidden="true">✳</span><span>{brand}</span></a><nav aria-label="Navegação principal">{nav.map((item,i)=><a key={i} href={item.href}>{item.label}</a>)}</nav><a className="tp1-new-order" href={cta}>{site.header?.ctaLabel||"PEDIR AGORA"} <span aria-hidden="true">↗</span></a></header><main><section className="tp1-new-hero" id="inicio"><div className="tp1-new-copy"><span className="tp1-new-label">BURGER EXPERIENCE / 001</span><h1>{heading}</h1><p>{summary}</p><div className="tp1-new-actions"><a className="tp1-new-main-button" href="#produtos">EXPLORAR CARDÁPIO <span aria-hidden="true">↗</span></a><a className="tp1-new-outline-button" href={cta}>FAZER PEDIDO</a></div><span className="tp1-new-signature">ARTESANAL. INTENSO. INESQUECÍVEL.</span></div><div className="tp1-new-visual"><picture><source media="(max-width:760px)" srcSet={mobile}/><img src={desktop} alt="Hambúrguer artesanal em fotografia gastronômica premium" loading="eager"/></picture></div><div className="tp1-new-bottom"><span>01 / FEITO COM PAIXÃO</span><span>EXPLORE NOSSO SABOR ↓</span></div></section></main></div>;
}