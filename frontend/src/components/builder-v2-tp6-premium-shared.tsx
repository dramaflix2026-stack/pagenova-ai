"use client";
import "./builder-v2-tp6-premium-shared.css";
import type {TP6RetailAddedSection,TP6RetailVisualEdits} from "@/lib/builder-v2-tp6-edit-bridge";
export type TP6RetailReview={name:string;role:string;quote:string;photo?:string};
type ReviewBlock={id?:string;type:string;section?:string;text?:string;src?:string;forCardId?:string};
export function readTP6RealReviews(blocks:ReviewBlock[]):TP6RetailReview[]{
 return blocks.filter(b=>b.type==="paragraph"&&/depoiment|testimonial|avalia[cç][aã]o/i.test(b.section||"")).map(b=>{
  const parts=(b.text||"").split("|").map(p=>p.trim()).filter(Boolean);
  if(parts.length<3||parts[0].split(/\s+/).length<2||parts.slice(2).join(" ").length<=12||/ilustrativ|fict[ií]ci|demonstra[cç][aã]o/i.test(b.text||""))return null;
  const photo=blocks.find(p=>p.type==="image"&&p.src&&p.section===b.section&&(p.forCardId===b.id||p.id===b.id+"-photo"))?.src;
  return {name:parts[0],role:parts[1],quote:parts.slice(2).join(" | "),...(photo?{photo}:{})};
 }).filter((v):v is TP6RetailReview=>v!==null).slice(0,5);
}
const sampleReviews:TP6RetailReview[]=[
 {name:"Mariana Oliveira",role:"Buquê de aniversário",quote:"As flores combinaram com a delicadeza que imaginei para um presente especial. A composição ficou linda.",photo:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Carolina Mendes",role:"Arranjo personalizado",quote:"Gostei muito da proposta de combinar flores e cores para transformar um gesto simples em algo marcante.",photo:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Rafael Almeida",role:"Flores para celebrações",quote:"A ideia de um arranjo criado especialmente para a ocasião trouxe um toque de carinho à comemoração.",photo:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Fernanda Costa",role:"Decoração floral",quote:"A seleção de flores naturais e uma paleta suave fizeram toda a diferença na atmosfera da celebração.",photo:"https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Lucas Ferreira",role:"Presente romântico",quote:"Um buquê pensado nos detalhes é uma maneira bonita de demonstrar afeto em uma data importante.",photo:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=180&h=180&q=80"}
];
export function TP6RetailPolishStyles(){return null;}
export function TP6RetailReviewSlots({reviews=[]}:{reviews?:TP6RetailReview[]}){
 const entries=[...reviews.slice(0,5).map(v=>({...v,isDemo:false})),...sampleReviews.slice(0,Math.max(0,5-reviews.length)).map(v=>({...v,isDemo:true}))];
 return <div className="pn-t6-review-wrap" data-tp6-reviews="complete">
  <p className="pn-t6-review-disclosure">Os exemplos identificados como fictícios demonstram o design e não são avaliações reais de clientes.</p>
  <div className="pn-t6-review-slots" aria-label="Depoimentos da floricultura">
  {entries.map((r,i)=><article key={(r.isDemo?"demo":"real")+i} className="pn-t6-review-slot">
   <div className="pn-t6-review-card-top">
    {r.photo?<img className="pn-t6-review-portrait" src={r.photo} loading="lazy" alt={r.isDemo?"Fotografia editorial ilustrativa, não representa um cliente real":"Fotografia cadastrada do cliente"}/>:<span className="pn-t6-review-avatar" aria-hidden="true">{r.name.split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()}</span>}
    <div className="pn-t6-review-identity"><strong>{r.name}</strong><small>{r.role}</small></div>
   </div>
   <p className="pn-t6-review-text">“{r.quote}”</p>
   <span className="pn-t6-review-index">{r.isDemo?"EXEMPLO FICTÍCIO · NÃO É CLIENTE REAL":"RELATO CADASTRADO"}</span>
  </article>)}
  </div>
 </div>;
}

