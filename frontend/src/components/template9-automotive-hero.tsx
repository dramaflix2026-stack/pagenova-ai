"use client";
import {useState} from "react";
type Props={brand:string;niche:string;headline?:string;description?:string;image?:string;contactHref?:string};
const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const config:Record<string,{headline:string;sub:string;cta:string;photo:string}>={
"oficinas mecanicas":{headline:"Precisão em cada detalhe.",sub:"Cuidado técnico e atenção para o seu veículo.",cta:"Solicitar atendimento",photo:"photo-1486262715619-67b85e0b08d3"},
"auto centers":{headline:"Seu veículo merece o melhor.",sub:"Serviços automotivos com praticidade e atenção.",cta:"Consultar serviços",photo:"photo-1486262715619-67b85e0b08d3"},
"estetica automotiva":{headline:"A beleza está nos detalhes.",sub:"Valorize cada linha e acabamento do seu veículo.",cta:"Conhecer serviços",photo:"photo-1492144534655-ae79c964c9d7"},
"detalhamento automotivo":{headline:"O extraordinário está no detalhe.",sub:"Um novo olhar para o acabamento automotivo.",cta:"Solicitar orçamento",photo:"photo-1492144534655-ae79c964c9d7"},
"funilaria e pintura":{headline:"Cada detalhe faz a diferença.",sub:"Acabamento, restauração e cuidado automotivo.",cta:"Solicitar avaliação",photo:"photo-1486262715619-67b85e0b08d3"},
"lava-rapidos":{headline:"Seu carro em destaque.",sub:"Cuidado e apresentação para acompanhar sua rotina.",cta:"Consultar atendimento",photo:"photo-1492144534655-ae79c964c9d7"},
"autoeletricas":{headline:"Tecnologia a favor da sua jornada.",sub:"Soluções elétricas automotivas com atenção técnica.",cta:"Consultar serviços",photo:"photo-1486262715619-67b85e0b08d3"},
"lojas de pneus":{headline:"Pronto para seguir em frente.",sub:"Encontre opções para cuidar da sua mobilidade.",cta:"Consultar pneus",photo:"photo-1503376780353-7e6692767b70"},
"centros de alinhamento":{headline:"Direção com mais confiança.",sub:"Precisão e cuidado em cada ajuste.",cta:"Solicitar atendimento",photo:"photo-1486262715619-67b85e0b08d3"},
"oficinas de motos":{headline:"Sua próxima estrada começa aqui.",sub:"Cuidado e atenção para quem vive sobre duas rodas.",cta:"Consultar serviços",photo:"photo-1558981806-ec527fa84c39"},
"concessionarias de veiculos":{headline:"O próximo capítulo da sua jornada.",sub:"Descubra possibilidades para escolher seu próximo veículo.",cta:"Conhecer opções",photo:"photo-1503376780353-7e6692767b70"},
"locadoras de veiculos":{headline:"Liberdade para ir mais longe.",sub:"Explore possibilidades de mobilidade para cada jornada.",cta:"Consultar veículos",photo:"photo-1503376780353-7e6692767b70"}
};
export function Template9AutomotiveHero({brand,niche,headline,description,image,contactHref}:Props){
 const [open,setOpen]=useState(false);const key=normalize(niche);const d=config[key]||config[Object.keys(config).find(k=>key.includes(k)||k.includes(key))||"auto centers"];
 const photo=image&&/^https?:\/\//i.test(image)?image:"https://images.unsplash.com/"+d.photo+"?auto=format&fit=crop&w=2200&q=85";
 const contact=contactHref&&/^(https?:\/\/|mailto:|tel:)/i.test(contactHref)?contactHref:"#tp9-contato";
 return <div className="pn-t9" id="tp9-inicio"><style>{`
 .pn-t9{width:100%;max-width:100%;overflow-x:clip;background:#111616;color:white;font-family:Arial,Helvetica,sans-serif}.pn-t9 *{box-sizing:border-box}
 .pn-t9-header{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:26px clamp(22px,5vw,90px);border-bottom:1px solid #ffffff4d;background:linear-gradient(#050a0a66,transparent)}
 .pn-t9-brand{font-size:clamp(17px,2vw,27px);font-weight:700;letter-spacing:.03em;color:#fff;text-decoration:none;overflow-wrap:anywhere;max-width:42%}
 .pn-t9-nav{display:flex;align-items:center;gap:30px}.pn-t9-nav a{color:white;text-decoration:none;font-size:11px;letter-spacing:.13em;text-transform:uppercase}
 .pn-t9-btn{border:1px solid #f2f2e6;padding:15px 20px;text-decoration:none;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.13em;display:inline-block}
 .pn-t9-toggle{display:none;border:1px solid #ffffff66;background:#0a11117d;color:white;padding:11px 14px;cursor:pointer}
 .pn-t9-hero{position:relative;min-height:min(900px,100svh);min-height:max(680px,100svh);display:flex;align-items:end;isolation:isolate;padding:180px clamp(22px,7vw,110px) clamp(70px,9vw,125px)}
 .pn-t9-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-3}.pn-t9-hero:after{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(90deg,#030707b8,#03070722 85%),linear-gradient(0deg,#030707cb,transparent 65%)}
 .pn-t9-hero-inner{max-width:1000px}.pn-t9-eyebrow{display:block;text-transform:uppercase;letter-spacing:.27em;font-size:11px;font-weight:700;margin-bottom:25px;color:#e6e3d9}
 .pn-t9-title{font:400 clamp(53px,8.5vw,135px)/.98 Georgia,'Times New Roman',serif;letter-spacing:-.06em;margin:0 0 28px;overflow-wrap:break-word}
 .pn-t9-desc{font-size:clamp(16px,1.6vw,21px);line-height:1.7;max-width:610px;color:#efefec;margin:0 0 34px}
 .pn-t9-hero-foot{position:absolute;bottom:27px;right:clamp(22px,7vw,110px);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#ffffffc9}
 .pn-t9-intro{background:#eeeae2;color:#1d2625;padding:38px clamp(22px,7vw,110px);display:flex;align-items:center;justify-content:space-between;gap:20px}.pn-t9-intro span{font:400 clamp(19px,2.3vw,30px) Georgia,serif}.pn-t9-intro a{color:#1d2625;text-decoration:none;font-size:11px;text-transform:uppercase;letter-spacing:.12em}
 @media(max-width:850px){.pn-t9-toggle{display:block}.pn-t9-nav{display:none;position:absolute;top:100%;left:0;right:0;padding:25px;background:#101a19;flex-direction:column;align-items:start}.pn-t9-nav[data-open="true"]{display:flex}.pn-t9-header{padding:20px 22px}.pn-t9-hero{min-height:720px;padding:160px 22px 95px}.pn-t9-hero-foot{right:22px}.pn-t9-intro{flex-direction:column;align-items:start}}
 `}</style>
 <header className="pn-t9-header"><a className="pn-t9-brand" href="#tp9-inicio">{brand}</a><button className="pn-t9-toggle" aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open} type="button" onClick={()=>setOpen(!open)}>{open?"Fechar ×":"Menu ☰"}</button><nav className="pn-t9-nav" data-open={open} aria-label="Menu principal"><a href="#tp9-inicio" onClick={()=>setOpen(false)}>Início</a><a href="#tp9-sobre" onClick={()=>setOpen(false)}>Sobre</a><a href="#tp9-servicos" onClick={()=>setOpen(false)}>Serviços</a><a href="#tp9-contato" onClick={()=>setOpen(false)}>Contato</a><a className="pn-t9-btn" href={contact} onClick={()=>setOpen(false)}>{d.cta} ↗</a></nav></header>
 <section className="pn-t9-hero"><img src={photo} alt={"Fotografia ilustrativa do segmento "+niche}/><div className="pn-t9-hero-inner"><span className="pn-t9-eyebrow">{niche} · excelência automotiva</span><h1 className="pn-t9-title">{headline?.trim()||d.headline}</h1><p className="pn-t9-desc">{description?.trim()||d.sub}</p><a className="pn-t9-btn" href={contact}>{d.cta} ↗</a></div><span className="pn-t9-hero-foot">Automotivo e mobilidade / 01</span></section>

 </div>;
}
