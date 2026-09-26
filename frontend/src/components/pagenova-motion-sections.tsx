"use client";

import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function PageNovaReveal({
  children,
  className = "",
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
      }}
      className={[
        className,
        "transition-[opacity,transform] duration-700 ease-out",
        "motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-7 opacity-0",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

const steps = [
  {
    number: "01",
    title: "Cole a URL ou comece do zero",
    description:
      "Clone uma landing page existente ou inicie uma nova página para sua oferta.",
  },
  {
    number: "02",
    title: "Edite do seu jeito",
    description:
      "Personalize textos, imagens, links e elementos usando o editor visual.",
  },
  {
    number: "03",
    title: "Deixe pronta para sua oferta",
    description:
      "Salve seu projeto e continue ajustando até chegar à versão que você precisa.",
  },
];

export function PageNovaHowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.22,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={sectionRef}>
      <div className="mx-auto max-w-3xl text-center">
        <PageNovaReveal>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7148FF]">
            COMO FUNCIONA
          </span>

          <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] text-[#100A1D] md:text-5xl">
            Em 3 passos, sua página começa a ganhar forma.
          </h2>
        </PageNovaReveal>
      </div>

      <div className="relative mt-14">
        <div className="pointer-events-none absolute left-[16.6%] right-[16.6%] top-[30px] hidden h-px overflow-hidden bg-[#E8E2F1] lg:block">
          <div
            className={[
              "h-full origin-left bg-gradient-to-r from-[#8A61FF] via-[#7148FF] to-[#8A61FF]",
              "transition-transform duration-[1600ms] ease-out",
              "motion-reduce:transition-none",
              active ? "scale-x-100" : "scale-x-0",
            ].join(" ")}
          />
        </div>

        <div className="relative grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => (
            <PageNovaReveal
              key={step.number}
              delay={index * 160}
              className="h-full"
            >
              <article className="group relative h-full rounded-[24px] border border-[#E7E1EE] bg-white px-7 pb-8 pt-7 shadow-[0_14px_45px_rgba(44,24,80,0.035)] transition duration-300 hover:-translate-y-1 hover:border-violet-300/80 hover:shadow-[0_24px_65px_rgba(80,47,160,0.09)]">
                <div className="relative z-10 flex h-[42px] items-center">
                  <span className="text-3xl font-black tracking-[-0.05em] text-[#7148FF] transition-transform duration-300 group-hover:scale-105">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-6 text-base font-black tracking-[-0.02em] text-[#171020]">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#746D7E]">
                  {step.description}
                </p>

                <div className="pointer-events-none absolute inset-x-8 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-violet-400/60 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            </PageNovaReveal>
          ))}
        </div>
      </div>
    </div>
  );
}

const faqItems = [
  {
    question: "Preciso saber programar?",
    answer:
      "Não. A proposta da PageNova é permitir que você clone, crie e edite sua landing page visualmente, sem depender de programação para as alterações principais.",
  },
  {
    question: "Como funcionam os planos de assinatura?",
    answer:
      "Sim. O plano mensal custa R$147 por mês. Há opções trimestral, semestral e anual com menor custo mensal equivalente. A cobrança ocorre pelo período escolhido.",
  },
  {
    question: "Posso editar a página depois de criar?",
    answer:
      "Sim. Você pode abrir seus projetos e continuar ajustando textos, imagens, links e outros elementos disponíveis no editor.",
  },
  {
    question: "Posso começar uma página sem ter uma URL para clonar?",
    answer:
      "Sim. Além do clonador, a PageNova possui o fluxo de criação de uma nova landing page para quem prefere começar do zero.",
  },
];

export function PageNovaFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      <PageNovaReveal className="mx-auto max-w-3xl text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7148FF]">
          FAQ
        </span>

        <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] text-[#100A1D] md:text-5xl">
          Dúvidas frequentes
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#746D7E]">
          As principais respostas antes de começar com a PageNova.
        </p>
      </PageNovaReveal>

      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {faqItems.map((item, index) => {
          const open = openIndex === index;

          return (
            <PageNovaReveal
              key={item.question}
              delay={index * 90}
            >
              <div
                className={[
                  "overflow-hidden rounded-2xl border bg-white",
                  "transition-[border-color,box-shadow] duration-300",
                  open
                    ? "border-violet-300 shadow-[0_16px_45px_rgba(89,54,160,0.08)]"
                    : "border-[#E8E3EE]",
                ].join(" ")}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => {
                    setOpenIndex(
                      open ? null : index
                    );
                  }}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                >
                  <span className="text-sm font-bold text-[#171020] md:text-base">
                    {item.question}
                  </span>

                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      "border border-violet-200 bg-violet-50 text-lg font-light text-[#7148FF]",
                      "transition-transform duration-300",
                      open ? "rotate-45" : "rotate-0",
                    ].join(" ")}
                  >
                    +
                  </span>
                </button>

                <div
                  className={[
                    "grid transition-[grid-template-rows,opacity] duration-400 ease-out",
                    "motion-reduce:transition-none",
                    open
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 pr-16 text-sm leading-6 text-[#746D7E]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </PageNovaReveal>
          );
        })}
      </div>
    </div>
  );
}