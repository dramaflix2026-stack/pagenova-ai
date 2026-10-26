"use client";

import {normalizedSocialLink,type WhatsAppEffect} from "@/lib/site-social-links";

/** Resolve the business's own WhatsApp contact. Never use a PageNova number. */
export function siteWhatsAppLink(value?:string,message?:string):string|null {
  const normalized=normalizedSocialLink("whatsapp",value||"");
  if(!normalized)return null;
  const url=new URL(normalized);
  // Respect an explicitly configured WhatsApp message; otherwise reuse the
  // message in a provided wa.me link or show the site's default greeting.
  const greeting=(message||url.searchParams.get("text")||"Olá! Vim pelo site e gostaria de mais informações.").trim();
  return url.origin+url.pathname+(greeting?"?text="+encodeURIComponent(greeting):"");
}

function WhatsAppMark(){
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="27" height="27" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.52 2 2.03 6.49 2.03 12c0 1.76.46 3.48 1.33 5L2 22l5.14-1.35A9.97 9.97 0 0 0 12.04 22C17.56 22 22.05 17.51 22.05 12S17.56 2 12.04 2Zm0 18.3a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.14.82.84-3.06-.2-.32a8.3 8.3 0 1 1 7.03 3.9Zm4.56-6.21c-.25-.13-1.48-.73-1.71-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.12-.11.25-.29.38-.44.12-.14.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.42 1.02 2.59c.13.17 1.77 2.7 4.28 3.78.6.26 1.07.42 1.43.53.6.19 1.15.16 1.59.1.49-.07 1.48-.61 1.69-1.2.21-.59.21-1.09.15-1.2-.06-.1-.23-.17-.48-.29Z"/>
  </svg>;
}

/** Same WhatsApp mark in preview and public pages; placeholder is preview-only. */
export function SiteWhatsAppButton({
  numberOrUrl,message,preview=false,enabled=true,effect="none"
}:{
  numberOrUrl?:string;message?:string;preview?:boolean;enabled?:boolean;effect?:WhatsAppEffect
}){
  if(!enabled)return null;
  const link=siteWhatsAppLink(numberOrUrl,message);
  if(!link&&!preview)return null;
  const className="pn-site-whatsapp-button fixed bottom-5 right-5 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_5px_16px_rgba(0,0,0,.18)] ring-1 ring-white/20 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] sm:bottom-7 sm:right-7 sm:h-14 sm:w-14";
  const label=link?"Conversar no WhatsApp do estabelecimento":"Configure o número de WhatsApp do estabelecimento para ativar este botão";
  const effectClass=link&&effect!=="none"?" pn-whatsapp-effect-"+effect:"";
  if(!link){
    return <span aria-label={label} role="img" title={label} className={className+" cursor-help opacity-65 grayscale-[.15]"}><WhatsAppMark/></span>;
  }
  return <><style>{`\n@keyframes pn-whatsapp-pulse{0%,100%{transform:scale(1);box-shadow:0 5px 16px rgba(0,0,0,.18),0 0 0 0 rgba(37,211,102,.32)}50%{transform:scale(1.065);box-shadow:0 7px 22px rgba(0,0,0,.18),0 0 0 11px rgba(37,211,102,0)}}\n@keyframes pn-whatsapp-blink{0%,100%{opacity:1;filter:brightness(1)}50%{opacity:.64;filter:brightness(1.28)}}\n.pn-whatsapp-effect-pulse{animation:pn-whatsapp-pulse 2.2s ease-in-out infinite}\n.pn-whatsapp-effect-blink{animation:pn-whatsapp-blink 1.45s ease-in-out infinite}\n.pn-site-whatsapp-button:is(:hover,:focus-visible){animation-play-state:paused}\n@media(prefers-reduced-motion:reduce){.pn-site-whatsapp-button{animation:none!important}}\n`}</style><a href={link} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} data-whatsapp-effect={effect} className={className+effectClass}><WhatsAppMark/></a></>;
}
