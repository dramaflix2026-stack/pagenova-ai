import type { ReactNode } from "react";

export type TimelineStep = { id: string; title: string; description: string };

/** Dedicated semantic composition. The surrounding template must not reskin its cards. */
export function BuilderV2VerticalTimeline({
  heading,
  introduction,
  steps,
}: {
  heading: ReactNode;
  introduction?: ReactNode;
  steps: TimelineStep[];
}) {
  return (
    <div data-pn-composition="universal-process-timeline" className="mx-auto w-full max-w-5xl px-1 py-6">
      {heading}
      {introduction}
      <ol className="relative ml-4 mt-9 border-l-2 border-[#b78245] pl-6 md:ml-7 md:pl-10" style={{borderLeft:"2px solid #b78245"}}>
        {steps.map((step, index) => (
          <li key={step.id} data-block-id={step.id} className="relative pb-6 last:pb-0 md:pb-8">
            <span
              aria-hidden="true"
              className="absolute -left-[42px] top-5 z-10 grid h-8 w-8 place-items-center border border-[#d3a063] bg-[#111417] text-xs font-bold text-[#f0b674] md:-left-[57px]"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="pn-process-timeline-card px-5 py-6 md:px-8 md:py-8" style={{background:"#202226",border:"1px solid #373b3e",borderRadius:4,boxShadow:"none",color:"#fff",minHeight:0}}>
              <span className="pn-process-timeline-kicker mb-3 block text-xs font-semibold uppercase tracking-[.2em]">
                Etapa {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-bold leading-snug">{step.title}</h3>
              <p className="mt-3 text-sm leading-7">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
