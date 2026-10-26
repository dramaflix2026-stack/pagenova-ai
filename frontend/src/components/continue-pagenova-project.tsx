"use client";

import Link from "next/link";
import {ArrowRight,FolderOpen} from "lucide-react";
import {useEffect,useState} from "react";

const STUDIO_STORAGE_KEY="pagenova-builder-v2-private-v1";

/**
 * A site being edited in Studio V2 is a local browser draft.
 * Resolve it locally without an API call; otherwise send the visitor to
 * their existing "Meus sites" page, which includes legacy projects.
 */
export function resolvePageNovaContinueHref(storage:Pick<Storage,"getItem"|"key"|"length">):string {
  const isEditableDraft=(key:string)=>{
    try{
      const raw=storage.getItem(key);
      if(!raw)return false;
      const data:unknown=JSON.parse(raw);
      if(!data||typeof data!=="object")return false;
      const blocks=(data as {blocks?:unknown}).blocks;
      return Array.isArray(blocks)&&blocks.length>0;
    }catch{return false;}
  };
  if(isEditableDraft(STUDIO_STORAGE_KEY))return "/app/builder-v2";

  // Imported CRM drafts have their own keys and keep their real lead ID.
  // Do not interpret :versions or unrelated values as editable projects.
  for(let i=storage.length-1;i>=0;i--){
    const key=storage.key(i);
    if(!key||!key.startsWith(STUDIO_STORAGE_KEY+":crm:"))continue;
    const projectId=key.slice((STUDIO_STORAGE_KEY+":crm:").length);
    if(!/^[a-zA-Z0-9_-]{20,40}$/.test(projectId))continue;
    if(isEditableDraft(key))return "/app/builder-v2?crmProject="+encodeURIComponent(projectId);
  }
  return "/app/paginas";
}

export function ContinuePageNovaProject(){
  const [href,setHref]=useState("/app/paginas");
  useEffect(()=>{
    try{setHref(resolvePageNovaContinueHref(window.localStorage));}catch{
      setHref("/app/paginas");
    }
  },[]);
  return <Link href={href} aria-label="Continuar meu projeto" title="Continuar meu projeto ou abrir meus sites"
    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/[.055] px-2.5 py-2 text-xs font-semibold text-white/85 transition hover:border-lime-300/45 hover:bg-white/[.09] sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm">
    <FolderOpen size={16} className="shrink-0"/>
    <span className="sm:hidden">Continuar</span>
    <span className="hidden sm:inline">Continuar projeto</span>
    <ArrowRight size={14} className="shrink-0"/>
  </Link>;
}
