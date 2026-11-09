"use client";
import "./builder-v2-tp6-premium-shared.css";
export type TP6RetailReview={name:string;role?:string;quote:string};
type ReviewBlock={type:string;section?:string;text?:string};
export function readTP6RealReviews(blocks:ReviewBlock[]):TP6RetailReview[]{
 return blocks.filter(b=>b.type==="paragraph"&&/depoiment|testimonial|avalia[cç][aã]o/i.test(b.section||"")).map(b=>{
  const parts=(b.text||"").split("|").map(p=>p.trim()).filter(Boolean);
  return parts.length>=3&&parts[0].length>1&&parts.slice(2).join(" ").length>12&&!/ilustrativ|fict[ií]ci|demonstra[cç][aã]o/i.test(b.text||"")?{name:parts[0],role:parts[1],quote:parts.slice(2).join(" | ")}:null;
 }).filter((item):item is TP6RetailReview=>item!==null).slice(0,5);
}
export function TP6RetailPolishStyles(){return null;}
export function TP6RetailReviewSlots({reviews=[]}:{reviews?:TP6RetailReview[]}){
 return <div className="pn-t6-review-slots" aria-label="Área de depoimentos">
 {reviews.length?reviews.map((review,i)=><article className="pn-t6-review-slot" key={review.name+"-"+i}><span className="pn-t6-review-index">{String(i+1).padStart(2,"0")} / EXPERIÊNCIA</span><p className="pn-t6-review-text">“{review.quote}”</p><strong>{review.name}</strong>{review.role&&<small>{review.role}</small>}</article>):Array.from({length:5},(_,i)=><article key={i} className="pn-t6-review-slot pn-t6-review-pending"><span className="pn-t6-review-index">{String(i+1).padStart(2,"0")} / DEPOIMENTO</span><span className="pn-t6-review-star" aria-hidden="true">✦</span><strong>Aguardando avaliação real</strong><p>Espaço preparado para o relato de um cliente, após cadastro.</p></article>)}
 </div>;
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
