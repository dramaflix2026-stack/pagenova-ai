"use client";
import {normalizedSocialLink,type SocialFooter,type SocialNetwork} from "@/lib/site-social-links";

const names:{key:SocialNetwork;label:string}[]=[
  {key:"instagram",label:"Instagram"},
  {key:"facebook",label:"Facebook"},
  {key:"youtube",label:"YouTube"},
  {key:"whatsapp",label:"WhatsApp"}
];
function Glyph({network}:{network:SocialNetwork}){
  return <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {network==="instagram"?<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".9" fill="currentColor"/></>:
    network==="facebook"?<path d="M14 21v-8h3l.5-4H14V7c0-1.1.4-2 2-2h2V1.5A23 23 0 0 0 15 1c-3.2 0-5 1.9-5 5.3V9H7v4h3v8z"/>:
    network==="youtube"?<><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/></>:
    <><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.5-4.7a8.5 8.5 0 1 1 16-4.1Z"/><path d="M9 8.5c.3-.5.6-.5.9-.1l1 1.5c.2.3.1.6-.2.9l-.5.5c.8 1.4 1.9 2.4 3.3 3l.6-.6c.3-.3.6-.3.9-.1l1.5.9c.4.3.3.7-.1 1.1-.8.8-1.7.8-2.7.4-2.7-1.1-4.9-3.2-6-5.8-.3-.8-.1-1.4.4-1.7Z"/></>}
  </svg>;
}
export function SiteFooterSocialIcons({footer,fallbackWhatsApp}:{footer?:SocialFooter;fallbackWhatsApp?:string}){
  return <nav aria-label="Redes sociais" className="mt-6 flex flex-wrap items-center justify-center gap-3">
    {names.map(({key,label})=>{
      const link=normalizedSocialLink(key,footer?.[key]||(key==="whatsapp"?fallbackWhatsApp:"")||"");
      const common="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white/20";
      return link?<a key={key} href={link} target="_blank" rel="noopener noreferrer" aria-label={label} className={common}><Glyph network={key}/></a>:
        <span key={key} role="img" title={label+": configure pelo chat"} aria-label={label+" — link não configurado"} className={common+" opacity-45"}><Glyph network={key}/></span>;
    })}
  </nav>;
}
