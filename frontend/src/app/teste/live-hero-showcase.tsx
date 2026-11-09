"use client";
import type { CSSProperties } from "react";
import "./live-hero-showcase.css";
type Lang = "pt" | "en" | "es";
type Website = {
  key: string;
  brand: string;
  image: string;
  accent: string;
  className?: string;
  label: Record<Lang,string>;
  title: Record<Lang,string>;
};
const sites: Website[] = [
  {
    key:"nexora", brand:"NEXORA AI", accent:"#7cffb6",
    image:"https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1100",
    label:{pt:"TECNOLOGIA / IA",en:"TECHNOLOGY / AI",es:"TECNOLOGÍA / IA"},
    title:{pt:"Soluções em IA para seu negócio.",en:"AI solutions for your business.",es:"Soluciones de IA para tu negocio."}
  },
  {
    key:"vertice",brand:"VÉRTICE.",accent:"#b6ff69",
    image:"https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1100",
    label:{pt:"ENGENHARIA & ARQUITETURA",en:"ENGINEERING & ARCHITECTURE",es:"INGENIERÍA & ARQUITECTURA"},
    title:{pt:"Projetos que transformam espaços.",en:"Spaces designed to inspire.",es:"Proyectos que transforman espacios."}
  },
  {
    key:"aurora-food",brand:"AURORA.",accent:"#ecc58b",
    image:"https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=1100",
    label:{pt:"GASTRONOMIA",en:"GASTRONOMY",es:"GASTRONOMÍA"},
    title:{pt:"Sabores feitos para surpreender.",en:"Flavours to remember.",es:"Sabores para recordar."}
  },
  {
    key:"lavanderia",brand:"LAVANDERIA.",accent:"#8adfd3",
    image:"/pagenova-lavanderia-banner-1.png",
    label:{pt:"SERVIÇOS",en:"SERVICES",es:"SERVICIOS"},
    title:{pt:"Cuidado em cada detalhe.",en:"Care in every detail.",es:"Cuidado en cada detalle."}
  },
  {
    key:"beauty",brand:"BELEZA.",accent:"#f5a6bd",
    image:"https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=1100",
    label:{pt:"ESTÉTICA & BELEZA",en:"BEAUTY & WELLNESS",es:"BELLEZA & BIENESTAR"},
    title:{pt:"Sua beleza, nossa inspiração.",en:"Beauty that inspires.",es:"Belleza que inspira."}
  },
  {
    key:"essencia",brand:"ESSÊNCIA.",accent:"#f1ce99",
    image:"https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1100",
    label:{pt:"HOTELARIA",en:"HOSPITALITY",es:"HOTELERÍA"},
    title:{pt:"Hospedagem com conforto e estilo.",en:"Stay in comfort and style.",es:"Hospedaje con confort y estilo."}
  },
  {
    key:"atelier",brand:"ATELIER.",accent:"#f2a6bb",
    image:"https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=1100",
    label:{pt:"LOJA ONLINE",en:"ONLINE SHOP",es:"TIENDA ONLINE"},
    title:{pt:"Produtos exclusivos para você.",en:"Curated pieces for you.",es:"Piezas exclusivas para ti."}
  },
  {
    key:"studio",brand:"NOVA STUDIO.",accent:"#a6d8ff",
    image:"/landing-universal/hero.webp",
    label:{pt:"ESTÚDIO CRIATIVO",en:"CREATIVE STUDIO",es:"ESTUDIO CREATIVO"},
    title:{pt:"Ideias com identidade própria.",en:"A distinctive digital identity.",es:"Ideas con identidad propia."}
  }
];
function WebsiteCard({site,lang}:{site:Website;lang:Lang}) {
  return <div className={"pn7-site-card pn7-site-"+site.key} style={{"--pn7-accent":site.accent} as CSSProperties}>
    <div className="pn7-site-photo" style={{backgroundImage:"url('"+site.image+"')"}}/>
    <div className="pn7-site-tint"/>
    <div className="pn7-site-head"><div className="pn7-site-dots"><i/><i/><i/></div><span>{site.brand}</span><span className="pn7-site-menu"><i/><i/></span></div>
    <div className="pn7-site-content">
      <p>{site.label[lang]}</p>
      <strong>{site.title[lang]}</strong>
      <span className="pn7-site-button"><span/><b>↗</b></span>
    </div>
    <div className="pn7-site-reflection"/>
  </div>;
}
export function LiveHeroShowcase({lang,mobile=false}:{lang:Lang;mobile?:boolean}) {
  const first=[sites[0],sites[1],sites[2],sites[3],sites[4],sites[5],sites[6],sites[7]];
  const second=[sites[5],sites[6],sites[4],sites[2],sites[7],sites[0],sites[3],sites[1]];
  return <div className={"pn7-showcase "+(mobile?"pn7-showcase-mobile":"pn7-showcase-desktop")} aria-hidden="true">
    <div className="pn7-light pn7-light-left"/><div className="pn7-light pn7-light-right"/>
    {(!mobile?["back","front"]:["mobile"]).map(layer=>{
      const list=layer==="back"?second:first;
      return <div key={layer} className={"pn7-rail pn7-rail-"+layer}>
        <div className="pn7-runner">
          {[0,1].map(group=><div className="pn7-set" key={group}>{list.map(site=><WebsiteCard key={site.key} site={site} lang={lang}/>)}</div>)}
        </div>
      </div>;
    })}
    <div className="pn7-mid-mask"/><div className="pn7-lens-flare"/>
  </div>;
}
