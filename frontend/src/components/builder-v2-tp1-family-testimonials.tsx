"use client";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {getTP1RealReviews} from "@/lib/tp1-family-content";
import "./builder-v2-tp1-family-testimonials.css";

/** Examples are visible only in the Builder preview. Never publish fictitious reviews. */
const PREVIEW_TESTIMONIALS=[
 {name:"Exemplo 01",detail:"Depoimento fictício · prévia",quote:"O espaço é acolhedor e a proposta de atendimento valoriza cada detalhe da experiência."},
 {name:"Exemplo 02",detail:"Depoimento fictício · prévia",quote:"Gostei da ideia de receber orientações claras e atenção às minhas necessidades individuais."},
 {name:"Exemplo 03",detail:"Depoimento fictício · prévia",quote:"Um exemplo de atendimento organizado, com uma avaliação cuidadosa e explicações durante cada etapa."},
 {name:"Exemplo 04",detail:"Depoimento fictício · prévia",quote:"A proposta de bem-estar e cuidado personalizado transmite conforto e tranquilidade."},
 {name:"Exemplo 05",detail:"Depoimento fictício · prévia",quote:"O acompanhamento e a clareza das informações fazem parte da experiência que eu procuraria."}
] as const;

export function TP1FamilyTestimonials({site,publishedMode=false,model="01"}:{site:BuilderV2SiteData;publishedMode?:boolean;model?:"01"|"02"|"03"}){
 const realReviews=getTP1RealReviews(site.blocks);
 if(publishedMode&&!realReviews.length)return null;
 // Complete five cards in the preview while keeping real reviews distinct.
 const cards=publishedMode?realReviews.slice(0,5):[
  ...realReviews.slice(0,5).map(review=>({...review,illustrative:false})),
  ...PREVIEW_TESTIMONIALS.slice(0,Math.max(0,5-realReviews.length)).map(review=>({...review,illustrative:true}))
 ];
 return <section id="depoimentos" data-universal-section="depoimentos" data-pn-section-kind="testimonials" data-tp1-reviews-model={model} className="tp1-family-reviews" aria-labelledby={"tp1-reviews-title-"+model}>
  <header className="tp1-family-reviews-head">
   <span className="tp1-family-reviews-kicker">07 / DEPOIMENTOS</span>
   <h2 id={"tp1-reviews-title-"+model}>Histórias que <em>merecem ser ouvidas.</em></h2>
   <p>{publishedMode?"Experiências compartilhadas pelos nossos clientes.":realReviews.length?"Depoimentos cadastrados e exemplos ilustrativos para completar a prévia.":"Cinco exemplos demonstrativos do formato de depoimentos. Substitua por avaliações reais antes de publicar."}</p>
  </header>
  <div className="tp1-family-reviews-grid">{cards.map((review,i)=><blockquote className="tp1-family-review-card" key={review.name+"-"+i}>
   <div className="tp1-family-review-top"><span className="tp1-family-review-mark" aria-hidden="true">“</span><span className="tp1-family-review-number">0{i+1}</span></div>
   <p>“{review.quote}”</p>
   <footer>
    <span className="tp1-family-review-avatar" aria-hidden="true">{review.illustrative?String(i+1):review.name.trim().charAt(0).toLocaleUpperCase("pt-BR")}</span>
    <span><strong>{review.name}</strong><small>{review.detail}</small></span>
   </footer>
   {review.illustrative&&<span className="tp1-family-review-disclaimer">EXEMPLO FICTÍCIO · NÃO É AVALIAÇÃO REAL</span>}
  </blockquote>)}</div>
 </section>;
}
