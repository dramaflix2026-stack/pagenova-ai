"use client";
import React from "react";

const metrics=[
 {value:"98,7%",label:"Eficiência operacional",detail:"+24% em produtividade",tone:"cyan"},
 {value:"3,2×",label:"Velocidade de execução",detail:"Fluxos em tempo real",tone:"pink"},
 {value:"24/7",label:"Inteligência ativa",detail:"Automação sem interrupções",tone:"violet"},
 {value:"-42%",label:"Tempo em tarefas manuais",detail:"Mais foco no estratégico",tone:"cyan"},
];
export function NexoraIndicators(){
 return <section className="nx5i" id="indicadores" aria-labelledby="nx5i-title">
 <style>{`
 .nx5i{position:relative;isolation:isolate;overflow:hidden;background:#070914;color:#f8fbff;padding:105px max(22px,calc((100vw - 1160px)/2)) 115px;font-family:inherit}
 .nx5i *{box-sizing:border-box}.nx5i:before{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(ellipse 55% 55% at 92% 30%,#a42c9c20,transparent 75%),radial-gradient(ellipse 55% 60% at 0% 80%,#08caff15,transparent 72%)}
 .nx5i-eyebrow{display:inline-flex;align-items:center;gap:9px;color:#68e7f6;font-size:11px;letter-spacing:.18em;font-weight:700;text-transform:uppercase}.nx5i-eyebrow:before{content:"";width:7px;height:7px;border-radius:50%;background:#33e6f4;box-shadow:0 0 13px #24e6f4}
 .nx5i-heading{max-width:770px;margin:20px 0 16px;font-size:clamp(34px,4.6vw,62px);font-weight:750;line-height:1.09;letter-spacing:-.052em}.nx5i-heading em{font-style:normal;background:linear-gradient(95deg,#49e6f7,#d17cff,#ff65c5);color:transparent;background-clip:text}
 .nx5i-sub{color:#a2a8be;font-size:16px;line-height:1.75;max-width:600px;margin:0 0 43px}
 .nx5i-layout{display:grid;grid-template-columns:1.12fr .88fr;gap:17px}.nx5i-visual,.nx5i-stat{border:1px solid #ffffff1c;background:linear-gradient(145deg,#14182a,#0b0e1c);border-radius:23px;min-width:0}
 .nx5i-visual{position:relative;min-height:405px;overflow:hidden;padding:27px;display:flex;flex-direction:column;justify-content:space-between}.nx5i-visual:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 48%,#8c39ed22,transparent 60%)}
 .nx5i-visual-top{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;color:#a8afc5}.nx5i-live{border:1px solid #43e8d54a;border-radius:30px;padding:7px 11px;color:#60eed7;background:#0e38362b;font-size:10px;letter-spacing:.08em}
 .nx5i-cube-wrap{height:250px;display:grid;place-items:center;perspective:800px}.nx5i-cube{position:relative;width:140px;height:140px;transform-style:preserve-3d;transform:rotateX(-24deg) rotateY(-34deg);animation:nx5i-turn 22s linear infinite}.nx5i-face{position:absolute;inset:0;border:1px solid #8eeaff99;background:linear-gradient(135deg,#17d9ff22,#b42be733);box-shadow:inset 0 0 45px #13c9fc25,0 0 25px #d23fff16;backface-visibility:visible}.nx5i-front{transform:translateZ(70px)}.nx5i-back{transform:rotateY(180deg) translateZ(70px)}.nx5i-right{transform:rotateY(90deg) translateZ(70px)}.nx5i-left{transform:rotateY(-90deg) translateZ(70px)}.nx5i-top{transform:rotateX(90deg) translateZ(70px)}.nx5i-bottom{transform:rotateX(-90deg) translateZ(70px)}
 .nx5i-core{position:absolute;inset:39px;border-radius:50%;background:#a45dff;box-shadow:0 0 35px 19px #d25fff8a,0 0 65px 30px #28dfff42}
 .nx5i-visual-bottom{display:flex;justify-content:space-between;gap:12px;align-items:end;z-index:1}.nx5i-visual-bottom strong{font-size:20px;letter-spacing:-.03em}.nx5i-visual-bottom small{display:block;color:#8994ac;margin-top:8px}.nx5i-wave{display:flex;align-items:end;gap:4px;height:34px}.nx5i-wave i{width:5px;border-radius:4px;background:linear-gradient(#56e6ff,#a750f4);height:var(--h)}
 .nx5i-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px}.nx5i-stat{padding:26px 21px;display:flex;flex-direction:column;justify-content:space-between;min-height:192px}.nx5i-stat-top{display:flex;align-items:center;justify-content:space-between}.nx5i-stat-top span{color:#929bb2;font-size:11px;letter-spacing:.07em;text-transform:uppercase}.nx5i-stat-top b{width:9px;height:9px;border-radius:50%;background:#37dff2;box-shadow:0 0 13px #37dff2}.nx5i-stat:nth-child(2) .nx5i-stat-top b{background:#fb5dbd;box-shadow:0 0 13px #fb5dbd}.nx5i-stat:nth-child(3) .nx5i-stat-top b{background:#b48cff;box-shadow:0 0 13px #b48cff}
 .nx5i-number{font-size:clamp(31px,3.2vw,47px);font-weight:750;letter-spacing:-.065em;line-height:1.1}.nx5i-label{font-size:13px;color:#d7d9e8;margin-top:10px}.nx5i-detail{color:#8593a9;font-size:11px;margin-top:13px}
 @keyframes nx5i-turn{to{transform:rotateX(-24deg) rotateY(326deg)}}
 @media(max-width:800px){.nx5i{padding:72px 18px 78px}.nx5i-layout{grid-template-columns:1fr}.nx5i-visual{min-height:340px}.nx5i-cube-wrap{height:210px}.nx5i-stats{gap:12px}.nx5i-stat{min-height:170px;padding:20px 15px}}
 @media(max-width:390px){.nx5i-number{font-size:30px}.nx5i-stat{padding:17px 12px}.nx5i-visual-bottom strong{font-size:17px}}
 @media(prefers-reduced-motion:reduce){.nx5i-cube{animation:none}}
 `}</style>
 <div className="nx5i-eyebrow">INTELIGÊNCIA MENSURÁVEL</div>
 <h2 className="nx5i-heading" id="nx5i-title">Resultados que você pode <em>ver em tempo real.</em></h2>
 <p className="nx5i-sub">Transforme dados complexos em decisões claras. Uma visão unificada do desempenho da sua operação, em cada etapa.</p>
 <div className="nx5i-layout">
 <div className="nx5i-visual"><div className="nx5i-visual-top"><span>NEXORA / NÚCLEO DE INTELIGÊNCIA</span><span className="nx5i-live">● SISTEMA ATIVO</span></div><div className="nx5i-cube-wrap"><div className="nx5i-cube"><div className="nx5i-face nx5i-front"/><div className="nx5i-face nx5i-back"/><div className="nx5i-face nx5i-right"/><div className="nx5i-face nx5i-left"/><div className="nx5i-face nx5i-top"/><div className="nx5i-face nx5i-bottom"/><div className="nx5i-core"/></div></div><div className="nx5i-visual-bottom"><div><strong>Controle total. Zero atrito.</strong><small>Visibilidade operacional centralizada</small></div><div className="nx5i-wave" aria-hidden="true">{[16,27,20,33,22,29,14,31,25,19].map((h,i)=><i key={i} style={{"--h":h+"px"} as React.CSSProperties}/>)}</div></div></div>
 <div className="nx5i-stats">{metrics.map((m,i)=><article className="nx5i-stat" key={m.label}><div className="nx5i-stat-top"><span>INDICADOR 0{i+1}</span><b/></div><div><div className="nx5i-number">{m.value}</div><div className="nx5i-label">{m.label}</div><div className="nx5i-detail">{m.detail}</div></div></article>)}</div>
 </div><p style={{fontSize:11,color:"#6f7892",marginTop:18}}>Indicadores ilustrativos de demonstração. Não representam resultados reais de clientes.</p></section>
}
