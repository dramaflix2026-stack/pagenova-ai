"use client";
import type {PropertyItem} from "@/components/builder-v2-real-estate";

const price=(value:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(value);
const defaultPhoto="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85";
export function Template7RealEstateSections({brand,niche,properties,images,contactHref}:{brand:string;niche:string;properties:PropertyItem[];images:string[];contactHref:string}){
 const featured=properties.find(p=>p.image)||properties[0];
 const showcasePhoto=featured?.image||images.find(Boolean)||defaultPhoto;
 const isDeveloper=/lançamento|incorporadora|empreendimento|condomínio/i.test(niche);
 const aboutTitle=isDeveloper?"Projetamos o amanhã com propósito.":"Mais que imóveis. Novas perspectivas de viver.";
 const aboutCopy=isDeveloper?"Cada projeto é uma oportunidade de conectar arquitetura, localização e novas possibilidades de vida. Nosso compromisso é apresentar cada empreendimento com clareza, atenção aos detalhes e uma visão de futuro.":"Acreditamos que escolher um imóvel é também escolher um novo capítulo. Unimos conhecimento do mercado, atenção individual e uma curadoria cuidadosa para tornar cada decisão mais segura e significativa.";
 const differences=[{n:"01",title:"Curadoria criteriosa",body:"Uma seleção alinhada ao seu momento, às suas prioridades e ao potencial de cada endereço."},{n:"02",title:"Atendimento próximo",body:"Escuta, orientação e acompanhamento em todas as etapas da sua jornada imobiliária."},{n:"03",title:"Conhecimento de mercado",body:"Informações claras e uma visão estratégica para apoiar decisões com confiança."}];
 return <div className="pn-t7-story">
 <style>{`
 .pn-t7-story{background:#f6f4ef;color:#242927;font-family:Arial,Helvetica,sans-serif}.pn-t7-story *{box-sizing:border-box}
 .pn-t7-story .eyebrow{font-size:11px;letter-spacing:.25em;text-transform:uppercase;font-weight:700;color:#797d73}
 .pn-t7-story h2,.pn-t7-story h3{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.05em}
 .pn-t7-feature{padding:110px clamp(22px,7vw,110px) 115px}
 .pn-t7-feature-top{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:35px}
 .pn-t7-feature h2{font-size:clamp(43px,5vw,78px);line-height:1.08;max-width:800px;margin:18px 0 0}
 .pn-t7-feature-image{position:relative;min-height:480px;height:min(66vw,680px);overflow:hidden;background:#d6d3ca}
 .pn-t7-feature-image img{width:100%;height:100%;object-fit:cover;display:block}
 .pn-t7-feature-image:after{content:"";position:absolute;inset:35% 0 0;background:linear-gradient(transparent,rgba(0,0,0,.62));pointer-events:none}
 .pn-t7-feature-caption{position:absolute;z-index:1;bottom:0;left:0;right:0;padding:clamp(22px,4vw,60px);color:white;display:flex;justify-content:space-between;align-items:end;gap:20px}
 .pn-t7-feature-caption h3{font-size:clamp(30px,4vw,59px);margin:10px 0}.pn-t7-feature-caption p{font-size:14px;line-height:1.6;color:#f0eee9}
 .pn-t7-feature-caption a,.pn-t7-empty a{display:inline-block;color:white;border:1px solid #ffffffb0;padding:15px 22px;text-decoration:none;font-size:12px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap}
 .pn-t7-empty{margin-top:20px;display:flex;justify-content:space-between;align-items:center;gap:20px;color:#626760;font-size:14px}.pn-t7-empty a{background:#263230;border-color:#263230}
 .pn-t7-about{background:#e9e6df;padding:130px clamp(22px,9vw,160px);display:grid;grid-template-columns:1.15fr .85fr;gap:clamp(35px,7vw,120px);align-items:end}
 .pn-t7-about h2{font-size:clamp(54px,7vw,112px);line-height:1.02;margin:25px 0 0}.pn-t7-about-copy{max-width:430px}.pn-t7-about-copy p{font-size:17px;line-height:1.9;color:#5d625d;margin:0 0 30px}
 .pn-t7-about-copy a{color:#242927;text-decoration:none;border-bottom:1px solid #242927;padding-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:.15em}
 .pn-t7-differences{background:#1c2525;color:#f5f3ec;padding:110px clamp(22px,7vw,110px);display:grid;grid-template-columns:1fr 1fr;gap:clamp(35px,7vw,110px)}
 .pn-t7-diff-visual{position:relative;min-height:600px;background:#303b3b;overflow:hidden}.pn-t7-diff-visual img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}
 .pn-t7-diff-text{display:flex;flex-direction:column;justify-content:center}.pn-t7-differences .eyebrow{color:#c4c0b4}.pn-t7-differences h2{font-size:clamp(46px,5vw,78px);line-height:1.05;margin:22px 0 45px}
 .pn-t7-diff-item{display:grid;grid-template-columns:55px 1fr;gap:20px;border-top:1px solid #ffffff40;padding:26px 0}.pn-t7-diff-item:last-child{border-bottom:1px solid #ffffff40}
 .pn-t7-diff-num{font-family:Georgia,serif;font-size:21px;color:#d6c9b2}.pn-t7-diff-item h3{font-size:26px;margin:0 0 10px;letter-spacing:-.03em}.pn-t7-diff-item p{font-size:14px;line-height:1.7;color:#d0d2cd;margin:0}
 @media(max-width:850px){.pn-t7-feature{padding:75px 22px}.pn-t7-feature-image{min-height:430px}.pn-t7-feature-caption{align-items:start;flex-direction:column}.pn-t7-about{grid-template-columns:1fr;padding:85px 26px}.pn-t7-differences{grid-template-columns:1fr;padding:75px 22px}.pn-t7-diff-visual{min-height:420px;max-height:520px}}
 @media(max-width:520px){.pn-t7-feature-top{display:block}.pn-t7-feature-image{min-height:460px}.pn-t7-feature-caption h3{font-size:32px}.pn-t7-empty{align-items:start;flex-direction:column}.pn-t7-about h2{font-size:53px}.pn-t7-diff-visual{min-height:330px}.pn-t7-diff-item{grid-template-columns:38px 1fr;gap:12px}}
 `}</style>
 <section id="empreendimentos-tp7" className="pn-t7-feature">
  <div className="pn-t7-feature-top"><div><span className="eyebrow">01 / Seleção especial</span><h2>Endereços que merecem ser descobertos.</h2></div><span className="eyebrow">{niche}</span></div>
  <div className="pn-t7-feature-image"><img src={showcasePhoto} alt={featured?.title||"Referência arquitetônica ilustrativa"} loading="lazy"/><div className="pn-t7-feature-caption"><div><span className="eyebrow" style={{color:"#f2ece1"}}>{featured?"Imóvel em destaque":"Inspiração arquitetônica"}</span><h3>{featured?.title||"O extraordinário está nos detalhes."}</h3><p>{featured?[featured.location,featured.price>0?price(featured.price):""].filter(Boolean).join(" · "):"Imóveis reais aparecerão aqui quando forem cadastrados."}</p></div><a href={featured?"#buscar-imoveis-tp7":contactHref}>{featured?"Explorar imóveis ↗":"Fale com nossa equipe ↗"}</a></div></div>
  {!featured&&<div className="pn-t7-empty"><span>Imagem ilustrativa. Nenhum imóvel anunciado sem cadastro.</span><a href="#buscar-imoveis-tp7">Consultar disponibilidade ↗</a></div>}
 </section>
 <section id="sobre-tp7" className="pn-t7-about"><div><span className="eyebrow">02 / Nossa essência</span><h2>{aboutTitle}</h2></div><div className="pn-t7-about-copy"><p>{aboutCopy}</p><a href={contactHref}>Conheça {brand} ↗</a></div></section>
 <section id="diferenciais-tp7" className="pn-t7-differences"><div className="pn-t7-diff-visual"><img src={images.find(p=>p&&p!==showcasePhoto)||"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85"} alt="Detalhes de arquitetura contemporânea" loading="lazy"/></div><div className="pn-t7-diff-text"><span className="eyebrow">03 / Por que escolher</span><h2>Uma experiência à altura dos seus planos.</h2><div>{differences.map(d=><article className="pn-t7-diff-item" key={d.n}><span className="pn-t7-diff-num">{d.n}</span><div><h3>{d.title}</h3><p>{d.body}</p></div></article>)}</div></div></section>
 </div>;
}
