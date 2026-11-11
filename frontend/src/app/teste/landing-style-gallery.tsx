"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import "./landing-style-gallery.css";

type Locale = "pt" | "en" | "es";
type StyleId = "institucional" | "cinematografico" | "3d-imersivo";

/** Configure the individual published demo destinations here once supplied. */
const styleLinks: Record<StyleId, string | null> = {
  institucional: null,
  cinematografico: null,
  "3d-imersivo": null,
};

const styles: { id: StyleId; alt: Record<Locale, string> }[] = [
  {
    id: "institucional",
    alt: {
      pt: "Institucional: exemplo visual de site de arquitetura profissional",
      en: "Institutional: visual example of a professional architecture website",
      es: "Institucional: ejemplo visual de un sitio profesional de arquitectura",
    },
  },
  {
    id: "cinematografico",
    alt: {
      pt: "Cinematográfico: exemplo visual de site com iluminação e narrativa cinematográfica",
      en: "Cinematic: visual example of a storytelling website with dramatic lighting",
      es: "Cinematográfico: ejemplo visual de un sitio con narrativa e iluminación cinematográficas",
    },
  },
  {
    id: "3d-imersivo",
    alt: {
      pt: "3D Imersivo: exemplo visual de site com profundidade e elementos tridimensionais",
      en: "Immersive 3D: visual example of a website with depth and three-dimensional elements",
      es: "3D Inmersivo: ejemplo visual de un sitio con profundidad y elementos tridimensionales",
    },
  },
];

const translations = {
  pt: {
    eyebrow: "TRÊS ESTILOS DE SITES",
    titleStart: "Três estilos.",
    titleEnd: "Infinitas possibilidades.",
    description: "Escolha a experiência visual que combina com a sua ideia.",
    note: "Artes demonstrativas dos estilos disponíveis. Não representam projetos publicados de clientes.",
    cta: "Começar meu projeto",
    open: "Abrir estilo",
  },
  en: {
    eyebrow: "THREE WEBSITE STYLES",
    titleStart: "Three styles.",
    titleEnd: "Endless possibilities.",
    description: "Choose the visual experience that fits your idea.",
    note: "Illustrative examples of available styles, not published client projects.",
    cta: "Start my project",
    open: "Open style",
  },
  es: {
    eyebrow: "TRES ESTILOS DE SITIOS",
    titleStart: "Tres estilos.",
    titleEnd: "Infinitas posibilidades.",
    description: "Elige la experiencia visual ideal para tu idea.",
    note: "Imágenes ilustrativas de los estilos, no proyectos publicados de clientes.",
    cta: "Empezar mi proyecto",
    open: "Abrir estilo",
  },
} as const;

export function LandingStyleGallery() {
  const [locale, setLocale] = useState<Locale>("pt");

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

  const t = translations[locale];

  return (
    <section id="galeria" className="pn-style-gallery" aria-labelledby="pn-style-gallery-heading">
      <div className="pn-style-gallery-inner">
        <header className="pn-style-gallery-heading">
          <p className="pn-style-gallery-eyebrow">{t.eyebrow}</p>
          <h2 id="pn-style-gallery-heading">
            {t.titleStart} <span>{t.titleEnd}</span>
          </h2>
          <p>{t.description}</p>
        </header>
        <div className="pn-style-gallery-grid">
          {styles.map((style) => {
            const art = (
              <picture>
                <source
                  media="(max-width: 767px)"
                  srcSet={`/gallery-styles/${style.id}-mobile.webp`}
                />
                <img
                  src={`/gallery-styles/${style.id}-desktop.webp`}
                  alt={style.alt[locale]}
                  width={1600}
                  height={900}
                  decoding="async"
                  loading="lazy"
                />
              </picture>
            );
            const href = styleLinks[style.id];
            return (
              <article key={style.id} className="pn-style-gallery-item">
                {href ? (
                  <a href={href} aria-label={`${t.open}: ${style.alt[locale]}`}>
                    {art}
                  </a>
                ) : (
                  <div className="pn-style-gallery-art" aria-label={style.alt[locale]}>
                    {art}
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <div className="pn-style-gallery-footer">
          <p>{t.note}</p>
          <a href="/cadastro" className="pn-style-gallery-cta">
            {t.cta}<ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}