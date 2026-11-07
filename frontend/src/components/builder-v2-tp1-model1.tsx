"use client";

import { useState } from "react";
import type { BuilderV2SiteData } from "./builder-v2-site";
import { universalBlockProps, UniversalTypographyRules } from "./builder-v2-universal-bindings";
import { UniversalTemplateSections } from "./builder-v2-universal-sections";
import {MAKEUP_PHOTOS,MAKEUP_GALLERY_PHOTOS,MAKEUP_RE} from "@/lib/tp1-makeup-niche";
import "./builder-v2-tp1-model1.css";

const BARBER_PHOTOS = [
  "https://images.pexels.com/photos/7518731/pexels-photo-7518731.jpeg?auto=compress&cs=tinysrgb&w=1600",
  "https://images.pexels.com/photos/4625645/pexels-photo-4625645.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/7518740/pexels-photo-7518740.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/5584458/pexels-photo-5584458.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/7518746/pexels-photo-7518746.jpeg?auto=compress&cs=tinysrgb&w=1200",
];
const GALLERY_PHOTOS = [
  "https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/2076930/pexels-photo-2076930.jpeg?auto=compress&cs=tinysrgb&w=1000",
  "https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=1000",
  "https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=1000",
];
const SERVICES = [
  { name: "Corte masculino", description: "Precisão, acabamento e estilo." },
  { name: "Barba", description: "Contornos e cuidado nos detalhes." },
  { name: "Corte e barba", description: "Uma experiência completa." },
  { name: "Acabamento", description: "Detalhes que fazem a diferença." },
];
const HIGHLIGHTS = [
  { title: "Técnica e precisão", text: "Cuidado nos contornos e atenção ao acabamento." },
  { title: "Atenção individual", text: "O corte alinhado ao seu estilo e às suas preferências." },
  { title: "Estilo e identidade", text: "Da proposta clássica à contemporânea." },
];
const EXPERIENCE = [
  { title: "Conversa", text: "Entendemos suas preferências e o estilo desejado." },
  { title: "Precisão", text: "Corte e barba com atenção à técnica e aos detalhes." },
  { title: "Acabamento", text: "Finalização e ajustes para valorizar o resultado." },
];
const FAQ = [
  { question: "Como posso agendar um atendimento?", answer: "Entre em contato pelos canais informados nesta página para consultar os horários disponíveis." },
  { question: "Quais serviços posso solicitar?", answer: "Entre os serviços apresentados estão corte masculino, barba, corte e barba e acabamento. Confirme a disponibilidade ao entrar em contato." },
  { question: "Onde posso consultar valores?", answer: "Solicite os valores atualizados diretamente à barbearia antes de agendar." },
  { question: "Posso enviar uma referência do corte?", answer: "Você pode conversar com a equipe sobre o estilo desejado e consultar a possibilidade de enviar uma referência." },
];

const MAKEUP_SERVICES = [
  {name:"Maquiagem social",description:"Uma produção para suas ocasiões especiais."},
  {name:"Maquiagem para eventos",description:"Seu estilo traduzido em cores e detalhes."},
  {name:"Maquiagem para noivas",description:"Beleza delicada para um momento marcante."},
  {name:"Maquiagem editorial",description:"Expressão e criatividade para ensaios e projetos."}
];
const MAKEUP_HIGHLIGHTS = [
  {title:"Técnica e delicadeza",text:"Uma produção que valoriza seus traços naturais."},
  {title:"Atendimento individual",text:"Referências, preferências e ocasião em primeiro lugar."},
  {title:"Beleza com identidade",text:"Cores e acabamentos alinhados à sua personalidade."}
];
const MAKEUP_EXPERIENCE = [
  {title:"Conversa",text:"Conhecemos a ocasião, suas ideias e suas referências."},
  {title:"Produção",text:"Criamos sua maquiagem com atenção aos detalhes."},
  {title:"Finalização",text:"Conferimos o resultado e os ajustes desejados."}
];
const MAKEUP_FAQ = [
  {question:"Como posso agendar minha maquiagem?",answer:"Entre em contato pelos canais informados para consultar horários disponíveis."},
  {question:"Posso enviar referências da maquiagem?",answer:"Sim. Referências ajudam a alinhar o estilo e o acabamento desejados."},
  {question:"Quais serviços estão disponíveis?",answer:"Consulte o estúdio para confirmar os tipos de maquiagem, os valores e a disponibilidade."},
  {question:"Como me preparar para o atendimento?",answer:"A equipe poderá orientar os cuidados necessários conforme o tipo de produção."}
];

