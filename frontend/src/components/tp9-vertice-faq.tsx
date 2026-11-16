"use client";

import {useState} from "react";
import {ArrowUpRight,ChevronDown,MessagesSquare} from "lucide-react";

const photo="https://images.unsplash.com/photo-1632733711679-529326f6db12?auto=format&fit=crop&w=1600&q=85";
const photoFallback="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=85";
const questions=[
 {question:"Quais serviços posso consultar?",answer:"Você pode consultar revisão preventiva, óleo e filtros, freios e suspensão, diagnóstico eletrônico, ar-condicionado, alinhamento e balanceamento. Confirme com a equipe quais serviços estão disponíveis para o seu veículo."},
 {question:"Como é feita a avaliação do veículo?",answer:"O atendimento começa com suas informações sobre o veículo e a necessidade apresentada. A equipe orienta a verificação técnica e explica quais próximos passos podem ser necessários."},
 {question:"Como solicitar uma revisão?",answer:"Use a área de orçamento para informar o modelo do veículo, o serviço desejado e os sinais observados. A equipe poderá orientar a solicitação pelo canal oficial cadastrado."},
 {question:"Como solicitar atendimento?",answer:"Preencha o formulário de contato e informe como deseja ser atendido. Quando houver um WhatsApp ou e-mail cadastrado, o site prepara sua solicitação para envio por esse canal."},
 {question:"Os valores são informados pelo site?",answer:"Não há uma tabela de preços confirmada neste site. Valores, condições de pagamento e serviços incluídos devem ser consultados diretamente com a empresa antes da autorização."},
 {question:"Como consultar prazos e disponibilidade?",answer:"O prazo depende do serviço, da avaliação e da disponibilidade de atendimento. Confirme datas, previsão de execução e agendamento diretamente com a equipe."}
];

