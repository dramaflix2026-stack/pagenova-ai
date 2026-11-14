"use client";

import {createPortal} from "react-dom";
import {type ReactNode,useEffect,useRef,useState} from "react";
import {interceptPreviewFragmentNavigation} from "@/lib/builder-v2-preview-navigation";

export type BuilderPreviewDevice="desktop"|"tablet"|"mobile";

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
        // The iframe is a real scroll viewport. On Android, overscroll containment
        // can trap touch gestures inside the embedded preview and prevent the
        // parent Builder from moving when the inner page reaches its boundary.
        // Keep both scrollers native and allow scroll chaining.
        overrides.textContent=[
          "html{min-height:100%!important;height:auto!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:auto!important}",
          "body{margin:0!important;padding:0!important;min-height:100%!important;height:auto!important;overflow-x:hidden!important;overflow-y:visible!important;overscroll-behavior-y:auto!important}",
          "#pn-v2-preview-root{min-height:100%;}",
        ].join("");
        head.appendChild(overrides);
      }
    };
    syncStyles();
    const stylesObserver=new MutationObserver(syncStyles);
    stylesObserver.observe(document.head,{childList:true,subtree:false});
    setPortalNode(iframeHost);
    return ()=>{stylesObserver.disconnect();setPortalNode(null);};
  },[frameDocument]);

  // Universal custom sections must preserve legible text regardless of
  // niche/template CSS, injected styles or an older saved card palette.
  // Fix only genuinely low-contrast text, preserving readable explicit colors.
  // The renderer is frozen; this shared preview boundary can still verify it.
  useEffect(()=>{
    if(!portalNode||!frameDocument?.defaultView)return;
    const previewWindow=frameDocument.defaultView;
    const rgb=(value:string):number[]|null=>{
      const parts=value.match(/^rgba?\\(\\s*(\\d+(?:\\.\\d+)?)\\s*[, ]+\\s*(\\d+(?:\\.\\d+)?)\\s*[, ]+\\s*(\\d+(?:\\.\\d+)?)/i);
      return parts?[Number(parts[1]),Number(parts[2]),Number(parts[3])]:null;
    };
    const luminance=(channels:number[])=>{
      const linear=channels.slice(0,3).map(v=>{const n=v/255;return n<=0.04045?n/12.92:Math.pow((n+0.055)/1.055,2.4);});
      return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
    };
    const contrast=(first:number[],second:number[])=>{
      const a=luminance(first),b=luminance(second);
      return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    };
    let scheduled:number|null=null;
    const check=()=>{
      scheduled=null;
      const cards=portalNode.querySelectorAll<HTMLElement>('section[data-section-id^="custom-"] [data-pn-composition="universal-custom-section"] > .grid > article');
      for(const card of cards){
        const background=rgb(previewWindow.getComputedStyle(card).backgroundColor);
        if(!background)continue;
        for(const child of card.querySelectorAll<HTMLElement>("h3,p")){
          const style=previewWindow.getComputedStyle(child);
          const fill=style.getPropertyValue("-webkit-text-fill-color");
          const foreground=rgb(fill)||rgb(style.color);
          if(foreground&&contrast(foreground,background)<4.5){
            const dark=[51,41,33],light=[249,245,239];
            const ink=contrast(dark,background)>contrast(light,background)?"#332921":"#f9f5ef";
            child.style.setProperty("color",ink,"important");
            child.style.setProperty("-webkit-text-fill-color",ink,"important");
          }
          if(style.textShadow!=="none")child.style.setProperty("text-shadow","none","important");
          if(style.filter!=="none")child.style.setProperty("filter","none","important");
        }
      }
    };
    const schedule=()=>{if(scheduled===null)scheduled=previewWindow.requestAnimationFrame(check);};
    const observer=new MutationObserver(schedule);
    observer.observe(portalNode,{childList:true,subtree:true});
    schedule();
    return()=>{observer.disconnect();if(scheduled!==null)previewWindow.cancelAnimationFrame(scheduled);};
  },[portalNode,frameDocument]);

  // Keep hash-only links inside the iframe. Without capture, about:srcdoc
  // resolves #contato against the parent Builder URL and replaces the preview.
  useEffect(()=>{
    if(!frameDocument)return;
    const onClick=(event:MouseEvent)=>{interceptPreviewFragmentNavigation(event,frameDocument);};
    frameDocument.addEventListener("click",onClick,true);
    return()=>frameDocument.removeEventListener("click",onClick,true);
  },[frameDocument]);

  const targetWidth=device==="mobile"?390:device==="tablet"?820:1280;
  const targetHeight=device==="mobile"?780:device==="tablet"?900:800;
  const scale=Math.min(1,Math.max(0.08,(availableWidth-2)/targetWidth));
  const visualWidth=targetWidth*scale;
  return <div ref={viewportRef} aria-label={device==="mobile"?"Prévia mobile do site":device==="tablet"?"Prévia tablet do site":"Prévia desktop do site"} className="relative w-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#0b1110]">
    <div style={{position:"relative",width:"100%",height:Math.round(targetHeight*scale),minHeight:availableWidth?undefined:420}}>
      <iframe
        ref={frameRef}
        scrolling="yes"
        title={device==="mobile"?"Visualização mobile do site":device==="tablet"?"Visualização tablet do site":"Visualização desktop do site"}
        srcDoc={'<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="pn-v2-preview-root"></div></body></html>'}
        onLoad={()=>setFrameDocument(frameRef.current?.contentDocument??null)}
        style={{
          position:"absolute",top:0,left:Math.max(0,(availableWidth-visualWidth)/2),
          display:"block",width:targetWidth,height:targetHeight,border:0,
          background:"#ffffff",touchAction:"auto",WebkitOverflowScrolling:"touch",transform:`scale(${scale})`,transformOrigin:"top left"
        }}
      />
    </div>
    {portalNode?createPortal(<div className="w-full min-h-screen">{children}</div>,portalNode):<p className="absolute inset-0 flex items-center justify-center text-xs text-white/50">Preparando prévia responsiva...</p>}
  </div>;
}
