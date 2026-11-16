"use client";

import {ArrowUpRight,ClipboardCheck,MessagesSquare,ScanLine,ShieldCheck} from "lucide-react";

const PHOTO="https://images.unsplash.com/photo-1635352124120-739339ec9ac1?auto=format&fit=crop&w=1550&q=85";
const FALLBACK="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1550&q=85";
const benefits=[
 {number:"01",title:"Atendimento próximo",description:"Escuta e atenção para compreender o que seu veículo precisa.",Icon:MessagesSquare},
 {number:"02",title:"Avaliação técnica",description:"Análise cuidadosa para orientar as opções de serviço.",Icon:ScanLine},
 {number:"03",title:"Orientação transparente",description:"Informações claras antes de decidir os próximos passos.",Icon:ClipboardCheck},
 {number:"04",title:"Cuidado em cada etapa",description:"Organização e atenção aos detalhes do atendimento.",Icon:ShieldCheck}
];

export function TP9VerticeM2Differentials(){
 return <section id="tp9-diferenciais" className="tp9m2v-difference" aria-labelledby="tp9m2v-diff-heading">
  <style>{`
  .tp9m2-vertice-journey .tp9m2v-difference{--m2gold:#d0aa70;max-width:100%;width:100%;background:#121715;color:#fff;font-family:Arial,Helvetica,sans-serif;overflow-x:clip;padding:clamp(72px,8vw,130px) clamp(22px,7vw,115px)}
  .tp9m2-vertice-journey .tp9m2v-difference *{box-sizing:border-box}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-layout{max-width:1430px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(40px,5vw,82px);align-items:center}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-copy{min-width:0}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-eyebrow{display:flex;align-items:center;gap:12px;color:var(--m2gold);font-size:11px;letter-spacing:.19em;text-transform:uppercase;font-weight:900;margin:0 0 24px}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-eyebrow:before{content:"";width:28px;height:2px;background:var(--m2gold);flex:none}
  .tp9m2-vertice-journey .tp9m2v-difference h2{font:900 clamp(40px,5.15vw,75px)/1.06 Arial,Helvetica,sans-serif;letter-spacing:-.055em;text-transform:uppercase;color:#fff;margin:0 0 23px;text-wrap:balance;max-width:780px}
  .tp9m2-vertice-journey .tp9m2v-difference h2 em{color:var(--m2gold);font-style:normal}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-intro{font-size:clamp(14px,1.32vw,18px);line-height:1.75;color:#c2cbc4;max-width:620px;margin:0 0 34px}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:0 0 30px}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-card{min-width:0;min-height:197px;padding:25px 22px 23px;background:#1d2521;border:1px solid #ffffff24;border-radius:13px;transition:border-color .25s,transform .25s,background .25s}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-card:hover{border-color:#d0aa708c;transform:translateY(-3px);background:#232b25}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-card-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-icon{display:flex;align-items:center;justify-content:center;width:46px;height:46px;flex:none;color:var(--m2gold);background:#d0aa7015;border:1px solid #d0aa7059;border-radius:10px}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-card-number{color:#b79b70;font-size:11px;letter-spacing:.11em;font-weight:900}
  .tp9m2-vertice-journey .tp9m2v-difference h3{font:850 clamp(16px,1.45vw,21px)/1.2 Arial,Helvetica,sans-serif;letter-spacing:-.025em;color:#fff;margin:0 0 10px}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-card p{color:#bcc8be;line-height:1.62;font-size:13px;margin:0}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-cta{display:inline-flex;justify-content:center;align-items:center;gap:12px;min-height:51px;padding:14px 22px;border:1px solid var(--m2gold);background:var(--m2gold);color:#121714;text-decoration:none;text-transform:uppercase;font-size:12px;letter-spacing:.06em;font-weight:900;transition:background .2s,transform .2s}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-cta:hover{background:#efc88f;transform:translateY(-2px)}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-cta:focus-visible{outline:3px solid #f3cf99;outline-offset:4px}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-wrap{align-self:stretch;position:relative;min-height:680px;overflow:hidden;background:#303c35;border-radius:15px;isolation:isolate}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-wrap img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center;filter:brightness(.87) contrast(1.08) saturate(.84);z-index:-2}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-wrap:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,transparent 54%,#090f0de9)}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-accent{position:absolute;top:10%;left:0;height:27%;width:5px;background:var(--m2gold)}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-caption{position:absolute;left:clamp(25px,4vw,48px);right:clamp(22px,4vw,48px);bottom:clamp(27px,4vw,49px);padding-left:17px;border-left:3px solid var(--m2gold)}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-caption strong{display:block;font:900 clamp(22px,2.4vw,34px)/1.13 Arial,Helvetica,sans-serif;letter-spacing:-.04em;color:#fff}
  .tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-caption small{display:block;margin-top:12px;font-size:11px;letter-spacing:.07em;color:#e3e8e2}
  @media(max-width:1040px){.tp9m2-vertice-journey .tp9m2v-difference .v2d-layout{grid-template-columns:1fr;gap:35px}.tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-wrap{min-height:420px;aspect-ratio:16/9}}
  @media(max-width:580px){.tp9m2-vertice-journey .tp9m2v-difference{padding:65px 20px}.tp9m2-vertice-journey .tp9m2v-difference h2{font-size:clamp(35px,10vw,55px)}.tp9m2-vertice-journey .tp9m2v-difference .v2d-grid{grid-template-columns:1fr;gap:13px}.tp9m2-vertice-journey .tp9m2v-difference .v2d-card{min-height:0;padding:22px}.tp9m2-vertice-journey .tp9m2v-difference .v2d-photo-wrap{min-height:420px;aspect-ratio:4/5}.tp9m2-vertice-journey .tp9m2v-difference .v2d-cta{width:100%}}
  @media(prefers-reduced-motion:reduce){.tp9m2-vertice-journey .tp9m2v-difference :is(.v2d-card,.v2d-cta){transition:none}}
  `}</style>
 <div className="v2d-layout">
  <div className="v2d-copy">
   <p className="v2d-eyebrow">03 / Por que nos escolher</p>
   <h2 id="tp9m2v-diff-heading">O diferencial está <em>no cuidado.</em></h2>
   <p className="v2d-intro">A atenção às necessidades do cliente e a orientação técnica fazem parte da proposta de atendimento da Vértice Auto Center.</p>
   <div className="v2d-grid">{benefits.map(({number,title,description,Icon})=><article className="v2d-card" key={number}>
    <div className="v2d-card-header"><span className="v2d-icon" aria-hidden="true"><Icon size={24} strokeWidth={1.8}/></span><span className="v2d-card-number">{number}</span></div>
    <h3>{title}</h3><p>{description}</p>
   </article>)}</div>
   <a href="#tp9-contato" className="v2d-cta">Solicitar atendimento <ArrowUpRight size={18} aria-hidden="true"/></a>
  </div>
  <div className="v2d-photo-wrap">
   <img src={PHOTO} alt="Fotografia ilustrativa de profissional trabalhando em oficina automotiva" loading="lazy" decoding="async" onError={event=>{if(!event.currentTarget.src.includes("photo-1619642751034-765dfdf7c58e"))event.currentTarget.src=FALLBACK;}}/>
   <span className="v2d-photo-accent" aria-hidden="true"/>
   <div className="v2d-photo-caption"><strong>Seu veículo merece atenção.</strong><small>Manutenção · Orientação · Cuidado</small></div>
  </div>
 </div>
 </section>;
}
