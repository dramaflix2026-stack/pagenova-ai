"use client";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {getTP1RealReviews} from "@/lib/tp1-family-content";
import "./builder-v2-tp1-family-testimonials.css";

/** Examples are visible only in the Builder preview. Never publish fictitious reviews. */
const PREVIEW_TESTIMONIALS=[
 {name:"Camila Duarte",detail:"Depoimento fictício · prévia",quote:"A proposta de um atendimento personalizado transmite cuidado desde a primeira conversa.",photo:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80"},
 {name:"Rafael Martins",detail:"Depoimento fictício · prévia",quote:"O ambiente acolhedor e a atenção aos detalhes são exatamente o que procuro em um serviço.",photo:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80"},
 {name:"Ana Ribeiro",detail:"Depoimento fictício · prévia",quote:"Ter orientações claras sobre cada etapa torna a experiência mais tranquila.",photo:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"},
 {name:"Lucas Ferreira",detail:"Depoimento fictício · prévia",quote:"Gostei da maneira como o cuidado e o conforto aparecem em cada detalhe.",photo:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"},
 {name:"Marina Costa",detail:"Depoimento fictício · prévia",quote:"O acompanhamento e a comunicação próxima fazem toda a diferença na experiência.",photo:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"}
] as const;

export function TP1FamilyTestimonials({site,publishedMode=false,model="01"}:{site:BuilderV2SiteData;publishedMode?:boolean;model?:"01"|"02"|"03"}){
 const realReviews=getTP1RealReviews(site.blocks);
 if(publishedMode&&!realReviews.length)return null;
 // Complete five cards in the preview while keeping real reviews distinct.
 const cards: Array<{name:string;detail:string;quote:string;illustrative?:boolean;photo?:string}>=publishedMode?realReviews.slice(0,5):[
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
    <span className="tp1-family-review-avatar">{review.illustrative&&review.photo?<img src={review.photo} alt="Retrato de modelo ilustrativo; não é cliente real" loading="lazy"/>:<span aria-hidden="true">{review.name.trim().charAt(0).toLocaleUpperCase("pt-BR")}</span>}</span>
    <span><strong>{review.name}</strong><small>{review.detail}</small></span>
   </footer>
   {review.illustrative&&<span className="tp1-family-review-disclaimer">EXEMPLO FICTÍCIO · NÃO É AVALIAÇÃO REAL</span>}
  </blockquote>)}</div>
 </section>;
}
