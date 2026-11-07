"use client";
import {useState,type FormEvent} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import {normalizedSocialLink} from "@/lib/site-social-links";
import "./builder-v2-tp1-model3-sections.css";
import {MAKEUP_RE,MAKEUP_PHOTOS} from "@/lib/tp1-makeup-niche";

// Curated, distinct editorial photography; no random or missing Pexels numeric IDs.
const editorialPhotos=[
 "photo-1534528741775-53994a69daeb",
 "photo-1529139574466-a303027c1d8b",
 "photo-1515886657613-9f3515b0c78f",
 "photo-1490481651871-ab68de25d43d",
 "photo-1483985988355-763728e1935b",
 "photo-1539109136881-3be0616acf4b",
 "photo-1525507119028-ed4c629a60a3",
 "photo-1503342217505-b0a15ec3261c",
 "photo-1441986300917-64674bd600d8",
 "photo-1483985988355-763728e1935b",
 "photo-1524250502761-1ac6f2e30d43",
 "photo-1506794778202-cad84cf45f1d",
 "photo-1531123897727-8f129e1688ce",
 "photo-1524504388940-b1c1722653e1",
 "photo-1544005313-94ddf0286df2",
 "photo-1529626455594-4ff0802cfb7e",
 "photo-1551836022-d5d88e9218df",
 "photo-1487412720507-e7ab37603c6f",
 "photo-1560066984-138dadb4c035",
 "photo-1517841905240-472988babdf9",
 "photo-1508214751196-bcfd4ca60f91",
 "photo-1515372039744-b8f02a3ae446",
 "photo-1496747611176-843222e1e57c",
 "photo-1524250502761-1ac6f2e30d43"
];
const img=(id:string)=>{if(id.startsWith("makeup-"))return MAKEUP_PHOTOS[Number(id.slice(7))%MAKEUP_PHOTOS.length]||MAKEUP_PHOTOS[0];if(id.startsWith("male-"))return `https://images.unsplash.com/${id.slice(5)}?auto=format&fit=crop&w=1200&q=82`;if(id.startsWith("barber-")){const n=id.slice(7);return `https://images.pexels.com/photos/${n}/pexels-photo-${n}.jpeg?auto=compress&cs=tinysrgb&w=1200`; }const n=Number(id);const photo=editorialPhotos[Number.isFinite(n)?Math.abs(n)%editorialPhotos.length:0];return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=82`;};
const configs=[
 {match:/barbearia|barbeiro|barbershop|barber shop/i,services:["Corte masculino","Barba completa","Corte e barba","Acabamento e contornos"],photos:["barber-19050581","barber-7518740","barber-4625645","barber-7518746","barber-5584458","barber-7518731","barber-4625645","barber-7518740","barber-7518731","barber-19050581","barber-7518746","barber-5584458","barber-7518731","barber-4625645","barber-7518740","barber-7518746","barber-5584458","barber-19050581","barber-7518740","barber-7518731","barber-4625645","barber-5584458"],noun:"barbearia masculina",about:"Cortes, barba e atendimento personalizado com técnica e atenção aos detalhes."},
 {match:/consultoria de imagem|consultor.*imagem|personal stylist/i,services:["Análise de estilo","Coloração pessoal","Curadoria de guarda-roupa","Personal shopper"],photos:["0","1","2","3"],noun:"imagem e estilo",about:"Uma consultoria de imagem que valoriza a individualidade e transforma escolhas em expressão pessoal."},
 {match:/fotograf/i,services:["Retratos autorais","Ensaios pessoais","Fotografia de marca","Direção criativa"],photos:["4","5","6","7"],noun:"fotografia",about:"Imagens com intenção, sensibilidade e um olhar atento à história de cada pessoa."},
 {match:/maquiagem/i,services:["Maquiagem social","Maquiagem para eventos","Maquiagem para noivas","Maquiagem editorial"],photos:Array.from({length:22},(_,i)=>`makeup-${i+8}`),noun:"maquiagem feminina",about:"Maquiagens que valorizam sua beleza natural, suas preferências e a expressão de quem você é."},
 {match:/sal[aã]o|cabel/i,services:["Corte e estilo","Tratamentos capilares","Coloração","Produção especial"],photos:["12","13","14","15"],noun:"beleza",about:"Uma experiência de beleza construída com escuta, técnica e atenção aos detalhes."},
 {match:/spa|bem-estar/i,services:["Rituais de relaxamento","Massagens","Cuidados faciais","Experiências de bem-estar"],photos:["16","17","18","19"],noun:"bem-estar",about:"Um convite para desacelerar e dedicar tempo ao próprio cuidado."},
 {match:/odontolog/i,services:["Avaliação estética","Estética do sorriso","Cuidados preventivos","Planejamento individual"],photos:["20","21","22","23"],noun:"odontologia estética",about:"Cuidado individualizado para valorizar a naturalidade de cada sorriso."},
 {match:/dermatolog/i,services:["Avaliação dermatológica","Cuidados com a pele","Acompanhamento clínico","Orientação preventiva"],photos:["24","25","26","27"],noun:"dermatologia",about:"Atenção à saúde e às particularidades da sua pele."},
 {match:/fisioterap/i,services:["Avaliação funcional","Mobilidade","Terapia manual","Acompanhamento individual"],photos:["28","29","30","31"],noun:"fisioterapia",about:"Movimento, atenção e cuidado alinhados às necessidades de cada pessoa."},
 {match:/psicolog|terapia/i,services:["Escuta individual","Acompanhamento terapêutico","Bem-estar emocional","Atendimento personalizado"],photos:["32","33","34","35"],noun:"psicologia e terapias",about:"Um espaço de acolhimento e escuta respeitosa para cada trajetória."},
 {match:/est[eé]tica/i,services:["Estética facial","Cuidados corporais","Rituais para a pele","Avaliação personalizada"],photos:["36","37","38","39"],noun:"estética",about:"Uma experiência de cuidado que respeita sua essência e valoriza o que é único em você."}
];
const faqQuestions=[
 ["Como funciona o primeiro atendimento?","O primeiro contato é dedicado a entender suas necessidades, objetivos e o formato de atendimento disponível."],
 ["Os serviços são personalizados?","A proposta é considerar as necessidades individuais e definir o percurso adequado durante a conversa inicial."],
 ["É possível solicitar informações antes de agendar?","Sim. Utilize o canal de contato cadastrado pela empresa para esclarecer dúvidas."],
 ["Como saber qual serviço escolher?","Você pode apresentar seus objetivos no contato inicial e conversar sobre as opções disponíveis."],
 ["Existe atendimento online?","A disponibilidade de atendimento remoto depende da configuração e da oferta da empresa."],
 ["Como consultar valores e horários?","Solicite informações atualizadas diretamente pelo canal de contato da empresa."]
];
export function BuilderV2TP1Model3Sections({site,brand,publishedMode=false}:{site:BuilderV2SiteData;brand:string;publishedMode?:boolean}){
 const config=configs.find(x=>x.match.test(site.niche||""))||configs[0];
 const isMakeup=MAKEUP_RE.test(site.niche||"");
 const makeupDemoAddress="Avenida Paulista, 1578 — Bela Vista, São Paulo/SP";
 const realAddress=site.footer?.address?.trim()||"";
 const previewMakeupAddress=isMakeup&&!publishedMode&&!realAddress;
 const [openFaq,setOpenFaq]=useState<number|null>(0);
 const [showMakeupWhatsappHelp,setShowMakeupWhatsappHelp]=useState(false);
 const [name,setName]=useState("");
 const [contact,setContact]=useState("");
 const [message,setMessage]=useState("");
 const [feedback,setFeedback]=useState("");
 const email=site.footer?.email?.trim()||"";
 const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null;
 const phone=(site.footer?.whatsapp||site.restaurant?.whatsapp||"").replace(/\D/g,"");
 const validPhone=phone.length>=10&&phone.length<=15?(phone.startsWith("55")?phone:"55"+phone):null;
 const contactAvailable=Boolean(validPhone||validEmail);
 const social=(["instagram","facebook","youtube","whatsapp"] as const).map(k=>({name:k,url:normalizedSocialLink(k,site.footer?.[k]||"")})).filter((x):x is {name:typeof x.name;url:string}=>Boolean(x.url));
 const testimonials=site.blocks.filter(b=>b.type==="paragraph"&&/depoiment|testimonial|avalia[cç]|relato/i.test(b.section||"")).map(b=>{const fields=(b.text||"").split(/\s*\|\s*/).map(x=>x.trim());return fields.length>=3&&fields[0]&&fields[2]?{name:fields[0],detail:fields[1],quote:fields.slice(2).join(" | ")}:null;}).filter((v):v is {name:string;detail:string;quote:string}=>v!==null);
 const send=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!name.trim()||!contact.trim()||!message.trim()){setFeedback("Preencha todos os campos.");return;}
  if(!contactAvailable){setFeedback("A empresa ainda não cadastrou um canal para receber mensagens.");return;}
  const body=`Olá! Meu nome é ${name.trim()}. Meu contato: ${contact.trim()}. Mensagem: ${message.trim()}`;
  const url=validPhone?`https://wa.me/${validPhone}?text=${encodeURIComponent(body)}`:`mailto:${validEmail}?subject=${encodeURIComponent("Contato pelo site")}&body=${encodeURIComponent(body)}`;
  const w=window.open(url,"_blank","noopener,noreferrer");
  if(!w)setFeedback("Não foi possível abrir o aplicativo de contato. Verifique se o navegador permite novas janelas.");else setFeedback("Canal de contato aberto. Confirme o envio da mensagem no aplicativo.");
 };
 return <>
  <section className="tp1m3-section tp1m3-about" id="conceito" aria-labelledby="tp1m3-about-title"><div className="tp1m3-section-top"><span>02 / NOSSA ESSÊNCIA</span><span>UMA HISTÓRIA DE IDENTIDADE</span></div><div className="tp1m3-about-layout"><div className="tp1m3-portrait"><img src={img(config.photos[4]||config.photos[1])} alt={`Fotografia editorial ilustrativa de ${config.noun}`} loading="lazy"/><span>POR TRÁS DE CADA DETALHE</span></div><div className="tp1m3-about-copy"><span className="tp1m3-kicker">A ESSÊNCIA DA MARCA</span><h2 id="tp1m3-about-title">Mais do que aparência. <em>Uma forma de ser.</em></h2><p>{config.about}</p><p>Nosso olhar parte da escuta e da intenção de criar experiências que façam sentido para você.</p><a className="tp1m3-text-link" href="#contato">Conheça nossa abordagem <span>↗</span></a></div></div></section>
  <section className="tp1m3-section tp1m3-services" data-tp1-niche={isMakeup?"makeup":undefined} id="servicos" aria-labelledby="tp1m3-services-title"><div className="tp1m3-section-top"><span>03 / NOSSAS ESPECIALIDADES</span><span>ESCOLHAS COM PROPÓSITO</span></div><div className="tp1m3-section-heading"><span className="tp1m3-kicker">SERVIÇOS E EXPERIÊNCIAS</span><h2 id="tp1m3-services-title">Cada detalhe, <em>uma expressão.</em></h2></div><div className="tp1m3-service-grid">{config.services.map((s,i)=><article className="tp1m3-service-card" key={s}><div className="tp1m3-service-image"><img src={img(config.photos[i])} alt={`Imagem ilustrativa de ${s}`} loading="lazy"/><span>0{i+1}</span></div>{isMakeup?<div className="tp1m3-service-body"><h3>{s}</h3><p>{["Produção sofisticada para valorizar sua beleza natural e expressar seu estilo.","Maquiagem personalizada para festas, cerimônias e momentos especiais.","Um visual delicado e elegante, pensado para seu grande dia.","Produções criativas para ensaios, campanhas e projetos visuais."][i]||"Uma produção personalizada com atenção aos detalhes."}</p></div>:<><h3>{s}</h3><p>Uma experiência pensada para atender necessidades individuais com atenção aos detalhes.</p></>}</article>)}</div></section>
  <section className="tp1m3-section tp1m3-differences" id="diferenciais" aria-labelledby="tp1m3-diff-title"><div className="tp1m3-section-top"><span>04 / NOSSO OLHAR</span><span>O QUE NOS MOVE</span></div><div className="tp1m3-diff-layout"><div><span className="tp1m3-kicker">NOSSO MANIFESTO</span><h2 id="tp1m3-diff-title">A diferença está <em>na intenção.</em></h2><p>Acreditamos em experiências guiadas pela individualidade, pelo cuidado e por escolhas que fazem sentido.</p></div><div className="tp1m3-diff-grid">{[["01","Escuta verdadeira","Entender antes de propor."],["02","Olhar individual","Respeitar cada história e necessidade."],["03","Cuidado nos detalhes","Valorizar o processo, não apenas o resultado."],["04","Expressão autêntica","Construir uma experiência com identidade."]].map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></div></section>
  <section className="tp1m3-section tp1m3-process" id="experiencia" aria-labelledby="tp1m3-process-title"><div className="tp1m3-section-top"><span>05 / COMO FUNCIONA</span><span>A SUA EXPERIÊNCIA</span></div><div className="tp1m3-section-heading"><span className="tp1m3-kicker">UM CAMINHO COM INTENÇÃO</span><h2 id="tp1m3-process-title">Tudo começa <em>com você.</em></h2></div>{[["O primeiro encontro","Uma conversa para compreender seus objetivos e o que é importante para você."],["A construção do caminho","Definimos juntos uma proposta alinhada às suas necessidades."],["A experiência","Cada etapa é conduzida com atenção e espaço para suas escolhas."]].map(([title,desc],i)=><article className="tp1m3-process-row" key={title}><div className="tp1m3-process-photo"><img src={img(isMakeup?config.photos[5+i]:config.match.test("barbearia")?config.photos[9+i]:String(12+(configs.indexOf(config)*3+i)%editorialPhotos.length))} alt={`Imagem ilustrativa: ${title}`} loading="lazy"/></div><div className="tp1m3-process-copy"><span>ETAPA 0{i+1}</span><h3>{title}</h3><p>{desc}</p><span className="tp1m3-process-line"/></div></article>)}</section>
  <section className="tp1m3-section tp1m3-gallery" id="galeria" aria-labelledby="tp1m3-gallery-title"><div className="tp1m3-section-top"><span>06 / GALERIA EDITORIAL</span><span>INSPIRAÇÕES VISUAIS</span></div><div className="tp1m3-section-heading"><span className="tp1m3-kicker">IMAGENS QUE INSPIRAM</span><h2 id="tp1m3-gallery-title">Um olhar <em>em imagens.</em></h2><p>Fotografias ilustrativas de referência visual. Substitua por trabalhos autorizados da marca.</p></div><div className="tp1m3-mosaic">{Array.from({length:6},(_,i)=>(isMakeup?config.photos[9+i]:config.match.test("barbearia")?config.photos[12+i]:String((configs.indexOf(config)*5+i+8)%editorialPhotos.length))).map((id,i)=><figure key={i}><img src={img(id)} alt={`Referência visual editorial ${i+1} de ${config.noun}`} loading="lazy"/><figcaption>EDITORIAL / 0{i+1}</figcaption></figure>)}</div></section>
  {isMakeup ? (<section className="tp1m3-section tp1m3-testimonials" id="depoimentos" aria-labelledby="tp1m3-testimonials-title">
   <div className="tp1m3-section-top"><span>07 / INSPIRAÇÃO E BELEZA</span><span>MAQUIAGEM COM IDENTIDADE</span></div>
   <div className="tp1m3-section-heading"><span className="tp1m3-kicker">SUA EXPRESSÃO É ÚNICA</span><h2 id="tp1m3-testimonials-title">A beleza <em>de ser você.</em></h2></div>
   <div className="tp1m3-testimonial-layout">
    <div className="tp1m3-testimonial-visual"><img src={img(config.photos[16])} alt="Inspiração editorial de maquiagem feminina" loading="lazy"/></div>
    <div className="tp1m3-testimonial-quotes" style={{display:"flex",flexDirection:"column",justifyContent:"center",minHeight:300}}>
      <div style={{padding:"clamp(20px,5vw,50px)",border:"1px solid rgba(140,115,91,.23)",background:"rgba(255,255,255,.55)"}}>
        <span style={{fontSize:11,letterSpacing:".17em",fontWeight:750,color:"#a5876d"}}>UMA EXPERIÊNCIA FEITA PARA VOCÊ</span>
        <h3 style={{fontFamily:"Georgia,serif",fontWeight:400,fontSize:"clamp(27px,4vw,44px)",lineHeight:1.2,color:"#2a3930",margin:"18px 0"}}>Seu estilo, suas escolhas, seu momento.</h3>
        <p style={{fontSize:15,lineHeight:1.8,color:"#657068"}}>Converse com o estúdio sobre referências, cores e ocasiões. Avaliações reais poderão ser adicionadas quando fornecidas e autorizadas.</p>
        <a href="#contato" style={{fontSize:13,fontWeight:700,color:"#2a3930",textDecoration:"underline"}}>Conheça nosso atendimento ↗</a>
      </div>
    </div>
   </div>
  </section>) : (<section className="tp1m3-section tp1m3-testimonials" id="depoimentos" aria-labelledby="tp1m3-testimonials-title"><div className="tp1m3-section-top"><span>07 / EXPERIÊNCIAS</span><span>EXPERIÊNCIAS ILUSTRATIVAS</span></div><div className="tp1m3-section-heading"><span className="tp1m3-kicker">HISTÓRIAS COMPARTILHADAS</span><h2 id="tp1m3-testimonials-title">Cada pessoa, <em>uma história.</em></h2></div><div className="tp1m3-testimonial-layout"><div className="tp1m3-testimonial-visual"><img src={img(config.match.test("barbearia")?config.photos[18]:String((configs.indexOf(config)*4+17)%editorialPhotos.length))} alt="Imagem editorial ilustrativa" loading="lazy"/></div><div className="tp1m3-testimonial-quotes">{(testimonials.length?testimonials:[{"name":"Rafael Almeida","quote":"Gostei da atenção aos detalhes e da conversa antes do corte. O resultado ficou bem alinhado ao que eu procurava.","photo":"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80"},{"name":"Lucas Ferreira","quote":"O ambiente transmite cuidado e o atendimento foi pensado para o estilo que eu queria.","photo":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"},{"name":"Bruno Martins","quote":"Um exemplo de experiência completa, do atendimento inicial ao acabamento da barba.","photo":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80"},{"name":"André Costa","quote":"A proposta de um atendimento personalizado faz toda a diferença na escolha do corte.","photo":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80"}].map(p=>({name:p.name,quote:p.quote,detail:"Depoimento fictício • exemplo de layout"}))).map((t,i)=><blockquote key={i}><span aria-hidden="true">“</span><p>{t.quote}</p><footer><img src={["https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=75","https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=75","https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=75","https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=75"][i%4]} alt={`Retrato ilustrativo de ${t.name}`} loading="lazy"/><div><strong>{t.name}</strong><small>{t.detail}</small></div></footer></blockquote>)}</div></div><p style={{fontSize:12,opacity:.75}}>Exemplos fictícios e imagens ilustrativas. Substitua por avaliações reais autorizadas antes de publicar.</p></section>)}
  <section className="tp1m3-section tp1m3-faq" id="faq" aria-labelledby="tp1m3-faq-title"><div className="tp1m3-section-top"><span>08 / PERGUNTAS FREQUENTES</span><span>INFORMAÇÃO COM CLAREZA</span></div><div className="tp1m3-faq-layout"><div><span className="tp1m3-kicker">ANTES DE COMEÇAR</span><h2 id="tp1m3-faq-title">Tudo o que você <em>quer saber.</em></h2><p>Não encontrou sua dúvida? Entre em contato para saber mais.</p></div><div className="tp1m3-faq-items">{faqQuestions.map(([q,a],i)=><div className="tp1m3-faq-item" key={q}><button type="button" aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}><span>{String(i+1).padStart(2,"0")}</span>{q}<b aria-hidden="true">{openFaq===i?"−":"+"}</b></button>{openFaq===i&&<p>{a}</p>}</div>)}</div></div></section>
  <section className="tp1m3-section tp1m3-contact" id="contato" aria-labelledby="tp1m3-contact-title"><div className="tp1m3-section-top"><span>09 / ENTRE EM CONTATO</span><span>VAMOS CONVERSAR</span></div><div className="tp1m3-contact-layout"><div className="tp1m3-contact-photo"><img src={img(isMakeup?config.photos[17]:config.match.test("barbearia")?config.photos[19]:String((configs.indexOf(config)*4+21)%editorialPhotos.length))} alt={`Fotografia editorial ilustrativa de ${config.noun}`} loading="lazy"/></div><div className="tp1m3-contact-copy"><span className="tp1m3-kicker">O PRÓXIMO PASSO</span><h2 id="tp1m3-contact-title">Sua próxima história <em>começa aqui.</em></h2><p>Conte um pouco sobre o que você procura. A mensagem será preparada para envio pelo canal cadastrado.</p><div className="tp1m3-makeup-location" style={{display:"grid",gap:14,width:"100%",minWidth:0}}>
   {realAddress ? (
      <>
        <iframe title="Localização cadastrada do estúdio" src={`https://www.google.com/maps?q=${encodeURIComponent(realAddress)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{display:"block",width:"100%",height:265,border:0,borderRadius:10}}/>
        <address style={{fontStyle:"normal",fontSize:14,lineHeight:1.65}}>{realAddress}</address>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(realAddress)}`} target="_blank" rel="noopener noreferrer" style={{fontSize:12,textDecoration:"underline",textUnderlineOffset:3,color:"inherit"}}>Ver endereço no Google Maps ↗</a>
      </>
   ) : previewMakeupAddress ? (
      <>
        <iframe title="Mapa demonstrativo do estúdio de maquiagem" src={`https://www.google.com/maps?q=${encodeURIComponent(makeupDemoAddress)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{display:"block",width:"100%",height:265,border:0,borderRadius:10}}/>
        <span style={{fontSize:10,letterSpacing:".14em",fontWeight:800,color:"#9e8067"}}>ENDEREÇO DEMONSTRATIVO</span>
        <address style={{fontStyle:"normal",fontSize:14,lineHeight:1.6,color:"#34473d",fontWeight:600}}>{makeupDemoAddress}</address>
        <small style={{fontSize:11,lineHeight:1.5,color:"#68736a"}}>Exemplo para visualização. Substitua pelo endereço real antes de publicar.</small>
      </>
   ) : (
      <p style={{fontSize:14,lineHeight:1.6}}>O endereço do estúdio será exibido quando estiver cadastrado.</p>
   )}
   {validPhone ? (
      <a className="tp1m3-whatsapp-action" href={`https://wa.me/${validPhone}`} target="_blank" rel="noopener noreferrer">Falar pelo WhatsApp ↗</a>
   ) : isMakeup&&!publishedMode ? (
      <>
         <button type="button" className="tp1m3-whatsapp-action" onClick={()=>setShowMakeupWhatsappHelp(true)}>Falar pelo WhatsApp ↗</button>
         {showMakeupWhatsappHelp&&<p role="status" style={{margin:0,fontSize:12,lineHeight:1.6}}>Este botão é demonstrativo. Cadastre o número real para ativar o WhatsApp.</p>}
      </>
   ) : (
      <span role="status" style={{fontSize:12,color:"#57675d"}}>WhatsApp ainda não cadastrado.</span>
   )}
  </div></div></div></section>
  <section className="tp1m3-section tp1m3-history" id="trajetoria" aria-labelledby="tp1m3-history-title"><div className="tp1m3-section-top"><span>10 / NOSSA TRAJETÓRIA</span><span>CAPÍTULOS DE UMA IDENTIDADE</span></div><div className="tp1m3-section-heading"><span className="tp1m3-kicker">NOSSA NARRATIVA</span><h2 id="tp1m3-history-title">Uma história <em>em construção.</em></h2><p>Os capítulos abaixo são uma estrutura editorial personalizável. Insira fatos e marcos reais da empresa.</p></div>{[["Nossa origem","Toda trajetória começa com uma ideia e uma intenção."],["O que nos inspira","Escuta, sensibilidade e atenção às pessoas orientam a proposta da marca."],["Nosso presente","Uma experiência que continua sendo construída em cada encontro."],["Os próximos capítulos","O futuro é feito de novas histórias e possibilidades."]].map(([t,d],i)=><article className="tp1m3-history-chapter" key={t}><div className="tp1m3-history-image"><img src={img(config.photos[isMakeup?i+18:i+5]||config.photos[i])} alt={`Imagem editorial ilustrativa para o capítulo ${t}`} loading="lazy"/></div><div className="tp1m3-history-copy"><span>CAPÍTULO / 0{i+1}</span><h3>{t}</h3><p>{d}</p></div></article>)}</section>
  <footer className="tp1m3-footer" id="rodape"><div className="tp1m3-footer-top"><span>11 / A SUA PRÓXIMA HISTÓRIA</span><a href="#inicio">VOLTAR AO INÍCIO ↑</a></div><div className="tp1m3-footer-content"><div><span className="tp1m3-kicker">VAMOS CRIAR ALGO SIGNIFICATIVO</span><h2>O próximo capítulo <em>é seu.</em></h2><a href="#contato" className="tp1m3-footer-cta">Vamos conversar ↗</a></div><div className="tp1m3-footer-links"><nav aria-label="Navegação do rodapé"><h3>EXPLORE</h3>{[["Início","#inicio"],["Nossa essência","#conceito"],["Especialidades","#servicos"],["Experiência","#experiencia"],["Galeria","#galeria"],["Perguntas frequentes","#faq"],["Contato","#contato"]].map(([label,href])=><a href={href} key={href}>{label}</a>)}</nav><div><h3>CONTATO</h3>{site.footer?.address&&<address>{site.footer.address}</address>}{validEmail&&<a href={`mailto:${validEmail}`}>{validEmail}</a>}{validPhone&&<a href={`https://wa.me/${validPhone}`} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}{!validEmail&&!validPhone&&!site.footer?.address&&<p>Dados de contato ainda não cadastrados.</p>}{social.length>0&&<><h3>REDES SOCIAIS</h3>{social.map(x=><a key={x.name} href={x.url} target="_blank" rel="noopener noreferrer">{x.name} ↗</a>)}</>}</div></div></div><div className="tp1m3-footer-brand">{brand}</div><div className="tp1m3-footer-bottom"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><span>{site.niche||"Beleza e Serviços Premium"}</span></div></footer>
 </>;
}
