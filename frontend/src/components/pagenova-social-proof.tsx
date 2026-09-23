"use client";

import { useEffect, useMemo, useState } from "react";

type Purchase = {
  name: string;
  city: string;
  initials: string;
  purchase: string;
  avatar: string;
};

const purchases: Purchase[] = [
  {
    name: "Lucas Almeida",
    city: "Campinas, SP",
    initials: "LA",
    purchase: "Acesso completo à PageNova AI",
    avatar:
      "https://i.pravatar.cc/160?img=12",
  },
  {
    name: "Fernanda Ribeiro",
    city: "Curitiba, PR",
    initials: "FR",
    purchase: "PageNova AI + bônus inclusos",
    avatar:
      "https://i.pravatar.cc/160?img=47",
  },
  {
    name: "Gustavo Martins",
    city: "Belo Horizonte, MG",
    initials: "GM",
    purchase: "Acesso vitalício à PageNova AI",
    avatar:
      "https://i.pravatar.cc/160?img=11",
  },
  {
    name: "Camila Nogueira",
    city: "Florianópolis, SC",
    initials: "CN",
    purchase: "PageNova AI — acesso completo",
    avatar:
      "https://i.pravatar.cc/160?img=32",
  },
  {
    name: "Rodrigo Carvalho",
    city: "Goiânia, GO",
    initials: "RC",
    purchase: "PageNova AI + Pack de Prompts",
    avatar:
      "https://i.pravatar.cc/160?img=14",
  },
  {
    name: "Beatriz Oliveira",
    city: "Recife, PE",
    initials: "BO",
    purchase: "Acesso completo à PageNova AI",
    avatar:
      "https://i.pravatar.cc/160?img=45",
  },
];

const testimonials = [
  {
    avatar: "https://i.pravatar.cc/160?img=3",
    name: "Carlos Mendes",
    city: "SÃ£o Paulo, SP",
    role: "Empreendedor digital",
    text: "Ter criaÃ§Ã£o, ediÃ§Ã£o e organizaÃ§Ã£o no mesmo ambiente deixa o processo muito mais direto.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=44",
    name: "Juliana Ferreira",
    city: "Curitiba, PR",
    role: "Produtora digital",
    text: "O fluxo reÃºne as principais etapas para trabalhar uma landing page sem espalhar tudo em vÃ¡rias ferramentas.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=13",
    name: "Bruno Martins",
    city: "Belo Horizonte, MG",
    role: "Prestador de serviÃ§os",
    text: "A proposta de comeÃ§ar uma pÃ¡gina e continuar os ajustes dentro do mesmo fluxo facilita bastante o trabalho.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=49",
    name: "Larissa Monteiro",
    city: "FlorianÃ³polis, SC",
    role: "Social media",
    text: "Consigo estruturar a pÃ¡gina e visualizar a oferta com muito mais rapidez durante a criaÃ§Ã£o.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=15",
    name: "Matheus Oliveira",
    city: "GoiÃ¢nia, GO",
    role: "Gestor de trÃ¡fego",
    text: "Centralizar clonagem e ediÃ§Ã£o torna muito mais simples preparar pÃ¡ginas para diferentes campanhas.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=48",
    name: "Renata Alves",
    city: "Recife, PE",
    role: "Infoprodutora",
    text: "A interface Ã© direta e ajuda a sair da ideia para uma pÃ¡gina organizada sem complicar o processo.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=8",
    name: "Diego Rocha",
    city: "Campinas, SP",
    role: "Designer",
    text: "O editor visual deixa o ajuste da pÃ¡gina muito mais prÃ¡tico para quem precisa trabalhar rÃ¡pido.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=36",
    name: "Ana Carolina",
    city: "Porto Alegre, RS",
    role: "Empreendedora",
    text: "Gostei principalmente da possibilidade de manter meus projetos organizados e voltar para editar quando precisar.",
  },
  {
    avatar: "https://i.pravatar.cc/160?img=18",
    name: "Felipe Costa",
    city: "Salvador, BA",
    role: "E-commerce",
    text: "Ter um fluxo Ãºnico para construir e ajustar landing pages reduz bastante o trabalho operacional.",
  },
];

