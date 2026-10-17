"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";

/**
 * Android's hardware Back button belongs to the browser. When a customer
 * opens a deep link directly (or refreshes it), there may be no prior
 * PageNova entry in browser history, and Back immediately leaves the site.
 *
 * Add one same-URL history entry only at the first /app entry so the first
 * hardware Back can safely return to the authenticated PageNova start.
 * Ordinary internal Next.js navigation keeps its native Back/Forward history.
 * No global Back trap is installed on the start page itself.
 */
export function MobileAppBackGuard(){
 const router=useRouter();

 useEffect(()=>{
  const path=window.location.pathname;
  if(!path.startsWith("/app/")||path==="/app/builder")return;

  let media:MediaQueryList;
  try{media=window.matchMedia("(max-width: 1023px)");}
  catch{return;}
  if(!media.matches)return;

  const marker="__pagenovaEntryGuard";
  const current=window.history.state;
  const original=(current&&typeof current==="object")?current:{};
  const entryUrl=window.location.pathname+window.location.search+window.location.hash;

  // React StrictMode can replay effects. Preserve the already-armed history.
  if(original[marker]!=="buffer"&&original[marker]!=="entry"){
   window.history.replaceState({...original,[marker]:"entry"}, "", entryUrl);
   window.history.pushState({...original,[marker]:"buffer"}, "", entryUrl);
  }

  function onBack(event:PopStateEvent){
   if(!media.matches)return;
   // Only redirect on the synthetic entry's previous state; never hijack a
   // normal Back that is returning to another page inside the platform.
   if(event.state?.[marker]==="entry" &&
      window.location.pathname+window.location.search+window.location.hash===entryUrl){
    router.replace("/app");
   }
  }

  window.addEventListener("popstate",onBack);
  return ()=>window.removeEventListener("popstate",onBack);
 },[router]);

 return null;
}
