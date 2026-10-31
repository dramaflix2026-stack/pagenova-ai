"use client";
import {useState} from "react";
const images=[
 "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2200&q=85",
 "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2200&q=85",
 "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=2200&q=85"
];
const norm=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function Template8HospitalityHero({brand,niche,headline,description,image,contactHref}:{brand:string;niche:string;headline?:string;description?:string;image?:string;contactHref?:string}){
 const [menu,setMenu]=useState(false),[slide,setSlide]=useState(0);
 const v=norm(niche),travel=/agencia|operadora|turismo|passeio|excurs|experiencia|ecoturismo/.test(v);
 const title=headline?.trim()|| (travel?"Descubra lugares. Viva histórias.":"Sua próxima experiência começa aqui.");
 const subtitle=description?.trim()|| (travel?"Destinos escolhidos com cuidado, experiências para lembrar.":"Momentos de pausa, descoberta e acolhimento em cada detalhe.");
 const action=travel?"Planejar minha viagem":"Consultar disponibilidade";
 const destination=contactHref&&/^(https?:\/\/|mailto:|tel:|#)/i.test(contactHref)?contactHref:"#tp8-contato";
 const photos=image?[image,...images.filter(p=>p!==image)]:images;
 return <div className="pn-t8">
 <style>{`
 .pn-t8{font-family:Arial,Helvetica,sans-serif;color:#fff;background:#1c2828;width:100%;max-width:100%;overflow-x:clip}.pn-t8 *{box-sizing:border-box}
 .pn-t8-hero{min-height:740px;min-height:100svh;position:relative;isolation:isolate;display:flex;flex-direction:column}
 .pn-t8-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-3;transition:opacity .3s}
 .pn-t8-overlay{position:absolute;inset:0;z-index:-2;background:linear-gradient(180deg,rgba(8,21,22,.62),rgba(8,21,22,.05) 40%,rgba(8,21,22,.67))}
 .pn-t8-header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;padding:28px clamp(22px,5vw,90px);border-bottom:1px solid #ffffff65;position:relative;z-index:5}
 .pn-t8-menu{justify-self:start;display:inline-flex;align-items:center;gap:12px;background:none;color:#fff;border:0;cursor:pointer;text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:.2em;padding:12px 0}
 .pn-t8-menu i{display:block;width:24px;height:1px;background:#fff;position:relative}.pn-t8-menu i:before{content:"";position:absolute;top:-6px;left:0;width:24px;height:1px;background:#fff}
 .pn-t8-brand{font-family:Georgia,'Times New Roman',serif;font-size:clamp(22px,2.4vw,38px);font-weight:400;text-align:center;color:#fff;text-decoration:none;letter-spacing:-.04em;overflow-wrap:anywhere}
 .pn-t8-reserve{justify-self:end;color:#fff;text-decoration:none;border:1px solid #ffffffa8;padding:15px 22px;text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:.14em;transition:background .2s}.pn-t8-reserve:hover{background:#ffffff30}
 .pn-t8-nav{position:absolute;top:100%;left:clamp(22px,5vw,90px);background:#f6f1e8;color:#263333;min-width:min(340px,calc(100vw - 44px));padding:20px 25px;display:flex;flex-direction:column;gap:0;box-shadow:0 20px 55px #0005}
 .pn-t8-nav a{padding:15px 4px;border-bottom:1px solid #26333322;color:#263333;text-decoration:none;font-size:13px;letter-spacing:.08em}
 .pn-t8-body{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:105px 22px 125px;max-width:1100px;width:100%;margin:auto}
 .pn-t8-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.34em;font-weight:700;color:#f6e8d5}
 .pn-t8-title{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.055em;line-height:1.04;font-size:clamp(54px,7.5vw,118px);margin:22px 0 24px;max-width:1020px;overflow-wrap:break-word}
 .pn-t8-description{font-size:clamp(15px,1.4vw,19px);line-height:1.8;max-width:590px;color:#f6f2ea;margin:0 0 30px}
 .pn-t8-primary{display:inline-block;background:#eee7db;color:#263333;padding:17px 27px;text-decoration:none;text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:.16em}
 .pn-t8-bottom{position:absolute;bottom:0;left:0;right:0;padding:22px clamp(22px,5vw,90px) 30px;display:flex;align-items:end;justify-content:space-between;gap:20px}
 .pn-t8-controls{display:flex;align-items:center;gap:15px}.pn-t8-controls button{background:transparent;border:1px solid #ffffff99;color:#fff;width:43px;height:43px;cursor:pointer;font-size:20px}.pn-t8-count{font-size:12px;letter-spacing:.15em}.pn-t8-scroll{font-size:10px;letter-spacing:.2em;text-transform:uppercase}
 .pn-t8-next{background:#f5f0e7;color:#293735;text-align:center;padding:26px 22px;font-family:Georgia,serif;font-size:clamp(19px,2.5vw,28px)}
 @media(max-width:680px){.pn-t8-hero{min-height:700px;min-height:92svh}.pn-t8-header{padding:18px 20px;grid-template-columns:1fr 1.5fr 1fr;gap:8px}.pn-t8-brand{font-size:clamp(18px,5vw,26px)}.pn-t8-menu span{display:none}.pn-t8-reserve{padding:11px 10px;font-size:9px;letter-spacing:.04em;text-align:center}.pn-t8-body{padding:90px 23px 110px}.pn-t8-title{font-size:clamp(42px,11vw,69px)}.pn-t8-kicker{font-size:10px;letter-spacing:.2em}.pn-t8-bottom{padding:18px 22px}.pn-t8-scroll{display:none}.pn-t8-nav{left:20px}}
 @media(prefers-reduced-motion:reduce){.pn-t8-photo{transition:none}}
 `}</style>
 <section id="inicio-tp8" className="pn-t8-hero">
  <img className="pn-t8-photo" src={photos[slide]} alt={slide===0?"Paisagem ou hospedagem que apresenta "+niche:"Inspiração visual de destino e hospitalidade"} />
  <div className="pn-t8-overlay"/>
  <header className="pn-t8-header">
   <button className="pn-t8-menu" type="button" aria-expanded={menu} aria-controls="pn-t8-nav" onClick={()=>setMenu(x=>!x)}><i aria-hidden="true"/><span>{menu?"Fechar":"Menu"}</span></button>
   <a className="pn-t8-brand" href="#inicio-tp8">{brand}</a>
   <a className="pn-t8-reserve" href={destination}>{travel?"Planeje sua viagem":"Reservar agora"} ↗</a>
   {menu&&<nav className="pn-t8-nav" id="pn-t8-nav"><a onClick={()=>setMenu(false)} href="#inicio-tp8">Início</a><a onClick={()=>setMenu(false)} href="#tp8-experiencias">Experiências</a><a onClick={()=>setMenu(false)} href="#tp8-contato">Contato e reservas</a></nav>}
  </header>
  <main className="pn-t8-body"><span className="pn-t8-kicker">{niche} · Experiências memoráveis</span><h1 className="pn-t8-title">{title}</h1><p className="pn-t8-description">{subtitle}</p><a className="pn-t8-primary" href={destination}>{action} ↗</a></main>
  <div className="pn-t8-bottom"><div className="pn-t8-controls"><button type="button" aria-label="Destino anterior" onClick={()=>setSlide(x=>(x+photos.length-1)%photos.length)}>‹</button><span className="pn-t8-count">0{slide+1} / 0{photos.length}</span><button type="button" aria-label="Próximo destino" onClick={()=>setSlide(x=>(x+1)%photos.length)}>›</button></div><span className="pn-t8-scroll">Role para descobrir ↓</span></div>
 </section>
 <section className="pn-t8-next" id="tp8-experiencias">Cada destino tem uma história. A próxima pode ser a sua.</section>

 </div>;
}