/** Apply scoped colors to the visible collection sections in each retail model. */
export function TP6RetailEditStyles({edits}:{edits?:TP6RetailVisualEdits}){
 const bg=edits?.collectionBackground,foreground=edits?.collectionHeadingColor;
 const valid=(x:unknown)=>typeof x==="string"&&/^#[0-9a-f]{6}$/i.test(x);
 if(!valid(bg)&&!valid(foreground))return null;
 const roots='.pn-t6-layout #produtos .pn-t6-collection,[data-tp6-family="retail"] #produtos.tp6m2-gallery,[data-tp6-family="retail"] #produtos.tp6m3-collections';
 const names='.pn-t6-layout #produtos .pn-t6-collection h2,.pn-t6-layout #produtos .pn-t6-collection h3,[data-tp6-family="retail"] #produtos.tp6m2-gallery h2,[data-tp6-family="retail"] #produtos.tp6m2-gallery h3,[data-tp6-family="retail"] #produtos.tp6m3-collections h2,[data-tp6-family="retail"] #produtos.tp6m3-collections h3';
 return <style data-tp6-retail-edit-style>{(valid(bg)?roots+'{background-color:'+bg+'!important;}':'')+(valid(foreground)?names+'{color:'+foreground+'!important;}':'')+(valid(bg)&&valid(foreground)?'.pn-t6-layout #produtos .pn-t6-collection .pn-t6-collection-kicker{color:'+foreground+'!important;}':'')}</style>;
}
/** New user-requested sections are real, persistent content, rendered immediately before FAQ. */
export function TP6RetailCustomSections({sections}:{sections?:TP6RetailAddedSection[]}){
 if(!sections?.length)return null;
 return <>{sections.map(section=><section key={section.id} id={section.id} className="pn-t6-added-section" style={section.background?{backgroundColor:section.background}:undefined}>
  <div className="pn-t6-added-inner">
   <span className="pn-t6-added-eyebrow">{section.name}</span>
   <h2>{section.title}</h2>
   <p className="pn-t6-added-description">{section.description}</p>
   <div className="pn-t6-added-grid">{section.cards.map((card,i)=><article key={section.id+"-"+i} className="pn-t6-added-card" style={{borderRadius:section.cardRadius??14}}>
    <span>{String(i+1).padStart(2,"0")} / {String(section.cards.length).padStart(2,"0")}</span>
    <h3>{card.title}</h3><p>{card.description}</p>
   </article>)}</div>
  </div>
 </section>)}</>;
}

export function TP6RetailLocation({address,whatsapp}:{address?:string;whatsapp?:string}){
 const digits=(whatsapp||"").replace(/\D/g,"");
 const active=digits.length>=10&&digits.length<=15;
 const supplied=!!address?.trim();
 const displayAddress=address?.trim()||"Avenida Paulista, 1000 — Bela Vista, São Paulo/SP";
 const mapSrc=supplied?"https://maps.google.com/maps?q="+encodeURIComponent(displayAddress)+"&z=15&output=embed":"https://www.openstreetmap.org/export/embed.html?bbox=-46.6550%2C-23.5680%2C-46.6400%2C-23.5560&layer=mapnik&marker=-23.5614%2C-46.6476";
 return <section className="pn-t6-location" id="localizacao" aria-labelledby="pn-t6-location-title">
 <div className="pn-t6-location-heading"><span>LOCALIZAÇÃO & CONTATO</span><h2 id="pn-t6-location-title">Venha florescer com a gente.</h2><p>Encontre as informações para conversar com a equipe e conhecer nossas coleções.</p></div>
 <iframe loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={supplied?"Mapa do endereço informado":"Mapa de endereço fictício demonstrativo"} src={mapSrc} className="pn-t6-location-map"/>
 <div className="pn-t6-location-bottom"><div><span>{supplied?"ENDEREÇO CADASTRADO":"ENDEREÇO FICTÍCIO · DEMONSTRAÇÃO"}</span><p>{displayAddress}</p>{!supplied&&<small>Localização ilustrativa. Não representa uma loja real.</small>}</div>{active?<a className="pn-t6-location-whatsapp" href={"https://wa.me/"+digits} target="_blank" rel="noopener noreferrer">Chamar no WhatsApp ↗</a>:<span className="pn-t6-location-whatsapp pn-t6-location-disabled" aria-disabled="true">WhatsApp · cadastre um número</span>}</div>
 </section>;
}
