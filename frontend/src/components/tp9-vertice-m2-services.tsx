"use client";

import {ArrowUpRight,Wrench} from "lucide-react";

type Service={number:string;name:string;description:string;photo:string;alt:string};
const services:Service[]=[
 {number:"01",name:"Revisão preventiva",description:"Verificações e orientações para acompanhar os cuidados periódicos com seu veículo.",photo:"photo-1792326103553-4e4e8964279e",alt:"Veículos em oficina automotiva com carros sob manutenção"},
 {number:"02",name:"Diagnóstico eletrônico",description:"Consulta de sistemas e sintomas para orientar uma avaliação técnica.",photo:"photo-1632733711679-529326f6db12",alt:"Profissional trabalhando em componentes eletrônicos de automóvel"},
 {number:"03",name:"Troca de óleo e filtros",description:"Cuidados com a lubrificação e a substituição periódica de componentes.",photo:"photo-1771340742493-52fbd5476ccb",alt:"Profissional realizando lubrificação do motor"},
 {number:"04",name:"Freios e suspensão",description:"Avaliação de componentes envolvidos no controle e na segurança do veículo.",photo:"photo-1769218402167-b0ef15eaf7cc",alt:"Componentes de suspensão e rodas observados na oficina"},
 {number:"05",name:"Ar-condicionado automotivo",description:"Consulta sobre avaliação e manutenção do sistema de climatização do veículo.",photo:"photo-1792792944402-5e94ce198dce",alt:"Fotografia ilustrativa de manutenção de roda de um veículo em oficina"},
 {number:"06",name:"Alinhamento e balanceamento",description:"Orientação sobre inspeção e ajustes de rodas conforme a necessidade e os equipamentos disponíveis.",photo:"photo-1652852592938-15bf8c50ab6d",alt:"Carro em elevador de oficina para avaliação e ajustes mecânicos"}
];
const fallback="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1000&q=82";
const image=(photo:string)=>"https://images.unsplash.com/"+photo+"?auto=format&fit=crop&w=1000&q=85";

