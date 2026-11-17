"use client";

import {useState} from "react";

type Props={brand:string;niche:string;headline?:string;description?:string;image?:string;contactHref?:string};
const defaultPhoto="https://images.unsplash.com/photo-1677230017871-f19937f21a8c?auto=format&fit=crop&w=1800&q=85";
const fallbackPhoto="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1800&q=85";

export function TP9VerticeHandcarHero({headline,description,contactHref}:Props){
 const [menuOpen,setMenuOpen]=useState(false);
 const cleanHeadline=(headline||"").trim().replace(/^v[ée]rtice\s+auto\s+center\s*[:\-–—|.]?\s*/i,"").trim();
 const title=cleanHeadline.length>8?cleanHeadline:"Performance e confiança para seu veículo.";
 const subtitle=(description||"").trim()||"Manutenção preventiva e corretiva com diagnóstico técnico, transparência e atenção aos detalhes.";
 // This approved visual is intentionally authoritative for Vértice until an
 // explicitly user-edited hero override is wired into the universal editor.
 // Seed/CRM-generated image blocks must never reinsert the old composite.
 const photo=defaultPhoto;
 const contact=contactHref&&(/^(https?:\/\/|mailto:|tel:)/i.test(contactHref)||contactHref==="#tp9-contato")?contactHref:"#tp9-orcamento";
 const external=/^https?:\/\//i.test(contact);
 const closeMenu=()=>setMenuOpen(false);
 return <div className="pn-vh" id="tp9-inicio"><style>{`
 .pn-vh{--accent:#fa7135;--dark:#101517;width:100%;max-width:100%;overflow-x:clip;background:var(--dark);color:#fff;font-family:Inter,Arial,sans-serif}
 .pn-vh *{box-sizing:border-box}.pn-vh a{color:inherit;text-decoration:none}
 .pn-vh .vh-header{position:relative;z-index:21;min-height:100px;padding:16px clamp(22px,5.5vw,86px);display:flex;justify-content:space-between;align-items:center;gap:25px;border-bottom:1px solid #ffffff2b;background:#101517}
 .pn-vh .vh-logo{display:inline-flex;align-items:center;gap:15px;flex-shrink:0}
 .pn-vh .vh-logo svg{width:44px;height:44px;flex:none}
 .pn-vh .vh-wordmark{display:flex;flex-direction:column;line-height:1.02}.pn-vh .vh-wordmark strong{font-size:clamp(18px,1.7vw,24px);font-weight:900;letter-spacing:.12em}.pn-vh .vh-wordmark span{font-size:10px;font-weight:700;letter-spacing:.3em;color:#cbd2cd;margin-top:6px}
 .pn-vh .vh-nav{display:flex;align-items:center;gap:clamp(17px,2.5vw,37px);margin-left:auto}
 .pn-vh .vh-nav>a:not(.vh-nav-cta){font-size:12px;letter-spacing:.05em;white-space:nowrap;font-weight:700;transition:color .2s}
 .pn-vh .vh-nav>a:not(.vh-nav-cta):hover{color:var(--accent)}
 .pn-vh .vh-nav-cta,.pn-vh .vh-btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:14px;min-height:50px;padding:14px 22px;background:var(--accent);border:1px solid var(--accent);color:#181918;font-size:13px;font-weight:900;white-space:nowrap;transition:background .2s,transform .2s}
 .pn-vh .vh-nav-cta:hover,.pn-vh .vh-btn-primary:hover{background:#ff945c;transform:translateY(-2px)}
 .pn-vh .vh-toggle{display:none;align-items:center;justify-content:center;min-width:46px;min-height:46px;background:#1b2225;color:#fff;border:1px solid #ffffff5d;border-radius:3px;font-size:23px;cursor:pointer}
 .pn-vh .vh-hero{position:relative;display:grid;grid-template-columns:minmax(0,46%) minmax(0,54%);min-height:670px;background:linear-gradient(125deg,#1c2225,#101517 77%)}
 .pn-vh .vh-copy{position:relative;z-index:2;min-width:0;align-self:center;padding:90px 32px 115px clamp(24px,7vw,120px)}
 .pn-vh .vh-eyebrow{display:flex;align-items:center;gap:12px;margin:0 0 29px;color:var(--accent);font-size:11px;line-height:1.6;letter-spacing:.16em;text-transform:uppercase;font-weight:800}
 .pn-vh .vh-eyebrow:before{content:"";display:inline-block;flex:none;width:28px;height:2px;background:var(--accent)}
 .pn-vh .vh-title{margin:0 0 27px;color:#fff;font-size:clamp(42px,5.3vw,76px);font-weight:900;line-height:1.07;letter-spacing:-.055em;text-wrap:balance;overflow-wrap:break-word}
 .pn-vh .vh-desc{margin:0 0 37px;max-width:560px;color:#c2ccc6;line-height:1.75;font-size:clamp(15px,1.3vw,18px)}
 .pn-vh .vh-actions{display:flex;flex-wrap:wrap;gap:12px}
 .pn-vh .vh-btn-primary,.pn-vh .vh-btn-secondary{min-height:56px;padding:15px 23px}
 .pn-vh .vh-btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:13px;border:1px solid #ffffff74;background:transparent;color:#fff;font-size:13px;font-weight:800;transition:background .2s,border-color .2s}
 .pn-vh .vh-btn-secondary:hover{background:#ffffff16;border-color:var(--accent)}
 .pn-vh .vh-photo{position:relative;min-height:670px;overflow:hidden;isolation:isolate}
 .pn-vh .vh-photo img{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover;object-position:center;animation:vhZoom .9s ease-out both}
 .pn-vh .vh-photo:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,#1015179c,transparent 32%),linear-gradient(0deg,#101517b8,transparent 48%)}
 .pn-vh .vh-photo-accent{position:absolute;top:10%;left:0;width:6px;height:34%;background:var(--accent)}
 .pn-vh .vh-photo-info{position:absolute;right:clamp(24px,5vw,75px);bottom:38px;padding:10px 0 10px 17px;border-left:3px solid var(--accent)}
 .pn-vh .vh-photo-info strong{display:block;font-size:12px;font-weight:900;letter-spacing:.12em}.pn-vh .vh-photo-info span{display:block;font-size:11px;color:#e5eae6;margin-top:8px}
 .pn-vh .vh-meta{position:absolute;bottom:23px;left:clamp(24px,7vw,120px);color:#8c9992;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
 .pn-vh .vh-copy>*{animation:vhRise .65s ease-out both}.pn-vh .vh-title{animation-delay:.07s}.pn-vh .vh-desc{animation-delay:.15s}.pn-vh .vh-actions{animation-delay:.22s}
 .pn-vh :is(a,button):focus-visible{outline:3px solid #ffaa78;outline-offset:4px}
 @keyframes vhZoom{from{transform:scale(1.06);opacity:.8}to{transform:scale(1);opacity:1}}
 @keyframes vhRise{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
 @media(max-width:1130px){.pn-vh .vh-header{padding-inline:25px}.pn-vh .vh-nav{gap:18px}.pn-vh .vh-copy{padding-left:35px}.pn-vh .vh-title{font-size:clamp(40px,5vw,67px)}.pn-vh .vh-meta{left:35px}}
 @media(max-width:930px){
 .pn-vh .vh-header{min-height:80px;padding:14px 22px}.pn-vh .vh-toggle{display:inline-flex}
 .pn-vh .vh-nav{display:none;position:absolute;top:100%;left:0;right:0;z-index:50;flex-direction:column;align-items:stretch;gap:0;padding:17px 22px 23px;background:#101517;border-bottom:1px solid #ffffff33;box-shadow:0 18px 32px #0009}
 .pn-vh .vh-nav[data-open="true"]{display:flex}.pn-vh .vh-nav>a:not(.vh-nav-cta){font-size:14px;padding:15px 4px;border-bottom:1px solid #ffffff1c}.pn-vh .vh-nav-cta{margin-top:16px}
 .pn-vh .vh-hero{grid-template-columns:1fr;min-height:unset}.pn-vh .vh-copy{padding:70px 24px 75px}.pn-vh .vh-title{font-size:clamp(43px,7vw,66px)}
 .pn-vh .vh-photo{height:440px;min-height:440px}.pn-vh .vh-photo:after{background:linear-gradient(0deg,#101517a8,transparent 67%)}.pn-vh .vh-meta{display:none}
 }
 @media(max-width:560px){
 .pn-vh .vh-logo svg{width:36px;height:36px}.pn-vh .vh-wordmark strong{font-size:17px}.pn-vh .vh-wordmark span{font-size:8px}
 .pn-vh .vh-copy{padding:53px 20px 64px}.pn-vh .vh-eyebrow{font-size:10px;letter-spacing:.1em;margin-bottom:22px}.pn-vh .vh-title{font-size:clamp(36px,10vw,54px);line-height:1.1}
 .pn-vh .vh-desc{font-size:15px;margin-bottom:29px}.pn-vh .vh-actions{flex-direction:column}.pn-vh .vh-btn-primary,.pn-vh .vh-btn-secondary{width:100%}
 .pn-vh .vh-photo{height:340px;min-height:340px}.pn-vh .vh-photo-info{right:20px;bottom:24px}
 }
 @media(prefers-reduced-motion:reduce){.pn-vh .vh-copy>*,.pn-vh .vh-photo img{animation:none}.pn-vh :is(a,button){transition:none}}
 `}</style>
 <header className="vh-header">
  <a className="vh-logo" href="#tp9-inicio" aria-label="Vértice Auto Center — voltar ao início" onClick={closeMenu}>
   <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M4 8h10l10 25L35 8h10L29 43H19L4 8Z" fill="#fa7135"/><path d="M16 8h15l-5 11h-5z" fill="#ffffff"/></svg>
   <span className="vh-wordmark"><strong>VÉRTICE</strong><span>AUTO CENTER</span></span>
  </a>
  <button type="button" className="vh-toggle" aria-controls="tp9-vertice-menu" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"×":"☰"}</button>
  <nav className="vh-nav" id="tp9-vertice-menu" aria-label="Menu principal" data-open={menuOpen}>
   <a href="#tp9-inicio" onClick={closeMenu}>Início</a>
   <a href="#tp9-sobre" onClick={closeMenu}>Sobre nós</a>
   <a href="#tp9-servicos" onClick={closeMenu}>Serviços</a>
   <a href="#tp9-faq" onClick={closeMenu}>Dúvidas</a>
   <a href={contact} className="vh-nav-cta" onClick={closeMenu} target={external?"_blank":undefined} rel={external?"noopener noreferrer":undefined}>Solicitar avaliação <span aria-hidden="true">↗</span></a>
  </nav>
 </header>
 <section className="vh-hero" aria-labelledby="tp9-vertice-title">
  <div className="vh-copy">
   <p className="vh-eyebrow">Manutenção automotiva com atenção aos detalhes</p>
   <h1 className="vh-title" id="tp9-vertice-title">{title}</h1>
   <p className="vh-desc">{subtitle}</p>
   <div className="vh-actions">
    <a className="vh-btn-primary" href={contact} target={external?"_blank":undefined} rel={external?"noopener noreferrer":undefined}>Solicitar avaliação <span aria-hidden="true">↗</span></a>
    <a className="vh-btn-secondary" href="#tp9-servicos">Conhecer serviços <span aria-hidden="true">→</span></a>
   </div>
  </div>
  <div className="vh-photo">
   <img src={photo} alt="Fotografia ilustrativa de manutenção de veículo em oficina automotiva" fetchPriority="high" onError={e=>{if(e.currentTarget.src!==fallbackPhoto)e.currentTarget.src=fallbackPhoto;}}/>
   <span className="vh-photo-accent" aria-hidden="true"/>
   <div className="vh-photo-info"><strong>SEU VEÍCULO, NOSSA ATENÇÃO.</strong><span>Revisão · Diagnóstico · Manutenção</span></div>
  </div>
  <span className="vh-meta">Vértice Auto Center / Manutenção e confiança</span>
 </section>
 </div>;
}
