"use client";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {getTP1RealReviews} from "@/lib/tp1-family-content";
import "./builder-v2-tp1-family-testimonials.css";
export function TP1FamilyTestimonials({site,publishedMode=false,model="01"}:{site:BuilderV2SiteData;publishedMode?:boolean;model?:"01"|"02"|"03"}){
 const reviews=getTP1RealReviews(site.blocks);
 if(!reviews.length&&publishedMode)return null;
 return <section id="depoimentos" data-universal-section="depoimentos" data-pn-section-kind="testimonials" data-tp1-reviews-model={model} className="tp1-family-reviews" aria-labelledby={"tp1-reviews-title-"+model}>
  <header className="tp1-family-reviews-head"><span className="tp1-family-reviews-kicker">07 / DEPOIMENTOS</span>
   <h2 id={"tp1-reviews-title-"+model}>Experiências <em>compartilhadas.</em></h2>
   <p>{reviews.length?"Relatos fornecidos para este site.":"Espaço preparado para avaliações reais dos clientes."}</p>
  </header>
  {reviews.length?<div className="tp1-family-reviews-grid">{reviews.map((review,i)=><blockquote className="tp1-family-review-card" key={review.name+"-"+i}>
   <span className="tp1-family-review-mark" aria-hidden="true">“</span><p>{review.quote}</p>
   <footer><span className="tp1-family-review-avatar" aria-hidden="true">{review.name.trim().charAt(0).toLocaleUpperCase("pt-BR")}</span><span><strong>{review.name}</strong>{review.detail&&<small>{review.detail}</small>}</span></footer>
  </blockquote>)}</div>:<div className="tp1-family-reviews-empty"><p>Depoimentos reais aparecerão aqui quando cadastrados. Nenhuma avaliação foi inventada.</p><a href="#contato">Conhecer o atendimento ↗</a></div>}
 </section>;
}