export function TP9VerticeM2Services(){
 return <section id="tp9-servicos" className="tp9m2v-services" aria-labelledby="tp9m2v-services-title">
  <style>{`
  .tp9m2-vertice-sections .tp9m2v-services{--m2gold:#d0aa70;background:#0a0d0c;padding:clamp(76px,8vw,132px) clamp(22px,7vw,114px);color:#fff;font-family:Arial,Helvetica,sans-serif;max-width:100%;overflow-x:clip}
  .tp9m2-vertice-sections .tp9m2v-services *{box-sizing:border-box}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-shell{max-width:1430px;margin:0 auto}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-header{display:flex;align-items:end;justify-content:space-between;gap:32px;margin-bottom:44px}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-eyebrow{margin:0 0 18px;display:flex;align-items:center;gap:13px;color:var(--m2gold);font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-eyebrow:before{content:"";display:block;width:27px;height:2px;background:var(--m2gold)}
  .tp9m2-vertice-sections .tp9m2v-services h2{font:900 clamp(39px,5.1vw,76px)/1.05 Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:-.055em;margin:0;color:#fff;max-width:700px;text-wrap:balance}
  .tp9m2-vertice-sections .tp9m2v-services h2 em{color:var(--m2gold);font-style:normal}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-intro{max-width:395px;margin:0;color:#bec7c1;font-size:clamp(14px,1.3vw,17px);line-height:1.8}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-card{min-width:0;border:1px solid #ffffff2a;border-radius:12px;overflow:hidden;background:#181e1b;display:flex;flex-direction:column;transition:transform .25s,border-color .25s,box-shadow .25s}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-card:hover{transform:translateY(-5px);border-color:#d0aa7099;box-shadow:0 20px 36px #0007}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-photo{position:relative;overflow:hidden;aspect-ratio:1.46;background:#272e2b}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,#101712a6);pointer-events:none}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-photo img{width:100%;height:100%;object-fit:cover;display:block;filter:contrast(1.09) saturate(.87);transition:transform .35s}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-card:hover img{transform:scale(1.055)}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-number{position:absolute;z-index:1;top:17px;left:17px;background:#0b1311d9;border:1px solid #c9a36b9c;padding:8px 11px;font-size:11px;font-weight:900;letter-spacing:.12em;color:var(--m2gold);border-radius:6px}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-content{padding:clamp(21px,2.3vw,29px);display:flex;flex-direction:column;align-items:flex-start;flex:1}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-content h3{font:850 clamp(19px,1.9vw,26px)/1.18 Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:-.025em;color:#fff;margin:0 0 13px}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-content p{font-size:14px;color:#b8c5bb;line-height:1.7;margin:0 0 24px;flex:1}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-link{display:inline-flex;align-items:center;gap:10px;min-height:35px;color:var(--m2gold);font-size:12px;letter-spacing:.05em;text-transform:uppercase;font-weight:900;text-decoration:none;border-bottom:1px solid #c9a36b99;transition:color .2s,gap .2s}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-link:hover{color:#ffe2a8;gap:15px}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-bottom{margin:32px 0 0;padding:20px 0 0;border-top:1px solid #ffffff2b;display:flex;align-items:center;justify-content:space-between;gap:15px 25px;flex-wrap:wrap}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-bottom p{font-size:12px;color:#a8b8ad;line-height:1.7;margin:0;max-width:700px}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-button{display:inline-flex;align-items:center;justify-content:center;gap:11px;padding:15px 22px;min-height:52px;background:var(--m2gold);border:1px solid var(--m2gold);color:#141817;text-decoration:none;font-size:12px;letter-spacing:.05em;text-transform:uppercase;font-weight:900;transition:transform .2s,background .2s}
  .tp9m2-vertice-sections .tp9m2v-services .v2s-button:hover{background:#f1ca8c;transform:translateY(-2px)}
  .tp9m2-vertice-sections .tp9m2v-services a:focus-visible{outline:3px solid #efcc96;outline-offset:4px}
  @media(max-width:960px){.tp9m2-vertice-sections .tp9m2v-services .v2s-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.tp9m2-vertice-sections .tp9m2v-services .v2s-header{align-items:flex-start;flex-direction:column;gap:18px}.tp9m2-vertice-sections .tp9m2v-services .v2s-intro{max-width:780px}}
  @media(max-width:580px){.tp9m2-vertice-sections .tp9m2v-services{padding:65px 20px}.tp9m2-vertice-sections .tp9m2v-services .v2s-grid{grid-template-columns:1fr;gap:16px}.tp9m2-vertice-sections .tp9m2v-services h2{font-size:clamp(35px,10vw,55px)}.tp9m2-vertice-sections .tp9m2v-services .v2s-photo{aspect-ratio:1.5}.tp9m2-vertice-sections .tp9m2v-services .v2s-content{padding:23px}.tp9m2-vertice-sections .tp9m2v-services .v2s-button{width:100%}}
  @media(prefers-reduced-motion:reduce){.tp9m2-vertice-sections .tp9m2v-services :is(.v2s-card,.v2s-photo img,.v2s-link,.v2s-button){transition:none}}
  `}</style>
 <div className="v2s-shell">
  <div className="v2s-header"><div><p className="v2s-eyebrow">02 / Nossos serviços</p><h2 id="tp9m2v-services-title">Cuidado que faz <em>a diferença.</em></h2></div>
   <p className="v2s-intro">Do diagnóstico à manutenção preventiva, conheça algumas possibilidades de cuidado para o seu veículo.</p>
  </div>
  <div className="v2s-grid">{services.map(item=><article className="v2s-card" key={item.number}>
   <div className="v2s-photo"><img src={image(item.photo)} loading="lazy" decoding="async" alt={item.alt} onError={event=>{if(!event.currentTarget.src.includes("photo-1619642751034-765dfdf7c58e"))event.currentTarget.src=fallback;}}/><span className="v2s-number">{item.number}</span></div>
   <div className="v2s-content"><h3>{item.name}</h3><p>{item.description}</p><a href="#tp9-contato" className="v2s-link" aria-label={"Consultar disponibilidade de "+item.name}>Consultar serviço <ArrowUpRight size={17} aria-hidden="true"/></a></div>
  </article>)}</div>
  <div className="v2s-bottom"><p><Wrench size={15} aria-hidden="true"/> Fotos ilustrativas de serviços automotivos. Consulte a disponibilidade diretamente com a empresa.</p><a className="v2s-button" href="#tp9-contato">Solicitar atendimento <ArrowUpRight size={18} aria-hidden="true"/></a></div>
 </div>
 </section>;
}
