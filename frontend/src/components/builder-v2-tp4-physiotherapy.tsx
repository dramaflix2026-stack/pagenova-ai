"use client";
import {useState} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {UniversalTemplateSections} from "./builder-v2-universal-sections";
import "./builder-v2-tp4-physiotherapy.css";

export type PhysioVariant="01"|"02"|"03";

/** Pexels originals showing physiotherapy, rehabilitation and actual clinical work.
 * Each template uses independent photo slots; never use unrelated gym or dental imagery.
 * Sources: https://www.pexels.com/license/
 */
export const TP4_PHYSIO_IMAGE_IDS=[
 "20860594","31234755","29807423","20860624","20860590",
 "20860580","20860616","20860593","20860618","20860584",
 "20860582","27730554","14797757","5793695","7942574"
] as const;
const photo=(index:number)=>"https://images.pexels.com/photos/"+TP4_PHYSIO_IMAGE_IDS[index]+"/pexels-photo-"+TP4_PHYSIO_IMAGE_IDS[index]+".jpeg?auto=compress&cs=tinysrgb&w=1600";
const services=[
 {name:"Avaliação fisioterapêutica",description:"Um primeiro encontro para compreender necessidades, objetivos e possibilidades de cuidado."},
 {name:"Reabilitação funcional",description:"Acompanhamento de mobilidade e atividades funcionais, conforme avaliação individual."},
 {name:"Terapia pelo movimento",description:"Exercícios terapêuticos e orientações ajustados à realidade de cada pessoa."},
 {name:"Prevenção e orientação",description:"Educação em saúde, postura e hábitos de movimento com orientação profissional."}
];
const steps=[
 ["01","Primeira conversa","Entenda o atendimento e compartilhe suas necessidades."],
 ["02","Avaliação individual","O profissional avalia sua condição e orienta a conduta."],
 ["03","Plano de acompanhamento","As etapas são definidas conforme a avaliação e os objetivos."],
 ["04","Acompanhamento contínuo","As orientações são revistas de acordo com a evolução clínica."]
] as const;
const demoReviews=[
 {name:"Mariana Oliveira",portrait:"774909",text:"Gostei da apresentação sobre as etapas de avaliação e do cuidado em explicar as possibilidades de reabilitação."},
 {name:"Rafael Martins",portrait:"614810",text:"As informações sobre movimento e acompanhamento estão organizadas de forma clara."},
 {name:"Camila Rodrigues",portrait:"415829",text:"Consegui entender melhor o que perguntar sobre fisioterapia e exercícios terapêuticos."},
 {name:"Lucas Ferreira",portrait:"220453",text:"O passo a passo para conhecer o atendimento e tirar dúvidas é fácil de acompanhar."},
 {name:"Beatriz Almeida",portrait:"1239291",text:"A página apresenta os serviços de fisioterapia de maneira acolhedora e objetiva."}
];
const faqs=[
 ["Preciso de avaliação antes do tratamento?","O atendimento costuma começar com uma avaliação para entender as necessidades e orientar as próximas etapas."],
 ["Quais condições podem ser acompanhadas?","A indicação depende de avaliação profissional. Entre em contato para consultar as modalidades oferecidas."],
 ["Como funcionam as sessões?","A duração, os métodos e a frequência são definidos pela equipe conforme a avaliação individual."],
 ["Como posso agendar uma avaliação?","Entre em contato pelo WhatsApp ou pelos canais oficiais disponibilizados pela clínica."],
 ["Vocês atendem por convênio?","Consulte diretamente a clínica para confirmar convênios, formas de pagamento e disponibilidade."]
] as const;
const pick=(site:BuilderV2SiteData,section:string,type:"heading"|"paragraph")=>site.blocks.find(b=>b.type===type&&(b.section||"").toLowerCase().includes(section)&&b.text?.trim())?.text?.trim();
const digits=(value?:string)=>value?.replace(/\D/g,"")||"";
const approvedReviews=(site:BuilderV2SiteData)=>site.blocks.filter(b=>b.type==="paragraph"&&/depoiment|testimonial|avaliac|relato/i.test(b.section||"")).map(b=>{
 const segments=(b.text||"").split(/\s*\|\s*/).map(x=>x.trim());
 const name=segments[0]||"",text=segments.slice(2).join(" | ");
 const portrait=site.blocks.find(x=>x.type==="image"&&x.section===b.section&&x.forCardId===b.id&&x.userUploaded)?.src;
 return {name,text,portrait};
}).filter(r=>r.name.length>2&&r.text.length>16);
function Portrait({name,src,example=false}:{name:string;src?:string;example?:boolean}){
 return src?<img src={src} loading="lazy" alt={example?"Retrato de banco de imagens, exemplo fictício":"Imagem enviada para o depoimento de "+name}/>:<span className="pn-physio-avatar-letter" aria-label={"Inicial de "+name}>{name[0]}</span>;
}
export function BuilderV2TP4Physiotherapy({site,variant,publishedMode=false}:{site:BuilderV2SiteData;variant:PhysioVariant;publishedMode?:boolean}){
 const [openFaq,setOpenFaq]=useState<number|null>(0);
 const brand=site.header?.brand||site.title||"Clínica de Fisioterapia";
 const mainTitle=pick(site,"inicio","heading")||"Movimento com atenção a cada etapa.";
 const intro=pick(site,"inicio","paragraph")||"Um espaço para compreender seu movimento e conhecer opções de acompanhamento fisioterapêutico.";
 const phone=digits(site.footer?.whatsapp);
 const whatsappHref=phone.length>=10&&phone.length<=13?"https://wa.me/"+(phone.startsWith("55")?phone:"55"+phone):"";
 const email=site.footer?.email?.trim()||"";
 const realAddress=site.footer?.address?.trim()||"";
 const demoAddress="Avenida Paulista, 1000 — São Paulo, SP";
 const address=realAddress||(!publishedMode?demoAddress:"");
 const mapSearch=realAddress||(!publishedMode?"Avenida Paulista, 1000, São Paulo, SP, Brasil":"");
 const verified=approvedReviews(site);
 const examples=!publishedMode&&!verified.length;
 const reviews=examples?demoReviews.map(r=>({...r,portrait:"https://images.pexels.com/photos/"+r.portrait+"/pexels-photo-"+r.portrait+".jpeg?auto=compress&cs=tinysrgb&w=250"})):verified;
 const cover=variant==="01"?0:variant==="02"?2:1;
 const secondary=variant==="01"?5:variant==="02"?3:12;
 const tertiary=variant==="01"?13:variant==="02"?14:11;
 const gallery=variant==="01"?[3,4,6,7,8,10]:variant==="02"?[9,5,11,12,13,14]:[0,4,6,8,9,10];
 const contactHref=whatsappHref||"#pn-physio-contact";
 const contactLabel=whatsappHref?"Conversar no WhatsApp":"Conhecer contato";
 return <main className={"pn-physio pn-physio--"+variant} data-tp4-family="saude-integrada" data-tp4-specialty="physiotherapy" data-tp4-model={variant}>
  <header className="pn-physio-header"><a href="#pn-physio-start" className="pn-physio-brand">{brand}</a><nav aria-label="Navegação principal"><a href="#pn-physio-services">Tratamentos</a><a href="#pn-physio-process">Como funciona</a><a href="#pn-physio-contact">Contato</a></nav><a className="pn-physio-header-cta" href="#pn-physio-contact">Agendar avaliação <span>↗</span></a></header>
  <UniversalTemplateSections site={site}>
   {variant==="01"?<section data-universal-section="inicio" id="pn-physio-start" className="pn-physio-hero pn-physio-hero-editorial"><div className="pn-physio-hero-copy"><span className="pn-physio-kicker">FISIOTERAPIA • CUIDADO INDIVIDUAL</span><h1>{mainTitle}</h1><p>{intro}</p><a className="pn-physio-primary" href="#pn-physio-contact">Conheça nosso atendimento <span>↗</span></a><div className="pn-physio-small-note"><span className="pn-physio-dot"/> Movimento e cuidado no seu ritmo</div></div><div className="pn-physio-hero-media"><img src={photo(cover)} alt="Fisioterapeuta orientando paciente em uma clínica de reabilitação"/><div className="pn-physio-hero-float"><span>01 — 03</span><strong>O cuidado começa por ouvir.</strong></div></div></section>:
   variant==="02"?<section data-universal-section="inicio" id="pn-physio-start" className="pn-physio-hero pn-physio-hero-digital"><div className="pn-physio-orbit" aria-hidden="true"/><div className="pn-physio-hero-copy"><span className="pn-physio-kicker">REABILITAÇÃO • MOVIMENTO • EVOLUÇÃO</span><h1>{mainTitle}</h1><p>{intro}</p><a className="pn-physio-primary" href="#pn-physio-contact">Conheça nosso atendimento <span>↗</span></a><div className="pn-physio-signal">CUIDADO EM MOVIMENTO <span>●</span></div></div><div className="pn-physio-hero-media"><img src={photo(cover)} alt="Equipe de fisioterapia realizando atendimento em clínica moderna"/><div className="pn-physio-frame-number">02 / MOVIMENTO</div></div></section>:
   <section data-universal-section="inicio" id="pn-physio-start" className="pn-physio-hero pn-physio-hero-art"><span className="pn-physio-kicker">SAÚDE FUNCIONAL / ATENDIMENTO PERSONALIZADO</span><h1>{mainTitle}</h1><div className="pn-physio-art-collage"><div className="pn-physio-art-large"><img src={photo(cover)} alt="Atendimento fisioterapêutico com profissional e paciente"/></div><div className="pn-physio-art-small"><img src={photo(secondary)} alt="Fisioterapeuta em atividade de reabilitação"/></div><div className="pn-physio-art-stamp" aria-hidden="true">MOVIMENTO<br/>+ CUIDADO</div></div><div className="pn-physio-art-intro"><p>{intro}</p><a className="pn-physio-primary" href="#pn-physio-contact">Comece uma conversa <span>↗</span></a></div></section>}
   <section data-universal-section="sobre" className="pn-physio-section pn-physio-about"><div className="pn-physio-about-images"><img src={photo(secondary)} loading="lazy" alt="Cena ilustrativa de assistência fisioterapêutica"/><img src={photo(tertiary)} loading="lazy" alt="Espaço e atendimento de fisioterapia ilustrativos"/></div><div className="pn-physio-about-text"><span className="pn-physio-kicker">01 / NOSSA ESSÊNCIA</span><h2>{pick(site,"sobre","heading")||"Mais presença em cada movimento."}</h2><p>{pick(site,"sobre","paragraph")||"Cada história e cada necessidade pedem escuta, avaliação cuidadosa e uma orientação personalizada. Aqui você encontra informações claras sobre como iniciar seu acompanhamento."}</p><div className="pn-physio-mini-feature"><span>✳</span><p>Um caminho construído a partir da sua avaliação individual.</p></div></div></section>
   <section data-universal-section="servicos" id="pn-physio-services" className="pn-physio-section pn-physio-services"><div className="pn-physio-heading"><span className="pn-physio-kicker">02 / FISIOTERAPIA</span><h2>Possibilidades de <em>cuidado e movimento.</em></h2><p>Os atendimentos e técnicas disponíveis devem ser confirmados com a clínica.</p></div><div className="pn-physio-service-grid">{services.map((s,i)=><article className="pn-physio-service" key={s.name}><span className="pn-physio-service-index">0{i+1}</span><div className="pn-physio-service-graphic" aria-hidden="true"><span>✳</span></div><h3>{s.name}</h3><p>{s.description}</p><a href="#pn-physio-contact" aria-label={"Informações sobre "+s.name}>Saiba mais ↗</a></article>)}</div></section>
   <section data-universal-section="diferenciais" className="pn-physio-section pn-physio-values"><div><span className="pn-physio-kicker">03 / NOSSA FORMA DE CUIDAR</span><h2>O essencial é olhar para a pessoa.</h2></div><div className="pn-physio-values-grid">{["Escuta e acolhimento","Avaliação individual","Orientações acessíveis","Acompanhamento responsável"].map((item,i)=><div key={item}><span>0{i+1}</span><h3>{item}</h3></div>)}</div></section>
   <section data-universal-section="processo" id="pn-physio-process" className="pn-physio-section pn-physio-process"><div className="pn-physio-heading"><span className="pn-physio-kicker">04 / COMO FUNCIONA</span><h2>Uma jornada de atendimento com clareza.</h2></div><div className="pn-physio-process-grid">{steps.map(([number,title,desc])=><article key={number}><span>{number}</span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
   <section data-universal-section="galeria" className="pn-physio-section pn-physio-gallery"><div className="pn-physio-heading"><span className="pn-physio-kicker">05 / NOSSO UNIVERSO</span><h2>Um olhar sobre o cuidado em movimento.</h2><p>Imagens editoriais ilustrativas — não representam necessariamente a estrutura real da clínica.</p></div><div className="pn-physio-gallery-grid">{gallery.map((id,i)=><figure key={id}><img src={photo(id)} alt={"Fotografia editorial de fisioterapia e reabilitação — "+(i+1)} loading="lazy"/><figcaption>{["Reabilitação","Atenção individual","Terapia pelo movimento","Cuidado funcional","Orientação profissional","Ambiente de atenção"][i]}</figcaption></figure>)}</div></section>
   <section data-universal-section="equipe" className="pn-physio-section pn-physio-team"><div><span className="pn-physio-kicker">06 / EQUIPE</span><h2>O cuidado tem pessoas por trás.</h2><p>Cadastre os nomes, as fotos e os registros profissionais reais da equipe antes de publicar essas informações.</p><a className="pn-physio-outline" href="#pn-physio-contact">Conheça nosso atendimento ↗</a></div><div><img src={photo(14)} alt="Imagem ilustrativa de profissional em sala de fisioterapia" loading="lazy"/><span className="pn-physio-image-label">IMAGEM EDITORIAL ILUSTRATIVA</span></div></section>
   <section data-universal-section="numeros" className="pn-physio-section pn-physio-proof"><span className="pn-physio-kicker">07 / TRANSPARÊNCIA</span><h2>Compromissos, não promessas.</h2><div>{["Informações claras","Atendimento individualizado","Condutas orientadas por avaliação"].map((v,i)=><article key={v}><span>0{i+1}</span><h3>{v}</h3></article>)}</div><p>Números de pacientes, índices de melhora e resultados só devem ser publicados quando forem reais e verificáveis.</p></section>
   <section data-universal-section="depoimentos" className="pn-physio-section pn-physio-reviews"><div className="pn-physio-heading"><span className="pn-physio-kicker">08 / EXPERIÊNCIAS</span><h2>Histórias e experiências.</h2></div>{examples&&<p className="pn-physio-demo-warning">EXEMPLOS FICTÍCIOS PARA EDIÇÃO — As fotos, nomes e relatos abaixo são apenas demonstrações de layout; não representam pacientes nem avaliações reais.</p>}{reviews.length?<div className="pn-physio-review-grid">{reviews.slice(0,5).map((r,i)=><article key={i}><div className="pn-physio-review-head"><Portrait name={r.name} src={r.portrait} example={examples}/><strong>{r.name}</strong></div><p>“{r.text}”</p>{examples&&<small>EXEMPLO FICTÍCIO</small>}</article>)}</div>:<p className="pn-physio-empty">Este espaço poderá exibir avaliações fornecidas pela clínica quando estiverem disponíveis.</p>}</section>
   <section data-universal-section="faq" className="pn-physio-section pn-physio-faq"><div><span className="pn-physio-kicker">09 / DÚVIDAS FREQUENTES</span><h2>Respostas que ajudam você a começar.</h2><img src={photo(8)} loading="lazy" alt="Fisioterapeuta orientando exercício em ambiente de reabilitação"/></div><div>{faqs.map(([question,answer],i)=><div key={question} className="pn-physio-faq-item"><button type="button" aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}>{question}<span>{openFaq===i?"−":"+"}</span></button>{openFaq===i&&<p>{answer}</p>}</div>)}</div></section>
   <section data-universal-section="contato" className="pn-physio-section pn-physio-contact" id="pn-physio-contact"><div><span className="pn-physio-kicker">10 / PRÓXIMO PASSO</span><h2>Seu próximo movimento começa com uma conversa.</h2><p>Entre em contato para conhecer os atendimentos disponíveis e consultar horários.</p>{whatsappHref&&<a className="pn-physio-primary" href={whatsappHref} target="_blank" rel="noopener noreferrer">Falar no WhatsApp ↗</a>}{!whatsappHref&&email&&<a className="pn-physio-primary" href={"mailto:"+email}>Enviar e-mail ↗</a>}{!whatsappHref&&!email&&<p className="pn-physio-contact-placeholder">Cadastre um WhatsApp ou e-mail oficial para ativar o contato.</p>}{address&&<address>{address}{!realAddress&&<small>ENDEREÇO FICTÍCIO / EDITÁVEL</small>}</address>}</div><div className="pn-physio-map">{mapSearch?<iframe title={realAddress?"Mapa da clínica":"Mapa demonstrativo, endereço fictício"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={"https://www.google.com/maps?q="+encodeURIComponent(mapSearch)+"&output=embed"}/>:<div className="pn-physio-map-unconfigured">Localização disponível após cadastro de endereço real.</div>}</div></section>
  </UniversalTemplateSections>
  <footer className="pn-physio-footer"><div className="pn-physio-footer-head"><span>FISIOTERAPIA / MOVIMENTO / CUIDADO</span><a href="#pn-physio-start">Voltar ao início ↑</a></div><div className="pn-physio-footer-title">{brand}</div><div className="pn-physio-footer-base"><span>Apresentação institucional · Conteúdo sujeito à confirmação pela clínica.</span><div>{email&&<a href={"mailto:"+email}>{email}</a>}{whatsappHref&&<a href={whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}</div></div></footer>
 </main>;
}
