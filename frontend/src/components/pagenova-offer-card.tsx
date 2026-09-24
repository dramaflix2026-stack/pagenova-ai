"use client";

import Link from "next/link";
import {
  type MouseEvent,
  useRef,
  useState,
} from "react";

const benefits = [
  "Clonador de páginas",
  "Editor visual",
  "Gerador de landing pages",
  "Minhas páginas",
  "Edição de textos",
  "Troca de imagens e links",
];

const bonuses = [
  {
    number: "01",
    oldPrice: "R$47",
    title: "Biblioteca de Estruturas de Landing Pages",
    description:
      "Estruturas para produto físico, infoproduto, serviço e SaaS.",
  },
  {
    number: "02",
    oldPrice: "R$37",
    title: "Pack de Prompts para Copy",
    description:
      "Prompts para headlines, benefícios, objeções, CTAs, FAQ e oferta.",
  },
];

export function PageNovaOfferCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState(
    "perspective(1400px) rotateX(0deg) rotateY(0deg)"
  );

  const [glow, setGlow] = useState({
    x: 50,
    y: 20,
  });

  function handleMouseMove(
    event: MouseEvent<HTMLDivElement>
  ) {
    const card = cardRef.current;

    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const percentX = x / rect.width;
    const percentY = y / rect.height;

    const rotateY = (percentX - 0.5) * 4.5;
    const rotateX = (0.5 - percentY) * 3.2;

    setTransform(
      `perspective(1400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`
    );

    setGlow({
      x: percentX * 100,
      y: percentY * 100,
    });
  }

  function resetTilt() {
    setTransform(
      "perspective(1400px) rotateX(0deg) rotateY(0deg) translateZ(0)"
    );

    setGlow({
      x: 50,
      y: 20,
    });
  }

  return (
    <div className="relative mx-auto mt-14 max-w-[840px] [perspective:1600px]">
      <div className="pointer-events-none absolute -inset-10 rounded-[54px] bg-violet-600/[0.14] blur-[65px]" />

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
        style={{
          transform,
          transformStyle: "preserve-3d",
        }}
        className="group relative transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transform-none"
      >
        <div className="relative overflow-hidden rounded-[34px] border border-violet-300/[0.22] bg-gradient-to-b from-[#1C1230] to-[#100A1D] p-[1px] shadow-[0_42px_120px_rgba(45,19,100,0.34)]">
          <div className="relative overflow-hidden rounded-[33px] border border-white/[0.05] bg-[#120C1E]/[0.97] px-7 py-9 md:px-11 md:py-11">
            <div
              className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500"
              style={{
                background: `radial-gradient(520px circle at ${glow.x}% ${glow.y}%, rgba(132,93,255,0.15), transparent 48%)`,
              }}
            />

            <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/45 to-transparent" />

            <div
              className="relative"
              style={{
                transform: "translateZ(22px)",
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#936FFF] to-[#6233F3] text-base font-black text-white shadow-[0_12px_30px_rgba(111,63,255,0.30)]">
                  N
                </div>

                <p className="mt-4 text-lg font-black tracking-[-0.03em] text-white">
                  PageNova AI
                </p>

                <p className="mt-1 text-xs text-white/40">
                  Acesso completo à plataforma
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-300">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/10">
                    ✓
                  </span>
                  Acesso completo
                </div>

                <div className="mt-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.20em] text-violet-300">
                    Acesso vitalício
                  </p>

                  <div className="mt-3 flex flex-wrap items-end justify-center gap-x-3">
                    <span className="text-6xl font-black tracking-[-0.075em] text-white md:text-7xl">
                      R$97
                    </span>

                    <span className="mb-2 text-sm text-white/35">
                      pagamento único
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-white/45">
                    Sem mensalidade na oferta atual.
                  </p>
                </div>
              </div>

              <div className="mx-auto my-9 h-px max-w-2xl bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

              <div className="text-center">
                <p className="text-xl font-black tracking-[-0.035em] text-white">
                  Clone + Crie + Edite em um só lugar
                </p>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/40">
                  Tudo que você precisa para começar, editar e continuar
                  trabalhando suas landing pages.
                </p>
              </div>

              <div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 text-left text-sm font-medium text-white/75 transition duration-500 hover:border-violet-400/25 hover:bg-violet-500/[0.06]"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/[0.14] text-[10px] font-black text-violet-300">
                      ✓
                    </span>

                    {benefit}
                  </div>
                ))}
              </div>

              <div className="mx-auto my-9 h-px max-w-2xl bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />

              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.20em] text-violet-300">
                  Você ainda recebe
                </p>

                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
                  2 bônus incluídos gratuitamente
                </h3>

                <span className="mt-4 inline-flex rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3 py-1.5 text-[10px] font-bold text-violet-200">
                  + R$84 em bônus
                </span>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {bonuses.map((bonus) => (
                  <div
                    key={bonus.number}
                    className="relative overflow-hidden rounded-2xl border border-violet-400/[0.16] bg-gradient-to-b from-violet-500/[0.08] to-violet-500/[0.025] p-6 text-center transition duration-500 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-violet-500/[0.10]"
                  >
                    <div className="pointer-events-none absolute left-1/2 top-0 h-28 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/10 blur-3xl" />

                    <div className="relative">
                      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-lg text-white">
                        ✦
                      </span>

                      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-violet-300">
                        Bônus {bonus.number}
                      </p>

                      <h4 className="mx-auto mt-2 max-w-[270px] font-bold leading-5 text-white">
                        {bonus.title}
                      </h4>

                      <p className="mx-auto mt-3 max-w-[280px] text-xs leading-5 text-white/40">
                        {bonus.description}
                      </p>

                      <div className="mt-5 flex items-center justify-center gap-2">
                        <span className="text-[10px] text-white/25 line-through">
                          {bonus.oldPrice}
                        </span>

                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300">
                          Grátis
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-white/[0.07] bg-black/15 px-5 py-5">
                <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-8">
                  <div>
                    <p className="text-[11px] text-white/35">
                      Valor total do pacote
                    </p>

                    <div className="mt-1 flex items-center justify-center gap-3">
                      <span className="text-sm text-white/25 line-through">
                        R$181
                      </span>

                      <span className="text-2xl font-black text-white">
                        R$97
                      </span>
                    </div>
                  </div>

                  <div className="hidden h-10 w-px bg-white/[0.08] sm:block" />

                  <div>
                    <p className="text-xs font-black text-emerald-300">
                      Você economiza R$84
                    </p>

                    <p className="mt-1 text-[10px] text-white/30">
                      Os dois bônus já estão incluídos.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="https://pay.kiwify.com.br/cMMBGQH"
                className="group/cta relative mt-6 flex min-h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#8A61FF] via-[#7447FF] to-[#6534F2] px-6 text-sm font-black text-white shadow-[0_18px_48px_rgba(109,61,255,0.28)] transition duration-500 hover:-translate-y-0.5 hover:shadow-[0_24px_65px_rgba(109,61,255,0.40)]"
              >
                <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/4 skew-x-[-22deg] bg-white/[0.13] blur-sm transition-all duration-700 group-hover/cta:left-[120%]" />

                <span className="relative flex items-center gap-3">
                  Quero acessar a PageNova
                  <span className="transition-[transform,box-shadow] duration-500 group-hover/cta:translate-x-1">
                    →
                  </span>
                </span>
              </Link>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-medium text-white/30">
                <span>✓ Pagamento único</span>
                <span>✓ Acesso imediato</span>
                <span>✓ Sem mensalidade</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}