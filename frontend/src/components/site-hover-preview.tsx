"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Globe2, LoaderCircle } from "lucide-react";

type Props = { html?: string; remoteProjectId?: string; title: string; imageUrl?: string | null };
/** The iframe is sandboxed: pasted third-party scripts cannot execute. */
export function SiteHoverPreview({html,remoteProjectId,title,imageUrl}:Props) {
  const root=useRef<HTMLDivElement>(null);
  const frame=useRef<HTMLIFrameElement>(null);
  const raf=useRef<number|null>(null);
  const [visible,setVisible]=useState(false);
  const [remote,setRemote]=useState("");
  const [loading,setLoading]=useState(false);
  const [frameReady,setFrameReady]=useState(false);
  const [playing,setPlaying]=useState(false);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    if(html||!remoteProjectId)return;
    const node=root.current;
    if(!node)return;
    if(typeof IntersectionObserver==="undefined"){setVisible(true);return;}
    const obs=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setVisible(true);obs.disconnect();}},{rootMargin:"280px"});
    obs.observe(node);
    return()=>obs.disconnect();
  },[html,remoteProjectId]);
  useEffect(()=>{
    if(!remoteProjectId||!visible||html)return;
    const controller=new AbortController();
    setLoading(true);
    void fetch("/api/crm/site-projects/"+encodeURIComponent(remoteProjectId)+"/render",{
      credentials:"same-origin",cache:"no-store",signal:controller.signal,
    }).then(async response=>{
      if(!response.ok)throw new Error("Site ainda não disponível");
      const text=await response.text();
      if(!text.trim())throw new Error("Prévia vazia");
      setRemote(text);
    }).catch(()=>{if(!controller.signal.aborted)setFailed(true);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[remoteProjectId,visible,html]);
  const markup=html||remote;
  const stop=useCallback(()=>{
    if(raf.current!==null)cancelAnimationFrame(raf.current);
    raf.current=null;setPlaying(false);
    try{frame.current?.contentWindow?.scrollTo(0,0);}catch{/* sandbox may deny access */}
  },[]);
  useEffect(()=>()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);},[]);
  function start(){
    if(!markup||!frameReady)return;
    const win=frame.current?.contentWindow;
    if(!win)return;
    try{
      const doc=win.document;
      const height=Math.max(doc.documentElement.scrollHeight,doc.body?.scrollHeight||0);
      const max=Math.max(0,height-win.innerHeight);
      if(max<60)return;
      if(raf.current!==null)cancelAnimationFrame(raf.current);
      win.scrollTo(0,0);
      const began=performance.now();
      setPlaying(true);
      const step=(at:number)=>{
        const progress=Math.min(1,(at-began)/10500);
        win.scrollTo(0,max*(progress*progress*(3-2*progress)));
        if(progress<1)raf.current=requestAnimationFrame(step);
        else{raf.current=null;setPlaying(false);}
      };
      raf.current=requestAnimationFrame(step);
    }catch{/* An opaque cross-origin preview still displays the page. */}
  }
  return <div ref={root} className="group relative h-56 w-full overflow-hidden bg-[#111a17] sm:h-60"
    onMouseEnter={start} onMouseLeave={stop}>
    {markup?
      <iframe key={remoteProjectId||title} ref={frame} title={"Prévia de "+title}
        srcDoc={markup} sandbox="allow-same-origin" loading="lazy" scrolling="yes"
        onLoad={()=>setFrameReady(true)}
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
        style={{width:"1200px",height:"810px",transform:"scale(0.34)",transformOrigin:"top left"}}
      />:imageUrl?
      <img alt={"Imagem de "+title} src={imageUrl}
        className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.04]"/>:
      <div className="flex h-full flex-col items-center justify-center gap-3 text-white/45">
        {loading?<LoaderCircle className="h-8 w-8 animate-spin text-emerald-300"/>:<Globe2 className="h-9 w-9 text-emerald-400/50"/>}
        <span className="text-xs">{loading?"Carregando a prévia...":failed?"Prévia indisponível por enquanto":"Prévia ainda não disponível"}</span>
      </div>}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#07110f]/95 via-[#07110f]/55 to-transparent px-4 pb-3 pt-10">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white/90">
        <Eye className="h-3.5 w-3.5"/> Prévia real
      </span>
      <span className="text-[10px] text-white/70">{playing?"Rolando a página ↓":markup?"Passe o mouse para percorrer":""}</span>
    </div>
    {markup&&<button type="button" aria-label={"Percorrer a prévia de "+title}
      className="absolute inset-0 z-10 bg-transparent text-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 md:hidden"
      onClick={()=>{if(playing)stop();else start();}}>
      Percorrer prévia
    </button>}
  </div>;
}
