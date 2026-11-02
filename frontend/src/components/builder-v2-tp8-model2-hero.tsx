"use client";
import {useState} from "react";
import "./builder-v2-tp8-model2-hero.css";
type Props={brand:string;niche:string;headline?:string;description?:string;image?:string;contactHref?:string};
const themes:[RegExp,string,string,string][]=[
[/resort|praia|litoral|beach/i,"UMA EXPERIÊNCIA À BEIRA-MAR","Onde cada horizonte convida a descobrir mais.","photo-1571896349842-33c89424de2d"],
[/hotel|hosped|pousada|hostel|chal[eé]|cabana|boutique/i,"HOSPITALIDADE EM CADA DETALHE","Um novo olhar sobre a arte de receber.","photo-1542314831-068cd1dbfeeb"],
[/ecotur|natureza|aventura|trilha|camping|glamping/i,"CONEXÃO COM A NATUREZA","Explore paisagens e descubra novos caminhos.","photo-1470770841072-f978cf4d019e"],
[/viage|ag[eê]ncia|turismo|destino|passeio|roteiro|excurs[aã]o/i,"DESCUBRA NOVOS HORIZONTES","Cada destino é o início de uma nova história.","photo-1469474968028-56623f02e42e"],
[/spa|retiro|wellness|bem-estar/i,"UM CONVITE AO EQUILÍBRIO","Tempo para se reconectar ao que importa.","photo-1540555700478-4be289fbecef"],
[/evento|experi[eê]ncia|gastronom/i,"MOMENTOS PARA DESCOBRIR","Experiências que transformam o cotidiano.","photo-1511795409834-ef04bbd61622"],
[/./i,"HOSPITALIDADE & EXPERIÊNCIAS","Descubra novos lugares e possibilidades.","photo-1571896349842-33c89424de2d"]];
export function BuilderV2TP8Model2Hero({brand,niche,headline,description,image,contactHref}:Props){
 const [menuOpen,setMenuOpen]=useState(false);
 const theme=themes.find(([re])=>re.test(niche))||themes[themes.length-1];
 const photo=image?.trim()||"https://images.unsplash.com/"+theme[3]+"?auto=format&fit=crop&w=2400&q=85";
 const link=contactHref||"#contato-tp8";
 return <div className="tp8m2"><header className="tp8m2-header"><a href="#inicio-tp8" className="tp8m2-brand">{brand}</a><button className="tp8m2-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="tp8m2-nav" onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"FECHAR":"MENU"} <span aria-hidden="true">{menuOpen?"×":"☰"}</span></button><nav id="tp8m2-nav" className={menuOpen?"tp8m2-nav tp8m2-nav-open":"tp8m2-nav"} aria-label="Navegação principal"><a onClick={()=>setMenuOpen(false)} href="#sobre-tp8">SOBRE</a><a onClick={()=>setMenuOpen(false)} href="#experiencias-tp8">EXPERIÊNCIAS</a><a onClick={()=>setMenuOpen(false)} href="#galeria-tp8">GALERIA</a><a onClick={()=>setMenuOpen(false)} href="#contato-tp8">CONTATO</a></nav><a className="tp8m2-header-cta" href={link}>{contactHref?"FALE CONOSCO ↗":"EXPLORAR ↗"}</a></header><section id="inicio-tp8" className="tp8m2-hero" aria-labelledby="tp8m2-heading"><img src={photo} alt={image?.trim()?"Imagem de capa cadastrada pela empresa":"Fotografia ilustrativa de hospitalidade ou turismo"} fetchPriority="high"/><div className="tp8m2-shade"/><div className="tp8m2-hero-inner"><span className="tp8m2-eyebrow">{niche.toLocaleUpperCase("pt-BR")} <span aria-hidden="true">—</span> {theme[1]}</span><h1 id="tp8m2-heading">{headline?.trim()||"Viva o extraordinário."}</h1><p>{description?.trim()||theme[2]}</p><div className="tp8m2-actions"><a href="#experiencias-tp8" className="tp8m2-primary">DESCUBRA MAIS <span aria-hidden="true">↗</span></a>{contactHref&&<a className="tp8m2-secondary" href={contactHref}>ENTRE EM CONTATO <span aria-hidden="true">↗</span></a>}</div></div><div className="tp8m2-hero-bottom"><span>UMA NOVA FORMA DE EXPLORAR</span><a href="#sobre-tp8">ROLE PARA DESCOBRIR ↓</a><span>IMAGEM {image?.trim()?"CADASTRADA":"ILUSTRATIVA"}</span></div></section></div>;
}
