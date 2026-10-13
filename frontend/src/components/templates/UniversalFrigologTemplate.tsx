"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, Clock3, HeartHandshake, MapPin, Menu, MessageCircle, ShieldCheck, Snowflake, Sparkles, Thermometer, Truck, X } from "lucide-react";
import type { UniversalSiteData } from "@/lib/frigolog-template-data";
import { validateUniversalSiteData } from "@/lib/frigolog-template-data";

/**
 * Universal version of the FRIGOLOG landing page.
 * Content, photography and theme are inputs; structure remains unchanged.
 * This component is isolated from the production template until QA is complete.
 */
/** Choose readable contrast independent of the AI brand palette. */
function pnLuminance(color: string): number {
  const channels = [1,3,5].map((i) => {
    const value = parseInt(color.slice(i,i+2),16)/255;
    return value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4;
  });
  return channels[0]!*.2126+channels[1]!*.7152+channels[2]!*.0722;
}
function pnContrast(a:string,b:string):number {
  const x=pnLuminance(a),y=pnLuminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function pnTextTokens(primary:string) {
  const ink="#172c38",white="#ffffff";
  return {
    primary:pnContrast(primary,ink)>=pnContrast(primary,white)?ink:white,
    accent:pnContrast(primary,"#e7eef2")>=4.5?primary:ink,
    button:pnContrast(primary,white)>=4.5?primary:ink,
  };
}

/**
 * Continuous, pixel-based marquee built on native scrolling: unlike a CSS
 * transform carousel, visitors can swipe in either direction at any moment.
 * Three identical sets let us silently recenter the scroll position forever.
 * Runs in the Next preview; published static sites use the equivalent runtime.
 */
function startKpiAutoscroll(rail: HTMLDivElement): () => void {
  const mobile = window.matchMedia("(max-width: 767px)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverCapable = window.matchMedia("(hover: hover)");
  const copies = Number(rail.dataset.pnKpiCount || 4);
  const speedPxPerSecond = 22;
  let period = 0;
  let positioned = false;
  let lastFrame = 0;
  let pausedUntil = 0;
  let pointerDown = false;
  let hovering = false;
  let focused = false;
  let visible = true;
  let mouseDragX: number | null = null;
  let mouseDragScroll = 0;
  let frameId = 0;

  function measure() {
    const first = rail.children.item(0) as HTMLElement | null;
    const repeat = rail.children.item(copies) as HTMLElement | null;
    period = first && repeat ? repeat.offsetLeft - first.offsetLeft : 0;
    if (!mobile.matches || period <= 0) {
      positioned = false;
      return;
    }
    if (!positioned) {
      rail.scrollLeft = period;
      positioned = true;
    }
  }
  function recenter() {
    if (period <= 0) return;
    while (rail.scrollLeft < period) rail.scrollLeft += period;
    while (rail.scrollLeft >= period * 2) rail.scrollLeft -= period;
  }
  function pause() { pausedUntil = window.performance.now() + 4000; }
  function onDown(event: PointerEvent) {
    pointerDown = true;
    pause();
    if (event.pointerType === "mouse" && mobile.matches) {
      mouseDragX = event.clientX;
      mouseDragScroll = rail.scrollLeft;
    }
  }
  function onMove(event: PointerEvent) {
    if (mouseDragX === null || !pointerDown) return;
    rail.scrollLeft = mouseDragScroll - (event.clientX - mouseDragX);
    event.preventDefault();
  }
  function onUp() {
    pointerDown = false;
    mouseDragX = null;
    pause();
  }
  function onEnter() { if (hoverCapable.matches) hovering = true; }
  function onLeave() { hovering = false; onUp(); }
  function onFocus() { focused = true; }
  function onBlur() { focused = false; pause(); }
  function tick(time: number) {
    const elapsed = lastFrame ? Math.min(time - lastFrame, 48) : 0;
    lastFrame = time;
    if (mobile.matches && !reduceMotion.matches && visible && !document.hidden && positioned &&
        !pointerDown && !hovering && !focused && time >= pausedUntil) {
      recenter();
      rail.scrollLeft += speedPxPerSecond * elapsed / 1000;
      recenter();
    }
    frameId = window.requestAnimationFrame(tick);
  }
  const observer = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver((entries) => { visible = Boolean(entries[0]?.isIntersecting); }, { threshold: 0 })
    : null;
  observer?.observe(rail);
  rail.addEventListener("pointerdown", onDown);
  rail.addEventListener("pointermove", onMove);
  rail.addEventListener("pointerup", onUp);
  rail.addEventListener("pointercancel", onUp);
  rail.addEventListener("pointerenter", onEnter);
  rail.addEventListener("pointerleave", onLeave);
  rail.addEventListener("focusin", onFocus);
  rail.addEventListener("focusout", onBlur);
  rail.addEventListener("wheel", pause, { passive: true });
  window.addEventListener("resize", measure);
  measure();
  frameId = window.requestAnimationFrame(tick);
  return () => {
    window.cancelAnimationFrame(frameId);
    observer?.disconnect();
    rail.removeEventListener("pointerdown", onDown);
    rail.removeEventListener("pointermove", onMove);
    rail.removeEventListener("pointerup", onUp);
    rail.removeEventListener("pointercancel", onUp);
    rail.removeEventListener("pointerenter", onEnter);
    rail.removeEventListener("pointerleave", onLeave);
    rail.removeEventListener("focusin", onFocus);
    rail.removeEventListener("focusout", onBlur);
    rail.removeEventListener("wheel", pause);
    window.removeEventListener("resize", measure);
  };
}

export default function UniversalFrigologTemplate({ data }: { data: UniversalSiteData }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState<number | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const kpiRail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!kpiRail.current) return;
    return startKpiAutoscroll(kpiRail.current);
  }, []);
  const errors = validateUniversalSiteData(data);
  if (errors.length) return <div role="alert">Dados inválidos para este modelo: {errors.join("; ")}</div>;

  const isReference = /frigolog/i.test(data.brand.name);
  const icons = isReference ? [Clock3, Thermometer, Truck, MapPin] : [Clock3, ShieldCheck, BadgeCheck, MapPin];
  const serviceIcons = isReference ? [Truck, Snowflake, ArrowRight, Thermometer] : [BadgeCheck, ShieldCheck, ArrowRight, HeartHandshake];
  const BrandIcon = isReference ? Snowflake : Sparkles;
  const heroWords = data.hero.title.trim().split(/\s+/);
  const heroAccent = heroWords.length >= 6 ? heroWords.slice(-3).join(" ") : "";
  const heroLeading = heroAccent ? heroWords.slice(0, -3).join(" ") + " " : data.hero.title;
  const nav = [
    { href: "#inicio", label: "Início" },
    { href: "#servicos", label: "O que fazemos" },
    { href: "#sobre", label: "Quem somos" },
    { href: "#operacao", label: "Nossa operação" },
    { href: "#contato", label: "Contato" },
  ];
  const readable = pnTextTokens(data.palette.primary);
  const theme = {
    "--primary": data.palette.primary,
    "--background": data.palette.background,
    "--foreground": data.palette.foreground,
    "--accent": data.palette.accent,
    "--pn-cta-ink": readable.primary,
    "--pn-light-accent": readable.accent,
    "--pn-action-ink": readable.button,
  } as CSSProperties;

  const showContact = () => {
    if (data.contact.ctaUrl.startsWith("#")) setQuoteOpen(true);
    else window.open(data.contact.ctaUrl, "_blank", "noopener,noreferrer");
  };

  return <div className="frigolog-template" style={theme}>
    <header className="site-header sticky top-0 z-30 border-b border-border bg-background">
      <div className="site-container flex h-full items-center justify-between gap-5">
        <a href="#inicio" className="flex min-w-0 items-center gap-3 text-primary" aria-label={data.brand.name + " — início"}>
          {data.brand.logoUrl ? <img src={data.brand.logoUrl} alt="" className="h-10 w-10 object-contain" /> : <BrandIcon className="h-10 w-10 shrink-0" />}
          <span className="min-w-0"><strong className="brand-name block">{data.brand.name}</strong><span className="brand-sub block">{data.brand.tagline}</span></span>
        </a>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Menu principal">{nav.map(item => <a key={item.href} href={item.href} className="text-[13px] text-muted-foreground hover:text-primary">{item.label}</a>)}</nav>
        <a href={data.contact.ctaUrl} onClick={e => { if (data.contact.ctaUrl.startsWith("#")) { e.preventDefault(); showContact(); } }} className="frigolog-button hidden md:inline-flex">{data.contact.ctaLabel} <ArrowUpRight size={16} /></a>
        <button type="button" data-pn-menu-toggle="1" className="frigolog-button--icon md:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
      <nav data-pn-mobile-menu="1" hidden={!menuOpen} className="absolute left-0 right-0 top-full border-b border-border bg-background p-5 shadow-md" aria-label="Menu móvel">{nav.map(item => <a key={item.href} href={item.href} className="block py-3" onClick={() => setMenuOpen(false)}>{item.label}</a>)}<a href={data.contact.ctaUrl} className="frigolog-button" onClick={e => {setMenuOpen(false);if(data.contact.ctaUrl.startsWith("#")) {e.preventDefault();showContact();}}}>{data.contact.ctaLabel}</a></nav>
    </header>
    <main id="conteudo">
      <section id="inicio" className={"hero" + (!data.hero.image.src ? " pn-photo-missing" : "")}>
        {data.hero.image.src ? <img className="hero-image" data-pn-photo="hero" src={data.hero.image.src} alt={data.hero.image.alt} onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.closest("section")?.classList.add("pn-photo-missing"); }} /> : null}
        <div className="site-container hero-content fade-in">
          <p className="eyebrow mb-6">{data.hero.eyebrow}</p>
          <h1>{heroLeading}{heroAccent ? <span className="pn-hero-accent">{heroAccent}</span> : null}</h1>
          <p className="mt-6 max-w-[480px] text-[15px] leading-7 text-muted-foreground">{data.hero.description}</p>
          <a href={data.contact.ctaUrl} onClick={e => { if (data.contact.ctaUrl.startsWith("#")) { e.preventDefault(); showContact(); } }} className="frigolog-button mt-7">{data.hero.ctaLabel} <ArrowUpRight size={17} /></a>
        </div>
      </section>
      <section className="frigolog-kpi-section" aria-label="Diferenciais">
        <div ref={kpiRail} data-pn-kpi-rail="1" data-pn-kpi-count={data.highlights.length} className="site-container frigolog-kpi-grid">
          {data.highlights.map((item, i) => {
            const Icon = icons[i];
            return <div key={i} className="frigolog-kpi-card"><span className="frigolog-kpi-icon"><Icon aria-hidden="true" /></span><div className="frigolog-kpi-copy"><p className="frigolog-kpi-value">{item.title}</p><p className="frigolog-kpi-label">{item.description}</p></div></div>;
          })}
          {[1, 2].flatMap(copy => data.highlights.map((item, i) => {
            const Icon = icons[i];
            return <div key={`repeat-${copy}-${i}`} aria-hidden="true" className="frigolog-kpi-card pn-kpi-clone"><span className="frigolog-kpi-icon"><Icon aria-hidden="true" /></span><div className="frigolog-kpi-copy"><p className="frigolog-kpi-value">{item.title}</p><p className="frigolog-kpi-label">{item.description}</p></div></div>;
          }))}
        </div>
      </section>
      <section id="servicos" className="py-20"><div className="site-container">
        <div className="text-center"><p className="eyebrow mb-3">{data.services.eyebrow}</p><h2 className="section-heading">{data.services.heading}</h2></div>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{data.services.items.map((item, i) => {
          const Icon = serviceIcons[i];
          return <article key={i} className="service-card flex min-h-[250px] flex-col rounded-lg border border-border bg-card p-6"><span className="service-icon"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-[16px] font-semibold">{item.title}</h3><p className="mt-3 text-[13px] leading-6 text-muted-foreground">{item.description}</p><a href="#contato" className="mt-auto flex items-center gap-2 pt-5 text-xs text-primary" onClick={e => { e.preventDefault(); setActiveService(i); }}>Saiba mais <ArrowUpRight size={16} /></a></article>;
        })}</div>
      </div></section>
      <section id="sobre" className={"bg-muted py-20" + (!data.about.image.src ? " pn-photo-missing" : "")}><div className="site-container grid items-center gap-12 md:grid-cols-2 md:gap-20">
        {data.about.image.src ? <figure>
          <img className="about-image w-full h-auto object-contain object-top" style={{ aspectRatio: "auto", maxHeight: "none" }} data-pn-photo="about" src={data.about.image.src} alt={data.about.image.alt} loading="lazy" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.closest("section")?.classList.add("pn-photo-missing"); }} />

        </figure> : null}
        <div><p className="eyebrow mb-4 text-center">{data.about.eyebrow}</p><h2 className="section-heading text-center">{data.about.heading}</h2>
          {data.about.paragraphs.map((paragraph,i) => <p key={i} className="mt-5 text-sm leading-7 text-muted-foreground">{paragraph}</p>)}
          <div className="mt-7 space-y-3">{data.about.benefits.map((benefit,i) => <p key={i} className="flex items-center gap-3 text-[13px]"><Check className="h-4 w-4 shrink-0 text-primary" />{benefit}</p>)}</div>
          <a href={data.contact.ctaUrl} className="frigolog-button mt-8 inline-flex" onClick={e => { if (data.contact.ctaUrl.startsWith("#")) { e.preventDefault(); showContact(); } }}>{data.about.ctaLabel} <ArrowRight size={17} /></a>
        </div>
      </div></section>
      <section id="operacao" className={(data.coverage.image.src ? "py-16 md:py-20" : "py-12 md:py-16") + (!data.coverage.image.src ? " pn-photo-missing" : "")}>
        <div className="site-container">
          <div className="mb-9 text-center">
            <p className="eyebrow mb-3">{data.coverage.eyebrow}</p>
            <h2 className="section-heading">{data.coverage.heading}</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted-foreground">{data.coverage.description}</p>
          </div>
          {data.coverage.image.src ? <img
            data-pn-photo="operation"
            src={data.coverage.image.src}
            alt={data.coverage.image.alt}
            loading="lazy"
            onError={event => { event.currentTarget.hidden = true; event.currentTarget.closest("section")?.classList.add("pn-photo-missing"); }}
            className="mx-auto mb-9 aspect-[2/1] w-full max-w-5xl rounded-xl object-contain md:aspect-[2.6/1]"
          /> : null}

          <div data-pn-operation-steps="1" className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-3">
            {(data.coverage.steps?.length ? data.coverage.steps : data.highlights.slice(0, 3)).map((item, i) =>
              <article key={i} className="rounded-xl border border-border bg-card p-5 text-left">
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-primary"><Check size={18} /></span>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            )}
          </div>
        </div>
      </section>
      <section id="contato" className="bg-primary py-16 text-primary-foreground"><div className="site-container text-center"><p className="mb-4 text-[10px] font-semibold uppercase tracking-[2px]">{data.contact.eyebrow}</p><h2 className="section-heading">{data.contact.heading}</h2><p className="mx-auto mt-4 max-w-lg text-sm">{data.contact.description}</p><a href={data.contact.ctaUrl} onClick={e => { if (data.contact.ctaUrl.startsWith("#")) { e.preventDefault(); showContact(); } }} className="frigolog-button mt-8"><MessageCircle size={18} />{data.contact.ctaLabel}<ArrowUpRight size={16} /></a></div></section>
    </main>
    <footer className="py-9"><div className="site-container flex flex-wrap items-center justify-between gap-5"><div className="flex items-center gap-4">{data.brand.logoUrl ? <img src={data.brand.logoUrl} alt="" className="h-12 w-12 object-contain" /> : <BrandIcon className="h-12 w-12 shrink-0" aria-hidden="true" />}<div><strong className="block">{data.brand.name}</strong><span className="brand-sub block">{data.brand.tagline}</span></div></div><p className="text-xs text-muted-foreground">{data.footer.copyright}</p></div></footer>
    {activeService !== null && <div role="dialog" aria-modal="true" aria-label={data.services.items[activeService].title} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setActiveService(null)}><div className="w-full max-w-md rounded-xl bg-white p-6 text-slate-900" onClick={e => e.stopPropagation()}><button type="button" className="float-right" aria-label="Fechar" onClick={() => setActiveService(null)}><X /></button><h3 className="text-xl font-semibold">{data.services.items[activeService].title}</h3><p className="mt-4">{data.services.items[activeService].description}</p><button type="button" className="frigolog-button mt-6" onClick={() => {setActiveService(null);showContact();}}>{data.contact.ctaLabel}</button></div></div>}
    {quoteOpen && <div role="dialog" aria-modal="true" aria-label={data.contact.heading} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setQuoteOpen(false)}><div className="w-full max-w-md rounded-xl bg-white p-6 text-slate-900" onClick={e => e.stopPropagation()}><button type="button" className="float-right" aria-label="Fechar" onClick={() => setQuoteOpen(false)}><X /></button><h3 className="text-xl font-semibold">{data.contact.heading}</h3><p className="mt-4">{data.contact.description}</p><button type="button" className="frigolog-button mt-6" onClick={() => setQuoteOpen(false)}>Entendido</button></div></div>}
  </div>;
}
