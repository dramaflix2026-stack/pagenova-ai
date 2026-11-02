"use client";
import {useState} from "react";
import "./builder-v2-tp7-model1-hero.css";
type Props={brand:string;niche:string;headline?:string;description?:string;contactHref?:string};
const themes:[RegExp,string,string,string][]=[
[/loteamento|terreno/i,"ESPAÇOS PARA O FUTURO","Novos horizontes começam aqui.","photo-1600607687939-ce8a6c25118c"],
[/construtor|incorporador|empreendimento/i,"ARQUITETURA EM PERSPECTIVA","Projetos para novas histórias.","photo-1600607687920-4e2a09cf159d"],
[/arquitet|design de interiores/i,"FORMAS DE HABITAR","Arquitetura que inspira.","photo-1600210492486-724fe5c67fb0"],
[/comercial|corporativ|escrit[oó]rio/i,"NOVAS POSSIBILIDADES","Espaços para grandes ideias.","photo-1497366811353-6870744d04b2"],
[/rural|fazenda|ch[aá]cara|s[ií]tio/i,"O PRIVILÉGIO DO ESPAÇO","Viva novos horizontes.","photo-1600566753190-17f0baa2a6c3"],
[/temporada|loca[cç][aã]o/i,"SEU PRÓXIMO DESTINO","Descubra onde estar.","photo-1613490493576-7fde63acd811"],
[/apartamento|condom[ií]nio/i,"NOVAS PERSPECTIVAS","Seu próximo capítulo começa aqui.","photo-1600607687920-4e2a09cf159d"],
[/imobili[aá]r|corretor|alto padr[aã]o|im[oó]ve|resid[eê]ncia|casa/i,"IMÓVEIS & EXPERIÊNCIAS","Encontre seu próximo lugar.","photo-1600607687939-ce8a6c25118c"]
];
export function BuilderV2TP7Model1Hero({brand,niche,headline,description,contactHref}:Props){
 const [open,setOpen]=useState(false);
 const found=themes.find(([re])=>re.test(niche));
 const tag=found?.[1]||"ESPAÇOS & POSSIBILIDADES";
 const title=found?.[2]||"Descubra novos espaços.";
 const photo=found?.[3]||"photo-1600607687939-ce8a6c25118c";
 const src="https://images.unsplash.com/"+photo+"?auto=format&fit=crop&w=2200&q=85";
 const heading=headline&&headline.length<115&&!/^(briefing|nicho|fam[ií]lia|modelo visual|tp7)/i.test(headline.trim())?headline:title;
 const intro=description&&description.length<320&&!/^(briefing|nicho|fam[ií]lia|modelo visual|tp7)/i.test(description.trim())?description:"Explore uma apresentação visual de espaços, projetos e oportunidades alinhadas ao seu estilo.";
 return <div className="tp7m1" data-tp7-model="01">
 <header className="tp7m1-header"><a className="tp7m1-brand" href="#inicio-tp7">{brand}</a><nav className={open?"tp7m1-nav is-open":"tp7m1-nav"} aria-label="Navegação principal"><a href="#inicio-tp7" onClick={()=>setOpen(false)}>Início</a><a href="#imoveis-tp7" onClick={()=>setOpen(false)}>Imóveis</a><a href="#sobre-tp7" onClick={()=>setOpen(false)}>Sobre</a><a href="#contato-tp7" onClick={()=>setOpen(false)}>Contato</a></nav><a className="tp7m1-header-cta" href={contactHref||"#contato-tp7"}>FALE CONOSCO <span aria-hidden="true">↗</span></a><button className="tp7m1-menu" type="button" aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?"✕":"☰"}</button></header>
 <section className="tp7m1-hero" id="inicio-tp7" aria-labelledby="tp7m1-title"><img className="tp7m1-image" src={src} alt={"Fotografia arquitetônica ilustrativa para "+niche} fetchPriority="high"/><div className="tp7m1-overlay"/><div className="tp7m1-frame"><div className="tp7m1-top"><span>01 / APRESENTAÇÃO</span><span>{tag}</span></div><div className="tp7m1-content"><div className="tp7m1-kicker"><span className="tp7m1-line"/>ARQUITETURA • ESPAÇOS • POSSIBILIDADES</div><h1 id="tp7m1-title">{heading}</h1><p>{intro}</p><div className="tp7m1-actions"><a className="tp7m1-button" href="#imoveis-tp7">EXPLORAR IMÓVEIS <span aria-hidden="true">↗</span></a><a className="tp7m1-text-link" href={contactHref||"#contato-tp7"}>ENTRE EM CONTATO <span aria-hidden="true">↗</span></a></div></div><div className="tp7m1-bottom"><span>{brand} / {niche}</span><span>↓ DESLIZE PARA EXPLORAR</span><span>01 — 01</span></div></div></section></div>;
}
