"use client";
import type { CSSProperties } from "react";
import "./live-hero-showcase.css";

type Lang = "pt" | "en" | "es";
type Site = {
  id:string; brand:string; accent:string; image:string; fallback:string; position?:string;
  category:Record<Lang,string>; title:Record<Lang,string>;
};
const sites:Record<string,Site> = {
  nexora: {id:"nexora",brand:"NEXORA AI.",accent:"#81ffca",
    image:"https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800",
    fallback:"/landing-universal/offer.webp",position:"center",
    category:{pt:"TECNOLOGIA & IA",en:"TECHNOLOGY & AI",es:"TECNOLOGÍA & IA"},
    title:{pt:"Soluções em IA para seu negócio.",en:"AI solutions for your business.",es:"Soluciones de IA para tu negocio."}},
  vertice: {id:"vertice",brand:"VÉRTICE.",accent:"#a6ff61",
    image:"/templates/vertice-premium/a203401e-d5d3-4f4a-950a-86642f9c5db3/src/assets/hero.jpg",
    fallback:"/templates/vertice-premium/a203401e-d5d3-4f4a-950a-86642f9c5db3/src/assets/hero.jpg",position:"57% center",
    category:{pt:"ENGENHARIA & ARQUITETURA",en:"ENGINEERING & ARCHITECTURE",es:"INGENIERÍA & ARQUITECTURA"},
    title:{pt:"Projetos que transformam espaços.",en:"Projects that transform spaces.",es:"Proyectos que transforman espacios."}},
  aurora: {id:"aurora",brand:"AURORA.",accent:"#f4ce9a",
    image:"https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=850",
    fallback:"/landing-universal/hero.webp",
    category:{pt:"GASTRONOMIA",en:"DINING",es:"GASTRONOMÍA"},
    title:{pt:"Sabores para surpreender.",en:"Flavours to remember.",es:"Sabores para sorprender."}},
  laundry: {id:"laundry",brand:"LAVANDERIA.",accent:"#87eada",
    image:"/pagenova-lavanderia-banner-1.png",fallback:"/pagenova-lavanderia-banner-2.png",
    category:{pt:"SERVIÇOS",en:"SERVICES",es:"SERVICIOS"},
    title:{pt:"Cuidado em cada detalhe.",en:"Care in every detail.",es:"Cuidado en cada detalle."}},
  hotel: {id:"hotel",brand:"ESSÊNCIA.",accent:"#f4d098",
    image:"https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=850",
    fallback:"/landing-universal/hero.webp",position:"center",
    category:{pt:"HOTELARIA",en:"HOSPITALITY",es:"HOTELERÍA"},
    title:{pt:"Hospedagem com conforto e estilo.",en:"Stay in comfort and style.",es:"Hospedaje con confort y estilo."}},
  beauty: {id:"beauty",brand:"BELEZA.",accent:"#f7b5cb",
    image:"https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=850",
    fallback:"/landing-universal/people.webp",position:"center top",
    category:{pt:"BELEZA",en:"BEAUTY",es:"BELLEZA"},
    title:{pt:"Sua beleza merece o melhor.",en:"Beauty that inspires.",es:"Belleza que inspira."}},
  atelier: {id:"atelier",brand:"ATELIER.",accent:"#ffc0da",
    image:"/landing-universal/offer.webp",fallback:"/landing-universal/offer.webp",position:"center",
    category:{pt:"LOJA ONLINE",en:"ONLINE STORE",es:"TIENDA ONLINE"},
    title:{pt:"Produtos exclusivos para você.",en:"Curated pieces just for you.",es:"Piezas exclusivas para ti."}},
  creative: {id:"creative",brand:"NOVA STUDIO.",accent:"#9ecfff",
    image:"/landing-universal/hero.webp",fallback:"/landing-universal/hero.webp",
    category:{pt:"ESTÚDIO DIGITAL",en:"DIGITAL STUDIO",es:"ESTUDIO DIGITAL"},
    title:{pt:"Ideias que ganham vida.",en:"Ideas brought to life.",es:"Ideas que cobran vida."}}
};

function SiteCard({site,lang,placement}:{site:Site;lang:Lang;placement:string}){
  const imagePosition=site.position ?? "center";
  return <div className={"pn8-placement pn8-"+placement}>
    <div className="pn8-card" style={{"--accent":site.accent} as CSSProperties}>
      <div className="pn8-card-photo">
        <img
          src={site.image}
          alt=""
          loading={placement.includes("hero") || placement.includes("mobile") ? "eager" : "lazy"}
          decoding="async"
          style={{ objectPosition: imagePosition }}
          onError={event => {
            const el=event.currentTarget;
            if(el.dataset.fallbackApplied==="1"){el.style.display="none";return;}
            el.dataset.fallbackApplied="1";
            el.src=site.fallback;
          }}
        />
      </div>
      <div className="pn8-card-shadow"/>
      <div className="pn8-card-glare"/>
      <div className="pn8-card-header">
        <span className="pn8-dots"><i/><i/><i/></span>
        <b>{site.brand}</b>
        <span className="pn8-menu"><i/><i/></span>
      </div>
      <div className="pn8-card-content">
        <p>{site.category[lang]}</p>
        <strong>{site.title[lang]}</strong>
        <span className="pn8-faux-button"><span/>↗</span>
      </div>
    </div>
  </div>;
}

export function LiveHeroShowcase({lang,mobile=false}:{lang:Lang;mobile?:boolean}){
 if(mobile){
   return <div className="pn8-mobile-scene" aria-hidden="true">
     <div className="pn8-mobile-aura"/>
     <SiteCard site={sites.vertice} lang={lang} placement="mobile-left"/>
     <SiteCard site={sites.hotel} lang={lang} placement="mobile-right"/>
     <div className="pn8-mobile-floor"/>
   </div>;
 }
 return <div className="pn8-desktop-scene" aria-hidden="true">
   <div className="pn8-aura pn8-aura-left"/><div className="pn8-aura pn8-aura-right"/>
   <SiteCard site={sites.creative} lang={lang} placement="left-ghost"/>
   <SiteCard site={sites.aurora} lang={lang} placement="left-rear"/>
   <SiteCard site={sites.nexora} lang={lang} placement="left-edge"/>
   <SiteCard site={sites.vertice} lang={lang} placement="left-hero"/>
   <SiteCard site={sites.laundry} lang={lang} placement="right-rear"/>
   <SiteCard site={sites.beauty} lang={lang} placement="right-ghost"/>
   <SiteCard site={sites.hotel} lang={lang} placement="right-hero"/>
   <SiteCard site={sites.atelier} lang={lang} placement="right-edge"/>
   <div className="pn8-center-shield"/>
   <div className="pn8-floor-light"/>
 </div>;
}
