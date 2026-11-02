"use client";
import {useEffect,useState} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-pizzeria-g2.css";

const pizzaImage="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/immersive-3d/pizzaria/desktop-3ca9141d-3308-4022-97e6-11ec7344b7da.png";

const specialtyImages=[
 "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=1400",
 "https://images.pexels.com/photos/2619967/pexels-photo-2619967.jpeg?auto=compress&cs=tinysrgb&w=1400",
 "https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=1400"
];
const specialties=[
 {name:"Clássicos da casa",detail:"O sabor que transforma qualquer encontro em uma ocasião especial.",tag:"01 / TRADIÇÃO"},
 {name:"Receitas especiais",detail:"Combinações marcantes para quem aprecia cada detalhe.",tag:"02 / SABOR"},
 {name:"Experiência artesanal",detail:"Uma celebração da pizza, do primeiro aroma à última fatia.",tag:"03 / PAIXÃO"}
];

const demoTestimonials=[
 "Uma noite especial começa com bons sabores e termina com memórias para compartilhar.",
 "Cada detalhe da experiência merece ser lembrado, do primeiro aroma à última fatia.",
 "O encontro perfeito entre tradição, ingredientes e momentos à mesa."
];
const faqItems=[
 {question:"Como posso fazer meu pedido?",answer:"Use o botão Fazer meu pedido para acessar o canal de atendimento configurado pela pizzaria."},
 {question:"Onde encontro o cardápio?",answer:"Explore a seção Nossas Especialidades ou entre em contato para consultar o cardápio atualizado."},
 {question:"Vocês oferecem entrega ou retirada?",answer:"As modalidades de atendimento dependem da pizzaria. Consulte a equipe pelo canal de pedidos para confirmar a disponibilidade."},
 {question:"É possível personalizar uma pizza?",answer:"Consulte a equipe sobre ingredientes, alterações e opções disponíveis antes de finalizar o pedido."},
 {question:"Quais são os horários de funcionamento?",answer:"Os horários são definidos por cada estabelecimento. Entre em contato para confirmar o atendimento no dia desejado."}
];
export function BuilderV2PizzeriaG2({site}:{site:BuilderV2SiteData}){
 const [open,setOpen]=useState(false);
 const [faqOpen,setFaqOpen]=useState<number|null>(0);
 const [testimonialIndex,setTestimonialIndex]=useState(0);
 useEffect(()=>{if(typeof window==="undefined"||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const timer=window.setInterval(()=>setTestimonialIndex(i=>(i+1)%demoTestimonials.length),6500);return ()=>window.clearInterval(timer)},[]);
 const brand=site.header?.brand||site.title||"Pizzaria Artesanal";
 const raw=site.blocks?.find(b=>b.type==="heading")?.text||"A tradição italiana em cada fatia.";
 const title=raw.toLocaleLowerCase("pt-BR").replace(/^./,c=>c.toLocaleUpperCase("pt-BR"));
 const subtitle=site.blocks?.find(b=>b.type==="paragraph")?.text||"Massa de fermentação lenta, ingredientes selecionados e pizzas artesanais preparadas com paixão.";
 const order=site.header?.ctaHref||site.blocks?.find(b=>b.type==="button"&&b.href&&!b.href.startsWith("#"))?.href||"#contato";
 const contactAddress=site.footer?.address?.trim();
 const contactEmail=site.footer?.email?.trim();
 const whatsappDigits=site.restaurant?.whatsapp?.replace(/\D/g,"")||"";
 const whatsappHref=whatsappDigits.length>=10&&whatsappDigits.length<=13?`https://wa.me/${whatsappDigits}`:null;
 const contactHref=whatsappHref||((order&&order!=="#contato")?order:null);
 const links=[["Início","#inicio"],["Cardápio","#produtos"],["Sobre nós","#sobre"],["Contato","#contato"]];
 return <div className="g2-pizzeria">
  <header className="g2-header">
   <a href="#inicio" className="g2-brand"><span className="g2-brand-icon" aria-hidden="true">◉</span><span>{brand}</span></a>
   <nav aria-label="Navegação principal">{links.map(([label,href])=><a href={href} key={href}>{label}</a>)}</nav>
   <a className="g2-header-order" href={order}>Fazer pedido ↗</a>
   <button className="g2-menu-button" type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label={open?"Fechar menu":"Abrir menu"}>{open?"✕":"☰"}</button>
  </header>
  {open&&<nav className="g2-mobile-menu" aria-label="Menu móvel">{links.map(([label,href])=><a href={href} key={href} onClick={()=>setOpen(false)}>{label}</a>)}</nav>}
  <main><section id="inicio" className="g2-hero">
   <div className="g2-hero-aura" aria-hidden="true"/>
   <div className="g2-hero-stage" aria-hidden="true">
     <div className="g2-hero-stage-glow"/>
     <div className="g2-hero-stage-shadow"/>
     <div className="g2-hero-image"><img src={pizzaImage} alt=""/></div>
     <div className="g2-hero-foreground"><img src={pizzaImage} alt=""/></div>
     <div className="g2-hero-stage-spark g2-hero-stage-spark-one"/>
     <div className="g2-hero-stage-spark g2-hero-stage-spark-two"/>
   </div>
   <div className="g2-hero-shade" aria-hidden="true"/>
   <div className="g2-hero-content"><span className="g2-kicker">TRADIÇÃO · FORNO · PAIXÃO</span><h1>{title}</h1><p>{subtitle}</p><a className="g2-hero-cta" href="#produtos">Explorar cardápio <span aria-hidden="true">→</span></a></div>
  </section>
  <section id="produtos" className="g2-specialties" aria-labelledby="g2-specialties-title">
    <div className="g2-specialties-heading">
      <div><span className="g2-specialties-eyebrow">✳ O MELHOR DO NOSSO FORNO</span><h2 id="g2-specialties-title">Nossas <em>especialidades.</em></h2></div>
      <p>Uma experiência feita para despertar os sentidos. Descubra o universo de sabores da nossa pizzaria.</p>
    </div>
    <div className="g2-specialties-grid">
      {specialties.map((item,index)=><article className="g2-specialty-card" key={item.tag}>
        <div className="g2-specialty-media"><img src={specialtyImages[index]} alt={item.name} loading="lazy"/><span className="g2-specialty-index">{item.tag}</span></div>
        <div className="g2-specialty-info"><div><h3>{item.name}</h3><p>{item.detail}</p></div><a href={order} aria-label={`Consultar ${item.name}`} className="g2-specialty-link">↗</a></div>
      </article>)}
    </div>
  </section>
  <section id="sobre" className="g2-essence" aria-labelledby="g2-essence-title">
    <div className="g2-essence-visual">
      <div className="g2-essence-photo" role="img" aria-label="Pizza artesanal com queijo derretido e ingredientes frescos" style={{backgroundImage:`url("${pizzaImage}")`}}/>
      <div className="g2-essence-sparks" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div>
      <div className="g2-essence-seal" aria-hidden="true"><span>FEITO COM</span><strong>♥</strong><span>PAIXÃO</span></div>
      <span className="g2-essence-photo-caption">O SABOR COMEÇA NO CUIDADO</span>
    </div>
    <div className="g2-essence-copy">
      <span className="g2-essence-eyebrow">03 / NOSSA ESSÊNCIA</span>
      <h2 id="g2-essence-title">A arte de fazer <em>com as mãos.</em></h2>
      <span className="g2-essence-rule" aria-hidden="true"/>
      <p className="g2-essence-lead">Não é apenas sobre pizza. É sobre o tempo, o cuidado e a paixão por cada detalhe.</p>
      <p>Da massa ao forno, cada etapa é um convite para apreciar o verdadeiro sabor de uma experiência artesanal. Uma tradição que se sente em cada fatia.</p>
      <a className="g2-essence-cta" href={order}>Viva essa experiência <span aria-hidden="true">↗</span></a>
    </div>
  </section>
  <section className="g2-process" aria-labelledby="g2-process-title">
    <div className="g2-process-intro"><span className="g2-process-kicker">04 / NOSSO PROCESSO</span><h2 id="g2-process-title">O segredo do <em>nosso sabor.</em></h2><p>Uma jornada artesanal em três momentos. Do primeiro toque na massa até o calor do forno.</p></div>
    <div className="g2-process-stages">
      <article className="g2-process-stage g2-process-stage-featured">
        <div className="g2-process-photo"><img src="https://www.gardenahotels.com/typo3temp/_processed_/csm_Medel-restaurant-pizza-gardenahotels-Dolomites-lunch-dinner-bar-pizzeria-meat-grill-dry_age-homemade-wholemeal_f9365b29f3.jpg" alt="Mãos abrindo a massa artesanal com farinha suspensa no ar" loading="lazy"/></div>
        <div className="g2-process-gradient"/>
        <div className="g2-process-caption"><span>01 <i/> O COMEÇO</span><h3>A massa é a alma.</h3><p>O cuidado começa nas mãos, com tempo, textura e dedicação em cada movimento.</p></div>
      </article>
      <article className="g2-process-stage">
        <div className="g2-process-photo"><img src="https://images.pexels.com/photos/1435907/pexels-photo-1435907.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Ingredientes frescos selecionados para preparar a pizza" loading="lazy"/></div>
        <div className="g2-process-gradient"/>
        <div className="g2-process-caption"><span>02 <i/> A ESCOLHA</span><h3>Ingredientes que inspiram.</h3><p>Sabores, aromas e combinações escolhidos para criar uma experiência especial.</p></div>
      </article>
      <article className="g2-process-stage">
        <div className="g2-process-photo"><img src="https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Pizza assada com borda dourada" loading="lazy"/></div>
        <div className="g2-process-gradient"/>
        <div className="g2-process-caption"><span>03 <i/> O GRANDE FINAL</span><h3>O calor transforma.</h3><p>É no forno que o trabalho artesanal ganha aroma, cor e personalidade.</p></div>
      </article>
    </div>
  </section>
  <section className="g2-gallery" aria-labelledby="g2-gallery-title">
    <div className="g2-gallery-heading"><div><span className="g2-gallery-kicker">05 / MOMENTOS QUE FICAM</span><h2 id="g2-gallery-title">Uma experiência <em>além do sabor.</em></h2></div><p>Um olhar de perto para os detalhes que fazem cada encontro inesquecível.</p></div>
    <div className="g2-gallery-mosaic">
      <figure className="g2-gallery-tile g2-gallery-tile-main"><img src={pizzaImage} alt="Pizza artesanal com queijo derretido" loading="lazy"/><figcaption><span>01 / NOSSA ASSINATURA</span><strong>O sabor em primeiro plano.</strong></figcaption></figure>
      <figure className="g2-gallery-tile g2-gallery-tile-top"><img src="https://images.pexels.com/photos/1435907/pexels-photo-1435907.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Ingredientes frescos" loading="lazy"/><figcaption><span>02 / INGREDIENTES</span><strong>Escolhas que fazem a diferença.</strong></figcaption></figure>
      <figure className="g2-gallery-tile g2-gallery-tile-bottom"><img src="https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Pizza artesanal assada" loading="lazy"/><figcaption><span>03 / TRADIÇÃO</span><strong>Feita para compartilhar.</strong></figcaption></figure>
      <figure className="g2-gallery-tile g2-gallery-tile-wide"><img src="https://www.gardenahotels.com/typo3temp/_processed_/csm_Medel-restaurant-pizza-gardenahotels-Dolomites-lunch-dinner-bar-pizzeria-meat-grill-dry_age-homemade-wholemeal_f9365b29f3.jpg" alt="Preparo artesanal da pizza" loading="lazy"/><figcaption><span>04 / NOSSA ESSÊNCIA</span><strong>O cuidado está em cada detalhe.</strong></figcaption></figure>
    </div>
  </section>
  <section className="g2-testimonials" aria-labelledby="g2-testimonials-title">
    <div className="g2-testimonials-backdrop" aria-hidden="true"/>
    <div className="g2-testimonials-overlay" aria-hidden="true"/>
    <div className="g2-testimonials-inner">
      <span className="g2-testimonials-kicker">06 / VOZES E MEMÓRIAS</span>
      <h2 id="g2-testimonials-title">Momentos que <em>merecem ser contados.</em></h2>
      <div className="g2-testimonials-mark" aria-hidden="true">“</div>
      <blockquote className="g2-testimonials-quote" key={testimonialIndex}>{demoTestimonials[testimonialIndex]}</blockquote>
      <p className="g2-testimonials-disclaimer">Texto ilustrativo de apresentação — não representa uma avaliação real de cliente.</p>
      <div className="g2-testimonials-controls" aria-label="Navegar entre textos ilustrativos">
        <button type="button" aria-label="Texto anterior" onClick={()=>setTestimonialIndex(i=>(i+demoTestimonials.length-1)%demoTestimonials.length)}>←</button>
        <span aria-live="polite">{String(testimonialIndex+1).padStart(2,"0")} <i/> {String(demoTestimonials.length).padStart(2,"0")}</span>
        <button type="button" aria-label="Próximo texto" onClick={()=>setTestimonialIndex(i=>(i+1)%demoTestimonials.length)}>→</button>
      </div>
    </div>
  </section>
  <section className="g2-order-cta" aria-labelledby="g2-order-cta-title">
    <div className="g2-order-cta-grain" aria-hidden="true"/>
    <div className="g2-order-cta-content">
      <span className="g2-order-cta-eyebrow">07 / DIRETO DO NOSSO FORNO</span>
      <h2 id="g2-order-cta-title">Seu próximo momento <em>começa aqui.</em></h2>
      <p>Ingredientes escolhidos com carinho, massa artesanal e aquele sabor que transforma qualquer ocasião.</p>
      <a className="g2-order-cta-button" href={order}>Fazer meu pedido <span aria-hidden="true">↗</span></a>
      <span className="g2-order-cta-footnote">FEITO COM PAIXÃO · SERVIDO COM SABOR</span>
    </div>
    <div className="g2-order-cta-scene" aria-label="Pizza artesanal em composição tridimensional com camadas, iluminação e movimento" role="img">
      <div className="g2-order-cta-halo" aria-hidden="true"/>
      <div className="g2-order-cta-shadow" aria-hidden="true"/>
      <div className="g2-order-cta-backplate" aria-hidden="true"><img src={pizzaImage} alt=""/></div>
      <div className="g2-order-cta-pizza" aria-hidden="true"><img src={pizzaImage} alt=""/></div>
      <div className="g2-order-cta-foreground" aria-hidden="true"><img src={pizzaImage} alt=""/></div>
      <span className="g2-order-cta-light g2-order-cta-light-a" aria-hidden="true"/>
      <span className="g2-order-cta-light g2-order-cta-light-b" aria-hidden="true"/>
    </div>
  </section>
  <section className="g2-faq" aria-labelledby="g2-faq-title">
    <div className="g2-faq-photo">
      <img src="https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Pizza artesanal recém-assada em destaque" loading="lazy"/>
      <div className="g2-faq-photo-shade"/>
      <span className="g2-faq-photo-label">TRADIÇÃO EM CADA DETALHE <span aria-hidden="true">↗</span></span>
    </div>
    <div className="g2-faq-content">
      <span className="g2-faq-eyebrow">08 / ESTAMOS AQUI PARA AJUDAR</span>
      <h2 id="g2-faq-title">Perguntas <em>frequentes.</em></h2>
      <p className="g2-faq-lead">Tudo o que você precisa saber antes de viver a próxima experiência.</p>
      <div className="g2-faq-accordion">
        {faqItems.map((item,index)=><div className={"g2-faq-item"+(faqOpen===index?" g2-faq-item-open":"")} key={item.question}>
          <h3><button type="button" aria-expanded={faqOpen===index} aria-controls={`g2-faq-answer-${index}`} onClick={()=>setFaqOpen(current=>current===index?null:index)}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.question}</strong><i aria-hidden="true">{faqOpen===index?"−":"+"}</i></button></h3>
          <div id={`g2-faq-answer-${index}`} className="g2-faq-answer" hidden={faqOpen!==index}><p>{item.answer}</p></div>
        </div>)}
      </div>
      <a href={contactHref||"#contato"} className="g2-faq-contact">Ainda tem dúvidas? {contactHref?"Fale conosco":"Veja como entrar em contato"} <span aria-hidden="true">↗</span></a>
    </div>
  </section>
  <section id="contato" className="g2-contact" aria-labelledby="g2-contact-title">
    <div className="g2-contact-visual">
      <img src="https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Interior acolhedor de restaurante com iluminação quente" loading="lazy"/>
      <div className="g2-contact-visual-shade"/>
      <div className="g2-contact-visual-caption"><span>09 / UMA EXPERIÊNCIA PARA RECORDAR</span><strong>O melhor momento é aquele que compartilhamos.</strong></div>
    </div>
    <div className="g2-contact-content">
      <span className="g2-contact-kicker">VENHA VIVER ESSA EXPERIÊNCIA</span>
      <h2 id="g2-contact-title">Estamos esperando <em>por você.</em></h2>
      <p className="g2-contact-intro">Um bom encontro merece uma pizza especial. Entre em contato e descubra como viver essa experiência.</p>
      <div className="g2-contact-details">
        {contactAddress&&<div className="g2-contact-detail"><span className="g2-contact-detail-icon" aria-hidden="true">⌖</span><div><strong>Onde estamos</strong><p>{contactAddress}</p></div></div>}
        {contactEmail&&<div className="g2-contact-detail"><span className="g2-contact-detail-icon" aria-hidden="true">✉</span><div><strong>E-mail</strong><a href={`mailto:${contactEmail}`}>{contactEmail}</a></div></div>}
        {whatsappHref&&<div className="g2-contact-detail"><span className="g2-contact-detail-icon" aria-hidden="true">✆</span><div><strong>WhatsApp</strong><p>Fale com nossa equipe pelo WhatsApp.</p></div></div>}
        {!contactAddress&&!contactEmail&&!whatsappHref&&<div className="g2-contact-detail"><span className="g2-contact-detail-icon" aria-hidden="true">✦</span><div><strong>Uma experiência especial</strong><p>Conheça nossas especialidades e descubra o sabor da nossa cozinha.</p><a href="#produtos">Explorar especialidades ↗</a></div></div>}
      </div>
      {contactHref&&<a className="g2-contact-button" href={contactHref}>{whatsappHref?"Conversar pelo WhatsApp":"Entrar em contato"} <span aria-hidden="true">↗</span></a>}
      <span className="g2-contact-bottom">FEITO COM PAIXÃO · PARA MOMENTOS ESPECIAIS</span>
    </div>
  </section>

  </main>
  <footer className="g2-premium-footer" aria-label="Rodapé da pizzaria">
    <div className="g2-footer-top">
      <div className="g2-footer-intro"><span className="g2-footer-kicker">O SABOR DE BONS MOMENTOS</span><h2>Até a próxima <em>fatia.</em></h2><p>Tradição, cuidado e paixão em cada detalhe. Uma experiência para compartilhar.</p>{contactHref&&<a className="g2-footer-order" href={contactHref}>{whatsappHref?"Peça pelo WhatsApp":"Fazer um pedido"} <span aria-hidden="true">↗</span></a>}</div>
      <div className="g2-footer-links"><div><h3>Explore</h3><a href="#inicio">Início</a><a href="#produtos">Especialidades</a><a href="#sobre">Nossa essência</a><a href="#contato">Contato</a></div><div><h3>Contato</h3>{contactAddress&&<p>{contactAddress}</p>}{contactEmail&&<a href={`mailto:${contactEmail}`}>{contactEmail}</a>}{whatsappHref&&<a href={whatsappHref}>WhatsApp ↗</a>}{!contactAddress&&!contactEmail&&!whatsappHref&&<a href="#produtos">Conheça nossas especialidades ↗</a>}</div></div>
    </div>
    <div className="g2-footer-wordmark" aria-label={brand}><span>{brand}</span></div>
    <div className="g2-footer-bottom"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><span>FEITO COM PAIXÃO <span aria-hidden="true">✳</span> SERVIDO COM SABOR</span><a href="#inicio">Voltar ao topo ↑</a></div>
  </footer>
 </div>;
}
