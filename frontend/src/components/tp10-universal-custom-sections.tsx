"use client";

import {createPortal} from "react-dom";
import {type ReactNode,useEffect,useMemo,useRef,useState} from "react";
import type {UniversalSectionEvent} from "@/lib/builder-v2-universal-operations";

type EditableBlock={id:string;section?:string;type:string;text?:string;align?:string;src?:string};
type Section={id:string;title:string;headingAlign:"left"|"center"|"right";introduction:string;cards:{id:string;title:string;description:string;image?:string}[]};
type Placement={anchorId:string;direction:"before"|"after"};

const norm=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[_\s]+/g,"-");
const anchorAliases:Record<string,string[]>={
 faq:["tp10-faq","tp10m2-faq","tp10m3-faq"],
 testimonials:["tp10-depoimentos","tp10m2-reviews","tp10m3-reviews"],
 depoimentos:["tp10-depoimentos","tp10m2-reviews","tp10m3-reviews"],
 reviews:["tp10-depoimentos","tp10m2-reviews","tp10m3-reviews"],
 contact:["tp10-matriculas","tp10m2-contact","tp10m3-contact","tp9-contato","tp9v3-contact","tp9m3-contact","tp9-orcamento"],
 contato:["tp10-matriculas","tp10m2-contact","tp10m3-contact","tp9-contato","tp9v3-contact","tp9m3-contact","tp9-orcamento"],
 cursos:["tp10-cursos","tp10m2-courses","tp10m3-courses"],
 gallery:["tp10-galeria","tp10m2-gallery","tp10m3-gallery"],
 galeria:["tp10-galeria","tp10m2-gallery","tp10m3-gallery"],
 metodologia:["tp10-metodologia","tp10m2-method","tp10m3-method"],
 services:["tp9-servicos","tp9v3-services","tp9m3-services"],
 servicos:["tp9-servicos","tp9v3-services","tp9m3-services"],
 differences:["tp10-diferenciais","tp10m2-difference","tp10m3-difference"]
};

export function resolveTP10CustomPlacement(blocks:EditableBlock[],events:UniversalSectionEvent[],sectionId:string):Placement|null{
 // The latest verified intent wins. Block order alone is unreliable for TP10
 // because the approved sections are rendered by independent React components.
 const event=[...events].reverse().find(item=>item.action==="move"&&item.section.id===sectionId&&(item.after||item.before));
 if(event?.after)return {anchorId:event.after.id,direction:"after"};
 if(event?.before)return {anchorId:event.before.id,direction:"before"};
 const index=blocks.findIndex(block=>block.section===sectionId);
 if(index<0)return null;
 const previous=blocks.slice(0,index).reverse().find(block=>block.section&&!block.section.startsWith("custom-"));
 if(previous?.section)return {anchorId:previous.section,direction:"after"};
 const next=blocks.slice(index).find(block=>block.section&&!block.section.startsWith("custom-"));
 return next?.section?{anchorId:next.section,direction:"before"}:null;
}

function findVisibleTP10Anchor(root:HTMLElement,anchorId:string):HTMLElement|null{
 const normalized=norm(anchorId);
 const family=normalized==="perguntas-frequentes"||normalized==="duvidas-frequentes"?"faq":
  normalized==="depoimentos-dos-alunos"?"depoimentos":normalized;
 const canonical=/^(?:tp9|tp10)[a-z0-9-]*-(?:contato|contact)$/.test(family)?"contato":
  /^(?:tp9|tp10)[a-z0-9-]*-(?:servicos|services)$/.test(family)?"servicos":family;
 const candidates=[...new Set([anchorId,...(anchorAliases[family]||[]),...(anchorAliases[canonical]||[])])];
 const visible=(element:HTMLElement)=>element.getClientRects().length>0
  &&element.ownerDocument.defaultView?.getComputedStyle(element).display!=="none";
 const sections=Array.from(root.querySelectorAll<HTMLElement>("section,footer"));
 for(const id of candidates){
  const selected=sections.find(el=>(el.id===id||el.getAttribute("data-universal-section")===id
    ||el.getAttribute("data-section-id")===id)&&visible(el));
  if(selected)return selected;
  // Some approved templates put #tp9-contato on an anchor SPAN inside the
  // actual contact section. Never mount next to the span or behind the footer.
  const child=Array.from(root.querySelectorAll<HTMLElement>("[id]")).find(el=>el.id===id&&visible(el));
  const container=child?.closest<HTMLElement>("section,footer");
  if(container&&root.contains(container)&&visible(container))return container;
 }
 return null;
}

