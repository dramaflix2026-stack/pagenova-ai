"use client";
import {useState} from "react";
import "./builder-v2-tp7-model3-hero.css";
export function BuilderV2TP7Model3Hero({brand,niche,headline,description,contactHref}:{brand:string;niche:string;headline?:string;description?:string;contactHref:string}){
const [open,setOpen]=useState(false);
const themes:[RegExp,string,string,string][]=[
[/arquitet|interiores/i,"Arquitetura para novos olhares.","Ambientes, formas e ideias para descobrir.","photo-1600607687920-4e2a09cf159d"],
[/loteamento|terreno/i,"Horizontes para novos projetos.","Explore espaços e possibilidades.","photo-1600607687939-ce8a6c25118c"],
[/construtor|incorporador|empreendimento/i,"Projetos que inspiram o amanhã.","Arquitetura e espaços em perspectiva.","photo-1600585154340-be6161a56a0c"],
[/comercial|corporativ|escrit[oó]rio/i,"Espaços para novas ideias.","Ambientes que acompanham seus projetos.","photo-1497366754035-f200968a6e72"],
[/rural|fazenda|ch[aá]cara|s[ií]tio/i,"Um horizonte de possibilidades.","Paisagens e espaços para descobrir.","photo-1449158743715-0a90ebb6d2d8"],
[/temporada|loca[cç][aã]o/i,"Lugares para novas experiências.","Descubra ambientes e destinos.","photo-1613490493576-7fde63acd811"],
[/apartamento|condom[ií]nio/i,"Novas formas de viver.","Ambientes e arquitetura em destaque.","photo-1600607688969-a5bfcd646154"],
[/imobili[aá]r|corretor|alto padr[aã]o|im[oó]ve|resid[eê]ncia|casa/i,"Lugares que inspiram histórias.","Uma nova perspectiva sobre arquitetura e moradia.","photo-1600566753190-17f0baa2a6c3"]];
const theme=themes.find(([re])=>re.test(niche));const heading=headline?.trim()&&!/^(TP7|BRIEFING|MODELO)/i.test(headline.trim())?headline:theme?.[1]||"Espaços para novos olhares.";const intro=description?.trim()&&description.length<250?description:theme?.[2]||"Explore novas perspectivas.";
return <div id="inicio-tp7" className="tp7m3"><header className="tp7m3-header"><a className="tp7m3-brand" href="#inicio-tp7">{brand}</a><span className="tp7m3-label">ARQUITETURA / ESPAÇOS</span><nav className={open?"tp7m3-nav is-open":"tp7m3-nav"} aria-label="Menu principal"><a href="#sobre-tp7">Sobre nós</a><a href="#diferenciais-tp7">Diferenciais</a><a href="#contato-tp7">Contato</a></nav><a className="tp7m3-contact" href={contactHref}>FALE CONOSCO ↗</a><button type="button" aria-expanded={open} aria-label="Abrir ou fechar menu" className="tp7m3-toggle" onClick={()=>setOpen(!open)}>{open?"✕":"☰"}</button></header><section className="tp7m3-hero"><div className="tp7m3-copy"><span>01 / {niche.toLocaleUpperCase("pt-BR")}</span><h1>{heading}</h1><p>{intro}</p><a className="tp7m3-button" href="#imoveis-tp7">EXPLORAR ESPAÇOS ↗</a><small>FORMA & LUZ — UMA NOVA PERSPECTIVA</small></div><figure><img src={"https://images.unsplash.com/"+(theme?.[3]||"photo-1600607687939-ce8a6c25118c")+"?auto=format&fit=crop&w=1800&q=85"} alt="Fotografia arquitetônica ilustrativa" loading="eager"/><figcaption>IMAGEM ARQUITETÔNICA ILUSTRATIVA</figcaption></figure></section><div className="tp7m3-bottom"><span>DESIGN CONTEMPORÂNEO</span><a href="#sobre-tp7">DESCUBRA MAIS ↓</a></div></div>;
}