/** Regras comuns para os nichos TP1; nunca publica endereço ou depoimento fictício. */
export type TP1Block={type:string;section?:string;text?:string;id?:string};
export type TP1Review={name:string;detail:string;quote:string};
export function getTP1RealReviews(blocks:readonly TP1Block[]):TP1Review[]{
 const result:TP1Review[]=[];
 for(const block of blocks){
  if(block.type!=="paragraph"||!/depoiment|testimonial|avalia[cç][aã]o|relatos?\b|reviews?\b/i.test(block.section||""))continue;
  const raw=(block.text||"").trim();
  if(!raw||/fict[ií]ci|ilustrativ|exemplo de layout|texto modelo|placeholder|depoimento demonstrativo/i.test(raw))continue;
  const parts=raw.split(/\s*\|\s*/).map(x=>x.trim()).filter(Boolean);
  let name="",detail="",quote="";
  if(parts.length>=3){name=parts[0];detail=parts[1];quote=parts.slice(2).join(" | ");}
  else if(parts.length===2){name=parts[0];quote=parts[1];}
  else {const match=raw.match(/^(.{2,80}?)\s+[—–-]\s+(.{20,})$/);if(match){name=match[1].trim();quote=match[2].trim();}}
  if(!/^[\p{L}][\p{L} .'’-]{1,80}$/u.test(name)||/depoimento|cliente|pessoa|paciente|avaliacao|exemplo|modelo|sem nome|nome do/i.test(name)||quote.length<20||quote.length>2000)continue;
  if(result.some(x=>x.name===name&&x.quote===quote))continue;
  result.push({name,detail,quote});
 }
 return result.slice(0,12);
}
export const TP1_DEMO_ADDRESS="Avenida Paulista, 1578 — Bela Vista, São Paulo/SP";
export function getTP1FamilyContact(site:{footer?:{address?:string;whatsapp?:string};extras?:{address?:string}},publishedMode=false){
 const realAddress=(site.footer?.address||site.extras?.address||"").trim();
 const demonstrative=!realAddress&&!publishedMode;
 const address=realAddress||(demonstrative?TP1_DEMO_ADDRESS:"");
 const digits=(site.footer?.whatsapp||"").replace(/\D/g,"");
 const phone=digits.length>=10&&digits.length<=15?(digits.startsWith("55")?digits:"55"+digits):"";
 return {
  address,realAddress,demonstrative,
  mapSrc:address?"https://www.google.com/maps?q="+encodeURIComponent(address)+"&output=embed":"",
  mapHref:address?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(address):"",
  whatsappHref:phone?"https://wa.me/"+phone:"",
  previewWhatsApp:!publishedMode&&!phone
 };
}
