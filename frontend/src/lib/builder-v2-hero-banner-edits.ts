/**
 * Scoped edits for a carousel banner's own copy. The approved first hero keeps
 * its original blocks; secondary slide copy is stored independently by image ID.
 */
export type HeroBannerCopy={title?:string;description?:string;buttonText?:string;buttonHref?:string};
type Block={id:string;type:string;section?:string;text?:string;src?:string;href?:string};
type HeroSite={blocks:Block[];heroComposition?:"single"|"duo"|"trio";heroBannerCopy?:Record<string,HeroBannerCopy>};
const normal=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
export function getHeroBannerImages<T extends HeroSite>(site:T){
  const hero=site.blocks.find(b=>b.type==="heading")?.section||site.blocks[0]?.section||"principal";
  return site.blocks.filter(b=>b.section===hero&&b.type==="image"&&!!b.src);
}
export function isScopedBannerCopyRequest(instruction:string){
  const s=normal(instruction);
  const target=/(?:segund[oa]|terceir[oa]|banner\s*[23]|slide\s*[23]|banner\s*(?:numero\s*)?[23])/.test(s);
  const copy=/(?:titulo|texto|descricao|subtitulo|botao|cta|link)/.test(s);
  const action=/(?:troqu|alter|mud|substitu|escrev|coloc|adicione|mude|define|defina|crie|criar)/.test(s);
  return target&&copy&&action;
}
export function applyHeroBannerCopy<T extends HeroSite>(site:T,instruction:string):{site:T;summary:string}|null{
  if(!isScopedBannerCopyRequest(instruction))return null;
  if(site.heroComposition!=="duo"&&site.heroComposition!=="trio")
    throw Error("Adicione outro banner à capa antes de editar seu texto.");
  const images=getHeroBannerImages(site);
  const s=normal(instruction);
  const position=/(?:terceir[oa]|banner\s*3|slide\s*3)/.test(s)?2:1;
  if(!images[position])throw Error("Não encontrei o banner "+(position+1)+". Nenhum texto foi alterado.");
  const id=images[position].id;
  const previous=site.heroBannerCopy?.[id]||{};
  const quoted='"([^"]{1,350})"|“([^”]{1,350})”';
  const extract=(name:string)=>{
    const m=instruction.match(new RegExp("(?:\\b"+name+")\\b[^.!?\\n]{0,85}?(?:para|por|como|:)\\s*(?:"+quoted+")","i"));
    return (m?.[1]||m?.[2]||"").trim().slice(0,350);
  };
  const title=extract("t[ií]tulo|headline");
  const description=extract("descri[cç][aã]o|subt[ií]tulo|texto");
  const buttonText=extract("bot[aã]o|cta");
  const buttonHref=extract("link|destino|url");
  if(buttonHref&&!/^(https?:\/\/|mailto:|tel:|#[\w-]+)/i.test(buttonHref))
    throw Error("Informe um link ou âncora válido para o botão.");
  if(!title&&!description&&!buttonText&&!buttonHref)
    throw Error("Informe o texto entre aspas e o elemento do banner (título, descrição ou botão). Nenhuma alteração foi aplicada.");
  return {
    site:{...site,heroBannerCopy:{...site.heroBannerCopy,[id]:{...previous,...(title?{title}:{}),...(description?{description}:{}),...(buttonText?{buttonText}:{}),...(buttonHref?{buttonHref}:{})}}},
    summary:"Texto do banner "+(position+1)+" atualizado de forma independente. Capa original e demais seções preservadas."
  };
}
