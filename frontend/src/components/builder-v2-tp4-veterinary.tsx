"use client";
import {useState} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";
import {UniversalTemplateSections} from "./builder-v2-universal-sections";
import "./builder-v2-tp4-veterinary.css";

export type VetVariant="01"|"02"|"03";

/** Curated real Pexels photographs of veterinarians examining dogs and cats.
 * Three distinct visual variants use independent media slots; never use human medical imagery.
 * Sources: https://www.pexels.com/license/
 */
export const TP4_VETERINARY_IMAGE_IDS=[
 "6235650","6816859","6234618","28644631","6235228",
 "6816869","7469233","7470754","6235226","6604130",
 "6235244","6235240","6816851","7469216","33202416"
] as const;
const photo=(index:number)=>"https://images.pexels.com/photos/"+TP4_VETERINARY_IMAGE_IDS[index]+"/pexels-photo-"+TP4_VETERINARY_IMAGE_IDS[index]+".jpeg?auto=compress&cs=tinysrgb&w=1600";
const services=[
 {name:"Consultas veterinárias",description:"Avaliação clínica individualizada para cães e gatos, com orientações claras aos tutores."},
 {name:"Vacinação preventiva",description:"Orientação sobre proteção e protocolos de imunização conforme avaliação veterinária."},
 {name:"Exames clínicos",description:"Investigação e acompanhamento da saúde do pet de acordo com a indicação profissional."},
 {name:"Check-ups",description:"Avaliações periódicas para acompanhar o bem-estar e a saúde em cada fase da vida."},
 {name:"Cuidados preventivos",description:"Acompanhamento contínuo com orientações individualizadas para cães e gatos."},
 {name:"Orientação nutricional",description:"Recomendações alimentares ajustadas às necessidades e à condição de cada animal."}
];
const steps=[
 ["01","Primeiro contato","Fale com a clínica e conte o que seu cão ou gato precisa."],
 ["02","Avaliação veterinária","O médico-veterinário examina seu pet e orienta os próximos cuidados."],
 ["03","Plano de cuidados","Receba orientações sobre exames, vacinação ou acompanhamento quando indicados."],
 ["04","Acompanhamento","Mantenha os cuidados preventivos conforme a orientação profissional."]
] as const;
const demoReviews=[
 {name:"Mariana Oliveira",portrait:"774909",text:"O site explicou de forma clara como funcionam as consultas e os cuidados com meu cachorro."},
 {name:"Rafael Martins",portrait:"614810",text:"Achei fácil entender as opções de vacinação e acompanhamento veterinário."},
 {name:"Camila Rodrigues",portrait:"415829",text:"Gostei das orientações apresentadas para quem precisa cuidar da saúde dos gatos."},
 {name:"Lucas Ferreira",portrait:"220453",text:"Os serviços e as etapas para marcar uma consulta estão bem organizados."},
 {name:"Beatriz Almeida",portrait:"1239291",text:"A apresentação transmite carinho pelos animais e atenção aos tutores."},
 {name:"André Costa",portrait:"771742",text:"O conteúdo ajuda a preparar as perguntas antes da primeira consulta do pet."}
];
const faqs=[
 ["Quais animais a clínica atende?","O site apresenta atendimento para cães e gatos; confirme diretamente eventuais necessidades especiais."],
 ["Como agendar uma consulta veterinária?","Use os canais de contato cadastrados para consultar horários e disponibilidade."],
 ["Quais vacinas meu pet precisa?","O protocolo depende de espécie, idade, histórico e avaliação veterinária."],
 ["A clínica realiza exames?","Consulte a disponibilidade de exames e diagnósticos diretamente com a equipe."],
 ["Como funciona o acompanhamento preventivo?","O médico-veterinário orienta consultas periódicas e outros cuidados conforme cada animal."],
 ["Existe atendimento de emergência?","Entre em contato com a clínica para confirmar serviços de urgência e horários. Não presuma atendimento 24 horas."]
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
 return src?<img src={src} loading="lazy" alt={example?"Retrato de banco de imagens, exemplo fictício":"Imagem enviada para o depoimento de "+name}/>:<span className="pn-vet-avatar-letter" aria-label={"Inicial de "+name}>{name[0]}</span>;
}
export function BuilderV2TP4Veterinary({site,variant,publishedMode=false}:{site:BuilderV2SiteData;variant:VetVariant;publishedMode?:boolean}){
 const [openFaq,setOpenFaq]=useState<number|null>(0);
 const brand=site.header?.brand||site.title||"Clínica Veterinária";
 const mainTitle=pick(site,"inicio","heading")||"Cuidado veterinário com carinho em cada detalhe.";
 const intro=pick(site,"inicio","paragraph")||"Um espaço para cuidar da saúde de cães e gatos, com prevenção, acompanhamento e atenção aos tutores.";
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
 const gallery=variant==="01"?[3,4,6,7,8,10]:variant==="02"?[9,5,11,12,13,10]:[0,4,6,8,9,10];
 const contactHref=whatsappHref||"#pn-vet-contact";
 const contactLabel=whatsappHref?"Conversar no WhatsApp":"Conhecer contato";
 return <main className={"pn-vet pn-vet--"+variant} data-tp4-family="saude-integrada" data-tp4-specialty="veterinary" data-tp4-model={variant}>
  <header className="pn-vet-header"><a href="#pn-vet-start" className="pn-vet-brand">{brand}</a><nav aria-label="Navegação principal"><a href="#pn-vet-services">Serviços</a><a href="#pn-vet-process">Como funciona</a><a href="#pn-vet-contact">Contato</a></nav><a className="pn-vet-header-cta" href="#pn-vet-contact">Agendar consulta <span>↗</span></a></header>
  <UniversalTemplateSections site={site}>
   {variant==="01"?<section data-universal-section="inicio" id="pn-vet-start" className="pn-vet-hero pn-vet-hero-editorial"><div className="pn-vet-hero-copy"><span className="pn-vet-kicker">MEDICINA VETERINÁRIA • CUIDADO ANIMAL</span><h1>{mainTitle}</h1><p>{intro}</p><a className="pn-vet-primary" href="#pn-vet-contact">Conheça nosso atendimento <span>↗</span></a><div className="pn-vet-small-note"><span className="pn-vet-dot"/> Atenção para cada pata, bigode e história</div></div><div className="pn-vet-hero-media"><img src={photo(cover)} alt="Médico-veterinário atendendo um animal na clínica"/><div className="pn-vet-hero-float"><span>01 — 03</span><strong>O cuidado começa por ouvir.</strong></div></div></section>:
   variant==="02"?<section data-universal-section="inicio" id="pn-vet-start" className="pn-vet-hero pn-vet-hero-digital"><div className="pn-vet-orbit" aria-hidden="true"/><div className="pn-vet-hero-copy"><span className="pn-vet-kicker">SAÚDE ANIMAL • PREVENÇÃO • BEM-ESTAR</span><h1>{mainTitle}</h1><p>{intro}</p><a className="pn-vet-primary" href="#pn-vet-contact">Conheça nosso atendimento <span>↗</span></a><div className="pn-vet-signal">CUIDADO QUE ACOLHE <span>●</span></div></div><div className="pn-vet-hero-media"><img src={photo(cover)} alt="Veterinário realizando atendimento clínico em cão"/><div className="pn-vet-frame-number">02 / SAÚDE ANIMAL</div></div></section>:
   <section data-universal-section="inicio" id="pn-vet-start" className="pn-vet-hero pn-vet-hero-art"><span className="pn-vet-kicker">MEDICINA VETERINÁRIA / ATENDIMENTO ACOLHEDOR</span><h1>{mainTitle}</h1><div className="pn-vet-art-collage"><div className="pn-vet-art-large"><img src={photo(cover)} alt="Atendimento veterinário realizado em um pet"/></div><div className="pn-vet-art-small"><img src={photo(secondary)} alt="Profissional veterinário examinando cão ou gato"/></div><div className="pn-vet-art-stamp" aria-hidden="true">CARINHO<br/>+ CUIDADO</div></div><div className="pn-vet-art-intro"><p>{intro}</p><a className="pn-vet-primary" href="#pn-vet-contact">Comece uma conversa <span>↗</span></a></div></section>}
   <section data-universal-section="sobre" className="pn-vet-section pn-vet-about"><div className="pn-vet-about-images"><img src={photo(secondary)} loading="lazy" alt="Cena ilustrativa de atendimento veterinário"/><img src={photo(tertiary)} loading="lazy" alt="Cuidado clínico com cães e gatos"/></div><div className="pn-vet-about-text"><span className="pn-vet-kicker">01 / NOSSA ESSÊNCIA</span><h2>{pick(site,"sobre","heading")||"Mais carinho em cada cuidado."}</h2><p>{pick(site,"sobre","paragraph")||"Cada animal tem suas necessidades. Nosso cuidado começa pela escuta do tutor e pela avaliação veterinária, com orientações claras para o bem-estar do pet."}</p><div className="pn-vet-mini-feature"><span>✳</span><p>Cuidado responsável para cães, gatos e seus tutores.</p></div></div></section>
   <section data-universal-section="servicos" id="pn-vet-services" className="pn-vet-section pn-vet-services"><div className="pn-vet-heading"><span className="pn-vet-kicker">02 / SERVIÇOS VETERINÁRIOS</span><h2>Proteção, carinho e <em>saúde animal.</em></h2><p>Os atendimentos e técnicas disponíveis devem ser confirmados com a clínica.</p></div><div className="pn-vet-service-grid">{services.map((s,i)=><article className="pn-vet-service" key={s.name}><span className="pn-vet-service-index">0{i+1}</span><div className="pn-vet-service-graphic" aria-hidden="true"><span>✳</span></div><h3>{s.name}</h3><p>{s.description}</p><a href="#pn-vet-contact" aria-label={"Informações sobre "+s.name}>Saiba mais ↗</a></article>)}</div></section>
   <section data-universal-section="diferenciais" className="pn-vet-section pn-vet-values"><div><span className="pn-vet-kicker">03 / NOSSA FORMA DE CUIDAR</span><h2>O essencial é cuidar de cada animal.</h2></div><div className="pn-vet-values-grid">{["Escuta dos tutores","Avaliação veterinária","Orientações preventivas","Bem-estar animal"].map((item,i)=><div key={item}><span>0{i+1}</span><h3>{item}</h3></div>)}</div></section>
   <section data-universal-section="processo" id="pn-vet-process" className="pn-vet-section pn-vet-process"><div className="pn-vet-heading"><span className="pn-vet-kicker">04 / COMO FUNCIONA</span><h2>Uma jornada de atendimento com clareza.</h2></div><div className="pn-vet-process-grid">{steps.map(([number,title,desc])=><article key={number}><span>{number}</span><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
   <section data-universal-section="galeria" className="pn-vet-section pn-vet-gallery"><div className="pn-vet-heading"><span className="pn-vet-kicker">05 / NOSSO UNIVERSO</span><h2>Momentos de cuidado com cães e gatos.</h2><p>Fotografias editoriais reais de atendimento veterinário; não representam necessariamente a clínica cadastrada.</p></div><div className="pn-vet-gallery-grid">{gallery.map((id,i)=><figure key={id}><img src={photo(id)} alt={"Fotografia editorial de atendimento veterinário — "+(i+1)} loading="lazy"/><figcaption>{["Consultas","Atenção a cães e gatos","Vacinação","Cuidados preventivos","Equipe veterinária","Bem-estar animal"][i]}</figcaption></figure>)}</div></section>
   <section data-universal-section="equipe" className="pn-vet-section pn-vet-team"><div><span className="pn-vet-kicker">06 / EQUIPE</span><h2>O cuidado tem pessoas por trás.</h2><p>Cadastre os nomes, as fotos e os registros profissionais reais da equipe antes de publicar essas informações.</p><a className="pn-vet-outline" href="#pn-vet-contact">Conheça nosso atendimento ↗</a></div><div><img src={photo(variant==="02"?0:14)} alt="Profissional veterinário em atendimento ilustrativo" loading="lazy"/><span className="pn-vet-image-label">IMAGEM EDITORIAL ILUSTRATIVA</span></div></section>
   <section data-universal-section="numeros" className="pn-vet-section pn-vet-proof"><span className="pn-vet-kicker">07 / TRANSPARÊNCIA</span><h2>Cuidado responsável, sem promessas.</h2><div>{[
    {title:"Informações claras",description:"Serviços, etapas do atendimento e orientações apresentados com transparência."},
    {title:"Cuidado individualizado",description:"Atenção à história e às necessidades específicas de cada cão ou gato."},
    {title:"Orientações baseadas em avaliação",description:"Próximos cuidados explicados com base na avaliação veterinária."}
   ].map((item,i)=><article key={item.title}><div className="pn-vet-proof-card-top"><span className="pn-vet-proof-index">0{i+1} / 03</span><span className="pn-vet-proof-ornament" aria-hidden="true">✳</span></div><h3>{item.title}</h3><p className="pn-vet-proof-description">{item.description}</p></article>)}</div><p>Números de animais atendidos, avaliações e resultados só devem ser publicados quando forem reais e verificáveis.</p></section>
   <section data-universal-section="depoimentos" className="pn-vet-section pn-vet-reviews"><div className="pn-vet-heading"><span className="pn-vet-kicker">08 / EXPERIÊNCIAS</span><h2>Experiências de tutores.</h2></div>{examples&&<p className="pn-vet-demo-warning">EXEMPLOS FICTÍCIOS PARA EDIÇÃO — As fotos, nomes e relatos abaixo são apenas demonstrações de layout; não representam tutores nem avaliações reais.</p>}{reviews.length?<div className="pn-vet-review-grid">{reviews.slice(0,6).map((r,i)=><article key={i}><div className="pn-vet-review-head"><Portrait name={r.name} src={r.portrait} example={examples}/><strong>{r.name}</strong></div><p>“{r.text}”</p>{examples&&<small>EXEMPLO FICTÍCIO</small>}</article>)}</div>:<p className="pn-vet-empty">Este espaço poderá exibir avaliações autorizadas por tutores quando estiverem disponíveis.</p>}</section>
   <section data-universal-section="faq" className="pn-vet-section pn-vet-faq"><div><span className="pn-vet-kicker">09 / DÚVIDAS FREQUENTES</span><h2>Respostas que ajudam você a começar.</h2><img src={photo(variant==="01"?9:variant==="02"?8:13)} loading="lazy" alt="Veterinário cuidando de um cão ou gato em ambiente clínico"/></div><div>{faqs.map(([question,answer],i)=><div key={question} className="pn-vet-faq-item"><button type="button" aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}>{question}<span>{openFaq===i?"−":"+"}</span></button>{openFaq===i&&<p>{answer}</p>}</div>)}</div></section>
   <section data-universal-section="contato" className="pn-vet-section pn-vet-contact" id="pn-vet-contact"><div><span className="pn-vet-kicker">10 / PRÓXIMO PASSO</span><h2>O cuidado do seu pet começa com uma conversa.</h2><p>Entre em contato para conhecer os serviços veterinários e consultar horários.</p>{whatsappHref&&<a className="pn-vet-primary" href={whatsappHref} target="_blank" rel="noopener noreferrer">Falar no WhatsApp ↗</a>}{!whatsappHref&&email&&<a className="pn-vet-primary" href={"mailto:"+email}>Enviar e-mail ↗</a>}{!whatsappHref&&!email&&<p className="pn-vet-contact-placeholder">Cadastre um WhatsApp ou e-mail oficial para ativar o contato.</p>}{address&&<address>{address}{!realAddress&&<small>ENDEREÇO FICTÍCIO / EDITÁVEL</small>}</address>}</div><div className="pn-vet-map">{mapSearch?<iframe title={realAddress?"Mapa da clínica":"Mapa demonstrativo, endereço fictício"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={"https://www.google.com/maps?q="+encodeURIComponent(mapSearch)+"&output=embed"}/>:<div className="pn-vet-map-unconfigured">Localização disponível após cadastro de endereço real.</div>}</div></section>
  </UniversalTemplateSections>
  <footer className="pn-vet-footer"><div className="pn-vet-footer-inner"><div className="pn-vet-footer-head"><span>SAÚDE ANIMAL / CARINHO / CUIDADO</span><a className="pn-vet-footer-back" href="#pn-vet-start">Voltar ao início <span aria-hidden="true">↗</span></a></div><div className="pn-vet-footer-hero"><div><span className="pn-vet-footer-eyebrow">Cuidado começa com uma conversa.</span><div className="pn-vet-footer-title">{brand}</div></div><span className="pn-vet-footer-mark" aria-hidden="true">✳</span></div><div className="pn-vet-footer-mid"><p>Bem-estar de cães e gatos em cada etapa do cuidado.</p><nav aria-label="Navegação do rodapé"><a href="#pn-vet-services">Serviços</a><a href="#pn-vet-process">Como funciona</a><a href="#pn-vet-contact">Contato</a></nav></div><div className="pn-vet-footer-base"><span>Apresentação institucional · Conteúdo sujeito à confirmação pela clínica.</span><div>{email&&<a href={"mailto:"+email}>{email}</a>}{whatsappHref&&<a href={whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}</div></div></div></footer>
 </main>;
}
