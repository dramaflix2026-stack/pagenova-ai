"use client";

import Link from "next/link";
import {ArrowRight,FolderOpen} from "lucide-react";
import {useEffect,useState} from "react";

import {resolvePageNovaContinueHref} from "@/lib/pagenova-continue-project";

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
