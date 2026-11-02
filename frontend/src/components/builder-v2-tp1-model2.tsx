"use client";
import {useState} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-tp1-model2.css";

const photoSet=[
 {pattern:/fotograf|photograph/i,photo:"https://images.pexels.com/photos/3584996/pexels-photo-3584996.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/3062545/pexels-photo-3062545.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"FOTOGRAFIA AUTORAL",fallback:"Histórias que merecem ser vistas."},
 {pattern:/maquiagem|makeup/i,photo:"https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"BELEZA E EXPRESSÃO",fallback:"Sua beleza, sua assinatura."},
 {pattern:/psicolog|terapia/i,photo:"https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/17640381/pexels-photo-17640381.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"ACOLHIMENTO E CUIDADO",fallback:"Um espaço para você."},
 {pattern:/fisioterap/i,photo:"https://images.pexels.com/photos/4506109/pexels-photo-4506109.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/6111616/pexels-photo-6111616.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"MOVIMENTO E BEM-ESTAR",fallback:"Cuidado em cada movimento."},
 {pattern:/odontolog/i,photo:"https://images.pexels.com/photos/6627534/pexels-photo-6627534.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"ODONTOLOGIA ESTÉTICA",fallback:"Sorrisos com personalidade."},
 {pattern:/sal[aã]o|cabel|hair/i,photo:"https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"BELEZA CONTEMPORÂNEA",fallback:"Seu estilo em primeiro lugar."},
 {pattern:/consultoria de imagem|estilista/i,photo:"https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"IMAGEM E IDENTIDADE",fallback:"Estilo que comunica quem você é."},
 {pattern:/spa|bem.est[aá]r/i,photo:"https://images.pexels.com/photos/9335966/pexels-photo-9335966.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/11774389/pexels-photo-11774389.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"RITUAIS DE BEM-ESTAR",fallback:"Seu momento de reconexão."},
 {pattern:/dermatolog|est[eé]tica|beleza/i,photo:"https://images.pexels.com/photos/5659049/pexels-photo-5659049.jpeg?auto=compress&cs=tinysrgb&w=1600",secondary:"https://images.pexels.com/photos/6899549/pexels-photo-6899549.jpeg?auto=compress&cs=tinysrgb&w=850",eyebrow:"CUIDADO E ESTÉTICA",fallback:"O cuidado começa em você."}
];
const serviceCatalog=[
 {match:/fotograf/i,items:[["Retratos autorais","Imagens que revelam personalidade.","3584996"],["Ensaios especiais","Registros para momentos importantes.","3062545"],["Fotografia de marca","Uma linguagem visual própria.","3373736"]]},
 {match:/maquiagem/i,items:[["Maquiagem social","Beleza para ocasiões especiais.","3373736"],["Produção de beleza","Acabamentos com personalidade.","2113855"],["Beleza para eventos","Uma produção para o seu momento.","3993449"]]},
 {match:/psicolog|terapia/i,items:[["Atendimento individual","Um espaço de escuta e acolhimento.","4101143"],["Acompanhamento terapêutico","Cuidado construído com respeito.","17640381"],["Bem-estar emocional","Atenção à sua jornada pessoal.","3985332"]]},
 {match:/fisioterap/i,items:[["Avaliação funcional","Atenção às necessidades de movimento.","4506109"],["Terapia manual","Cuidado individualizado.","6111616"],["Mobilidade e bem-estar","Acompanhamento para sua rotina.","4506109"]]},
 {match:/odontolog/i,items:[["Estética do sorriso","Cuidado com a harmonia do sorriso.","6627534"],["Avaliação odontológica","Atenção individual desde o primeiro encontro.","3845810"],["Cuidado preventivo","Acompanhamento para saúde bucal.","6627534"]]},
 {match:/sal[aã]o|cabel/i,items:[["Corte e estilo","Expressão em cada detalhe.","3993449"],["Tratamentos capilares","Cuidado dedicado aos fios.","3992874"],["Produção especial","Beleza para momentos únicos.","3373736"]]},
 {match:/consultoria de imagem/i,items:[["Identidade visual pessoal","Estilo alinhado à sua essência.","1926769"],["Curadoria de guarda-roupa","Escolhas com intenção.","934070"],["Consultoria de estilo","Sua imagem como expressão.","3373736"]]},
 {match:/spa|bem.est[aá]r/i,items:[["Rituais de relaxamento","Pausas para renovar o equilíbrio.","9335966"],["Massagens","Um momento dedicado ao bem-estar.","11774389"],["Cuidados faciais","Atenção delicada à pele.","7446667"]]},
 {match:/dermatolog/i,items:[["Avaliação dermatológica","Cuidado especializado com a pele.","5659049"],["Cuidados faciais","Atenção às necessidades da pele.","3985332"],["Orientação preventiva","Informação e acompanhamento.","5659009"]]},
 {match:/est[eé]tica|beleza/i,items:[["Estética facial","Cuidado para valorizar a beleza natural.","29692111"],["Rituais para a pele","Um momento de atenção e bem-estar.","7446667"],["Tratamentos personalizados","Uma experiência de cuidado individual.","3985332"]]}
] as const;
const differentiators=[
 {pattern:/fotograf/i,image:"3584996",items:[["Olhar autoral","Uma direção visual atenta à identidade de cada projeto."],["Experiência acolhedora","Um processo conduzido com escuta e cuidado."],["Detalhes que importam","Atenção à luz, à composição e à expressão."],["Narrativas singulares","Imagens que valorizam histórias e momentos."]]},
 {pattern:/maquiagem/i,image:"3373736",items:[["Beleza individual","Produções pensadas para valorizar sua expressão."],["Escuta e sensibilidade","Preferências e referências guiam cada escolha."],["Acabamento cuidadoso","Atenção às texturas, aos tons e aos detalhes."],["Experiência especial","Um momento de cuidado antes de cada ocasião."]]},
 {pattern:/psicolog|terapia/i,image:"4101143",items:[["Escuta respeitosa","Atenção à individualidade de cada pessoa."],["Acolhimento","Um ambiente pensado para conversas com tranquilidade."],["Abordagem personalizada","Acompanhamento orientado às necessidades apresentadas."],["Respeito ao processo","Cuidado com o ritmo e os limites de cada jornada."]]},
 {pattern:/fisioterap/i,image:"4506109",items:[["Atenção individual","Um olhar cuidadoso para cada necessidade."],["Movimento consciente","Valorização da mobilidade e do bem-estar."],["Acompanhamento próximo","Diálogo e orientação ao longo do processo."],["Ambiente acolhedor","Conforto e tranquilidade durante o atendimento."]]},
 {pattern:/odontolog/i,image:"6627534",items:[["Olhar individualizado","Atenção às necessidades e preferências de cada paciente."],["Cuidado nos detalhes","Planejamento com foco na harmonia do sorriso."],["Atendimento acolhedor","Uma experiência pautada em escuta e respeito."],["Orientação clara","Informações acessíveis para decisões conscientes."]]},
 {pattern:/sal[aã]o|cabel/i,image:"3993449",items:[["Estilo pessoal","Beleza alinhada à identidade de cada pessoa."],["Atendimento próximo","Escuta atenta antes de cada transformação."],["Detalhes de acabamento","Cuidado com textura, forma e movimento."],["Atmosfera especial","Um espaço para dedicar tempo a si."]]},
 {pattern:/consultoria de imagem/i,image:"1926769",items:[["Identidade em primeiro lugar","Escolhas visuais conectadas à sua personalidade."],["Curadoria intencional","Atenção a combinações, cores e proporções."],["Escuta personalizada","Objetivos e preferências orientam o processo."],["Autenticidade","Estilo como extensão de quem você é."]]},
 {pattern:/spa|bem.est[aá]r/i,image:"9335966",items:[["Pausa consciente","Tempo reservado para desacelerar."],["Atmosfera acolhedora","Ambientes pensados para conforto e tranquilidade."],["Rituais de cuidado","Experiências dedicadas ao bem-estar."],["Atenção aos sentidos","Detalhes que convidam à reconexão."]]},
 {pattern:/dermatolog/i,image:"5659049",items:[["Atenção à pele","Cuidado orientado às necessidades individuais."],["Escuta cuidadosa","Um atendimento que considera suas dúvidas."],["Orientação clara","Informações acessíveis sobre opções de cuidado."],["Ambiente acolhedor","Tranquilidade e respeito em cada etapa."]]},
 {pattern:/est[eé]tica|beleza/i,image:"3985332",items:[["Beleza individual","Valorizamos as características de cada pessoa."],["Cuidado personalizado","Atenção às suas preferências e necessidades."],["Ambiente sofisticado","Conforto e delicadeza em cada detalhe."],["Experiência acolhedora","Um momento reservado ao seu bem-estar."]]}
] as const;
export function BuilderV2TP1Model2Hero({site}:{site:BuilderV2SiteData}){
 const [menuOpen,setMenuOpen]=useState(false);
 const niche=site.niche||"Beleza e Serviços Premium";
 const photo=photoSet.find(item=>item.pattern.test(niche))||photoSet[photoSet.length-1];
 const essencePhotoMap:Record<string,{essence:string;detail:string}>={
  "Fotografia profissional":{essence:"https://images.pexels.com/photos/3584996/pexels-photo-3584996.jpeg?auto=compress&cs=tinysrgb&w=1300",detail:"https://images.pexels.com/photos/3062545/pexels-photo-3062545.jpeg?auto=compress&cs=tinysrgb&w=800"},
  "Psicologia e terapias":{essence:"https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=1300",detail:"https://images.pexels.com/photos/17640381/pexels-photo-17640381.jpeg?auto=compress&cs=tinysrgb&w=800"}
 };
 const essencePhotos=essencePhotoMap[niche]||{essence:"https://images.pexels.com/photos/3985332/pexels-photo-3985332.jpeg?auto=compress&cs=tinysrgb&w=1300",detail:"https://images.pexels.com/photos/7446659/pexels-photo-7446659.jpeg?auto=compress&cs=tinysrgb&w=800"};
 const photoWithEssence={...photo,...essencePhotos};
 const serviceItems=(serviceCatalog.find(group=>group.match.test(niche))||serviceCatalog[serviceCatalog.length-1]).items;
 const difference=(differentiators.find(item=>item.pattern.test(niche))||differentiators[differentiators.length-1]);
 const brand=site.header?.brand?.trim()||site.title||"Seu Espaço";
 const heading=site.blocks.find(b=>b.type==="heading"&&b.text?.trim())?.text?.trim()||photo.fallback;
 const description=site.blocks.find(b=>b.type==="paragraph"&&b.text?.trim())?.text?.trim()||"Uma experiência pensada para valorizar cada detalhe do seu atendimento.";
 const rawHref=site.header?.ctaHref?.trim()||site.blocks.find(b=>b.type==="button"&&b.href)?.href?.trim()||"";
 const safeHref=rawHref.startsWith("#")||/^https:\/\//i.test(rawHref)||/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(rawHref)?rawHref:null;
 const cta=site.header?.ctaLabel?.trim()||"Fale com a equipe";
 return <div className="tp1v2" id="inicio">
  <header className="tp1v2-header">
   <a className="tp1v2-brand" href="#inicio">{brand}<span className="tp1v2-brand-dot">.</span></a>
   <button className="tp1v2-menu-toggle" type="button" aria-label={menuOpen?"Fechar menu":"Abrir menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen?"Fechar":"Menu"} <span aria-hidden="true">{menuOpen?"×":"☰"}</span></button>
   <nav className={"tp1v2-nav"+(menuOpen?" is-open":"")} aria-label="Navegação principal"><a href="#inicio" onClick={()=>setMenuOpen(false)}>Início</a><a href="#sobre" onClick={()=>setMenuOpen(false)}>Sobre</a><a href="#servicos" onClick={()=>setMenuOpen(false)}>Serviços</a><a href="#contato" onClick={()=>setMenuOpen(false)}>Contato</a></nav>
   {safeHref?<a className="tp1v2-header-cta" href={safeHref}>{cta}<span aria-hidden="true">↗</span></a>:<span className="tp1v2-header-cta tp1v2-header-cta-muted" aria-label="Contato ainda não configurado">Contato a configurar</span>}
  </header>
  <section className="tp1v2-hero" aria-labelledby="tp1v2-heading">
   <div className="tp1v2-copy"><div className="tp1v2-eyebrow"><span className="tp1v2-line"/> {photo.eyebrow}</div><h1 id="tp1v2-heading">{heading}</h1><p>{description}</p><div className="tp1v2-actions">{safeHref?<a className="tp1v2-primary" href={safeHref}>{cta} <span aria-hidden="true">↗</span></a>:null}<a className="tp1v2-secondary" href="#sobre">Conheça nosso espaço <span aria-hidden="true">→</span></a></div><div className="tp1v2-index"><span>01</span><span className="tp1v2-index-rule"/><span>BELEZA & SERVIÇOS PREMIUM</span></div></div>
   <div className="tp1v2-visual"><div className="tp1v2-visual-back" aria-hidden="true"/><figure className="tp1v2-primary-photo"><img src={photo.photo} alt={"Fotografia ilustrativa de "+niche} loading="eager"/></figure><figure className="tp1v2-secondary-photo"><img src={photo.secondary} alt={"Ambiente ou detalhe ilustrativo de "+niche} loading="lazy"/></figure><div className="tp1v2-vertical-note">BEAUTY • WELLNESS • EXPERIENCE</div><div className="tp1v2-photo-caption">UMA NOVA PERSPECTIVA SOBRE O CUIDADO <span>✳</span></div></div>
  </section>
  <section className="tp1v2-essence" id="sobre" aria-labelledby="tp1v2-essence-heading">
   <div className="tp1v2-essence-top"><span className="tp1v2-essence-kicker"><span aria-hidden="true">✳</span> NOSSA ESSÊNCIA</span><span className="tp1v2-essence-counter">02 / O QUE NOS MOVE</span></div>
   <div className="tp1v2-essence-grid">
    <div className="tp1v2-essence-art">
     <div className="tp1v2-essence-arch" aria-hidden="true"/>
     <figure className="tp1v2-essence-main"><img src={photoWithEssence.essence} alt={"Fotografia real ilustrativa do atendimento em "+niche} loading="lazy"/></figure>
     <figure className="tp1v2-essence-detail"><img src={photoWithEssence.detail} alt={"Detalhe fotográfico ilustrativo de "+niche} loading="lazy"/></figure>
     <span className="tp1v2-essence-artnote">CUIDAR É UMA FORMA DE ARTE</span>
    </div>
    <div className="tp1v2-essence-copy"><span className="tp1v2-essence-mini">NOSSA FILOSOFIA <span aria-hidden="true">—</span> {niche}</span><h2 id="tp1v2-essence-heading">A beleza está <em>nos detalhes.</em></h2><div className="tp1v2-essence-rule"/><p>Na {brand}, cada experiência é pensada para acolher, respeitar a individualidade e valorizar o que torna cada pessoa única.</p><p>Unimos atenção, sensibilidade e uma atmosfera cuidadosamente preparada para transformar o cuidado em um momento especial.</p><a className="tp1v2-essence-link" href="#contato">Entre em contato <span aria-hidden="true">↗</span></a><div className="tp1v2-essence-signature">ESSÊNCIA <span aria-hidden="true">✳</span> PROPÓSITO</div></div>
   </div>
  </section>
  <section className="tp1v2-services" id="servicos" aria-labelledby="tp1v2-services-heading">
   <div className="tp1v2-services-top"><div><span className="tp1v2-services-kicker">03 — NOSSAS ESPECIALIDADES</span><h2 id="tp1v2-services-heading">Cuidado que se <em>revela.</em></h2></div><p>Conheça algumas das experiências que fazem parte do universo de {niche.toLowerCase()}.</p></div>
   <div className="tp1v2-services-grid">{serviceItems.map(([name,description,imageId],index)=><article className="tp1v2-service-card" key={name}><div className="tp1v2-service-image"><img src={`https://images.pexels.com/photos/${imageId}/pexels-photo-${imageId}.jpeg?auto=compress&cs=tinysrgb&w=1000`} alt={`Fotografia ilustrativa: ${name}`} loading="lazy"/><span className="tp1v2-service-number">0{index+1}</span></div><div className="tp1v2-service-info"><div><h3>{name}</h3><p>{description}</p></div><span className="tp1v2-service-arrow" aria-hidden="true">↗</span></div></article>)}</div>
   <div className="tp1v2-services-bottom"><span>ATENÇÃO A CADA DETALHE</span><span>✳</span><span>{brand}</span></div>
  </section>
  <section className="tp1v2-differences" id="diferenciais" aria-labelledby="tp1v2-differences-heading">
   <div className="tp1v2-differences-label"><span>04 / NOSSOS DIFERENCIAIS</span><span>O QUE NOS TORNA ÚNICOS</span></div>
   <div className="tp1v2-differences-grid">
    <div className="tp1v2-differences-photo"><img src={`https://images.pexels.com/photos/${difference.image}/pexels-photo-${difference.image}.jpeg?auto=compress&cs=tinysrgb&w=1500`} alt={`Fotografia real ilustrativa de ${niche}`} loading="lazy"/><span className="tp1v2-differences-photo-note">CADA DETALHE TEM SEU VALOR <span aria-hidden="true">✳</span></span></div>
    <div className="tp1v2-differences-content"><span className="tp1v2-differences-eyebrow">NOSSA FORMA DE CUIDAR</span><h2 id="tp1v2-differences-heading">Uma experiência <em>feita para você.</em></h2><p className="tp1v2-differences-intro">Na {brand}, acreditamos que uma experiência especial começa na atenção aos detalhes.</p><div className="tp1v2-differences-list">{difference.items.map(([title,description],index)=><article className="tp1v2-difference" key={title}><span className="tp1v2-difference-number">0{index+1}</span><div><h3>{title}</h3><p>{description}</p></div><span className="tp1v2-difference-symbol" aria-hidden="true">✳</span></article>)}</div></div>
   </div>
  </section>
 </div>;
}
