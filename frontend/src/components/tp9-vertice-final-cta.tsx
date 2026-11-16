"use client";

import {ArrowUpRight,ChevronDown} from "lucide-react";

const PHOTO="https://images.unsplash.com/photo-1635352124120-739339ec9ac1?auto=format&fit=crop&w=2200&q=88";
const FALLBACK="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=2200&q=85";

/** Vértice Auto Center — TP9 Model 1 only. CTA always leads to the real quote form. */
export function TP9VerticeFinalCTA(){
 return <section className="pn-vfinal" id="tp9-chamada-final" aria-labelledby="pn-vfinal-heading">
  <style>{`
 .pn-t9f .pn-vfinal{--vfinal-orange:#fa7135;position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;width:100%;max-width:100%;min-height:clamp(570px,63vw,790px);padding:clamp(90px,11vw,150px) clamp(22px,6vw,90px);overflow:hidden;background:#0c1417;color:#fff;font-family:Inter,Arial,sans-serif;text-align:center}
 .pn-t9f .pn-vfinal *{box-sizing:border-box}
 .pn-t9f .pn-vfinal-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 45%;z-index:-3;filter:saturate(.77) contrast(1.13) brightness(.66);transform:scale(1.015)}
 .pn-t9f .pn-vfinal:before{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(90deg,#071013e8 0%,#0a1517ad 26%,#091115a8 74%,#071013e8 100%),linear-gradient(0deg,#071014ed 0%,#0a14175c 50%,#071014c9 100%)}
 .pn-t9f .pn-vfinal:after{content:"";position:absolute;inset:22px;z-index:-1;border:1px solid #ffffff1e;pointer-events:none}
 .pn-t9f .pn-vfinal-accent{position:absolute;top:0;left:50%;height:5px;width:clamp(65px,12vw,158px);transform:translateX(-50%);background:var(--vfinal-orange);box-shadow:0 0 40px #fa713588}
 .pn-t9f .pn-vfinal-content{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;max-width:1100px;margin:auto}
 .pn-t9f .pn-vfinal-kicker{display:inline-flex;align-items:center;gap:16px;margin:0 0 29px;color:#ffa375;font-size:clamp(10px,1vw,12px);font-weight:900;letter-spacing:.25em;line-height:1.6;text-transform:uppercase}
 .pn-t9f .pn-vfinal-kicker:before,.pn-t9f .pn-vfinal-kicker:after{content:"";width:clamp(18px,5vw,56px);height:1px;background:var(--vfinal-orange)}
 .pn-t9f h2.pn-vfinal-title{font:900 clamp(44px,6.5vw,100px)/1.065 Inter,Arial,sans-serif;letter-spacing:-.065em;max-width:1080px;margin:0 0 28px;color:#fff;text-wrap:balance;overflow-wrap:break-word}
 .pn-t9f .pn-vfinal-title em{font-style:normal;color:var(--vfinal-orange)}
 .pn-t9f .pn-vfinal-description{color:#dce5df;font-size:clamp(15px,1.5vw,20px);line-height:1.72;max-width:690px;margin:0 0 38px}
 .pn-t9f .pn-vfinal-cta{display:inline-flex;align-items:center;justify-content:center;gap:18px;min-height:60px;padding:18px 30px;min-width:240px;background:var(--vfinal-orange);border:1px solid var(--vfinal-orange);color:#15191a;font:900 14px/1.25 Inter,Arial,sans-serif;letter-spacing:.01em;text-decoration:none;transition:background .2s,transform .2s,border-color .2s;box-shadow:0 16px 30px #0007}
 .pn-t9f .pn-vfinal-cta:hover{background:#ff9e69;border-color:#ff9e69;transform:translateY(-3px)}
 .pn-t9f .pn-vfinal-cta:focus-visible{outline:3px solid #ffd5be;outline-offset:5px}
 .pn-t9f .pn-vfinal-footnote{display:flex;gap:9px;align-items:center;justify-content:center;margin:22px 0 0;font-size:12px;line-height:1.5;color:#c2cbc5}
 .pn-t9f .pn-vfinal-footnote svg{flex:none;color:var(--vfinal-orange)}
 .pn-t9f .pn-vfinal-corner{position:absolute;bottom:36px;right:clamp(36px,6vw,95px);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#c7d2ca8a;font-weight:850}
 @media(max-width:760px){.pn-t9f .pn-vfinal{min-height:600px;padding:98px 23px}.pn-t9f .pn-vfinal:after{inset:13px}.pn-t9f h2.pn-vfinal-title{font-size:clamp(42px,9vw,71px)}.pn-t9f .pn-vfinal-corner{display:none}}
 @media(max-width:480px){.pn-t9f .pn-vfinal{min-height:630px;padding:90px 22px}.pn-t9f .pn-vfinal-photo{object-position:58% center}.pn-t9f h2.pn-vfinal-title{font-size:clamp(40px,10vw,54px)}.pn-t9f .pn-vfinal-description{font-size:15px}.pn-t9f .pn-vfinal-kicker{letter-spacing:.13em;font-size:10px;gap:10px}.pn-t9f .pn-vfinal-kicker:before,.pn-t9f .pn-vfinal-kicker:after{width:17px}.pn-t9f .pn-vfinal-cta{width:100%;min-width:0}}
 @media(prefers-reduced-motion:reduce){.pn-t9f .pn-vfinal-cta{transition:none}.pn-t9f .pn-vfinal-photo{transform:none}}
 `}</style>
  <img className="pn-vfinal-photo" src={PHOTO} loading="lazy" decoding="async" alt="Fotografia ilustrativa de mecânico trabalhando em um carro dentro de oficina" onError={event=>{if(!event.currentTarget.src.includes("photo-1619642751034-765dfdf7c58e"))event.currentTarget.src=FALLBACK;}}/>
  <span className="pn-vfinal-accent" aria-hidden="true"/>
  <div className="pn-vfinal-content">
   <p className="pn-vfinal-kicker">11 / Vértice Auto Center</p>
   <h2 className="pn-vfinal-title" id="pn-vfinal-heading">Seu carro merece <em>atenção em cada detalhe.</em></h2>
   <p className="pn-vfinal-description">Pronto para conversar sobre seu veículo? Conte o que precisa e encaminhe sua solicitação pelo canal oficial cadastrado.</p>
   <a className="pn-vfinal-cta" href="#tp9-orcamento">Solicitar orçamento <ArrowUpRight size={20} strokeWidth={2} aria-hidden="true"/></a>
   <p className="pn-vfinal-footnote"><ChevronDown size={16} aria-hidden="true"/>Confira as condições de atendimento diretamente com a equipe.</p>
  </div>
  <span className="pn-vfinal-corner" aria-hidden="true">Manutenção • Cuidado • Confiança</span>
 </section>;
}