export function TP9VerticeFAQ(){
 const [openIndex,setOpenIndex]=useState<number|null>(0);
 return <section className="pn-vfaq" id="tp9-faq" aria-labelledby="pn-vfaq-title">
  <style>{`
   .pn-t9c .pn-vfaq{--vfaq-orange:#fa7135;width:100%;max-width:100%;overflow-x:clip;background:#101719;color:#f8f9f7;font-family:Inter,Arial,sans-serif;padding:clamp(75px,8vw,125px) clamp(22px,6vw,96px)}
   .pn-t9c .pn-vfaq *{box-sizing:border-box}
   .pn-t9c .pn-vfaq .vfaq-layout{max-width:1420px;margin:0 auto;display:grid;grid-template-columns:minmax(0,.94fr) minmax(0,1.06fr);gap:clamp(35px,5.3vw,85px);align-items:start}
   .pn-t9c .pn-vfaq .vfaq-intro{min-width:0}
   .pn-t9c .pn-vfaq .vfaq-kicker{margin:0 0 24px;display:flex;align-items:center;gap:12px;color:var(--vfaq-orange);font-size:11px;font-weight:900;line-height:1.4;letter-spacing:.18em;text-transform:uppercase}
   .pn-t9c .pn-vfaq .vfaq-kicker:before{content:"";width:29px;height:2px;background:var(--vfaq-orange);flex:none}
   .pn-t9c .pn-vfaq h2.vfaq-title{margin:0 0 19px;font-family:Inter,Arial,sans-serif;font-size:clamp(39px,5vw,73px);font-weight:900;line-height:1.07;letter-spacing:-.055em;color:#fff;text-wrap:balance;max-width:720px}
   .pn-t9c .pn-vfaq .vfaq-title em{font-style:normal;color:var(--vfaq-orange)}
   .pn-t9c .pn-vfaq .vfaq-description{font-size:clamp(14px,1.2vw,17px);line-height:1.75;margin:0 0 33px;color:#b8c6bd;max-width:610px}
   .pn-t9c .pn-vfaq .vfaq-image{height:clamp(310px,30vw,490px);position:relative;overflow:hidden;border-radius:14px;background:#303b40;isolation:isolate}
   .pn-t9c .pn-vfaq .vfaq-image img{position:absolute;z-index:-2;display:block;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;filter:saturate(.83) contrast(1.05)}
   .pn-t9c .pn-vfaq .vfaq-image:after{position:absolute;content:"";inset:0;z-index:-1;background:linear-gradient(0deg,#0c1415e8,transparent 65%)}
   .pn-t9c .pn-vfaq .vfaq-image-accent{position:absolute;top:9%;left:0;width:5px;height:35%;background:var(--vfaq-orange)}
   .pn-t9c .pn-vfaq .vfaq-image-label{position:absolute;left:25px;bottom:25px;right:25px;padding:9px 0 9px 16px;border-left:3px solid var(--vfaq-orange);font-size:clamp(15px,1.5vw,21px);font-weight:850;letter-spacing:-.025em;color:#fff}
   .pn-t9c .pn-vfaq .vfaq-list{min-width:0;margin:0;padding:0;list-style:none;border-top:1px solid #ffffff29}
   .pn-t9c .pn-vfaq .vfaq-item{border-bottom:1px solid #ffffff29}
   .pn-t9c .pn-vfaq .vfaq-question{width:100%;display:grid;grid-template-columns:38px minmax(0,1fr) 36px;gap:15px;align-items:center;padding:24px 0;border:0;border-radius:0;background:transparent;color:#fff;text-align:left;cursor:pointer;min-height:82px;font-family:Inter,Arial,sans-serif}
   .pn-t9c .pn-vfaq .vfaq-question-number{font-size:12px;font-weight:900;letter-spacing:.08em;color:var(--vfaq-orange)}
   .pn-t9c .pn-vfaq .vfaq-question-label{font-size:clamp(16px,1.6vw,22px);font-weight:750;line-height:1.35;letter-spacing:-.02em}
   .pn-t9c .pn-vfaq .vfaq-question-icon{display:flex;align-items:center;justify-content:center;border-radius:9px;border:1px solid #ffffff40;color:#fff;background:#ffffff09;width:35px;height:35px;transition:transform .25s ease,color .25s ease,background .25s ease,border-color .25s ease}
   .pn-t9c .pn-vfaq .vfaq-question[aria-expanded="true"] .vfaq-question-icon{transform:rotate(180deg);background:var(--vfaq-orange);border-color:var(--vfaq-orange);color:#101719}
   .pn-t9c .pn-vfaq .vfaq-answer-outer{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .3s ease,opacity .3s ease}
   .pn-t9c .pn-vfaq .vfaq-answer-outer[data-open="true"]{grid-template-rows:1fr;opacity:1}
   .pn-t9c .pn-vfaq .vfaq-answer-inner{overflow:hidden;min-height:0}
   .pn-t9c .pn-vfaq .vfaq-answer{font-size:14px;line-height:1.78;color:#bac8c0;margin:0;padding:0 47px 22px 53px}
   .pn-t9c .pn-vfaq .vfaq-help{margin-top:30px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px;background:#1b2527;border:1px solid #ffffff20;border-radius:12px;padding:22px}
   .pn-t9c .pn-vfaq .vfaq-help-copy{display:flex;align-items:center;gap:14px;color:#fff}
   .pn-t9c .pn-vfaq .vfaq-help-copy svg{color:var(--vfaq-orange);flex:none}
   .pn-t9c .pn-vfaq .vfaq-help-copy span{display:block;font-size:13px;font-weight:750;line-height:1.4}
   .pn-t9c .pn-vfaq .vfaq-help-button{display:inline-flex;align-items:center;justify-content:center;min-height:47px;padding:12px 17px;gap:10px;font-size:12px;font-weight:900;text-decoration:none;background:var(--vfaq-orange);color:#111819;transition:transform .2s,background .2s}
   .pn-t9c .pn-vfaq .vfaq-help-button:hover{background:#ff9c64;transform:translateY(-2px)}
   .pn-t9c .pn-vfaq :is(button,a):focus-visible{outline:3px solid #ffb98d;outline-offset:4px}
   @media(max-width:990px){.pn-t9c .pn-vfaq .vfaq-layout{grid-template-columns:1fr;gap:34px}.pn-t9c .pn-vfaq .vfaq-image{height:clamp(320px,52vw,475px)}.pn-t9c .pn-vfaq h2.vfaq-title{max-width:800px}.pn-t9c .pn-vfaq .vfaq-description{max-width:750px}}
   @media(max-width:580px){.pn-t9c .pn-vfaq{padding:65px 20px}.pn-t9c .pn-vfaq h2.vfaq-title{font-size:clamp(36px,10vw,53px)}.pn-t9c .pn-vfaq .vfaq-image{height:310px}.pn-t9c .pn-vfaq .vfaq-question{grid-template-columns:28px minmax(0,1fr) 33px;gap:9px;min-height:73px;padding:20px 0}.pn-t9c .pn-vfaq .vfaq-question-label{font-size:16px}.pn-t9c .pn-vfaq .vfaq-answer{padding:0 10px 19px 37px}.pn-t9c .pn-vfaq .vfaq-help-button{width:100%}}
   @media(prefers-reduced-motion:reduce){.pn-t9c .pn-vfaq .vfaq-question-icon,.pn-t9c .pn-vfaq .vfaq-answer-outer,.pn-t9c .pn-vfaq .vfaq-help-button{transition:none}}
  `}</style>
  <div className="vfaq-layout">
   <div className="vfaq-intro">
    <p className="vfaq-kicker">08 / Perguntas frequentes</p>
    <h2 className="vfaq-title" id="pn-vfaq-title">Dúvidas? <em>A gente explica.</em></h2>
    <p className="vfaq-description">Informações para você entender como consultar serviços, solicitar uma avaliação e conversar com nossa equipe.</p>
    <div className="vfaq-image">
     <img loading="lazy" decoding="async" src={photo} alt="Fotografia ilustrativa de mecânico trabalhando em oficina automotiva" onError={event=>{if(!event.currentTarget.src.includes("photo-1619642751034-765dfdf7c58e"))event.currentTarget.src=photoFallback}}/>
     <span className="vfaq-image-accent" aria-hidden="true"/>
     <div className="vfaq-image-label">Atendimento claro. Cuidado técnico.</div>
    </div>
   </div>
   <div>
    <div className="vfaq-list">{questions.map((item,index)=>{
     const expanded=openIndex===index;
     const buttonId="pn-vfaq-question-"+index,answerId="pn-vfaq-answer-"+index;
     return <div className="vfaq-item" key={buttonId}>
      <h3 style={{margin:0}}>
       <button type="button" className="vfaq-question" id={buttonId} aria-expanded={expanded} aria-controls={answerId} onClick={()=>setOpenIndex(expanded?null:index)}>
        <span className="vfaq-question-number">{String(index+1).padStart(2,"0")}</span>
        <span className="vfaq-question-label">{item.question}</span>
        <span className="vfaq-question-icon" aria-hidden="true"><ChevronDown size={19}/></span>
       </button>
      </h3>
      <div id={answerId} role="region" aria-labelledby={buttonId} aria-hidden={!expanded} className="vfaq-answer-outer" data-open={expanded}>
       <div className="vfaq-answer-inner"><p className="vfaq-answer">{item.answer}</p></div>
      </div>
     </div>;
    })}</div>
    <div className="vfaq-help"><div className="vfaq-help-copy"><MessagesSquare size={25} aria-hidden="true"/><span>Não encontrou sua resposta?</span></div><a className="vfaq-help-button" href="#tp9-orcamento">Solicitar atendimento <ArrowUpRight size={18} aria-hidden="true"/></a></div>
   </div>
  </div>
 </section>;
}
