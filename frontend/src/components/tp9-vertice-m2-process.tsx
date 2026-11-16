"use client";

import {ArrowUpRight,ClipboardCheck,ScanLine,MessageSquareText} from "lucide-react";

type Props={contactHref?:string};
const photos=[
 {step:"01",title:"Conte o que precisa",description:"Informe o veículo, o serviço desejado e os sintomas observados para iniciar sua solicitação.",photo:"EJr3XkHdBm0",alt:"Fotografia de mecânico avaliando o motor de um carro dentro de uma oficina",Icon:MessageSquareText},
 {step:"02",title:"Avaliação do veículo",description:"A equipe orienta a análise técnica e explica quais verificações podem ser necessárias.",photo:"s4d_ESS0ylA",alt:"Fotografia de profissional examinando os sistemas eletrônicos do carro",Icon:ScanLine},
 {step:"03",title:"Combine os próximos passos",description:"Confirme com a equipe o serviço, as condições e a disponibilidade antes de autorizar.",photo:"NjnftJ6_QCo",alt:"Fotografia ilustrativa de veículo elevado em oficina para manutenção",Icon:ClipboardCheck}
];
const source=(id:string)=>"https://unsplash.com/photos/"+id+"/download?force=true&w=1350";
const fallback="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1350&q=85";

