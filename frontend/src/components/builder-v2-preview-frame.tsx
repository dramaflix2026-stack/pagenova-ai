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
      // A transparent computed color is not the dark surface underneath a card.
      if(/^transparent$/i.test(value)||(/^rgba\(/i.test(value)&&/[,\/]\s*0(?:\.0+)?\s*\)$/i.test(value)))return null;
      const parts=value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]+\s*(\d+(?:\.\d+)?)\s*[, ]+\s*(\d+(?:\.\d+)?)/i);
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
      // Inspect the *actual* painted cards, not only one expected DOM hierarchy.
      // Classic sites, template wrappers and older saved blocks have different
      // nesting; data-block-id is stable across those renderers.
      const candidates=Array.from(portalNode.querySelectorAll<HTMLElement>("article"));
      const cards=candidates.filter(card=>{
        const section=card.closest("section");
        const id=section?.id||section?.getAttribute("data-section-id")||section?.getAttribute("data-universal-section")||"";
        return id.startsWith("custom-")||
          String(card.getAttribute("data-block-id")||"").startsWith("custom-")||
          Boolean(card.closest("[data-universal-custom-cards],[data-pn-composition='universal-custom-section']"));
      });
      portalNode.setAttribute("data-pn-custom-card-audit-count",String(cards.length));
      let fixed=0;
      for(const card of cards){
        // The same generated card can be styled through class, data attributes
        // or template-specific rules. Resolve its real background at runtime.
        const computed=previewWindow.getComputedStyle(card);
        let background=rgb(computed.backgroundColor);
        // Transparent black (e.g. over a cream gradient) is not a dark card.
        if(!background)background=[249,246,241];
        const darkSurface=luminance(background)<0.35;
        const targetTitle=darkSurface?"#f8f2e9":"#352b24";
        const targetBody=darkSurface?"#e6ded5":"#55483e";
        let cardFixed=false;
        for(const child of card.querySelectorAll<HTMLElement>("h3,p")){
          const style=previewWindow.getComputedStyle(child);
          const fill=style.getPropertyValue("-webkit-text-fill-color");
          const foreground=rgb(fill)||rgb(style.color);
          const needsContrast=!foreground||contrast(foreground,background)<4.5;
          if(needsContrast){
            const preferred=child.tagName==="P"?targetBody:targetTitle;
            child.style.setProperty("color",preferred,"important");
            child.style.setProperty("-webkit-text-fill-color",preferred,"important");
            cardFixed=true;
          }
          // Shadows from the template create the blurry lettering reported on
          // mobile even when the computed color itself is legible.
          if(style.textShadow!=="none"){child.style.setProperty("text-shadow","none","important");cardFixed=true;}
          if(style.filter!=="none"){child.style.setProperty("filter","none","important");cardFixed=true;}
          if(style.opacity!=="1"){child.style.setProperty("opacity","1","important");cardFixed=true;}
        }
        if(cardFixed)fixed++;
      }
      portalNode.setAttribute("data-pn-custom-card-fixes",String(fixed));
    };
    const schedule=()=>{if(scheduled===null)scheduled=previewWindow.requestAnimationFrame(check);};
    const observer=new MutationObserver(schedule);
    // Live color edits may change style/class without changing card children.
    // Recheck those mutations as well as newly rendered blocks.
    observer.observe(portalNode,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class"]});
    const styleObserver=new MutationObserver(schedule);
    styleObserver.observe(frameDocument.head,{childList:true});
    void frameDocument.fonts.ready.then(schedule);
    schedule();
    return()=>{observer.disconnect();styleObserver.disconnect();if(scheduled!==null)previewWindow.cancelAnimationFrame(scheduled);};
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
