import type { ReactNode } from "react";

export type TimelineStep={id:string;title:string;description:string};
export function BuilderV2VerticalTimeline({heading,introduction,steps}:{heading:ReactNode;introduction?:ReactNode;steps:TimelineStep[]}){
 return <div data-pn-composition="universal-process-timeline" className="mx-auto w-full max-w-5xl px-1 py-5">
  {heading}{introduction}
  <ol className="relative ml-5 border-l border-[#a7773b] pl-7 md:ml-8 md:pl-12">
   {steps.map((step,index)=><li key={step.id} data-block-id={step.id} className="relative pb-7 last:pb-0 md:pb-9">
    <span aria-hidden="true" className="absolute -left-[44px] top-5 grid h-8 w-8 place-items-center border border-[#cf913d] bg-[#111417] text-[11px] font-bold text-[#e2a35d] md:-left-[65px]">{String(index+1).padStart(2,"0")}</span>
    <article className="border border-[#373b3e] bg-[#202226] px-5 py-6 text-white shadow-none md:px-8 md:py-8">
     <span className="mb-3 block text-xs font-semibold uppercase tracking-[.2em] text-[#e2a35d]">Etapa {String(index+1).padStart(2,"0")}</span>
     <h3 className="text-xl font-bold leading-tight text-white">{step.title}</h3>
     <p className="mt-3 text-sm leading-7 text-[#d3d5d7]">{step.description}</p>
    </article>
   </li>)}
  </ol>
 </div>;
}
