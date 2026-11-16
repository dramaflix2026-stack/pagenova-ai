"use client";

import {ClipboardCheck, MessageCircle, ScanLine, ShieldCheck} from "lucide-react";

type Props={contactHref?:string};
const IMAGE="https://images.unsplash.com/photo-1646807284302-170c9505b2e7?auto=format&fit=crop&w=1600&q=85";
const IMAGE_FALLBACK="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=85";
const differences=[
 {number:"01",title:"Atendimento próximo",description:"Escutamos suas necessidades para orientar cada atendimento com clareza.",Icon:MessageCircle},
 {number:"02",title:"Avaliação técnica",description:"Atenção aos sintomas e aos componentes para indicar os próximos passos.",Icon:ScanLine},
 {number:"03",title:"Orientação transparente",description:"Explicações objetivas sobre as opções de manutenção e os serviços indicados.",Icon:ClipboardCheck},
 {number:"04",title:"Cuidado em cada etapa",description:"Organização e atenção aos detalhes do recebimento à entrega do veículo.",Icon:ShieldCheck}
];

export function TP9VerticeDifferentials({contactHref}:Props){
 const href=contactHref&&/^(https?:\/\/|mailto:|tel:)/i.test(contactHref)?contactHref:"#tp9-orcamento";
 const external=/^https?:\/\//i.test(href);
 return <section id="tp9-diferenciais" className="pnd-section" aria-labelledby="pnd-heading">
 <style>{`
  .pn-t9s .pnd-section{--pnd-orange:#fa7135;background:#101618;color:#fff;width:100%;overflow-x:clip;padding:clamp(72px,8vw,120px) clamp(22px,6vw,96px);font-family:Inter,Arial,sans-serif}
  .pn-t9s .pnd-section *{box-sizing:border-box}
  .pn-t9s .pnd-wrap{max-width:1420px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.18fr) minmax(0,.82fr);align-items:stretch;gap:clamp(28px,4.5vw,72px)}
  .pn-t9s .pnd-copy{min-width:0;display:flex;flex-direction:column;justify-content:center}
  .pn-t9s .pnd-kicker{display:flex;align-items:center;gap:12px;color:var(--pnd-orange);margin:0 0 23px;font-size:11px;font-weight:900;line-height:1.6;letter-spacing:.17em;text-transform:uppercase}
  .pn-t9s .pnd-kicker:before{content:"";width:28px;height:2px;background:var(--pnd-orange);flex:none}
  .pn-t9s h2.pnd-heading{font-family:Inter,Arial,sans-serif;font-weight:900;font-size:clamp(37px,4.7vw,68px);letter-spacing:-.055em;line-height:1.08;text-wrap:balance;color:#fff;max-width:800px;margin:0 0 22px}
  .pn-t9s .pnd-heading em{font-style:normal;color:var(--pnd-orange)}
  .pn-t9s .pnd-lead{color:#bfcac4;font-size:clamp(15px,1.23vw,18px);line-height:1.75;margin:0 0 37px;max-width:680px}
  .pn-t9s .pnd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:30px}
  .pn-t9s .pnd-card{min-width:0;display:flex;align-items:flex-start;gap:15px;padding:23px 20px 22px;background:#1b2427;border:1px solid #ffffff20;border-radius:14px;transition:transform .25s ease,border-color .25s ease,background .25s ease}
  .pn-t9s .pnd-card:hover{transform:translateY(-4px);border-color:#fa713599;background:#202b2d}
  .pn-t9s .pnd-icon{display:flex;align-items:center;justify-content:center;width:47px;height:47px;border-radius:11px;flex:none;background:#fa71351e;border:1px solid #fa71355f;color:var(--pnd-orange)}
  .pn-t9s .pnd-card small{display:block;color:var(--pnd-orange);font-size:10px;font-weight:900;letter-spacing:.17em;margin-bottom:8px}
  .pn-t9s .pnd-card h3{font-family:Inter,Arial,sans-serif;font-weight:850;font-size:clamp(16px,1.5vw,22px);line-height:1.25;letter-spacing:-.025em;color:#fff;margin:0 0 9px}
  .pn-t9s .pnd-card p{font-size:13px;line-height:1.66;color:#b9c6c0;margin:0}
  .pn-t9s .pnd-cta{display:inline-flex;align-items:center;justify-content:center;align-self:flex-start;min-height:51px;gap:16px;padding:14px 23px;color:#121718;background:var(--pnd-orange);font-size:13px;font-weight:900;text-decoration:none;transition:background .2s,transform .2s}
  .pn-t9s .pnd-cta:hover{transform:translateY(-2px);background:#ff9b68}
  .pn-t9s .pnd-cta:focus-visible{outline:3px solid #ffd0b4;outline-offset:4px}
  .pn-t9s .pnd-media{position:relative;overflow:hidden;min-width:0;min-height:670px;isolation:isolate;background:#263035;border-radius:16px}
  .pn-t9s .pnd-media img{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:-2;filter:brightness(.84) saturate(.8) contrast(1.08)}
  .pn-t9s .pnd-media:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,transparent 42%,#070d10de)}
  .pn-t9s .pnd-media-mark{position:absolute;left:0;top:10%;width:5px;height:30%;background:var(--pnd-orange)}
  .pn-t9s .pnd-media-tag{position:absolute;left:30px;right:25px;bottom:30px;padding:16px 0 12px 19px;border-left:3px solid var(--pnd-orange);background:linear-gradient(90deg,#10191ec7,transparent)}
  .pn-t9s .pnd-media-tag strong{display:block;color:#fff;font-size:clamp(15px,1.8vw,23px);line-height:1.25;font-weight:900;letter-spacing:-.02em}
  .pn-t9s .pnd-media-tag span{display:block;margin-top:9px;color:#e0e8e3;font-size:12px;line-height:1.5}
  @media(max-width:1170px){
   .pn-t9s .pnd-wrap{grid-template-columns:minmax(0,1fr) minmax(0,.75fr);gap:28px}
   .pn-t9s .pnd-card{padding:19px 16px;gap:12px}
   .pn-t9s .pnd-icon{width:40px;height:40px}
   .pn-t9s .pnd-media{min-height:680px}
  }
  @media(max-width:900px){
   .pn-t9s .pnd-wrap{grid-template-columns:1fr;gap:34px}
   .pn-t9s .pnd-media{min-height:400px;aspect-ratio:16/9}
   .pn-t9s .pnd-grid{gap:14px}
  }
  @media(max-width:570px){
   .pn-t9s .pnd-section{padding:65px 20px}
   .pn-t9s h2.pnd-heading{font-size:clamp(35px,10vw,49px)}
   .pn-t9s .pnd-grid{grid-template-columns:1fr}
   .pn-t9s .pnd-card{padding:19px}
   .pn-t9s .pnd-media{min-height:360px;aspect-ratio:4/5}
   .pn-t9s .pnd-cta{width:100%}
   .pn-t9s .pnd-media-tag{left:20px;right:20px;bottom:20px}
  }
  @media(prefers-reduced-motion:reduce){.pn-t9s .pnd-card,.pn-t9s .pnd-cta{transition:none}}
 `}</style>
 <div className="pnd-wrap">
  <div className="pnd-copy">
   <p className="pnd-kicker">04 / Nossos diferenciais</p>
   <h2 className="pnd-heading" id="pnd-heading">Mais do que um serviço. <em>Confiança em cada etapa.</em></h2>
   <p className="pnd-lead">Da primeira conversa ao cuidado com seu veículo, valorizamos a atenção técnica e a comunicação clara.</p>
   <div className="pnd-grid">{differences.map(({number,title,description,Icon})=><article className="pnd-card" key={number}>
    <span className="pnd-icon" aria-hidden="true"><Icon size={25} strokeWidth={1.75}/></span>
    <div><small>{number}</small><h3>{title}</h3><p>{description}</p></div>
   </article>)}</div>
   <a className="pnd-cta" href={href} target={external?"_blank":undefined} rel={external?"noopener noreferrer":undefined}>Converse com nossa equipe <span aria-hidden="true">↗</span></a>
  </div>
  <div className="pnd-media">
   <img loading="lazy" src={IMAGE} alt="Fotografia ilustrativa de veículo em manutenção em oficina automotiva" onError={e=>{if(e.currentTarget.src!==IMAGE_FALLBACK)e.currentTarget.src=IMAGE_FALLBACK;}}/>
   <span className="pnd-media-mark" aria-hidden="true"/>
   <div className="pnd-media-tag"><strong>Atenção que faz a diferença.</strong><span>Atendimento · Avaliação · Transparência</span></div>
  </div>
 </div>
 </section>;
}