const DEMO_ADDRESS = "Avenida Paulista, 1578 — Bela Vista, São Paulo/SP";

export function BuilderV2TP1Model1({ site, publishedMode = false }: { site: BuilderV2SiteData; publishedMode?: boolean }) {
  const [showWhatsAppNotice, setShowWhatsAppNotice] = useState(false);
  const isMakeup=MAKEUP_RE.test(site.niche||"")||MAKEUP_RE.test(site.header?.brand||site.title||"");
  const brand = site.header?.brand || site.title || (isMakeup?"Estúdio de Maquiagem":"Barbearia");
  const photos=isMakeup?MAKEUP_PHOTOS:BARBER_PHOTOS;
  const galleryPhotos=isMakeup?MAKEUP_GALLERY_PHOTOS:GALLERY_PHOTOS;
  const services=isMakeup?MAKEUP_SERVICES:SERVICES;
  const highlights=isMakeup?MAKEUP_HIGHLIGHTS:HIGHLIGHTS;
  const experience=isMakeup?MAKEUP_EXPERIENCE:EXPERIENCE;
  const questions=isMakeup?MAKEUP_FAQ:FAQ;
  const getBlock = (section: string, type: string, index = 0) =>
    site.blocks.filter((item) => item.section === section && item.type === type)[index];
  const copy = (section: string, type: string, fallback: string, index = 0) =>
    getBlock(section, type, index)?.text?.trim() || fallback;
  const image = (section: string, fallback: string, index = 0) =>
    getBlock(section, "image", index)?.src?.trim() || fallback;
  const phone = site.footer?.whatsapp?.replace(/\D/g, "") || "";
  const whatsappHref = phone.length >= 10 ? `https://wa.me/${phone}` : undefined;
  const email = site.footer?.email?.trim();
  const address = site.footer?.address?.trim() || site.extras?.address?.trim();
  const usingDemoAddress = !address && !publishedMode;
  const displayAddress = address || (usingDemoAddress ? DEMO_ADDRESS : undefined);
  const mapSrc = displayAddress ? `https://www.google.com/maps?q=${encodeURIComponent(displayAddress)}&output=embed` : undefined;
  const mapHref = displayAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}` : undefined;
  const whatsappAction = whatsappHref ? (
    <a className="tp1m1-button tp1m1-whatsapp-button" href={whatsappHref} target="_blank" rel="noopener noreferrer">
      FALAR PELO WHATSAPP <span aria-hidden="true">↗</span>
    </a>
  ) : !publishedMode ? (
    <button className="tp1m1-button tp1m1-whatsapp-button" type="button" onClick={() => setShowWhatsAppNotice(true)}>
      FALAR PELO WHATSAPP <span aria-hidden="true">↗</span>
    </button>
  ) : null;

  return (
    <div className="tp1m1" data-tp1-model1={isMakeup?"makeup":"barbershop"}>
      <UniversalTypographyRules />
      <header className="tp1m1-header">
        <a href="#inicio" className="tp1m1-brand" aria-label={`Início — ${brand}`}>{brand}</a>
        <a href="#contato" className="tp1m1-header-cta">AGENDAR <span aria-hidden="true">↗</span></a>
      </header>

      <UniversalTemplateSections site={site}>
        <section
          id="inicio"
          data-universal-section="inicio"
          className="tp1m1-hero"
          style={{ backgroundImage: isMakeup ? `linear-gradient(90deg, rgba(249,247,243,.98) 0%, rgba(249,247,243,.89) 40%, rgba(249,247,243,.50) 72%, rgba(249,247,243,.10) 100%), url("${image("inicio", photos[0])}")` : `linear-gradient(90deg, rgba(9,9,8,.86), rgba(9,9,8,.42) 65%, rgba(9,9,8,.18)), linear-gradient(0deg, rgba(9,9,8,.68), transparent 54%), url("${image("inicio", photos[0])}")` }}
        >
          <div className="tp1m1-hero-inner">
            <span className="tp1m1-eyebrow tp1m1-hero-eyebrow"><i /> {isMakeup?"MAQUIAGEM · BELEZA · EXPRESSÃO":"BARBEARIA · ESTILO · PRECISÃO"}</span>
            <h1 {...universalBlockProps(getBlock("inicio", "heading"))}>{copy("inicio", "heading", isMakeup?"Realce sua beleza. Expresse sua essência.":"Seu estilo. Nossa assinatura.")}</h1>
            <p className="tp1m1-hero-description" {...universalBlockProps(getBlock("inicio", "paragraph"))}>{copy("inicio", "paragraph", isMakeup?"Maquiagem e beleza para valorizar sua personalidade em cada ocasião.":"Cortes, barba e uma experiência de cuidado masculino em cada detalhe.")}</p>
            <a className="tp1m1-button tp1m1-button-gold" href="#servicos" {...universalBlockProps(getBlock("inicio", "button"), true)}>
              {copy("inicio", "button", "CONHEÇA OS SERVIÇOS")} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="tp1m1-hero-bottom"><span>ESTILO EM CADA DETALHE</span><a href="#sobre">DESCUBRA <span aria-hidden="true">↓</span></a></div>
        </section>

        <section id="sobre" data-universal-section="sobre" className="tp1m1-section tp1m1-about">
          <div className="tp1m1-about-copy">
            <span className="tp1m1-eyebrow">01 <span className="tp1m1-eyebrow-line" /> NOSSA ESSÊNCIA</span>
            <h2 {...universalBlockProps(getBlock("sobre", "heading"))}>{copy("sobre", "heading", isMakeup?"A beleza que acompanha sua essência.":"Tradição no cuidado. Personalidade no resultado.")}</h2>
            <p className="tp1m1-lead" {...universalBlockProps(getBlock("sobre", "paragraph"))}>{copy("sobre", "paragraph", isMakeup?"Maquiagem profissional com sensibilidade, cuidado e atenção às suas preferências.":"Um espaço dedicado a quem valoriza técnica, atenção e identidade em cada corte.")}</p>
            <a href="#servicos" className="tp1m1-text-link">CONHEÇA NOSSOS SERVIÇOS <span aria-hidden="true">↗</span></a>
          </div>
          <div className="tp1m1-about-photo">
            <img src={image("sobre", photos[1])} alt={isMakeup?"Profissional realizando maquiagem em uma mulher":"Barbeiro realizando atendimento"} loading="lazy" {...universalBlockProps(getBlock("sobre", "image"))} />
            <span>O VALOR DOS DETALHES / 01</span>
          </div>
        </section>

        <section id="servicos" data-universal-section="servicos" className="tp1m1-section tp1m1-services">
          <div className="tp1m1-section-heading">
            <div>
              <span className="tp1m1-eyebrow">02 <span className="tp1m1-eyebrow-line" /> SERVIÇOS</span>
              <h2 {...universalBlockProps(getBlock("servicos", "heading"))}>{copy("servicos", "heading", isMakeup?"Maquiagem para cada momento especial.":"A arte de cuidar do seu estilo.")}</h2>
            </div>
            <p className="tp1m1-section-aside">{isMakeup?"BELEZA EM CADA DETALHE":"DO CORTE AO ACABAMENTO"}</p>
          </div>
          <div className="tp1m1-services-grid">
            {services.map((service, index) => (
              <article className="tp1m1-service" key={service.name}>
                <div className="tp1m1-service-photo">
                  <img src={image("servicos", photos[index + 2] || photos[1], index)} alt={service.name} loading="lazy" {...universalBlockProps(getBlock("servicos", "image", index))} />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="tp1m1-service-body">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="diferenciais" data-universal-section="diferenciais" className="tp1m1-section tp1m1-differences">
          <div className="tp1m1-differences-intro">
            <span className="tp1m1-eyebrow">03 <span className="tp1m1-eyebrow-line" /> NOSSO COMPROMISSO</span>
            <h2 {...universalBlockProps(getBlock("diferenciais", "heading"))}>{copy("diferenciais", "heading", isMakeup?"O seu jeito de brilhar.":"Cada detalhe importa.")}</h2>
            <p className="tp1m1-lead">{isMakeup?"Mais que maquiagem: um cuidado que valoriza quem você é.":"Mais que um corte: atenção à sua identidade."}</p>
          </div>
          <div className="tp1m1-difference-list">
            {highlights.map((item, index) => (
              <div className="tp1m1-difference" key={item.title}>
                <span>0{index + 1}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
                <span className="tp1m1-difference-arrow" aria-hidden="true">↗</span>
              </div>
            ))}
          </div>
        </section>

        <section id="experiencia" data-universal-section="experiencia" className="tp1m1-section tp1m1-experience">
          <div className="tp1m1-section-heading">
            <div>
              <span className="tp1m1-eyebrow">04 <span className="tp1m1-eyebrow-line" /> A EXPERIÊNCIA</span>
              <h2 {...universalBlockProps(getBlock("experiencia", "heading"))}>{copy("experiencia", "heading", isMakeup?"Sua experiência de beleza, passo a passo.":"Um atendimento pensado em cada etapa.")}</h2>
            </div>
          </div>
          <div className="tp1m1-experience-grid">
            {experience.map((step, index) => (
              <article key={step.title}>
                <span className="tp1m1-step-number">0{index + 1} / 03</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="galeria" data-universal-section="galeria" className="tp1m1-section tp1m1-gallery">
          <div className="tp1m1-section-heading">
            <div>
              <span className="tp1m1-eyebrow">05 <span className="tp1m1-eyebrow-line" /> GALERIA</span>
              <h2 {...universalBlockProps(getBlock("galeria", "heading"))}>{copy("galeria", "heading", isMakeup?"Inspirações de maquiagem e beleza.":"Estilo em cada detalhe.")}</h2>
              <p className="tp1m1-gallery-note">Imagens ilustrativas do universo {isMakeup?"da maquiagem":"da barbearia"}; não representam trabalhos realizados pela empresa.</p>
            </div>
          </div>
          <div className="tp1m1-gallery-grid">
            {galleryPhotos.map((src, index) => (
              <figure key={index}>
                <img src={image("galeria", src, index)} alt={(isMakeup?["Maquiagem profissional feminina", "Pincéis e produtos de maquiagem", "Produção de beleza", "Resultado de maquiagem artística"]:["Cuidado com a barba", "Ambiente de barbearia", "Corte e finalização de cabelo", "Detalhes de atendimento na barbearia"])[index]} loading="lazy" {...universalBlockProps(getBlock("galeria", "image", index))} />
              </figure>
            ))}
          </div>
        </section>

        <section id="faq" data-universal-section="faq" className="tp1m1-section tp1m1-faq">
          <div>
            <span className="tp1m1-eyebrow">06 <span className="tp1m1-eyebrow-line" /> PERGUNTAS FREQUENTES</span>
            <h2 {...universalBlockProps(getBlock("faq", "heading"))}>{copy("faq", "heading", "Dúvidas frequentes.")}</h2>
            <p className="tp1m1-lead">Tudo o que você precisa saber antes de visitar.</p>
          </div>
          <div className="tp1m1-faq-items">
            {questions.map((entry, index) => (
              <details key={entry.question}>
                <summary><span className="tp1m1-faq-index">0{index + 1}</span><span>{entry.question}</span><span className="tp1m1-faq-plus" aria-hidden="true" /></summary>
                <p>{entry.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contato" data-universal-section="contato" className="tp1m1-section tp1m1-contact">
          <div className="tp1m1-contact-copy">
            <span className="tp1m1-eyebrow">07 <span className="tp1m1-eyebrow-line" /> ENTRE EM CONTATO</span>
            <h2 {...universalBlockProps(getBlock("contato", "heading"))}>{copy("contato", "heading", isMakeup?"Sua próxima produção começa aqui.":"Seu próximo corte começa aqui.")}</h2>
            <p>Entre em contato para conhecer a disponibilidade de horários, serviços e valores.</p>
            {!isMakeup && whatsappAction}
            {!isMakeup && !whatsappHref && showWhatsAppNotice && (
              <p className="tp1m1-whatsapp-notice" role="status">Este botão é demonstrativo. Cadastre o número real de WhatsApp no editor para ativar o atendimento.</p>
            )}
            {email && <a className="tp1m1-contact-email" href={`mailto:${email}`}>Ou entre em contato por e-mail ↗</a>}
          </div>
          <div className="tp1m1-contact-panel">
            {mapSrc ? (
              <>
                <iframe title={usingDemoAddress ? "Mapa demonstrativo de localização" : isMakeup?"Localização cadastrada do estúdio":"Localização cadastrada da barbearia"} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                <div className="tp1m1-map-details">
                  <span className="tp1m1-map-label">{usingDemoAddress ? "ENDEREÇO DEMONSTRATIVO" : "NOSSO ENDEREÇO"}</span>
                  <p className="tp1m1-contact-address">{displayAddress}</p>
                  {usingDemoAddress && <p className="tp1m1-map-disclaimer">Exemplo para visualizar o layout. Substitua pelo endereço real antes de publicar.</p>}
                  {mapHref && <a className="tp1m1-map-link" href={mapHref} target="_blank" rel="noopener noreferrer">ABRIR NO GOOGLE MAPS <span aria-hidden="true">↗</span></a>}
                </div>
              </>
            ) : (
              <div className="tp1m1-location-placeholder"><span aria-hidden="true">◎</span><strong>LOCALIZAÇÃO</strong><p>Cadastre o endereço real para exibir o mapa e o trajeto.</p></div>
            )}
            {isMakeup && whatsappAction}
            {isMakeup && !whatsappHref && showWhatsAppNotice && (
              <p className="tp1m1-whatsapp-notice" role="status">Botão demonstrativo: cadastre o número real de WhatsApp para ativar o atendimento.</p>
            )}
          </div>
        </section>
      </UniversalTemplateSections>

      <footer id="rodape" className="tp1m1-footer" data-tp1-model1-footer="premium">
        <div className="tp1m1-footer-grid">
          <div className="tp1m1-footer-intro">
            <span className="tp1m1-eyebrow">{isMakeup?"MAQUIAGEM · BELEZA · EXPRESSÃO":"BARBEARIA · ESTILO · PRECISÃO"}</span>
            <strong>{brand}</strong>
            <p>{isMakeup?"Maquiagem, beleza feminina e atenção aos detalhes.":"Cuidado masculino, técnica e atenção aos detalhes."}</p>
          </div>
          <div>
            <h3>EXPLORE</h3>
            <nav aria-label="Navegação do rodapé">
              {[["Início", "#inicio"], ["Sobre nós", "#sobre"], ["Serviços", "#servicos"], ["Galeria", "#galeria"], ["Contato", "#contato"]].map(([title, href]) =>
                <a href={href} key={href}>{title} <span aria-hidden="true">↗</span></a>
              )}
            </nav>
          </div>
          <div>
            <h3>FALE CONOSCO</h3>
            <div className="tp1m1-footer-contact">
              {whatsappHref && <a href={whatsappHref} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}
              {email && <a href={`mailto:${email}`}>{email}</a>}
              {address && <p>{address}</p>}
              {!whatsappHref && !email && !address && <p>Consulte os canais de atendimento cadastrados.</p>}
            </div>
          </div>
        </div>
        <div className="tp1m1-footer-bottom">
          <span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span>
          <a href="#inicio">VOLTAR AO TOPO ↑</a>
        </div>
      </footer>
    </div>
  );
}
