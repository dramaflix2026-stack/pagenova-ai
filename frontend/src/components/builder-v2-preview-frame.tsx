"use client";

import {createPortal} from "react-dom";
import {type ReactNode,useEffect,useRef,useState} from "react";

export type BuilderPreviewDevice="desktop"|"mobile";

/**
 * A real viewport preview, not just a narrow div: Tailwind media queries and
 * responsive breakpoints are evaluated against the iframe's viewport.
 * React portals preserve live editing, state and event handling.
 */
export function BuilderV2PreviewFrame({device,children}:{device:BuilderPreviewDevice;children:ReactNode}) {
  const viewportRef=useRef<HTMLDivElement>(null);
  const frameRef=useRef<HTMLIFrameElement>(null);
  const [frameDocument,setFrameDocument]=useState<Document|null>(null);
  const [portalNode,setPortalNode]=useState<HTMLElement|null>(null);
  const [availableWidth,setAvailableWidth]=useState(0);

  useEffect(()=>{
    const node=viewportRef.current;
    if(!node)return;
    const measure=()=>setAvailableWidth(node.getBoundingClientRect().width);
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(node);
    return ()=>observer.disconnect();
  },[]);

  useEffect(()=>{
    if(!frameDocument)return;
    const iframeHost=frameDocument.getElementById("pn-v2-preview-root");
    if(!iframeHost)return;
    const syncStyles=()=>{
      const head=frameDocument.head;
      head.querySelectorAll("[data-pn-preview-mirror]").forEach(node=>node.remove());
      document.head.querySelectorAll('link[rel="stylesheet"],style').forEach(node=>{
        const clone=node.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-pn-preview-mirror","true");
        head.appendChild(clone);
      });
      if(!head.querySelector("[data-pn-preview-overrides]")){
        const overrides=frameDocument.createElement("style");
        overrides.setAttribute("data-pn-preview-overrides","true");
        overrides.textContent="html,body{margin:0;padding:0;overflow-x:hidden} body{overscroll-behavior-y:contain}";
        head.appendChild(overrides);
      }
    };
    syncStyles();
    const stylesObserver=new MutationObserver(syncStyles);
    stylesObserver.observe(document.head,{childList:true,subtree:false});
    setPortalNode(iframeHost);
    return ()=>{stylesObserver.disconnect();setPortalNode(null);};
  },[frameDocument]);

  const targetWidth=device==="mobile"?390:1280;
  const targetHeight=device==="mobile"?780:800;
  const scale=Math.min(1,Math.max(0.08,(availableWidth-2)/targetWidth));
  const visualWidth=targetWidth*scale;
  return <div ref={viewportRef} aria-label={device==="mobile"?"Prévia mobile do site":"Prévia desktop do site"} className="relative w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b1110]">
    <div style={{position:"relative",width:"100%",height:Math.round(targetHeight*scale),minHeight:availableWidth?undefined:420}}>
      <iframe
        ref={frameRef}
        title={device==="mobile"?"Visualização mobile do site":"Visualização desktop do site"}
        srcDoc={'<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="pn-v2-preview-root"></div></body></html>'}
        onLoad={()=>setFrameDocument(frameRef.current?.contentDocument??null)}
        style={{
          position:"absolute",top:0,left:Math.max(0,(availableWidth-visualWidth)/2),
          display:"block",width:targetWidth,height:targetHeight,border:0,
          background:"#ffffff",transform:`scale(${scale})`,transformOrigin:"top left"
        }}
      />
    </div>
    {portalNode?createPortal(<div className="w-full min-h-screen">{children}</div>,portalNode):<p className="absolute inset-0 flex items-center justify-center text-xs text-white/50">Preparando prévia responsiva...</p>}
  </div>;
}
