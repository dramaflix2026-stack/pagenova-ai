"use client";
import "./builder-v2-tp6-model3-reviews-faq.css";
import {TP6PerfumePreviewReviews} from "./tp6-perfume-preview-reviews";
import {TP6RetailReviewSlots,TP6RetailCustomSections,readTP6RealReviews} from "./builder-v2-tp6-premium-shared";
import type {TP6RetailVisualEdits} from "@/lib/builder-v2-tp6-edit-bridge";
type Block={id?:string;type:string;text?:string;section?:string;layout?:string};
type Review={quote:string;name?:string};
export function BuilderV2TP6Model3ReviewsFAQ({niche,blocks,contactHref,publishedMode=false,edits}:{niche:string;blocks:Block[];contactHref?:string;publishedMode?:boolean;edits?:TP6RetailVisualEdits}){
 const reviewBlocks=blocks.filter(b=>/depoiment|testimonial|avalia[cç][aã]o/i.test(b.section||""));
 const reviews:Review[]=reviewBlocks.filter(b=>b.type==="paragraph"&&b.text?.trim()).map(b=>({quote:b.text!.trim()}));
 const faqBlocks=blocks.filter(b=>/faq|perguntas.frequentes|d[uú]vidas/i.test(b.section||"")||b.layout==="faq");
 const pairs:{q:string;a:string}[]=[];
 const isQuestion=(t:string)=>t.trim().endsWith("?")&&!/^(perguntas frequentes|faq|dúvidas frequentes)\b/i.test(t.trim());
 for(let i=0;i<faqBlocks.length;i++){
  const b=faqBlocks[i],next=faqBlocks[i+1];
  const q=(b.text||"").trim();
  if((b.type==="heading"||b.type==="paragraph")&&isQuestion(q)&&next?.type==="paragraph"&&next.text?.trim()&&!isQuestion(next.text)){
   pairs.push({q,a:next.text.trim()});
  }
 }
 const subject=niche.toLocaleLowerCase("pt-BR");
 const defaults=[
 {q:"Como encontrar as peças que combinam comigo?",a:"Explore as coleções por categoria e observe as fotos e os detalhes de cada peça para descobrir suas favoritas."},
 {q:"Posso saber mais sobre os materiais e características?",a:"Consulte a descrição de cada item. Para informações adicionais, envie sua dúvida à loja pelo canal de contato disponível."},
 {q:"Como consultar a disponibilidade de um produto?",a:"Escolha o item desejado e entre em contato com a loja para confirmar as opções disponíveis."},
 {q:"Onde posso esclarecer dúvidas antes de escolher?",a:"Use a seção Entre em Contato para falar com a equipe e obter informações sobre "+subject+"."}
 ];
 const floralQuestions=[
 {q:"Como escolher um buquê para presentear?",a:"Informe a ocasião e suas preferências para consultar as composições disponíveis."},
 {q:"Posso personalizar as cores e flores?",a:"Consulte a equipe sobre combinações, espécies e disponibilidade da estação."},
 {q:"Vocês atendem casamentos e eventos?",a:"Converse sobre sua data e o planejamento floral desejado."},
 {q:"Como funcionam entrega e retirada?",a:"Confirme regiões atendidas, horários e condições antes de finalizar o pedido."},
 {q:"É possível incluir uma mensagem no presente?",a:"Pergunte sobre cartões e personalização da encomenda."},
 {q:"Como conservar meu arranjo?",a:"Evite calor excessivo e siga as orientações de cuidado das flores."}
 ];
 const questions=niche==="Floricultura"&&pairs.length<5?floralQuestions:niche==="Perfumaria e cosméticos"&&pairs.length<4?[
 {q:"Como identificar uma fragrância adequada?",a:"Consulte as notas e famílias olfativas dos perfumes e peça orientação à equipe."},
 {q:"Quais cuidados com a pele a loja oferece?",a:"Verifique as linhas e características dos cosméticos disponíveis antes da compra."},
 {q:"Posso consultar opções de maquiagem?",a:"Confira a seleção e confirme cores, acabamentos, ingredientes e estoque com a loja."},
 {q:"Há sugestões de perfumes para presente?",a:"Converse com a equipe sobre a preferência olfativa e a disponibilidade de kits."},
 {q:"Como funcionam pagamento e entrega?",a:"Consulte diretamente os meios de pagamento, regiões atendidas e prazos vigentes."},
 {q:"Como funcionam trocas e devoluções?",a:"Confira a política informada pela loja e os direitos previstos na legislação aplicável."}
 ]:pairs.length>=2?pairs:defaults;
 return <div className="tp6m3 tp6m3-reviews-faq">
 <section className="tp6m3-reviews" id="depoimentos" aria-labelledby="tp6m3-reviews-title">
  <div className="tp6m3-section-meta"><span>06 / EXPERIÊNCIAS</span><span>DEPOIMENTOS DOS CLIENTES</span></div>
  <div className="tp6m3-reviews-heading"><h2 id="tp6m3-reviews-title">QUEM<br/>CONTA<span>.</span></h2><p>Um espaço para experiências compartilhadas por clientes, quando cadastradas pela loja.</p></div>
  {niche==="Floricultura"?<TP6RetailReviewSlots reviews={readTP6RealReviews(blocks)}/>:niche==="Perfumaria e cosméticos"&&!reviews.length?<TP6PerfumePreviewReviews publishedMode={publishedMode}/>:reviews.length?<div className="tp6m3-review-grid">{reviews.map((r,i)=><article className="tp6m3-review-card" key={i}><span className="tp6m3-review-number">0{i+1} / DEPOIMENTO</span><span className="tp6m3-review-quote" aria-hidden="true">“</span><blockquote>{r.quote}</blockquote><span className="tp6m3-review-bottom">RELATO CADASTRADO <span aria-hidden="true">↗</span></span></article>)}</div>:<TP6RetailReviewSlots/>}
 </section>
 <TP6RetailCustomSections sections={edits?.addedSections}/>
 <section className="tp6m3-faq" id="faq" aria-labelledby="tp6m3-faq-title">
  <div className="tp6m3-section-meta"><span>07 / PERGUNTAS FREQUENTES</span><span>INFORMAÇÃO SEM COMPLICAÇÃO</span></div>
  <div className="tp6m3-faq-layout"><div className="tp6m3-faq-intro"><span className="tp6m3-faq-eyebrow">PRECISA DE AJUDA?</span><h2 id="tp6m3-faq-title">PERGUNTAS<br/>FREQUENTES<span>.</span></h2><p>Encontre respostas para suas dúvidas e descubra como escolher com mais segurança.</p>{contactHref&&<a href={contactHref}>FALAR COM A LOJA <span aria-hidden="true">↗</span></a>}</div>
  <div className="tp6m3-faq-list">{questions.map((item,i)=><details key={i} className="tp6m3-faq-item"><summary><span className="tp6m3-faq-number">{String(i+1).padStart(2,"0")}</span><span className="tp6m3-faq-question">{item.q}</span><span className="tp6m3-faq-icon" aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></div>
 </section></div>;
}