export function PageNovaSocialProof() {
  const [purchaseIndex, setPurchaseIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const purchase = useMemo(
    () => purchases[purchaseIndex % purchases.length],
    [purchaseIndex],
  );

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let cycleTimer: ReturnType<typeof setTimeout> | undefined;

    const showPopup = () => {
      setImageFailed(false);
      setVisible(true);

      hideTimer = setTimeout(() => {
        setVisible(false);
      }, 5200);

      cycleTimer = setTimeout(() => {
        setPurchaseIndex((current) => (current + 1) % purchases.length);
        showPopup();
      }, 8500);
    };

    const firstTimer = setTimeout(showPopup, 1800);

    return () => {
      clearTimeout(firstTimer);

      if (hideTimer) {
        clearTimeout(hideTimer);
      }

      if (cycleTimer) {
        clearTimeout(cycleTimer);
      }
    };
  }, []);

  return (
    <>
      <section className="bg-[#F8F7FC] px-6 py-24 text-[#100B20]">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#7547FF]">
              Experiências
            </p>

            <h2 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Quem usa é quem melhor conta.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#756D82]">
              Veja como a PageNova se encaixa na rotina de quem trabalha com
              páginas, ofertas e projetos digitais.
            </p>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="group rounded-[26px] border border-[#E5E0EE] bg-white p-7 shadow-[0_18px_50px_rgba(47,32,78,0.06)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#BFAEFF] hover:shadow-[0_24px_70px_rgba(117,71,255,0.13)]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#875DFF] to-[#6333F5] shadow-[0_10px_25px_rgba(117,71,255,0.25)] ring-2 ring-[#EEE9FF]">
                    <img
                      src={testimonial.avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div>
                    <p className="font-bold text-[#100B20]">
                      {testimonial.name}
                    </p>

                    <p className="mt-0.5 text-sm text-[#8A8294]">
                      {testimonial.role}
                    </p>
                    <p className="mt-0.5 text-xs text-[#A099AA]">
                      {testimonial.city}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-1 text-[#7547FF]">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>

                <p className="mt-5 text-[15px] leading-7 text-[#51495D]">
                  “{testimonial.text}”
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <aside
        aria-live="polite"
        className={[
          "pointer-events-none fixed bottom-5 left-5 z-[90]",
          "w-[calc(100vw-40px)] max-w-[350px]",
          "transition-all duration-500 ease-out",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden rounded-[20px] border border-white/[0.14] bg-[#151020]/[0.97] shadow-[0_22px_70px_rgba(8,5,21,0.42)] backdrop-blur-xl">
          <div className="flex items-center gap-3.5 p-4">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#8A61FF] to-[#6232F5] shadow-[0_8px_24px_rgba(117,71,255,0.28)]">
              {!imageFailed ? (
                <img
                  src={purchase.avatar}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-black text-white">
                  {purchase.initials}
                </div>
              )}

              <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[14px] font-extrabold text-white">
                  {purchase.name}
                </p>

                <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-300">
                  compra
                </span>
              </div>

              <p className="mt-0.5 truncate text-[11px] text-white/45">
                {purchase.city}
              </p>

              <p className="mt-2 text-[12px] font-semibold leading-4 text-white/85">
                {purchase.purchase}
              </p>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-sm font-black text-emerald-300">
              ✓
            </div>
          </div>

          <div className="h-px bg-white/[0.08]">
            <div
              key={purchaseIndex}
              className="h-full bg-gradient-to-r from-[#875DFF] via-[#A987FF] to-transparent"
              style={{
                animation: visible
                  ? "pagenovaPurchaseProgress 5.2s linear forwards"
                  : "none",
              }}
            />
          </div>
        </div>
      </aside>

      <style jsx global>{`
        @keyframes pagenovaPurchaseProgress {
          from {
            width: 0%;
          }

          to {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          aside {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}