"use client";
import {useMemo,useState} from "react";
import type {PropertyItem} from "@/components/builder-v2-real-estate";

const money=(value:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(value);
export function Template7RealEstateHero({brand,niche,headline,description,image,properties,contactHref}:{brand:string;niche:string;headline?:string;description?:string;image?:string;properties:PropertyItem[];contactHref:string}){
 const [menuOpen,setMenuOpen]=useState(false);
 const [query,setQuery]=useState("");
 const [type,setType]=useState("Todos");
 const [searched,setSearched]=useState(false);
 const availableTypes=useMemo(()=>["Todos",...Array.from(new Set(properties.map(p=>p.type).filter(Boolean)))], [properties]);
 const matches=useMemo(()=>properties.filter(p=>(type==="Todos"||p.type===type)&&(!query.trim()||[p.title,p.location,p.description].some(v=>(v||"").toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))))),[properties,type,query]);
 const cover=image||properties.find(p=>p.image)?.image||"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=85";
 const title=headline?.trim()||({"Imóveis de luxo":"Endereços extraordinários. Histórias únicas.","Casas de alto padrão":"Arquitetura que inspira novas histórias.","Lançamentos imobiliários":"O futuro tem um novo endereço."} as Record<string,string>)[niche]||"Espaços que transformam o seu jeito de viver.";
 const subtitle=description?.trim()||"Uma curadoria imobiliária feita para quem valoriza localização, arquitetura e cada detalhe da próxima conquista.";
 return <section className="pn-t7" id="inicio-tp7">
  <style>{`
   .pn-t7{font-family:Arial,Helvetica,sans-serif;color:#fff;background:#191b1b}.pn-t7 *{box-sizing:border-box}
   .pn-t7-hero{position:relative;min-height:760px;min-height:min(850px,100svh);display:flex;flex-direction:column;isolation:isolate}
   .pn-t7-cover{position:absolute;inset:0;z-index:-2;width:100%;height:100%;object-fit:cover}
   .pn-t7-shade{position:absolute;inset:0;z-index:-1;background:linear-gradient(90deg,rgba(8,15,17,.72) 0%,rgba(8,15,17,.34) 63%,rgba(8,15,17,.3)),linear-gradient(0deg,rgba(8,15,17,.78),transparent 45%)}
   .pn-t7-header{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:29px clamp(22px,5vw,88px);border-bottom:1px solid rgba(255,255,255,.26);background:rgba(11,20,22,.09);backdrop-filter:blur(5px);position:relative;z-index:4}
   .pn-t7-brand{font-family:Georgia,serif;font-size:clamp(21px,2vw,32px);font-weight:400;letter-spacing:-.025em;line-height:1.1;color:white;text-decoration:none;max-width:300px}
   .pn-t7-nav{display:flex;align-items:center;gap:clamp(16px,2.6vw,44px)}.pn-t7-nav a{color:#fff;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
   .pn-t7-nav a:hover{text-decoration:underline;text-underline-offset:7px}
   .pn-t7-nav .pn-t7-contact{padding:14px 21px;border:1px solid rgba(255,255,255,.7);white-space:nowrap}
   .pn-t7-menu{display:none;color:#fff;background:transparent;border:1px solid #ffffff70;padding:10px 15px;cursor:pointer}
   .pn-t7-main{flex:1;display:flex;flex-direction:column;justify-content:center;padding:80px clamp(22px,8vw,140px) 130px;max-width:1050px}
   .pn-t7-eyebrow{font-size:11px;letter-spacing:.3em;text-transform:uppercase;font-weight:700;color:#e6dac5}
   .pn-t7-title{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.045em;font-size:clamp(48px,6.7vw,108px);line-height:1.04;margin:22px 0}
   .pn-t7-description{font-size:clamp(15px,1.25vw,19px);line-height:1.75;max-width:530px;color:#f0efeb}
   .pn-t7-bottom{position:absolute;bottom:0;left:0;right:0;padding:0 clamp(22px,5vw,88px) 34px;display:flex;align-items:end;justify-content:space-between;gap:20px}
   .pn-t7-bottom span{font-size:10px;text-transform:uppercase;letter-spacing:.22em}
   .pn-t7-search-wrap{background:#f7f5f0;color:#242825;padding:34px clamp(22px,7vw,112px) 45px}
   .pn-t7-search-head{display:flex;justify-content:space-between;align-items:end;gap:15px;margin-bottom:20px}
   .pn-t7-search-head h2{font-family:Georgia,serif;font-weight:400;font-size:clamp(26px,3vw,43px);letter-spacing:-.04em;margin:0}
   .pn-t7-search-head p{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#77776d}
   .pn-t7-search-form{display:grid;grid-template-columns:minmax(0,2fr) minmax(150px,1fr) auto;gap:10px;background:white;padding:10px;border:1px solid #e6e2d9}
   .pn-t7-field{display:flex;flex-direction:column;gap:7px;padding:8px 15px}.pn-t7-field label{font-size:10px;text-transform:uppercase;letter-spacing:.17em;color:#77766d;font-weight:700}
   .pn-t7-field input,.pn-t7-field select{width:100%;border:0;outline-offset:3px;background:transparent;color:#252825;font-size:15px;padding:4px 0;min-width:0}
   .pn-t7-submit{background:#202b2b;color:white;border:0;padding:14px 28px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
   .pn-t7-results{padding:28px 0 4px}.pn-t7-results h3{font-family:Georgia,serif;font-size:26px;font-weight:400;margin:0 0 15px}
   .pn-t7-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.pn-t7-card{background:#fff;border:1px solid #e8e5dd;overflow:hidden}
   .pn-t7-card img{width:100%;height:190px;object-fit:cover}.pn-t7-card-body{padding:18px}.pn-t7-card h4{font-family:Georgia,serif;font-size:20px;font-weight:400;margin:8px 0}.pn-t7-card p{font-size:13px;color:#696e69;margin:7px 0}
   @media(max-width:800px){.pn-t7-hero{min-height:720px;min-height:85svh}.pn-t7-menu{display:block}.pn-t7-header{padding:19px 22px}.pn-t7-nav{display:none;position:absolute;top:100%;left:0;right:0;background:#1a2526;padding:24px;flex-direction:column;align-items:stretch}.pn-t7-nav[data-open="true"]{display:flex}.pn-t7-main{padding:90px 25px 120px}.pn-t7-title{font-size:clamp(46px,10vw,78px)}.pn-t7-bottom{padding:0 25px 24px}.pn-t7-search-form{grid-template-columns:1fr}.pn-t7-submit{min-height:50px}.pn-t7-grid{grid-template-columns:1fr 1fr}}
   @media(max-width:520px){.pn-t7-search-wrap{padding:30px 18px 40px}.pn-t7-search-form{padding:12px;gap:8px}.pn-t7-field{padding:9px 8px}.pn-t7-main{padding:72px 22px 100px}.pn-t7-title{overflow-wrap:anywhere}.pn-t7-hero{min-height:710px}.pn-t7-title{font-size:clamp(44px,11vw,65px)}.pn-t7-bottom span:last-child{display:none}.pn-t7-search-head{display:block}.pn-t7-grid{grid-template-columns:1fr}.pn-t7-card img{height:230px}}
  `}</style>
  <div className="pn-t7-hero">
   <img className="pn-t7-cover" src={cover} alt={"Arquitetura e imóveis — "+niche} />
   <div className="pn-t7-shade"/>
   <header className="pn-t7-header">
    <a className="pn-t7-brand" href="#inicio-tp7">{brand}</a>
    <button type="button" className="pn-t7-menu" aria-expanded={menuOpen} aria-controls="pn-t7-nav" onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?"Fechar":"Menu"}</button>
    <nav className="pn-t7-nav" id="pn-t7-nav" data-open={menuOpen}>
     <a href="#inicio-tp7" onClick={()=>setMenuOpen(false)}>Início</a><a href="#buscar-imoveis-tp7" onClick={()=>setMenuOpen(false)}>Imóveis</a><a href="#sobre-tp7" onClick={()=>setMenuOpen(false)}>Sobre nós</a><a className="pn-t7-contact" href={contactHref} onClick={()=>setMenuOpen(false)}>Fale com um especialista ↗</a>
    </nav>
   </header>
   <div className="pn-t7-main"><span className="pn-t7-eyebrow">{niche} · Seleção exclusiva</span><h1 className="pn-t7-title">{title}</h1><p className="pn-t7-description">{subtitle}</p></div>
   <div className="pn-t7-bottom"><span>Explore possibilidades ↓</span><span>Arquitetura · Localização · Experiência</span></div>
  </div>
  <div className="pn-t7-search-wrap" id="buscar-imoveis-tp7">
   <div className="pn-t7-search-head"><h2>Encontre seu próximo endereço.</h2><p>Busca personalizada</p></div>
   <form className="pn-t7-search-form" onSubmit={e=>{e.preventDefault();setSearched(true)}}>
    <div className="pn-t7-field"><label htmlFor="pn-t7-location">Localização ou imóvel</label><input id="pn-t7-location" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cidade, bairro ou empreendimento"/></div>
    <div className="pn-t7-field"><label htmlFor="pn-t7-type">Tipo de imóvel</label><select id="pn-t7-type" value={type} onChange={e=>setType(e.target.value)}>{availableTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
    <button type="submit" className="pn-t7-submit">Buscar imóveis ↗</button>
   </form>
   {searched&&<div className="pn-t7-results" aria-live="polite"><h3>{matches.length?matches.length+" imóvel(is) encontrado(s)":"Nenhum imóvel encontrado"}</h3>{!properties.length?<p>O catálogo ainda não possui imóveis cadastrados. Entre em contato para consultar as oportunidades disponíveis.</p>:!matches.length?<p>Tente outra localização ou categoria.</p>:<div className="pn-t7-grid">{matches.slice(0,9).map(p=><article key={p.id} className="pn-t7-card">{p.image&&<img src={p.image} alt={p.title} loading="lazy"/>}<div className="pn-t7-card-body"><small>{p.type}</small><h4>{p.title}</h4><p>{p.location}</p>{p.price>0&&<strong>{money(p.price)}</strong>}</div></article>)}</div>}</div>}
  </div>
 </section>;
}
