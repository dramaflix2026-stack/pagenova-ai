import type { ReactNode } from "react";
import type { EngineeringCompositionId } from "@/lib/builder-v2-engineering-compositions";

export type EngineeringEditorialCard = {
  id: string;
  title: string;
  description: string;
};

type Props = {
  composition: EngineeringCompositionId;
  cards: EngineeringEditorialCard[];
  heading?: ReactNode;
  introduction?: ReactNode;
};

export function EngineeringEditorialCards({ composition, cards, heading, introduction }: Props) {
  return (
    <div data-pn-composition={composition} className="mx-auto w-full max-w-6xl">
      {heading}
      {introduction}
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((card, index) => (
          <article key={card.id} data-block-id={card.id} className="relative min-w-0 border border-[#36383c] bg-[#202226] px-6 pb-8 pt-7 text-white md:px-8 md:pb-10">
            <span aria-hidden="true" className="absolute left-0 top-0 h-[3px] w-14 bg-[#cf913d]" />
            <div className="mb-8 flex items-start justify-between gap-4">
              <span aria-hidden="true" className="text-[4.5rem] font-light leading-none tracking-[-.08em] text-[#858789]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center border border-[#b97932] text-xl text-[#d9953c]">
                ◇
              </span>
            </div>
            <div aria-hidden="true" className="mb-5 h-[2px] w-9 bg-[#cf913d]" />
            <h3 className="text-xl font-bold leading-tight tracking-tight text-white">{card.title}</h3>
            <p className="mt-4 text-sm leading-7 text-[#c8cbce]">{card.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
