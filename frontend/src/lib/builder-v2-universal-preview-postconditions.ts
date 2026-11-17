import type {UniversalSite} from "./builder-v2-universal-operations.ts";

/** Visual contract generated from a completed move, never from chat assertions. */
export type UniversalPreviewMoveContract={
 kind:"move-section";sectionId:string;anchorId:string;direction:"before"|"after";
 heading?:{text:string;align:"left"|"center"|"right"};
 cardTitles:string[];
};
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim();

/** Only a truly new movement event creates a visual confirmation obligation. */
export function planUniversalPreviewMove<T extends UniversalSite>(before:T,after:T):UniversalPreviewMoveContract|null{
 const oldEvents=before.universalSectionEvents||[];
 const incoming=(after.universalSectionEvents||[]).slice(oldEvents.length).filter(event=>event.action==="move");
 if(incoming.length!==1)return null;
 const move=incoming[0];
 // A freshly added section carries a placement event, NOT a movement of an existing section.
 // Its proof belongs to section-new, which checks the new heading, cards and placement.
 if(!before.blocks.some(block=>block.section===move.section.id))return null;
 const anchor=move.after?.id||move.before?.id;
 if(!anchor||!move.section.id||anchor===move.section.id)return null;
 const sectionBlocks=after.blocks.filter(block=>block.section===move.section.id);
 const headings=sectionBlocks.filter(block=>block.type==="heading");
 if(!sectionBlocks.length)return null;
 const lead=headings[0];
 return {kind:"move-section",sectionId:move.section.id,anchorId:anchor,direction:move.before?"before":"after",
  ...(lead&&["center","left","right"].includes(lead.align||"")?
   {heading:{text:lead.text||"",align:lead.align as "left"|"center"|"right"}}:{}),
  cardTitles:headings.length>=4?headings.slice(1).map(block=>block.text||""):[]
 };
}

export type UniversalPreviewAuditResult={ok:boolean;reason:string};
/** Works against the actual iframe document. Never changes the page or its styles. */
export function auditUniversalPreviewMove(root:ParentNode,win:Pick<Window,"getComputedStyle">,
 plan:UniversalPreviewMoveContract):UniversalPreviewAuditResult{
 const fail=(reason:string)=>({ok:false,reason});
 const all=Array.from(root.querySelectorAll<HTMLElement>("section"));
 const isVisible=(element:HTMLElement)=>element.getClientRects().length>0
   &&win.getComputedStyle(element).display!=="none"&&win.getComputedStyle(element).visibility!=="hidden";
 const normId=(value:string)=>normalize(value).replace(/[_\s]+/g,"-");
 const isExact=(element:HTMLElement,id:string)=>[element.id,element.getAttribute("data-universal-section"),element.getAttribute("data-section-id")]
   .some(value=>!!value&&normId(value)===normId(id));
 const matchingSection=all.filter(el=>isVisible(el)&&isExact(el,plan.sectionId));
 if(matchingSection.length!==1)return fail("A seção movimentada está ausente ou duplicada na prévia.");
 const moved=matchingSection[0];
 const candidateAnchors=all.filter(el=>isVisible(el)&&(
  isExact(el,plan.anchorId)||el.id&&normId(el.id).endsWith("-"+normId(plan.anchorId))&&!el.id.startsWith("custom-")
 ));
 if(candidateAnchors.length!==1)return fail("A seção de referência não foi localizada de forma única na prévia.");
 const anchor=candidateAnchors[0];
 const inOrder=plan.direction==="after"
  ?Boolean(anchor.compareDocumentPosition(moved)&4)
  :Boolean(moved.compareDocumentPosition(anchor)&4);
 if(!inOrder)return fail("A ordem visual das seções está diferente da solicitada.");
 // The user specifically requested immediate placement. Another major section
 // must not appear between the destination and moved section.
 const between=all.filter(el=>el!==moved&&el!==anchor&&isVisible(el)&&
  (el.id||el.getAttribute("data-universal-section"))&&
  (plan.direction==="after"
   ?Boolean(anchor.compareDocumentPosition(el)&4)&&Boolean(el.compareDocumentPosition(moved)&4)
   :Boolean(moved.compareDocumentPosition(el)&4)&&Boolean(el.compareDocumentPosition(anchor)&4))
  // Child sections are not independent top-level destinations.
  &&!anchor.contains(el)&&!moved.contains(el)&&!el.contains(anchor)&&!el.contains(moved)
  &&!!(el.getAttribute("data-universal-section")||el.id.startsWith("tp10-")||el.hasAttribute("data-section-id")));
 if(between.length)return fail("Outra seção aparece entre o destino e a seção movimentada.");
 if(plan.heading){
  const heading=moved.querySelector<HTMLElement>("h1,h2,h3");
  if(!heading)return fail("Título principal não encontrado na seção movimentada.");
  if(normalize(heading.textContent||"")!==normalize(plan.heading.text))return fail("O título renderizado está diferente do título solicitado.");
  if(win.getComputedStyle(heading).textAlign!==plan.heading.align)return fail("O alinhamento do título não corresponde ao pedido.");
 }
 if(plan.cardTitles.length){
  const cards=Array.from(moved.querySelectorAll<HTMLElement>("article"));
  if(cards.length!==plan.cardTitles.length)return fail("A quantidade de cards renderizados está diferente da original.");
  const actual=cards.map(card=>normalize(card.querySelector("h3,h4")?.textContent||""));
  if(actual.some((value,index)=>value!==normalize(plan.cardTitles[index])))return fail("Os títulos dos cards foram alterados ou saíram de ordem.");
 }
 return {ok:true,reason:"Posição, título, alinhamento e cards confirmados na prévia."};
}
