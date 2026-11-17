"use client";
import {useEffect,useRef,type ReactNode} from "react";

/** Explicit user-edited TP9 photo is projected without modifying frozen models. */
export function UniversalIsolatedHeroPhoto({src,children}:{src?:string;children:ReactNode}){
 const hostRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
  if(!src||!/^https:\/\/images\.unsplash\.com\//i.test(src))return;
  const host=hostRef.current;if(!host)return;
  const selectors=[
   ".tp9m2-heroimg",
   "#tp9-inicio .vh-photo img",
   ".pn-t9-hero img",
   "#tp9m3-home > img",
   ".tp9v3-hero .tp9v3-cover"
  ];
  let target:HTMLImageElement|null=null;
  let original:string|null=null;
  let failed=false;
  const onFailure=()=>{
   failed=true;
   if(target){target.removeAttribute("data-universal-hero-photo");if(original)target.setAttribute("src",original);}
  };
  const project=()=>{
   const candidates=Array.from(host.querySelectorAll<HTMLImageElement>(selectors.join(",")));
   if(candidates.length!==1)return;
   const image=candidates[0];
   if(image!==target){
    target?.removeEventListener("error",onFailure);
    target=image;original=image.getAttribute("src");failed=false;
    image.addEventListener("error",onFailure);
   }
   if(failed)return;
   image.setAttribute("data-universal-hero-photo","true");
   if(image.getAttribute("src")!==src)image.setAttribute("src",src);
  };
  const observer=new MutationObserver(project);
  observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:["src"]});
  project();
  return ()=>{
   observer.disconnect();
   if(target){
    target.removeEventListener("error",onFailure);
    target.removeAttribute("data-universal-hero-photo");
    if(original)target.setAttribute("src",original);
   }
  };
 },[src]);
 if(!src)return <>{children}</>;
 return <div ref={hostRef} data-pn-universal-photo-bridge="true" style={{display:"contents"}}>{children}</div>;
}
