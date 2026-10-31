"use client";
import {useState} from "react";

type Props={brand:string;headline?:string;description?:string};
export function Template5AIFuturistHero({brand,headline,description}:Props){
 const [menuOpen,setMenuOpen]=useState(false);
 const title=headline?.trim()||"Inteligência que transforma ideias em crescimento.";
 const sub=description?.trim()||"Estratégia, tecnologia e experiências inteligentes para transformar o seu negócio.";
 const isAI=/(?:intelig[eê]ncia artificial|automa[cç][aã]o|marketing|tecnologia|software|digital|saas|startup|ag[eê]ncia)/i.test([brand,title,sub].join(" "));
 return <div className="pn-t5" id="inicio"><style>{`
 .pn-t5{position:relative;isolation:isolate;overflow:hidden;min-height:780px;background:#090713;color:#f8f6ff;font-family:Inter,Poppins,Arial,sans-serif}.pn-t5 *{box-sizing:border-box}
 .pn-t5:before{content:"";position:absolute;inset:0;z-index:-2;background:radial-gradient(ellipse at 75% 40%,#4320877a,transparent 44%),radial-gradient(ellipse at 18% 95%,#32186e88,transparent 55%),#090713}
 .pn-t5:after{content:"";position:absolute;inset:0;pointer-events:none;z-index:-1;background-image:linear-gradient(#ffffff07 1px,transparent 1px),linear-gradient(90deg,#ffffff07 1px,transparent 1px);background-size:72px 72px;mask-image:linear-gradient(to bottom,transparent,#000 50%,transparent)}
 .pn-t5-nav{height:86px;max-width:1440px;margin:auto;padding:0 clamp(22px,5vw,80px);display:flex;align-items:center;justify-content:space-between;gap:24px;position:relative;z-index:8;border-bottom:1px solid #ffffff1a}
 .pn-t5-logo{display:flex;align-items:center;gap:12px;min-width:0;color:#fff;text-decoration:none;font-size:clamp(17px,2vw,23px);font-weight:750;letter-spacing:-.05em}.pn-t5-logo span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .pn-t5-mark{display:block;width:32px;height:32px;flex-shrink:0;border-radius:11px;background:conic-gradient(from 25deg,#a45fff,#5e36d8,#f2a7ff,#a45fff);transform:rotate(-14deg);box-shadow:0 0 24px #8e4cf777}
 .pn-t5-links{display:flex;align-items:center;gap:clamp(14px,2.5vw,34px)}.pn-t5-links a{color:#d1cbdc;text-decoration:none;font-size:13px;font-weight:500;white-space:nowrap}.pn-t5-links a:hover{color:white}
 .pn-t5-links .pn-t5-navcta{padding:13px 21px;background:#9e63f4;color:#fff;border-radius:9px;font-weight:700;box-shadow:0 6px 24px #7334e84d}
 .pn-t5-toggle{display:none;border:1px solid #ffffff44;background:#ffffff0d;color:white;border-radius:9px;padding:11px 14px}
 .pn-t5-hero{max-width:1440px;min-height:685px;margin:auto;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);align-items:center;gap:20px;padding:65px clamp(22px,5vw,80px) 100px;position:relative}
 .pn-t5-copy{position:relative;z-index:2;max-width:690px}.pn-t5-eyebrow{display:inline-flex;align-items:center;gap:9px;color:#d8b9ff;font-size:11px;font-weight:750;letter-spacing:.17em;text-transform:uppercase;margin-bottom:30px}.pn-t5-eyebrow:before{content:"";height:7px;width:7px;border-radius:50%;background:#c78aff;box-shadow:0 0 14px #b66fff}
 .pn-t5 h1{font-size:clamp(46px,5.4vw,83px);line-height:1.035;letter-spacing:-.07em;font-weight:750;margin:0 0 28px;overflow-wrap:break-word;text-wrap:balance}.pn-t5-sub{font-size:clamp(16px,1.35vw,19px);line-height:1.7;color:#bcb5ca;max-width:570px;margin:0 0 35px}
 .pn-t5-actions{display:flex;gap:13px;flex-wrap:wrap}.pn-t5-primary,.pn-t5-secondary{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:15px 22px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700}.pn-t5-primary{background:#a36bf5;color:#130a24;box-shadow:0 0 28px #9d4af54d}.pn-t5-secondary{border:1px solid #ffffff40;color:#fff;background:#ffffff0a}
 .pn-t5-art{position:relative;display:grid;place-items:center;min-height:490px;isolation:isolate}.pn-t5-art:before{content:"";position:absolute;width:100%;max-width:550px;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#8739f65e,transparent 65%);filter:blur(28px)}
 .pn-t5-art:after{content:"";position:absolute;inset:5% 0 3% 4%;z-index:-1;border-radius:32px;background:linear-gradient(90deg,#090713bb,#09071318),url("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1100&q=85") center/cover no-repeat;opacity:.55;mask-image:radial-gradient(ellipse at center,#000 30%,transparent 78%);pointer-events:none}
 .pn-t5-orbit{position:absolute;width:min(96%,530px);aspect-ratio:1;border:1px solid #b992ff25;border-radius:50%;transform:rotate(-25deg) scaleY(.72)}.pn-t5-orbit:nth-child(2){transform:rotate(35deg) scaleY(.67);width:84%;border-color:#c892ff40}
 .pn-t5-orb{position:relative;width:min(73%,380px);aspect-ratio:1;border-radius:39% 61% 60% 40% / 43% 38% 62% 57%;background:radial-gradient(circle at 27% 23%,#f8d4ff 0%,#c17bff 12%,transparent 36%),radial-gradient(circle at 72% 68%,#3b146f 3%,#7441ed 36%,transparent 62%),conic-gradient(from 15deg,#381168,#ad5aff,#f7b0ff,#5329c0,#241044,#9c5af9,#381168);box-shadow:inset -24px -24px 65px #160b3b, inset 20px 18px 45px #f3c2ff99,0 0 90px #a55cff77;transform:rotate(-20deg);animation:pn-t5-float 8s ease-in-out infinite}
 .pn-t5-orb:before{content:"";position:absolute;inset:18%;border:28px solid #1b0b4bc4;border-top-color:#f0b4ffb8;border-right-color:#8440e8;border-radius:50% 36% 62% 40%;filter:blur(1px);transform:rotate(30deg);box-shadow:0 0 27px #160932c4,inset 0 0 25px #f0b0ff55}
 .pn-t5-orb:after{content:"";position:absolute;inset:36%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f4c4ff,#a359f1 28%,#2d145e 75%);box-shadow:0 0 22px #d18bff}
 .pn-t5-chip{position:absolute;z-index:2;left:4%;bottom:17%;padding:14px 18px;border:1px solid #d6b0ff4d;border-radius:12px;background:#1c1230c9;backdrop-filter:blur(16px);font-size:12px;color:#f2e9ff;box-shadow:0 12px 38px #0006}.pn-t5-chip b{display:block;font-size:13px;margin-bottom:4px}.pn-t5-chip small{color:#b7a6d3}
 .pn-t5-foot{position:absolute;bottom:25px;left:clamp(22px,5vw,80px);right:clamp(22px,5vw,80px);display:flex;justify-content:space-between;gap:20px;color:#8f85a5;font-size:11px;letter-spacing:.14em;text-transform:uppercase}
 @keyframes pn-t5-float{50%{transform:translateY(-17px) rotate(-13deg)}}
 @media(max-width:900px){.pn-t5-hero{grid-template-columns:1fr;gap:0;padding-top:75px;padding-bottom:95px}.pn-t5-copy{max-width:780px}.pn-t5-art{min-height:400px}.pn-t5-orb{max-width:310px}.pn-t5-links{gap:15px}.pn-t5-links>a:not(.pn-t5-navcta){display:none}}
 @media(max-width:600px){.pn-t5-nav{height:72px;padding:0 20px}.pn-t5-logo{max-width:65%}.pn-t5-toggle{display:block}.pn-t5-links{display:none;position:absolute;top:72px;left:12px;right:12px;padding:20px;border:1px solid #ffffff24;border-radius:15px;background:#140d25;flex-direction:column;align-items:stretch;box-shadow:0 20px 50px #0008}.pn-t5-links[data-open="true"]{display:flex}.pn-t5-links>a:not(.pn-t5-navcta){display:block}.pn-t5-links .pn-t5-navcta{text-align:center}.pn-t5-hero{padding:65px 20px 88px}.pn-t5 h1{font-size:clamp(40px,10.5vw,60px)}.pn-t5-eyebrow{font-size:10px}.pn-t5-art{min-height:320px}.pn-t5-orb{max-width:260px}.pn-t5-chip{bottom:8%;left:0}.pn-t5-foot{left:20px;right:20px;font-size:9px}}

 /* TP5 option 2: premium split editorial header + image-led futuristic cover */
 .pn-t5{background:#080611}
 .pn-t5-nav{height:92px;border-bottom:1px solid #c7a0f52b}
 .pn-t5-logo{letter-spacing:-.045em}
 .pn-t5-mark{width:39px;height:39px;border-radius:13px;box-shadow:0 0 30px #a44df55c}
 .pn-t5-hero{grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:clamp(24px,3vw,55px);padding-top:74px;padding-bottom:110px;min-height:740px}
 .pn-t5-copy{max-width:720px}
 .pn-t5 h1{font-size:clamp(48px,5.2vw,82px);line-height:1.045;letter-spacing:-.064em}
 .pn-t5-sub{max-width:535px}
 .pn-t5-primary{background:#ad77ff;color:#12071d}
 .pn-t5-art{min-height:535px;border:1px solid #bd87ff4d;border-radius:30px;overflow:hidden;background:#1a102b;box-shadow:0 30px 90px #0009,0 0 70px #853be41d}
 .pn-t5-art:after{inset:0;z-index:0;opacity:1;mask-image:none;border-radius:0;background:linear-gradient(180deg,#08061110 0%,#13092030 42%,#080611d9 100%),url("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85") center/cover no-repeat}
 .pn-t5-art:before{z-index:1}
 .pn-t5-orbit{z-index:2;width:78%;border-color:#e3b9ff4d}
 .pn-t5-orbit:nth-child(2){width:67%}
 .pn-t5-orb{z-index:2;width:min(58%,310px);opacity:.9}
 .pn-t5-chip{z-index:3;left:6%;bottom:7%;padding:17px 20px;border-radius:15px;background:#140d28e6}
 .pn-t5-chip b{font-size:15px}
 .pn-t5-foot{bottom:29px}
 @media(max-width:900px){.pn-t5-hero{grid-template-columns:1fr;gap:28px;padding-top:58px}.pn-t5-art{min-height:420px}.pn-t5-copy{max-width:700px}}
 @media(max-width:600px){.pn-t5-nav{height:76px}.pn-t5-links{top:76px}.pn-t5-hero{padding:54px 20px 94px;gap:32px}.pn-t5 h1{font-size:clamp(38px,10vw,57px);letter-spacing:-.055em}.pn-t5-sub{font-size:16px;line-height:1.65}.pn-t5-actions{gap:11px}.pn-t5-primary,.pn-t5-secondary{min-height:51px}.pn-t5-art{min-height:335px;border-radius:23px}.pn-t5-orb{width:min(62%,240px)}.pn-t5-chip{left:5%;bottom:6%;padding:12px 14px}.pn-t5-chip b{font-size:12px}.pn-t5-chip small{font-size:10px}.pn-t5-foot{bottom:23px;letter-spacing:.08em}}
 @media(prefers-reduced-motion:reduce){.pn-t5-orb{animation:none}}
 `}</style>
 <header className="pn-t5-nav"><a className="pn-t5-logo" href="#inicio"><span className="pn-t5-mark" aria-hidden="true"/><span>{brand}</span></a><button type="button" className="pn-t5-toggle" aria-expanded={menuOpen} aria-controls="pn-t5-menu" onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"Fechar ×":"Menu ☰"}</button><nav id="pn-t5-menu" className="pn-t5-links" data-open={menuOpen} aria-label="Navegação principal"><a href="#solucoes" onClick={()=>setMenuOpen(false)}>Soluções</a><a href="#sobre" onClick={()=>setMenuOpen(false)}>Sobre</a><a href="#projetos" onClick={()=>setMenuOpen(false)}>Projetos</a><a href="#contato" onClick={()=>setMenuOpen(false)}>Contato</a><a className="pn-t5-navcta" href="#contato" onClick={()=>setMenuOpen(false)}>Iniciar projeto ↗</a></nav></header>
 <main className="pn-t5-hero"><div className="pn-t5-copy"><span className="pn-t5-eyebrow">{isAI?"Marketing, automação e inteligência artificial":"Experiências, inovação e novas possibilidades"}</span><h1>{title}</h1><p className="pn-t5-sub">{sub}</p><div className="pn-t5-actions"><a href="#contato" className="pn-t5-primary">Vamos conversar <span aria-hidden="true">↗</span></a><a href="#solucoes" className="pn-t5-secondary">Explorar soluções <span aria-hidden="true">→</span></a></div></div><div className="pn-t5-art" aria-hidden="true"><div className="pn-t5-orbit"/><div className="pn-t5-orbit"/><div className="pn-t5-orb"/><div className="pn-t5-chip"><b>{isAI?"Inteligência em movimento":"Sua marca em destaque"}</b><small>{isAI?"Estratégia + criatividade + automação":"Experiência + identidade + inovação"}</small></div></div><div className="pn-t5-foot"><span>Ideias conectadas ao futuro</span><span>Explore o que vem a seguir ↓</span></div></main></div>;
}
