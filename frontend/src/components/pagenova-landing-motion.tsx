"use client";

import { useEffect, useState } from "react";

const demonstrations = [
  {
    number: "01",
    title: "Criação de sites",
    description: "Do briefing à prévia das páginas.",
    source: "",
  },
  {
    number: "02",
    title: "Clonador e editor",
    description: "Da URL aos ajustes visuais do projeto.",
    source: "",
  },
  {
    number: "03",
    title: "CRM e agenda",
    description: "Organização dos leads e da rotina.",
    source: "",
  },
] as const;

function DemoVideo({
  source,
  title,
}: {
  source: string;
  title: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!source || failed) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-[#10261b] px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#65deb0]/30 bg-[#1b4833] text-lg text-[#80ecc0]">
          ▶
        </div>
        <span className="text-sm font-medium text-white/80">{title}</span>
        <span className="text-xs text-white/45">
          Gravação da plataforma em preparação
        </span>
      </div>
    );
  }

  return (
    <video
      className="aspect-video w-full bg-[#08140e] object-contain"
      src={source}
      controls
      playsInline
      preload="metadata"
      aria-label={`Vídeo: ${title}`}
      onError={() => setFailed(true)}
    >
      Seu navegador não suporta este vídeo.
    </video>
  );
}

export function PageNovaLandingMotion() {
  useEffect(() => {
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const root = document.querySelector("main");
    if (!root) return;

    const elements = Array.from(
      root.querySelectorAll(
        "section h1, section h2, section > div > p, section article, section details, section [data-pn-motion]"
      )
    ).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top > window.innerHeight * 0.85;
    });

    elements.forEach((element) => {
      element.classList.add("pn-reveal");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("pn-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -35px 0px" }
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => element.classList.remove("pn-reveal"));
      observer.disconnect();
    };
  }, []);

  return null;
}

export function PageNovaVideoShowcase() {
  return (
    <section
      id="videos"
      className="scroll-mt-20 border-t border-white/[.08] bg-[#07140d] py-20 text-white md:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[.18em] text-[#62e1ad]">
              Demonstrações
            </span>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.12] tracking-[-.05em] md:text-5xl">
              Veja a PageNova em uso.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/50 lg:justify-self-end">
            Vídeos curtos do processo real: criar, editar e organizar o trabalho.
            Cada demonstração poderá ser assistida aqui sem sair da página.
          </p>
        </div>

        <div className="mt-11 grid gap-4 lg:grid-cols-3">
          {demonstrations.map((demo) => (
            <article
              key={demo.number}
              className="overflow-hidden rounded-[18px] border border-white/10 bg-[#0d2116]"
            >
              <DemoVideo source={demo.source} title={demo.title} />
              <div className="border-t border-white/10 p-5">
                <span className="text-[11px] font-bold text-[#68e2af]">
                  {demo.number} / DEMONSTRAÇÃO
                </span>
                <h3 className="mt-3 text-lg font-semibold">{demo.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  {demo.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}