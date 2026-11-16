"use client";

import {useState} from "react";
import {ArrowUpRight,ChevronDown} from "lucide-react";

const faqs=[
 {q:"Quais serviços posso consultar?",a:"Você pode consultar revisão preventiva, troca de óleo e filtros, freios e suspensão, diagnóstico eletrônico, ar-condicionado automotivo, alinhamento e balanceamento. Confirme a disponibilidade dos serviços diretamente com a equipe."},
 {q:"Como solicitar uma revisão para meu veículo?",a:"Informe o modelo do veículo, o serviço desejado e os sintomas observados pelo formulário de contato. A equipe poderá orientar a avaliação e os próximos passos pelo canal oficial cadastrado."},
 {q:"Como funciona a avaliação do veículo?",a:"A solicitação começa com as informações fornecidas por você. A necessidade de inspeção técnica, os serviços indicados e os próximos passos devem ser confirmados com a equipe após a avaliação."},
 {q:"Posso conhecer os valores antes de autorizar o serviço?",a:"Sim, solicite informações sobre o serviço desejado. Preços, condições e itens incluídos dependem da avaliação e precisam ser confirmados diretamente com a empresa antes de qualquer autorização."},
 {q:"Como consultar prazo e disponibilidade?",a:"Entre em contato pelo canal cadastrado e informe o serviço de interesse. Datas, prazos e disponibilidade variam conforme a demanda e devem ser confirmados pela equipe."},
 {q:"Preciso agendar o atendimento?",a:"Consulte a equipe para saber se o atendimento desejado exige agendamento. O site não confirma automaticamente uma reserva, horário ou execução do serviço."}
];

