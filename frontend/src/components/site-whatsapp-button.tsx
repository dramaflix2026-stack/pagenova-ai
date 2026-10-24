"use client";

import type {CSSProperties} from "react";

/** Resolve the business's own WhatsApp contact. Never use a PageNova number. */
export function siteWhatsAppLink(value?:string,message?:string):string|null {
  const raw=(value||"").trim();
  if(!raw)return null;
  let digits="";
  if(/^https?:\/\//i.test(raw)){
    try{
      const url=new URL(raw);
      if(!["wa.me","www.wa.me","api.whatsapp.com","web.whatsapp.com"].includes(url.hostname.toLowerCase()))return null;
      digits=(url.hostname.toLowerCase().includes("wa.me")?url.pathname.replace(/\//g,""):url.searchParams.get("phone")||"").replace(/\D/g,"");
    }catch{return null;}
  }else{
    digits=raw.replace(/\D/g,"");
  }
  if(digits.length<10||digits.length>15)return null;
  const text=(message||"Olá! Vim pelo site e gostaria de mais informações.").trim();
  return "https://wa.me/"+digits+(text?"?text="+encodeURIComponent(text):"");
}

function WhatsAppMark(){
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2C6.52 2 2.03 6.49 2.03 12c0 1.76.46 3.48 1.33 5L2 22l5.14-1.35A9.97 9.97 0 0 0 12.04 22C17.56 22 22.05 17.51 22.05 12S17.56 2 12.04 2Zm0 18.3a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.14.82.84-3.06-.2-.32a8.3 8.3 0 1 1 7.03 3.9Zm4.56-6.21c-.25-.13-1.48-.73-1.71-.81-.23-.08-.39-.13-.56.13-.17.25-.65.81-.8.98-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.12-.11.25-.29.38-.44.12-.14.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.84-.2-.48-.4-.41-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.42 1.02 2.59c.13.17 1.77 2.7 4.28 3.78.6.26 1.07.42 1.43.53.6.19 1.15.16 1.59.1.49-.07 1.48-.61 1.69-1.2.21-.59.21-1.09.15-1.2-.06-.1-.23-.17-.48-.29Z"/>
  </svg>;
}

/** Same WhatsApp mark in preview and public pages; placeholder is preview-only. */
export function SiteWhatsAppButton({
  numberOrUrl,message,preview=false,enabled=true
}:{
  numberOrUrl?:string;message?:string;preview?:boolean;enabled?:boolean
}){
  if(!enabled)return null;
  const link=siteWhatsAppLink(numberOrUrl,message);
  if(!link&&!preview)return null;
  const className="fixed bottom-5 right-4 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-[#25D366] text-white shadow-[0_10px_32px_rgba(0,0,0,.3)] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366] sm:bottom-7 sm:right-7";
  const label=link?"Conversar no WhatsApp do estabelecimento":"Configure o número de WhatsApp do estabelecimento para ativar este botão";
  if(!link){
    return <span aria-label={label} role="img" title={label} className={className+" cursor-help opacity-70"}><WhatsAppMark/></span>;
  }
  return <a href={link} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={className}><WhatsAppMark/></a>;
}
