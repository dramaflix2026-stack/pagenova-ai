"use client";

import {createPortal} from "react-dom";
import {type ReactNode,useEffect,useMemo,useState} from "react";

type EditableBlock={id:string;section?:string;type:string;text?:string};
type Section={id:string;title:string;introduction:string;cards:{id:string;title:string;description:string}[]};

export function TP10UniversalCustomSections({blocks,children}:{blocks:EditableBlock[];children:ReactNode}){
 const sections=useMemo(()=>{
  const grouped=new Map<string,EditableBlock[]>();
  for(const block of blocks){
   if(!block.section?.startsWith("custom-"))continue;
   const group=grouped.get(block.section)||[];
   group.push(block);grouped.set(block.section,group);
  }
  return [...grouped].map(([id,items]):Section=>{
   const title=items.find(b=>b.type==="heading")?.text||id.replace(/^custom-/,"").replace(/-/g," ");
   const rest=items.slice(1).filter(b=>b.type==="heading"||b.type==="paragraph");
   const cards:Section["cards"]=[];
   let introduction="";
   for(let i=0;i<rest.length;i++){
    const item=rest[i];
    if(item.type==="heading"){
     const next=rest[i+1];
     cards.push({id:item.id,title:item.text||"",description:next?.type==="paragraph"?next.text||"":""});
     if(next?.type==="paragraph")i++;
    }else{
     const text=item.text||"";
     const split=text.match(/^([^:：—–]{2,100})\s*[:：—–]\s*(.+)$/);
     if(split)cards.push({id:item.id,title:split[1].trim(),description:split[2].trim()});
     else if(!introduction)introduction=text;
    }
   }
   return {id,title,introduction,cards};
  });
 },[blocks]);
 const [mount,setMount]=useState<HTMLElement|null>(null);
 useEffect(()=>{
  if(!sections.length)return;
  const host=document.createElement("div");
  host.setAttribute("data-pn-tp10-universal-sections","true");
  let observer:MutationObserver|null=null;
  const attach=()=>{
   const root=document.querySelector("[data-pn-tp10-custom-host]");
   if(!root)return false;
   const target=root.querySelector("#tp10-depoimentos,#tp10m2-reviews,#tp10m3-reviews");
   if(!target?.parentElement)return false;
   target.parentElement.insertBefore(host,target);
   setMount(host);
   return true;
  };
  if(!attach()){
   observer=new MutationObserver(()=>{if(attach()){observer?.disconnect();observer=null;}});
   observer.observe(document.body,{subtree:true,childList:true});
  }
  return ()=>{observer?.disconnect();setMount(null);host.remove();};
 },[sections]);
 return <div data-pn-tp10-custom-host="true">{children}{mount?createPortal(sections.map(section=><section key={section.id} id={section.id} data-universal-section={section.id} className="bg-[#f4f6f4] px-6 py-16 text-[#14251f] md:px-12 md:py-24"><div className="mx-auto max-w-6xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#587061]">Metodologia e diferenciais</p><h2 className="mb-6 text-3xl font-bold md:text-5xl">{section.title}</h2>{section.introduction&&<p className="mb-8 max-w-3xl text-base leading-7">{section.introduction}</p>}<div className="grid gap-5 md:grid-cols-3">{section.cards.map(card=><article key={card.id} data-block-id={card.id} className="rounded-2xl border border-[#dce5dc] bg-white p-7 shadow-sm"><h3 className="mb-3 text-xl font-bold">{card.title}</h3><p className="leading-7 text-[#42564b]">{card.description}</p></article>)}</div></div></section>),host):null}</div>;
}
