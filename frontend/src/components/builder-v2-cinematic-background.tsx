"use client";
import {useEffect,useState} from "react";
export type CinematicAppearance={mode:"static"|"cinematic";desktopUrl?:string;mobileUrl?:string;posterUrl?:string;overlay?:number};
export function CinematicBackground({appearance}:{appearance?:CinematicAppearance}){
 const [reduceMotion,setReduceMotion]=useState(false);
 useEffect(()=>{const query=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduceMotion(query.matches);update();query.addEventListener("change",update);return()=>query.removeEventListener("change",update)},[]);
 if(appearance?.mode!=="cinematic")return null;
 const desktop=appearance.desktopUrl||appearance.mobileUrl;
 const mobile=appearance.mobileUrl||appearance.desktopUrl;
 if(!desktop&&!mobile)return null;
 const overlay=Math.max(0,Math.min(0.85,appearance.overlay??0.4));
 return <div aria-hidden="true" className="pn-cinematic-background pointer-events-none fixed inset-0 z-0 overflow-hidden">
  {appearance.posterUrl&&<div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:`url("${appearance.posterUrl.replace(/"/g,"%22")}")`}}/>}
  {!reduceMotion&&<video key={desktop+"|"+mobile} autoPlay muted loop playsInline preload="metadata" poster={appearance.posterUrl} className="absolute inset-0 h-full w-full object-cover">
   {mobile&&<source src={mobile} media="(max-width: 767px)" type="video/mp4"/>}
   {desktop&&<source src={desktop} type="video/mp4"/>}
  </video>}
  <div className="absolute inset-0 bg-black" style={{opacity:overlay}}/>
 </div>;
}
