"use client";

import {ArrowUpRight, CalendarDays, CheckCircle2, ClipboardList, MessagesSquare} from "lucide-react";

type Props={contactHref?:string};
const primaryImage="https://unsplash.com/photos/erWc6mrOq_I/download?force=true&w=1800";
const fallbackImage="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1800&q=85";
const steps=[
 {number:"01",title:"Solicitação de atendimento",description:"Conte o que está acontecendo com o seu veículo e informe o serviço que procura.",Icon:MessagesSquare},
 {number:"02",title:"Avaliação inicial",description:"Conversamos sobre a necessidade e orientamos a verificação técnica do veículo.",Icon:ClipboardList},
 {number:"03",title:"Orientação e orçamento",description:"Apresentamos as opções de serviço, condições e valores antes de qualquer decisão.",Icon:CalendarDays},
 {number:"04",title:"Execução autorizada",description:"Após sua confirmação, seguimos com o serviço combinado e atenção aos detalhes.",Icon:CheckCircle2}
];

export function TP9VerticeProcess({contactHref}:Props){
 const contact=contactHref&&/^(https?:\/\/|mailto:|tel:)/i.test(contactHref)?contactHref:"#tp9-contato";
 const external=/^https?:\/\//i.test(contact);
 return <section id="tp9-processo" className="pn-vp-process" aria-labelledby="pn-vp-title">
  <style>{`
  .pn-t9x .pn-vp-process{--vp-accent:#fa7135;background:#12191b;color:#f6f7f5;padding:clamp(72px,8vw,116px) clamp(22px,6vw,96px);width:100%;max-width:100%;overflow-x:clip;font-family:Inter,Arial,sans-serif}
  .pn-t9x .pn-vp-process *{box-sizing:border-box}
  .pn-t9x .pn-vp-process .vp-shell{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:clamp(34px,5.5vw,92px);align-items:stretch;max-width:1390px;margin:0 auto}
  .pn-t9x .pn-vp-process .vp-photo{min-height:740px;position:relative;overflow:hidden;isolation:isolate;border-radius:12px;background:#333c3f}
  .pn-t9x .pn-vp-process .vp-photo img{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:-2;filter:saturate(.82) contrast(1.06)}
  .pn-t9x .pn-vp-process .vp-photo:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,#070c0de5 0%,#10191c3b 47%,#060c0e05 85%)}
  .pn-t9x .pn-vp-process .vp-photo-line{position:absolute;top:9%;left:0;width:6px;height:28%;background:var(--vp-accent)}
  .pn-t9x .pn-vp-process .vp-photo-info{position:absolute;left:clamp(22px,4vw,55px);right:clamp(22px,4vw,55px);bottom:clamp(30px,5vw,65px)}
  .pn-t9x .pn-vp-process .vp-photo-info span{display:block;color:var(--vp-accent);font-size:11px;letter-spacing:.2em;font-weight:900;text-transform:uppercase;margin-bottom:12px}
  .pn-t9x .pn-vp-process .vp-photo-info strong{display:block;max-width:500px;color:#fff;font-weight:900;font-size:clamp(26px,3vw,43px);line-height:1.14;letter-spacing:-.045em}
  .pn-t9x .pn-vp-process .vp-content{min-width:0;display:flex;flex-direction:column;justify-content:center;padding-block:clamp(12px,1.7vw,25px)}
  .pn-t9x .pn-vp-process .vp-eyebrow{display:flex;align-items:center;gap:13px;color:var(--vp-accent);font-size:11px;font-weight:900;letter-spacing:.19em;text-transform:uppercase;line-height:1.5;margin:0 0 22px}
  .pn-t9x .pn-vp-process .vp-eyebrow:before{content:"";width:29px;height:2px;background:var(--vp-accent);flex:none}
  .pn-t9x .pn-vp-process h2.vp-title{font-family:Inter,Arial,sans-serif;font-size:clamp(38px,4.5vw,67px);line-height:1.08;font-weight:900;letter-spacing:-.055em;color:#fff;margin:0 0 18px;text-wrap:balance}
  .pn-t9x .pn-vp-process h2.vp-title em{font-style:normal;color:var(--vp-accent)}
  .pn-t9x .pn-vp-process .vp-lead{color:#aab9b2;font-size:clamp(15px,1.25vw,18px);line-height:1.75;max-width:600px;margin:0 0 36px}
  .pn-t9x .pn-vp-process .vp-steps{display:flex;flex-direction:column;gap:0;margin:0 0 28px;padding:0;list-style:none}
  .pn-t9x .pn-vp-process .vp-step{display:grid;grid-template-columns:60px minmax(0,1fr);gap:17px;position:relative;min-width:0;padding:0 0 24px}
  .pn-t9x .pn-vp-process .vp-step:last-child{padding-bottom:0}
  .pn-t9x .pn-vp-process .vp-step:not(:last-child):before{content:"";position:absolute;left:24px;top:51px;bottom:1px;width:1px;background:linear-gradient(var(--vp-accent),#ffffff27)}
  .pn-t9x .pn-vp-process .vp-number{display:flex;justify-content:center;align-items:center;position:relative;z-index:1;width:50px;height:50px;border:1px solid #fa71358c;border-radius:13px;background:#fa713516;color:var(--vp-accent);font-size:14px;font-weight:900;letter-spacing:.02em}
  .pn-t9x .pn-vp-process .vp-step-body{padding:6px 0 22px;border-bottom:1px solid #ffffff21;min-width:0}
  .pn-t9x .pn-vp-process .vp-step:last-child .vp-step-body{border-bottom:0;padding-bottom:0}
  .pn-t9x .pn-vp-process .vp-step-title{display:flex;align-items:center;gap:11px;margin:0 0 9px;font-family:Inter,Arial,sans-serif;color:#fff;font-size:clamp(17px,1.7vw,23px);font-weight:850;letter-spacing:-.028em;line-height:1.25}
  .pn-t9x .pn-vp-process .vp-step-title svg{flex:none;color:var(--vp-accent)}
  .pn-t9x .pn-vp-process .vp-step-body p{color:#b7c4bc;line-height:1.68;font-size:14px;margin:0;max-width:545px}
  .pn-t9x .pn-vp-process .vp-cta{display:inline-flex;gap:14px;align-items:center;justify-content:center;align-self:flex-start;min-height:54px;background:var(--vp-accent);color:#141718;font-size:13px;font-weight:900;padding:15px 23px;text-decoration:none;transition:background .2s,transform .2s}
  .pn-t9x .pn-vp-process .vp-cta:hover{background:#ff9b68;transform:translateY(-2px)}
  .pn-t9x .pn-vp-process .vp-cta:focus-visible{outline:3px solid #ffc3a3;outline-offset:4px}
  @media(max-width:1120px){.pn-t9x .pn-vp-process .vp-shell{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:32px}.pn-t9x .pn-vp-process .vp-photo{min-height:710px}}
  @media(max-width:850px){.pn-t9x .pn-vp-process .vp-shell{grid-template-columns:1fr;gap:39px}.pn-t9x .pn-vp-process .vp-photo{min-height:420px;max-height:560px}.pn-t9x .pn-vp-process .vp-content{padding:0}}
  @media(max-width:550px){.pn-t9x .pn-vp-process{padding:65px 20px 72px}.pn-t9x .pn-vp-process .vp-photo{min-height:365px;max-height:440px}.pn-t9x .pn-vp-process .vp-photo-info strong{font-size:30px}.pn-t9x .pn-vp-process h2.vp-title{font-size:clamp(35px,10vw,51px)}.pn-t9x .pn-vp-process .vp-step{grid-template-columns:51px minmax(0,1fr);gap:11px;padding-bottom:21px}.pn-t9x .pn-vp-process .vp-step:not(:last-child):before{left:22px}.pn-t9x .pn-vp-process .vp-number{width:45px;height:45px}.pn-t9x .pn-vp-process .vp-step-title{font-size:18px}.pn-t9x .pn-vp-process .vp-cta{width:100%}}
  @media(prefers-reduced-motion:reduce){.pn-t9x .pn-vp-process .vp-cta{transition:none}}
  `}</style>
  <div className="vp-shell">
   <div className="vp-photo">
    <img src={primaryImage} loading="lazy" alt="Fotografia ilustrativa de mecânico inspecionando o motor de um veículo em oficina" onError={e=>{if(e.currentTarget.src!==fallbackImage)e.currentTarget.src=fallbackImage}}/>
    <span className="vp-photo-line" aria-hidden="true"/>
    <div className="vp-photo-info"><span>Vértice Auto Center</span><strong>Seu veículo acompanhado em cada etapa.</strong></div>
   </div>
   <div className="vp-content">
    <p className="vp-eyebrow">05 / Como funciona</p>
    <h2 className="vp-title" id="pn-vp-title">Um processo claro. <em>Do início ao fim.</em></h2>
    <p className="vp-lead">Conheça o caminho do primeiro contato à execução do serviço, com transparência em cada decisão.</p>
    <ol className="vp-steps">{steps.map(({number,title,description,Icon})=><li className="vp-step" key={number}>
      <span className="vp-number" aria-hidden="true">{number}</span>
      <div className="vp-step-body"><h3 className="vp-step-title"><Icon size={20} strokeWidth={1.8} aria-hidden="true"/>{title}</h3><p>{description}</p></div>
    </li>)}</ol>
    <a className="vp-cta" href={contact} target={external?"_blank":undefined} rel={external?"noopener noreferrer":undefined}>Solicitar atendimento <ArrowUpRight size={19} aria-hidden="true"/></a>
   </div>
  </div>
 </section>;
}
