/**
 * Shared, deterministic social destinations for all Builder V2 templates.
 * Never attach an arbitrary website to a social icon.
 */
export type SocialNetwork="instagram"|"facebook"|"youtube"|"whatsapp";
export type WhatsAppEffect="none"|"pulse"|"blink";
export type SocialFooter={
  instagram?:string;facebook?:string;youtube?:string;whatsapp?:string;
  whatsappMessage?:string;showFloatingWhatsapp?:boolean;
  whatsappEffect?:WhatsAppEffect;
};
const socialHosts:Record<SocialNetwork,readonly string[]>={
  instagram:["instagram.com","www.instagram.com","m.instagram.com","instagr.am"],
  facebook:["facebook.com","www.facebook.com","m.facebook.com","fb.com","www.fb.com","fb.me"],
  youtube:["youtube.com","www.youtube.com","m.youtube.com","youtu.be","www.youtu.be"],
  whatsapp:["wa.me","www.wa.me","api.whatsapp.com","web.whatsapp.com"]
};
const normal=(s:string)=>s.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
export function whatsappDigits(value:string):string|null{
  const raw=value.trim();
  if(!raw)return null;
  let valueDigits=raw;
  if(/^https?:\/\//i.test(raw)){
    let url:URL;
    try{url=new URL(raw);}catch{return null;}
    if(!socialHosts.whatsapp.includes(url.hostname.toLowerCase()))return null;
    valueDigits=url.hostname.toLowerCase().endsWith("wa.me")?url.pathname.replace(/\//g,""):url.searchParams.get("phone")||"";
  }
  let digits=valueDigits.replace(/\D/g,"");
  // BR national formats: DDD + phone; convert to international format.
  if(digits.length===10||digits.length===11)digits="55"+digits;
  if(digits.length<12||digits.length>15)return null;
  return digits;
}
export function normalizedSocialLink(name:SocialNetwork,value:string):string|null{
  const raw=value.trim().replace(/[),;.!?]+$/,"");
  if(!raw)return null;
  if(name==="whatsapp"){
    const digits=whatsappDigits(raw);
    if(!digits)return null;
    if(/^https?:\/\//i.test(raw)){
      try{
        const url=new URL(raw);
        const text=url.searchParams.get("text");
        return "https://wa.me/"+digits+(text?"?text="+encodeURIComponent(text):"");
      }catch{return null;}
    }
    return "https://wa.me/"+digits;
  }
  if(/^https?:\/\//i.test(raw)){
    try{
      const url=new URL(raw);
      if(!socialHosts[name].includes(url.hostname.toLowerCase()))return null;
      if(url.username||url.password)return null;
      if(url.pathname==="/"||!url.pathname.trim())return null;
      url.protocol="https:";url.hash="";
      return url.toString();
    }catch{return null;}
  }
  if(name==="instagram"&&/^@?[a-zA-Z0-9._]{1,30}$/.test(raw)){
    return "https://www.instagram.com/"+raw.replace(/^@/,"")+"/";
  }
  if(name==="facebook"&&/^@?[a-zA-Z0-9._-]{3,80}$/.test(raw)){
    return "https://www.facebook.com/"+raw.replace(/^@/,"");
  }
  if(name==="youtube"&&/^@[a-zA-Z0-9._-]{3,40}$/.test(raw)){
    return "https://www.youtube.com/"+raw;
  }
  return null;
}
function networkFromUrl(url:string):SocialNetwork|null{
  try{
    const hostname=new URL(url).hostname.toLowerCase();
    return (Object.keys(socialHosts) as SocialNetwork[]).find(name=>socialHosts[name].includes(hostname))||null;
  }catch{return null;}
}
export function socialLinksFromInstruction(message:string):Partial<SocialFooter>{
  const result:Partial<SocialFooter>={};
  const candidates=message.match(/https?:\/\/[^\s<>"'“”]+/gi)||[];
  for(const candidate of candidates){
    const raw=candidate.replace(/[),;.!?]+$/,"");
    const name=networkFromUrl(raw);
    if(!name)continue;
    const link=normalizedSocialLink(name,raw);
    if(link)result[name]=link;
  }
  const names:SocialNetwork[]=["instagram","facebook","youtube","whatsapp"];
  for(const name of names){
    if(result[name])continue;
    // Explicitly labeled account handles/numbers, never arbitrary text mentions.
    const re=new RegExp("(?:^|[\\s,;])"+name+"\\s*(?:[:=–—-]|e\\s+|\\s+)\\s*(@?[a-zA-Z0-9._+() -]{3,45})","i");
    const match=message.match(re);
    if(!match)continue;
    const candidate=match[1].trim().split(/\s+(?:e|com|para|do|da|no|na|meu|minha|coloque|altere)\b/i)[0].trim();
    const link=normalizedSocialLink(name,candidate);
    if(link)result[name]=link;
  }
  return result;
}
export function whatsappEffectFromInstruction(instruction:string):WhatsAppEffect|null{
  const s=normal(instruction);
  if(!/\b(?:whats(?:app)?|icone verde|botao verde)\b/.test(s))return null;
  if(!/(?:pisca|piscando|puls|pulse|batendo|anima|efeito|brilh|parar|desativ|deslig|tirar)\w*/.test(s))return null;
  // Restrict to the floating icon, not generic WhatsApp links or unrelated animations.
  if(!/(?:icone|botao|flutuante|fixo|canto inferior|inferior direito|icone verde|botao verde)/.test(s))return null;
  if(/(?:preserv|mantenh)\w*[^.]{0,55}(?:botao|icone)[^.]{0,35}whats(?:app)?/.test(s))return null;
  if(/\b(?:nao|sem)\b[^.]{0,45}(?:piscar|piscando|pulsar|pulsando|animar)/.test(s))return "none";
  if(/(?:sem\s+(?:efeito|animacao)|(?:desativ|deslig|remov|tir|parar)\w*[^.]{0,45}(?:efeito|animacao|pisca|puls)|(?:pare|parar)\s+de\s+(?:piscar|pulsar))/.test(s))return "none";
  if(/pisca|piscando/.test(s))return "blink";
  if(/puls|pulse|batendo|efeito|anima|brilh/.test(s))return "pulse";
  return null;
}
export function floatingVisibilityFromInstruction(instruction:string):boolean|null{
  const s=normal(instruction);
  if(!/(?:whats(?:app)?|icone verde|botao verde)/.test(s))return null;
  if(whatsappEffectFromInstruction(instruction)!==null)return null;
  if(!/(?:flutuante|canto inferior|inferior direito|botao fixo|icone verde|botao verde)/.test(s))return null;
  if(/(?:remov|retir|ocult|escond|desativ)\w*[^.]{0,70}(?:botao|icone|whats)|(?:botao|icone)[^.]{0,70}(?:remov|ocult|escond)/.test(s))return false;
  if(/(?:mostr|exib|ativ|habilit|coloc|adicion)\w*[^.]{0,60}(?:botao|icone|whats)/.test(s))return true;
  return null;
}
export function applySocialInstruction<T extends {footer?:SocialFooter}>(site:T,instruction:string):{site:T;summary:string}|null{
  const links=socialLinksFromInstruction(instruction);
  const effect=whatsappEffectFromInstruction(instruction);
  const visible=floatingVisibilityFromInstruction(instruction);
  const removing:Partial<SocialFooter>={};
  const normalized=normal(instruction);
  const networkKeys:SocialNetwork[]=["instagram","facebook","youtube","whatsapp"];
  // Removal applies to a named social icon only; it never removes unrelated links.
  for(const key of networkKeys){
    if(links[key])continue;
    // Disabling an animation is never permission to unlink WhatsApp.
    if(key==="whatsapp"&&effect!==null)continue;
    if(new RegExp("(?:remov|retir|exclu|apag|desvincul|ocult)\\w*[^.\\n]{0,45}\\b"+key+"\\b|\\b"+key+"\\b[^.\\n]{0,35}(?:remov|exclu|apag|desvincul)\\w*","i").test(normalized)){
      removing[key]="";
    }
  }
  const footer={...site.footer,...removing,...links,...(effect?{whatsappEffect:effect}:{}),...(visible!==null?{showFloatingWhatsapp:visible}:{})};
  const changed=Object.keys(links).length>0||Object.keys(removing).length>0||effect!==null||visible!==null;
  if(!changed)return null;
  const fields=[
    ...Object.keys(links).map(name=>name==="whatsapp"?"WhatsApp":name),
    ...Object.keys(removing).map(name=>name+" removido"),
    ...(effect?["efeito do WhatsApp "+(effect==="none"?"desativado":effect==="blink"?"piscando":"pulsando")]:[]),
    ...(visible!==null?["botão flutuante "+(visible?"ativado":"oculto")]:[])
  ];
  return {site:{...site,footer},summary:"Configuração aplicada: "+fields.join(", ")+". Demais elementos preservados."};
}