export function TP9VerticeM2FAQ(){
 const [open,setOpen]=useState<number|null>(0);
 return <section id="tp9-faq" className="tp9m2vf" aria-labelledby="tp9m2vf-title">
  <style>{`
  .tp9m2vf{--gold:#c9a36b;background:#0b0e0c;color:#f7f7f3;font-family:Arial,Helvetica,sans-serif;padding:clamp(75px,9vw,138px) clamp(22px,7vw,118px);width:100%;max-width:100%;overflow-x:clip}
  .tp9m2vf *{box-sizing:border-box}
  .tp9m2vf .vf-inner{max-width:1410px;margin:0 auto}
  .tp9m2vf .vf-heading{display:grid;grid-template-columns:1.13fr .87fr;align-items:end;gap:25px 70px;padding-bottom:39px;border-bottom:1px solid #ffffff2c}
  .tp9m2vf .vf-eyebrow{display:flex;align-items:center;gap:12px;color:var(--gold);font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;margin:0 0 23px}
  .tp9m2vf .vf-eyebrow:before{content:"";height:2px;width:32px;background:var(--gold)}
  .tp9m2vf h2.vf-title{font:900 clamp(40px,5.6vw,79px)/1.06 Arial,Helvetica,sans-serif;letter-spacing:-.055em;text-transform:uppercase;color:white;max-width:760px;margin:0;text-wrap:balance}
  .tp9m2vf h2.vf-title em{font-style:normal;color:var(--gold)}
  .tp9m2vf .vf-desc{max-width:490px;font-size:clamp(14px,1.3vw,18px);line-height:1.78;color:#c5cec5;margin:0}
  .tp9m2vf .vf-row{border-bottom:1px solid #ffffff29}
  .tp9m2vf .vf-trigger{width:100%;min-height:93px;padding:26px 0;display:grid;grid-template-columns:49px minmax(0,1fr) 42px;align-items:center;gap:17px;background:transparent;border:0;color:white;text-align:left;cursor:pointer}
  .tp9m2vf .vf-index{color:var(--gold);font-size:13px;font-weight:900;letter-spacing:.12em}
  .tp9m2vf .vf-question{font:750 clamp(18px,2vw,26px)/1.35 Arial,Helvetica,sans-serif;letter-spacing:-.025em}
  .tp9m2vf .vf-icon{display:grid;place-items:center;border:1px solid #c9a36b7d;color:var(--gold);border-radius:50%;width:39px;height:39px;transition:transform .25s,background .25s,color .25s}
  .tp9m2vf .vf-trigger[aria-expanded="true"] .vf-icon{transform:rotate(180deg);background:var(--gold);color:#131713}
  .tp9m2vf .vf-answer-frame{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .27s ease,opacity .27s ease}
  .tp9m2vf .vf-answer-frame[data-expanded="true"]{grid-template-rows:1fr;opacity:1}
  .tp9m2vf .vf-answer-inner{min-height:0;overflow:hidden}
  .tp9m2vf .vf-answer{font-size:15px;line-height:1.8;color:#bfcbc0;max-width:900px;margin:0;padding:0 65px 27px 66px}
  .tp9m2vf .vf-bottom{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:19px;margin-top:31px}
  .tp9m2vf .vf-bottom p{color:#afbbb0;font-size:13px;line-height:1.65;margin:0}
  .tp9m2vf .vf-link{display:inline-flex;align-items:center;gap:10px;color:var(--gold);font-size:13px;font-weight:900;text-decoration:none;border-bottom:1px solid var(--gold);min-height:40px}
  .tp9m2vf :is(button,a):focus-visible{outline:3px solid #edcc99;outline-offset:4px}
  @media(max-width:800px){.tp9m2vf .vf-heading{grid-template-columns:1fr;gap:22px}.tp9m2vf .vf-trigger{min-height:76px}}
  @media(max-width:520px){.tp9m2vf{padding:65px 20px}.tp9m2vf h2.vf-title{font-size:clamp(35px,10vw,54px)}.tp9m2vf .vf-trigger{grid-template-columns:28px minmax(0,1fr) 34px;gap:9px;padding:20px 0}.tp9m2vf .vf-question{font-size:16px}.tp9m2vf .vf-icon{width:33px;height:33px}.tp9m2vf .vf-answer{padding:0 5px 23px 37px;font-size:14px}}
  @media(prefers-reduced-motion:reduce){.tp9m2vf .vf-answer-frame,.tp9m2vf .vf-icon{transition:none}}
  `}</style>
  <div className="vf-inner">
   <div className="vf-heading"><div><p className="vf-eyebrow">07 / Tire suas dúvidas</p><h2 id="tp9m2vf-title" className="vf-title">Respostas com <em>clareza.</em></h2></div>
    <p className="vf-desc">Tire suas dúvidas sobre serviços, avaliações e atendimento. As condições específicas são confirmadas diretamente com a equipe.</p>
   </div>
   <div className="vf-list">{faqs.map(({q,a},i)=>{
    const expanded=open===i,triggerId="tp9m2vf-trigger-"+i,answerId="tp9m2vf-answer-"+i;
    return <div className="vf-row" key={q}><h3 style={{margin:0}}>
     <button type="button" className="vf-trigger" id={triggerId} aria-expanded={expanded} aria-controls={answerId} onClick={()=>setOpen(expanded?null:i)}>
      <span className="vf-index">{String(i+1).padStart(2,"0")}</span><span className="vf-question">{q}</span><span className="vf-icon" aria-hidden="true"><ChevronDown size={19}/></span>
     </button></h3>
     <div id={answerId} className="vf-answer-frame" data-expanded={expanded} role="region" aria-labelledby={triggerId} aria-hidden={!expanded}>
      <div className="vf-answer-inner"><p className="vf-answer">{a}</p></div>
     </div>
    </div>;
   })}</div>
   <div className="vf-bottom"><p>Não encontrou sua dúvida? Consulte o atendimento oficial da empresa.</p><a href="#tp9-contato" className="vf-link">Falar sobre meu veículo <ArrowUpRight size={18} aria-hidden="true"/></a></div>
  </div>
 </section>;
}