export function TP9VerticeM2Process({contactHref}:Props){
 const href=contactHref&&/^(https?:\/\/|mailto:|tel:|#)/i.test(contactHref)?contactHref:"#tp9-contato";
 const external=/^https?:\/\//i.test(href);
 return <section className="tp9m2vp-process" id="tp9-como-funciona" aria-labelledby="tp9m2vp-heading">
 <style>{`
 .tp9m2-vertice-journey .tp9m2vp-process{--vp-gold:#d0aa70;background:#090c0b;color:#f7f8f4;width:100%;max-width:100%;overflow-x:clip;font-family:Arial,Helvetica,sans-serif;padding:clamp(76px,8vw,130px) clamp(22px,7vw,114px)}
 .tp9m2-vertice-journey .tp9m2vp-process *{box-sizing:border-box}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-shell{max-width:1430px;margin:0 auto}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-heading{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-bottom:42px}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-eyebrow{display:flex;align-items:center;gap:11px;color:var(--vp-gold);font-size:11px;letter-spacing:.2em;font-weight:900;text-transform:uppercase;margin:0 0 18px}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-eyebrow:before{content:"";width:30px;height:2px;background:var(--vp-gold)}
 .tp9m2-vertice-journey .tp9m2vp-process h2.vp-title{font:900 clamp(40px,5.25vw,77px)/1.08 Arial,Helvetica,sans-serif;letter-spacing:-.055em;text-transform:uppercase;color:white;margin:0;max-width:760px;text-wrap:balance}
 .tp9m2-vertice-journey .tp9m2vp-process h2.vp-title em{font-style:normal;color:var(--vp-gold)}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-intro{max-width:375px;margin:0;color:#c5d0c7;font-size:clamp(14px,1.2vw,17px);line-height:1.72}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-card{min-width:0;background:#1b211d;border:1px solid #ffffff2c;border-radius:13px;overflow:hidden;display:flex;flex-direction:column}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-photo{height:clamp(230px,24vw,325px);position:relative;overflow:hidden;background:#29322c}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,#080e0bde 100%);pointer-events:none}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-photo img{width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.83) saturate(.83) contrast(1.06);transition:transform .3s}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-card:hover img{transform:scale(1.05)}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-number{position:absolute;z-index:1;bottom:-11px;left:23px;font-size:clamp(66px,7vw,104px);font-weight:900;line-height:1;color:var(--vp-gold);letter-spacing:-.08em;text-shadow:0 6px 15px #0008}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-body{flex:1;display:flex;flex-direction:column;padding:36px 25px 30px}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-icon{display:flex;align-items:center;justify-content:center;width:39px;height:39px;color:var(--vp-gold);border:1px solid #cfa86e6b;border-radius:8px;margin-bottom:17px;background:#cfa86e15}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-body h3{font:850 clamp(17px,1.8vw,24px)/1.23 Arial,Helvetica,sans-serif;margin:0 0 11px;color:white;letter-spacing:-.024em;text-transform:uppercase}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-body p{color:#bbc8bf;line-height:1.73;font-size:14px;margin:0}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-foot{display:flex;align-items:center;justify-content:space-between;gap:22px;flex-wrap:wrap;border-top:1px solid #ffffff25;margin-top:33px;padding-top:26px}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-foot p{font-size:12px;color:#aab9ad;line-height:1.6;max-width:670px;margin:0}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-cta{display:inline-flex;gap:12px;align-items:center;justify-content:center;min-height:52px;padding:15px 23px;background:var(--vp-gold);color:#101614;border:1px solid var(--vp-gold);font:900 12px Arial,Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.05em;text-decoration:none;transition:background .2s,transform .2s}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-cta:hover{background:#edc88d;transform:translateY(-2px)}
 .tp9m2-vertice-journey .tp9m2vp-process .vp-cta:focus-visible{outline:3px solid #f6d8a6;outline-offset:4px}
 @media(max-width:950px){.tp9m2-vertice-journey .tp9m2vp-process .vp-grid{gap:13px}.tp9m2-vertice-journey .tp9m2vp-process .vp-body{padding:35px 17px 23px}.tp9m2-vertice-journey .tp9m2vp-process .vp-photo{height:225px}}
 @media(max-width:720px){.tp9m2-vertice-journey .tp9m2vp-process .vp-heading{align-items:start;flex-direction:column;gap:15px}.tp9m2-vertice-journey .tp9m2vp-process .vp-intro{max-width:650px}.tp9m2-vertice-journey .tp9m2vp-process .vp-grid{grid-template-columns:1fr}.tp9m2-vertice-journey .tp9m2vp-process .vp-photo{height:300px}.tp9m2-vertice-journey .tp9m2vp-process .vp-body{padding:33px 24px 29px}.tp9m2-vertice-journey .tp9m2vp-process .vp-number{font-size:85px}}
 @media(max-width:520px){.tp9m2-vertice-journey .tp9m2vp-process{padding:65px 20px}.tp9m2-vertice-journey .tp9m2vp-process h2.vp-title{font-size:clamp(34px,10vw,55px)}.tp9m2-vertice-journey .tp9m2vp-process .vp-photo{height:270px}.tp9m2-vertice-journey .tp9m2vp-process .vp-cta{width:100%}}
 @media(prefers-reduced-motion:reduce){.tp9m2-vertice-journey .tp9m2vp-process :is(.vp-cta,.vp-photo img){transition:none}}
 `}</style>
 <div className="vp-shell">
  <div className="vp-heading"><div><p className="vp-eyebrow">04 / Sua jornada</p><h2 className="vp-title" id="tp9m2vp-heading">Seu atendimento, <em>passo a passo.</em></h2></div><p className="vp-intro">Três etapas para você entender como consultar os serviços, conhecer a avaliação e combinar o atendimento.</p></div>
  <div className="vp-grid">{photos.map(({step,title,description,photo,alt,Icon})=><article key={step} className="vp-card">
   <div className="vp-photo"><img src={source(photo)} alt={alt} loading="lazy" decoding="async" onError={event=>{if(event.currentTarget.src!==fallback)event.currentTarget.src=fallback;}}/><span className="vp-number">{step}</span></div>
   <div className="vp-body"><span className="vp-icon" aria-hidden="true"><Icon size={23} strokeWidth={1.7}/></span><h3>{title}</h3><p>{description}</p></div>
  </article>)}</div>
  <div className="vp-foot"><p>Fotografias ilustrativas de terceiros. Serviços, prazos e condições devem ser confirmados com a equipe.</p><a className="vp-cta" href={href} target={external?"_blank":undefined} rel={external?"noopener noreferrer":undefined}>Solicitar atendimento <ArrowUpRight size={18} aria-hidden="true"/></a></div>
 </div>
 </section>;
}