export function TP10UniversalCustomSections({blocks,sectionEvents=[],children,automotive=false}:{blocks:EditableBlock[];sectionEvents?:UniversalSectionEvent[];children:ReactNode;automotive?:boolean}){
 const sections=useMemo(()=>{
  const grouped=new Map<string,EditableBlock[]>();
  for(const block of blocks){
   if(!block.section?.startsWith("custom-"))continue;
   const group=grouped.get(block.section)||[];
   group.push(block);grouped.set(block.section,group);
  }
  return [...grouped].map(([id,items]):Section=>{
   const heading=items.find(b=>b.type==="heading");
   const title=heading?.text||id.replace(/^custom-/,"").replace(/-/g," ");
   const rest=items.slice(1).filter(b=>b.type==="heading"||b.type==="paragraph");
   const cards:Section["cards"]=[];
   let introduction="";
   for(let i=0;i<rest.length;i++){
    const item=rest[i];
    if(item.type==="heading"){
     const next=rest[i+1];
     cards.push({id:item.id,title:item.text||"",description:next?.type==="paragraph"?next.text||"":"",...(next?.type==="paragraph"&&next.src?{image:next.src}:{})});
     if(next?.type==="paragraph")i++;
    }else{
     const text=item.text||"";
     const split=text.match(/^([^:：—–]{2,100})\s*[:：—–]\s*(.+)$/);
     if(split)cards.push({id:item.id,title:split[1].trim(),description:split[2].trim(),...(item.src?{image:item.src}:{})});
     else if(!introduction)introduction=text;
    }
   }
   return {id,title,headingAlign:heading?.align==="center"?"center":heading?.align==="right"?"right":"left",introduction,cards};
  });
 },[blocks]);
 const [mounts,setMounts]=useState<{sectionId:string;host:HTMLElement}[]>([]);
 const rootRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
  if(!sections.length){setMounts([]);return;}
  const root=rootRef.current,doc=root?.ownerDocument;
  if(!root||!doc)return;
  const hosts=new Map<string,HTMLElement>();
  let observer:MutationObserver|null=null;
  const attach=()=>{
   const afterTail=new Map<HTMLElement,HTMLElement>();
   let changed=false;
   for(const section of sections){
    const oldHost=hosts.get(section.id);
    if(oldHost?.isConnected)continue;
    // React template switches and preview refreshes can detach an injected
    // portal host. Reattach instead of silently claiming the section exists.
    if(oldHost){oldHost.remove();hosts.delete(section.id);}
    const placement=resolveTP10CustomPlacement(blocks,sectionEvents,section.id);
    if(!placement)continue;
    const target=findVisibleTP10Anchor(root,placement.anchorId);
    if(!target?.parentElement)continue;
    const host=doc.createElement("div");
    host.setAttribute("data-pn-tp10-universal-sections","true");
    host.setAttribute("data-tp10-custom-id",section.id);
    if(placement.direction==="after"){
     const tail=afterTail.get(target)||target;
     tail.parentElement?.insertBefore(host,tail.nextSibling);
     afterTail.set(target,host);
    }else target.parentElement.insertBefore(host,target);
    hosts.set(section.id,host);changed=true;
   }
   if(changed)setMounts([...hosts].map(([sectionId,host])=>({sectionId,host})));
   // Keep observing: approved templates can rerender without this component remounting.
  };
  observer=new MutationObserver(attach);
  observer.observe(root,{subtree:true,childList:true});
  attach();
  return ()=>{observer?.disconnect();for(const host of hosts.values())host.remove();setMounts([]);};
 },[sections,blocks,sectionEvents]);
 return <div ref={rootRef} data-pn-tp10-custom-host="true" style={{display:"contents"}}>{children}{mounts.map(({sectionId,host})=>{
  const section=sections.find(item=>item.id===sectionId);
  return section?createPortal(<section id={section.id} data-universal-section={section.id} data-section-id={section.id} data-pn-generated-premium="true" className="px-6 py-16 md:px-12 md:py-24" style={{background:automotive?"#13191D":"#f4f6f4",color:automotive?"#F7F7F5":"#14251f"}}><div className="mx-auto max-w-6xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{color:automotive?"#D5B47F":"#587061"}}>{automotive?"EQUIPE · DEMONSTRAÇÃO":"Metodologia e diferenciais"}</p><h2 style={{textAlign:section.headingAlign}} className="mb-6 text-3xl font-bold md:text-5xl">{section.title}</h2>{section.introduction&&<p className="mb-8 max-w-3xl text-base leading-7">{section.introduction}</p>}<div data-universal-custom-cards className="grid gap-5 md:grid-cols-3">{section.cards.map(card=><article key={card.id} data-block-id={card.id} className="rounded-2xl border p-5 shadow-sm" style={{background:automotive?"#1E282C":"#FFFFFF",color:automotive?"#F7F7F5":"#14251f",borderColor:automotive?"#D5B47F45":"#dce5dc"}}>{card.image&&/^https:\/\//i.test(card.image)&&<img src={card.image} alt={"Fotografia ilustrativa para "+card.title} loading="eager" decoding="async" className="mb-5 aspect-[4/3] w-full rounded-lg object-cover"/>}<h3 className="mb-3 text-xl font-bold">{card.title}</h3><p className="leading-7" style={{color:automotive?"#CED6D7":"#42564b"}}>{card.description}</p></article>)}</div></div></section>,host,section.id):null;
 })}</div>;
}
