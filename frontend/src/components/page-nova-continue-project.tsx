"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {ArrowRight,FolderOpen,Play} from "lucide-react";

/**
 * Only present "Continuar meu projeto" when a real local Studio draft exists.
 * The Studio already restores the draft from this key automatically.
 * Other users retain a useful route to the project library instead.
 */
const studioDraftKey="pagenova-builder-v2-private-v1";

export function PageNovaContinueProject(){
  const [hasStudioDraft,setHasStudioDraft]=useState(false);
  useEffect(()=>{
    try{
      const raw=window.localStorage.getItem(studioDraftKey);
      if(!raw)return;
      const parsed=JSON.parse(raw) as {blocks?:unknown};
      setHasStudioDraft(Array.isArray(parsed.blocks)&&parsed.blocks.length>0);
    }catch{
      setHasStudioDraft(false);
    }
  },[]);

  return <Link
    href={hasStudioDraft?"/app/builder-v2":"/app/paginas"}
    aria-label={hasStudioDraft?"Continuar meu projeto no PageNova Studio":"Ver meus projetos"}
    className="inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/[.055] px-2.5 py-2.5 text-[12px] font-semibold text-white/85 transition hover:border-lime-300/40 hover:bg-white/[.09] sm:min-h-12 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
  >
    {hasStudioDraft?<Play size={16} className="shrink-0 text-lime-300"/>:<FolderOpen size={16} className="shrink-0 text-white/80"/>}
    <span className="truncate sm:hidden">{hasStudioDraft?"Continuar projeto":"Meus projetos"}</span>
    <span className="hidden sm:inline">{hasStudioDraft?"Continuar meu projeto":"Meus projetos"}</span>
    <ArrowRight size={14} className="hidden shrink-0 sm:inline"/>
  </Link>;
}
