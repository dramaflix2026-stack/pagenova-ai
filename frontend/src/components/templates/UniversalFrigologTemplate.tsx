"use client";

import { useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Check, Clock3, MapPin, Menu, MessageCircle, Snowflake, Thermometer, Truck, X } from "lucide-react";
import type { UniversalSiteData } from "@/lib/frigolog-template-data";
import { validateUniversalSiteData } from "@/lib/frigolog-template-data";

/**
 * Universal version of the FRIGOLOG landing page.
 * Content, photography and theme are inputs; structure remains unchanged.
 * This component is isolated from the production template until QA is complete.
 */
export default function UniversalFrigologTemplate({ data }: { data: UniversalSiteData }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState<number | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const errors = validateUniversalSiteData(data);
  if (errors.length) return <div role="alert">Dados inválidos para este modelo: {errors.join("; ")}</div>;

  const icons = [Clock3, Thermometer, Truck, MapPin];
  const serviceIcons = [Truck, Snowflake, ArrowRight, Thermometer];
  const nav = [
    { href: "#inicio", label: "Início" },
    { href: "#servicos", label: "O que fazemos" },
    { href: "#sobre", label: "Quem somos" },
    { href: "#operacao", label: "Nossa operação" },
    { href: "#contato", label: "Contato" },
  ];
  const theme = {
    "--primary": data.palette.primary,
    "--background": data.palette.background,
    "--foreground": data.palette.foreground,
    "--accent": data.palette.accent,
  } as CSSProperties;

  const showContact = () => {
    if (data.contact.ctaUrl.startsWith("#")) setQuoteOpen(true);
    else window.open(data.contact.ctaUrl, "_blank", "noopener,noreferrer");
  };

  return <div className="frigolog-template" style={theme}>
    <header className="site-header sticky top-0 z-30 border-b border-border bg-background">
      <div className="site-container flex h-full items-center justify-between gap-5">
        <a href="#inicio" className="flex min-w-0 items-center gap-3 text-primary" aria-label={data.brand.name + " — início"}>
          {data.brand.logoUrl ? <img src={data.brand.logoUrl} alt="" className="h-10 w-10 object-contain" /> : <Snowflake className="h-10 w-10 shrink-0" />}
          <span className="min-w-0"><strong className="brand-name block">{data.brand.name}</strong><span className="brand-sub block">{data.brand.tagline}</span></span>
        </a>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Menu principal">{nav.map(item => <a key={item.href} href={item.href} className="text-[13px] text-muted-foreground hover:text-primary">{item.label}</a>)}</nav>
        <button type="button" onClick={showContact} className="frigolog-button hidden md:inline-flex">{data.contact.ctaLabel} <ArrowUpRight size={16} /></button>
        <button type="button" className="frigolog-button--icon md:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      {menuOpen && <nav className="absolute left-0 right-0 top-full border-b border-border bg-background p-5 shadow-md" aria-label="Menu móvel">{nav.map(item => <a key={item.href} href={item.href} className="block py-3" onClick={() => setMenuOpen(false)}>{item.label}</a>)}<button type="button" className="frigolog-button" onClick={() => {setMenuOpen(false);showContact();}}>{data.contact.ctaLabel}</button></nav>}
    </header>
    <main>
      <section id="inicio" className="hero">
        <img className="hero-image" src={data.hero.image.src} alt={data.hero.image.alt} />
        <div className="site-container hero-content fade-in">
          <p className="eyebrow mb-6">{data.hero.eyebrow}</p>
          <h1>{data.hero.title}</h1>
          <p className="mt-6 max-w-[480px] text-[15px] leading-7 text-muted-foreground">{data.hero.description}</p>
          <button type="button" className="frigolog-button mt-7" onClick={showContact}>{data.hero.ctaLabel} <ArrowUpRight size={17} /></button>
        </div>
      </section>
      <section className="frigolog-kpi-section" aria-label="Diferenciais">
        <div className="site-container frigolog-kpi-grid">{data.highlights.map((item, i) => {
          const Icon = icons[i];
          return <div key={i} className="frigolog-kpi-card"><span className="frigolog-kpi-icon"><Icon aria-hidden="true" /></span><div className="frigolog-kpi-copy"><p className="frigolog-kpi-value">{item.title}</p><p className="frigolog-kpi-label">{item.description}</p></div></div>;
        })}</div>
      </section>
      <section id="servicos" className="py-20"><div className="site-container">
        <div className="text-center"><p className="eyebrow mb-3">{data.services.eyebrow}</p><h2 className="section-heading">{data.services.heading}</h2></div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{data.services.items.map((item, i) => {
          const Icon = serviceIcons[i];
          return <article key={i} className="service-card flex min-h-[250px] flex-col rounded-lg border border-border bg-card p-6"><span className="service-icon"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-[16px] font-semibold">{item.title}</h3><p className="mt-3 text-[13px] leading-6 text-muted-foreground">{item.description}</p><button type="button" className="mt-auto flex items-center gap-2 pt-5 text-xs text-primary" onClick={() => setActiveService(i)}>Saiba mais <ArrowUpRight size={16} /></button></article>;
        })}</div>
      </div></section>
      <section id="sobre" className="bg-muted py-20"><div className="site-container grid items-center gap-12 md:grid-cols-2 md:gap-20">
        <img className="about-image w-full" src={data.about.image.src} alt={data.about.image.alt} loading="lazy" />
        <div><p className="eyebrow mb-4 text-center">{data.about.eyebrow}</p><h2 className="section-heading text-center">{data.about.heading}</h2>
          {data.about.paragraphs.map((paragraph,i) => <p key={i} className="mt-5 text-sm leading-7 text-muted-foreground">{paragraph}</p>)}
          <div className="mt-7 space-y-3">{data.about.benefits.map((benefit,i) => <p key={i} className="flex items-center gap-3 text-[13px]"><Check className="h-4 w-4 shrink-0 text-primary" />{benefit}</p>)}</div>
          <a href="#operacao" className="frigolog-button mt-8 inline-flex">{data.about.ctaLabel} <ArrowRight size={17} /></a>
        </div>
      </div></section>
      <section id="operacao" className="py-20"><div className="site-container"><div className="mb-9 text-center"><p className="eyebrow mb-3">{data.coverage.eyebrow}</p><h2 className="section-heading">{data.coverage.heading}</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{data.coverage.description}</p></div><img src={data.coverage.image.src} alt={data.coverage.image.alt} loading="lazy" className="aspect-[2/1] w-full rounded-md object-cover md:aspect-[2.6/1]" /></div></section>
      <section id="contato" className="bg-primary py-16 text-primary-foreground"><div className="site-container text-center"><p className="mb-4 text-[10px] font-semibold uppercase tracking-[2px]">{data.contact.eyebrow}</p><h2 className="section-heading">{data.contact.heading}</h2><p className="mx-auto mt-4 max-w-lg text-sm">{data.contact.description}</p><button type="button" className="frigolog-button mt-8" onClick={showContact}><MessageCircle size={18} />{data.contact.ctaLabel}<ArrowUpRight size={16} /></button></div></section>
    </main>
    <footer className="py-9"><div className="site-container flex flex-wrap items-center justify-between gap-5"><strong>{data.brand.name}</strong><p className="text-xs text-muted-foreground">{data.footer.copyright}</p></div></footer>
    {activeService !== null && <div role="dialog" aria-modal="true" aria-label={data.services.items[activeService].title} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setActiveService(null)}><div className="w-full max-w-md rounded-xl bg-white p-6 text-slate-900" onClick={e => e.stopPropagation()}><button type="button" className="float-right" aria-label="Fechar" onClick={() => setActiveService(null)}><X /></button><h3 className="text-xl font-semibold">{data.services.items[activeService].title}</h3><p className="mt-4">{data.services.items[activeService].description}</p><button type="button" className="frigolog-button mt-6" onClick={() => {setActiveService(null);showContact();}}>{data.contact.ctaLabel}</button></div></div>}
    {quoteOpen && <div role="dialog" aria-modal="true" aria-label={data.contact.heading} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setQuoteOpen(false)}><div className="w-full max-w-md rounded-xl bg-white p-6 text-slate-900" onClick={e => e.stopPropagation()}><button type="button" className="float-right" aria-label="Fechar" onClick={() => setQuoteOpen(false)}><X /></button><h3 className="text-xl font-semibold">{data.contact.heading}</h3><p className="mt-4">{data.contact.description}</p><button type="button" className="frigolog-button mt-6" onClick={() => setQuoteOpen(false)}>Entendido</button></div></div>}
  </div>;
}
