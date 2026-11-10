"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, CircleHelp, Layers3, Palette, RotateCcw, Sparkles, Type, WandSparkles } from "lucide-react";
import "./premium-ai-demo.css";

type Locale = "pt" | "en" | "es";
type Command = 0 | 1 | 2;

const copy = {
  pt: {
    eyebrow: "PERSONALIZAÇÃO COM INTELIGÊNCIA ARTIFICIAL",
    title: "Você imagina. A IA",
    highlight: "transforma.",
    description: "Peça mudanças em linguagem natural e veja seu site ganhar uma nova aparência em tempo real.",
    assistant: "Assistente PageNova",
    subtitle: "Assistente de criação",
    demo: "Demonstração interativa",
    choose: "ESCOLHA UMA ALTERAÇÃO",
    prompts: ["Mude o título e a chamada principal", "Troque as cores para um estilo premium", "Adicione uma seção de diferenciais"],
    replies: ["Título e chamada principal atualizados.", "Nova identidade visual aplicada ao projeto.", "Seção de diferenciais adicionada ao projeto."],
    applied: "Alteração aplicada",
    ready: "Escolha uma alteração para transformar o site.",
    reset: "Reiniciar",
    preview: "Prévia do site",
    live: "Atualização visual",
    before: "Antes",
    after: "Depois",
    brandSubtitle: "BRANDING & DESIGN STUDIO",
    headlineDefault: "Seu próximo nível começa aqui.",
    headlineUpdated: "Sua nova história começa aqui.",
    siteSubtitle: "Soluções que conectam ideias e negócios.",
    link: "Conhecer soluções",
    features: "Por que escolher nossa marca",
    featureItems: ["Design exclusivo", "Experiência intuitiva", "Resultados sob medida"],
    newSection: "Diferenciais que fazem a diferença",
    newItems: ["Identidade própria", "Tecnologia inteligente", "Experiência premium"],
    nav: ["Studio", "Sobre", "Contato"],
    connect: "Conhecer",
    note: "Simulação visual ilustrativa. Não envia comandos ao Builder, não consome créditos nem altera projetos reais.",
  },
  en: {
    eyebrow: "AI-POWERED CUSTOMIZATION",
    title: "You imagine. AI",
    highlight: "transforms.",
    description: "Request changes in natural language and watch your website take on a new look in real time.",
    assistant: "PageNova Assistant",
    subtitle: "Creation assistant",
    demo: "Interactive demo",
    choose: "CHOOSE A CHANGE",
    prompts: ["Change the headline and hero message", "Switch colors to a premium style", "Add a benefits section"],
    replies: ["Headline and hero message updated.", "New visual identity applied to the project.", "A new benefits section was added."],
    applied: "Change applied",
    ready: "Choose a change to transform the site.",
    reset: "Reset",
    preview: "Website preview",
    live: "Visual update",
    before: "Before",
    after: "After",
    brandSubtitle: "BRANDING & DESIGN STUDIO",
    headlineDefault: "Your next level starts here.",
    headlineUpdated: "Your new story starts here.",
    siteSubtitle: "Solutions connecting ideas and businesses.",
    link: "Explore solutions",
    features: "Why choose our brand",
    featureItems: ["Distinctive design", "Intuitive experience", "Tailored results"],
    newSection: "What makes us different",
    newItems: ["Unique identity", "Smart technology", "Premium experience"],
    nav: ["Studio", "About", "Contact"],
    connect: "Explore",
    note: "Illustrative visual simulation. No commands are sent to the actual Builder; no credits are used or real projects modified.",
  },
  es: {
    eyebrow: "PERSONALIZACIÓN CON INTELIGENCIA ARTIFICIAL",
    title: "Tú imaginas. La IA",
    highlight: "transforma.",
    description: "Pide cambios en lenguaje natural y observa cómo tu sitio cobra una nueva apariencia en tiempo real.",
    assistant: "Asistente PageNova",
    subtitle: "Asistente de creación",
    demo: "Demostración interactiva",
    choose: "ELIGE UN CAMBIO",
    prompts: ["Cambia el título y el mensaje principal", "Cambia los colores a un estilo premium", "Añade una sección de beneficios"],
    replies: ["Título y mensaje principal actualizados.", "Nueva identidad visual aplicada al proyecto.", "Sección de beneficios añadida al proyecto."],
    applied: "Cambio aplicado",
    ready: "Elige un cambio para transformar el sitio.",
    reset: "Reiniciar",
    preview: "Vista del sitio",
    live: "Actualización visual",
    before: "Antes",
    after: "Después",
    brandSubtitle: "ESTUDIO DE BRANDING Y DISEÑO",
    headlineDefault: "Tu próximo nivel comienza aquí.",
    headlineUpdated: "Tu nueva historia comienza aquí.",
    siteSubtitle: "Soluciones que conectan ideas y negocios.",
    link: "Conocer soluciones",
    features: "Por qué elegir nuestra marca",
    featureItems: ["Diseño exclusivo", "Experiencia intuitiva", "Resultados a medida"],
    newSection: "Ventajas que nos distinguen",
    newItems: ["Identidad propia", "Tecnología inteligente", "Experiencia premium"],
    nav: ["Estudio", "Nosotros", "Contacto"],
    connect: "Explorar",
    note: "Simulación visual ilustrativa. No envía comandos al Builder real, no consume créditos ni modifica proyectos reales.",
  }
} as const;

