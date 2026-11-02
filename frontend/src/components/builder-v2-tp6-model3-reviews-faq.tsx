"use client";
import "./builder-v2-tp6-model3-reviews-faq.css";
type Block={id?:string;type:string;text?:string;section?:string;layout?:string};
type Review={quote:string;name?:string};
export function BuilderV2TP6Model3ReviewsFAQ({niche,blocks,contactHref}:{niche:string;blocks:Block[];contactHref?:string}){
 const reviewBlocks=blocks.filter(b=>/depoiment|testimonial|avalia[cç][aã]o/i.test(b.section||""));
 const reviews:Review[]=reviewBlocks.filter(b=>b.type==="paragraph"&&b.text?.trim()).map(b=>({quote:b.text!.trim()}));
 const faqBlocks=blocks.filter(b=>/faq|perguntas.frequentes|d[uú]vidas/i.test(b.section||"")||b.layout==="faq");
 const pairs:{q:string;a:string}[]=[];
 for(let i=0;i<faqBlocks.length;i++){const b=faqBlocks[i],next=faqBlocks[i+1];if(b.type==="heading"&&b.text?.trim()&&next?.type==="paragraph"&&next.text?.trim())pairs.push({q:b.text.trim(),a:next.text.trim()});}
 const defaults=[
 {q:"Como posso explorar os produtos?",a:"Você pode navegar pelas categorias apresentadas nesta página e consultar as informações disponíveis de cada produto."},
 {q:"Como tirar dúvidas sobre um item?",a:"Consulte o canal de atendimento informado pela loja para esclarecer características, opções e disponibilidade."},
 {q:"Onde encontro informações sobre pagamento e entrega?",a:"As formas de pagamento, os prazos e as condições de entrega precisam ser confirmados diretamente com a loja."},
 {q:"Como saber quais opções de "+niche.toLocaleLowerCase("pt-BR")+" estão disponíveis?",a:"Explore as coleções exibidas e consulte a loja para verificar o catálogo e a disponibilidade atual."}
 ];
 const questions=pairs.length?pairs:defaults;
 return <div className="tp6m3 tp6m3-reviews-faq">
 <section className="tp6m3-reviews" id="depoimentos" aria-labelledby="tp6m3-reviews-title">
  <div className="tp6m3-section-meta"><span>06 / EXPERIÊNCIAS</span><span>DEPOIMENTOS DOS CLIENTES</span></div>
  <div className="tp6m3-reviews-heading"><h2 id="tp6m3-reviews-title">QUEM<br/>CONTA<span>.</span></h2><p>Um espaço para experiências compartilhadas por clientes, quando cadastradas pela loja.</p></div>
  {reviews.length?<div className="tp6m3-review-grid">{reviews.map((r,i)=><article className="tp6m3-review-card" key={i}><span className="tp6m3-review-number">0{i+1} / DEPOIMENTO</span><span className="tp6m3-review-quote" aria-hidden="true">“</span><blockquote>{r.quote}</blockquote><span className="tp6m3-review-bottom">RELATO CADASTRADO <span aria-hidden="true">↗</span></span></article>)}</div>:<div className="tp6m3-reviews-empty"><span className="tp6m3-review-quote" aria-hidden="true">“</span><div><h3>Histórias reais merecem espaço.</h3><p>Os depoimentos aparecerão aqui quando a loja cadastrar avaliações autênticas de clientes.</p></div><span>AGUARDANDO DEPOIMENTOS</span></div>}
 </section>
 <section className="tp6m3-faq" id="faq" aria-labelledby="tp6m3-faq-title">
  <div className="tp6m3-section-meta"><span>07 / PERGUNTAS FREQUENTES</span><span>INFORMAÇÃO SEM COMPLICAÇÃO</span></div>
  <div className="tp6m3-faq-layout"><div className="tp6m3-faq-intro"><span className="tp6m3-faq-eyebrow">PRECISA DE AJUDA?</span><h2 id="tp6m3-faq-title">PERGUNTAS<br/>FREQUENTES<span>.</span></h2><p>Encontre orientações gerais sobre a experiência de explorar a seleção.</p>{contactHref&&<a href={contactHref}>FALAR COM A LOJA <span aria-hidden="true">↗</span></a>}</div>
  <div className="tp6m3-faq-list">{questions.map((item,i)=><details key={i} className="tp6m3-faq-item"><summary><span className="tp6m3-faq-number">{String(i+1).padStart(2,"0")}</span><span className="tp6m3-faq-question">{item.q}</span><span className="tp6m3-faq-icon" aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></div>
 </section></div>;
}