const commandIcons = [Type, Palette, Layers3] as const;

export function PremiumAiDemo() {
  const [locale, setLocale] = useState<Locale>("pt");
  const [command, setCommand] = useState<Command>(1);
  const [applied, setApplied] = useState(true);
  const [showBefore, setShowBefore] = useState(false);
  const [revision, setRevision] = useState(1);

  useEffect(() => {
    const sync = () => {
      const lang = document.documentElement.lang.toLowerCase();
      setLocale(lang.startsWith("en") ? "en" : lang.startsWith("es") ? "es" : "pt");
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);

  const t = copy[locale];
  const edited = applied && !showBefore;
  const premium = edited && command === 1;
  const newTitle = edited && command === 0;
  const extraSection = edited && command === 2;

  function choose(index: Command) {
    setCommand(index);
    setApplied(true);
    setShowBefore(false);
    setRevision(value => value + 1);
  }

  function reset() {
    setApplied(false);
    setShowBefore(false);
    setRevision(value => value + 1);
  }

  return (
    <section id="edicao-ia" className="pn-ai-premium-section" aria-labelledby="pn-ai-premium-heading">
      <div className="pn-ai-premium-ambient" aria-hidden="true" />
      <div className="pn-ai-premium-inner">
        <div className="pn-ai-premium-heading">
          <div className="pn-ai-premium-eyebrow"><Sparkles size={15} />{t.eyebrow}</div>
          <h2 id="pn-ai-premium-heading">{t.title} <span>{t.highlight}</span></h2>
          <p>{t.description}</p>
        </div>

        <div className="pn-ai-workbench">
          <div className="pn-ai-dialog">
            <header className="pn-ai-dialog-top">
              <span className="pn-ai-robot-symbol"><Sparkles size={25} fill="currentColor" /></span>
              <span className="pn-ai-dialog-brand"><strong>{t.assistant}</strong><small>{t.subtitle}</small></span>
              <span className="pn-ai-demo-pill"><WandSparkles size={14} />{t.demo}</span>
            </header>
            <div className="pn-ai-conversation" aria-live="polite">
              <div className="pn-ai-request">
                <span>{t.choose}</span>
                <p>{applied ? t.prompts[command] : t.ready}</p>
              </div>
              <div className="pn-ai-response-row">
                <span className="pn-ai-response-symbol"><Sparkles size={20} fill="currentColor" /></span>
                <div className="pn-ai-response" key={revision}>
                  <p>{applied ? t.replies[command] : t.ready}</p>
                  {applied && <strong><CheckCircle2 size={18} />{t.applied}</strong>}
                </div>
              </div>
            </div>
            <div className="pn-ai-command-box">
              <p className="pn-ai-command-label">{t.choose}</p>
              <div className="pn-ai-command-list">
                {t.prompts.map((prompt, index) => {
                  const Icon = commandIcons[index];
                  const selected = applied && command === index;
                  return (
                    <button
                      type="button"
                      key={index}
                      aria-pressed={selected}
                      onClick={() => choose(index as Command)}
                      className={"pn-ai-command" + (selected ? " is-active" : "")}
                    >
                      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                      <span>{prompt}</span>
                      <ArrowUpRight size={18} className="pn-ai-command-arrow" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <div className="pn-ai-command-footer">
                <button type="button" onClick={reset} className="pn-ai-reset"><RotateCcw size={15} />{t.reset}</button>
                <span>{applied ? command + 1 : 0}/3</span>
              </div>
            </div>
          </div>

          <div className={"pn-ai-preview" + (premium ? " is-premium" : "")}>
            <header className="pn-ai-preview-top">
              <div className="pn-ai-preview-headlabel"><span className="pn-ai-dots" aria-hidden="true"><i/><i/><i/></span><span>{t.preview}</span></div>
              <span className="pn-ai-live"><span/>{t.live}</span>
            </header>
            <div className="pn-ai-preview-pad">
              <div className="pn-ai-site" key={"site-" + revision + "-" + String(showBefore)}>
                <div className="pn-ai-site-header">
                  <span className="pn-ai-site-logo">ATELIER<span>.</span></span>
                  <div className="pn-ai-site-nav">{t.nav.map(item => <span key={item}>{item}</span>)}</div>
                  <span className="pn-ai-site-small-cta">{t.connect}</span>
                </div>
                <div className="pn-ai-site-hero">
                  <div className="pn-ai-site-hero-copy">
                    <div className="pn-ai-site-overline">{t.brandSubtitle}</div>
                    <h3>{newTitle ? t.headlineUpdated : t.headlineDefault}</h3>
                    <p>{t.siteSubtitle}</p>
                    <span className="pn-ai-site-button">{t.link} <ArrowRight size={17} /></span>
                  </div>
                  <div className="pn-ai-site-art" aria-hidden="true">
                    <span className="pn-ai-art-orbit pn-ai-orbit-one" />
                    <span className="pn-ai-art-orbit pn-ai-orbit-two" />
                    <span className="pn-ai-art-center"><Sparkles size={45} fill="currentColor" strokeWidth={1}/></span>
                  </div>
                </div>
                <div className="pn-ai-site-features">
                  <strong>{t.features}</strong>
                  <div className="pn-ai-site-features-grid">
                    {t.featureItems.map(feature => <span key={feature}><Check size={16} />{feature}</span>)}
                  </div>
                </div>
                {extraSection && (
                  <div className="pn-ai-extra-section">
                    <strong><Sparkles size={16}/>{t.newSection}</strong>
                    <div>{t.newItems.map(item => <span key={item}><Check size={14}/>{item}</span>)}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="pn-ai-preview-bottom">
              <div className="pn-ai-compare" role="group" aria-label={t.before + " / " + t.after}>
                <button type="button" aria-pressed={showBefore} className={showBefore ? "selected" : ""} onClick={() => setShowBefore(true)}>{t.before}</button>
                <span>/</span>
                <button type="button" aria-pressed={!showBefore} className={!showBefore ? "selected" : ""} onClick={() => setShowBefore(false)}>{t.after}</button>
              </div>
              <span className="pn-ai-preview-success"><CheckCircle2 size={17} />{applied && !showBefore ? t.applied : t.preview}</span>
            </div>
          </div>
        </div>
        <p className="pn-ai-disclaimer"><span/><CircleHelp size={16}/>{t.note}<span/></p>
      </div>
    </section>
  );
}
