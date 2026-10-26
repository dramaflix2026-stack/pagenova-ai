/**
 * CRM SiteSchema -> existing Builder V2 block model.
 * This is an INPUT ADAPTER, not another generator or template implementation.
 * No AI call is made; the existing CRM-created hero and vetted image slots
 * are used as-is. BuilderV2Site remains the only institutional renderer.
 */
export const BUILDER_V2_CRM_TEMPLATES=[
  "institutional-complete",
  "minimalist-sophisticated",
  "modern-impactful",
  "image-text-alternating"
] as const;
export type BuilderV2InstitutionalTemplate=typeof BUILDER_V2_CRM_TEMPLATES[number];

type AnyObject=Record<string,unknown>;
export type ImportedBuilderBlock={
  id:string;section:string;type:"heading"|"paragraph"|"image"|"button";
  text:string;color:string;align:"left"|"center"|"right";
  src?:string;href?:string;forCardId?:string;layout?:"hero"|"grid"|"split"|"banner"|"faq"|"gallery"|"standard";imageFit?:"cover"|"contain";
};
export type ImportedCrmSite={
  id:string;kind:"institutional";title:string;background:string;niche:string;
  templateId:BuilderV2InstitutionalTemplate;heroPresentation:"immersive";
  blocks:ImportedBuilderBlock[];
  motion:{preset:"professional"};
  footer:{instagram?:string;whatsapp?:string;showFloatingWhatsapp?:boolean};
};
const obj=(v:unknown):AnyObject=>v&&typeof v==="object"&&!Array.isArray(v)?v as AnyObject:{};
const text=(v:unknown)=>typeof v==="string"?v.trim():"";
const array=(v:unknown)=>Array.isArray(v)?v:[] as unknown[];
const color=(v:unknown,fallback:string)=>/^#[a-f0-9]{6}$/i.test(text(v))?text(v):fallback;
const sectionName=(name:string):string=>({
  hero:"principal",authority:"sobre-nos",about:"sobre-nos",services:"servicos",
  benefits:"diferenciais",audience:"publico",stats:"numeros",process:"processo",
  gallery:"galeria",offer:"oferta",testimonials:"depoimentos",faq:"faq",
  contactMap:"contato",whatsappForm:"formulario",cta:"contato",footer:"rodape",
} as Record<string,string>)[name]||name;
export function crmAssetIds(config:unknown):string[]{
  const ids=new Set<string>();
  const visit=(value:unknown,depth:number)=>{
    if(depth>12)return;
    if(Array.isArray(value)){for(const item of value)visit(item,depth+1);return;}
    if(!value||typeof value!=="object")return;
    const o=value as AnyObject;
    if(typeof o.assetId==="string"&&/^[\w-]{12,80}$/.test(o.assetId))ids.add(o.assetId);
    for(const v of Object.values(o))visit(v,depth+1);
  };
  visit(config,0);return Array.from(ids).slice(0,12);
}
export function crmTemplateFromConfig(config:unknown):BuilderV2InstitutionalTemplate{
  const value=text(obj(obj(config).project).builderV2TemplateId);
  return (BUILDER_V2_CRM_TEMPLATES as readonly string[]).includes(value)
    ?value as BuilderV2InstitutionalTemplate:"institutional-complete";
}
export function convertCrmSiteToBuilder(config:unknown,urls:Record<string,string>,projectId:string):ImportedCrmSite{
  const root=obj(config),business=obj(root.business),theme=obj(root.theme);
  const colors=obj(theme.colors);
  const background=color(colors.background,"#ffffff");
  const copyColor=color(colors.text,"#22302a");
  const name=text(business.name)||"Empresa";
  const blocks:ImportedBuilderBlock[]=[];
  const firstSectionId=new Map<string,number>();
  const heroSection=array(root.sections).map(obj).find(x=>text(x.type)==="hero");
  if(!heroSection)throw Error("O projeto CRM ainda não tem uma capa gerada.");
  const heroImage=obj(heroSection.image);
  if(!text(urls[text(heroImage.assetId)]))throw Error("A foto da capa do CRM está indisponível. A capa atual não foi substituída.");
  const add=(section:string,type:ImportedBuilderBlock["type"],value:string,extra:Partial<ImportedBuilderBlock>={})=>{
    if(!value.trim())return undefined;
    const id="crm-"+blocks.length+"-"+type;
    const block:ImportedBuilderBlock={id,section,type,text:value,color:copyColor,align:"left",...extra};
    blocks.push(block);return id;
  };
  const addImage=(section:string,raw:unknown,card?:string)=>{
    const asset=obj(raw);
    const assetId=text(asset.assetId);
    const url=urls[assetId];
    if(url)add(section,"image",text(asset.alt)||"Fotografia do estabelecimento",{src:url,...(card?{forCardId:card}:{})});
  };
  const link=(value:unknown)=>{
    const action=obj(value),target=text(action.target),kind=text(action.kind);
    if(!target)return "";
    if(kind==="anchor")return "#"+target.replace(/^#/,"");
    if(kind==="whatsapp"){const n=target.replace(/\D/g,"");return n.length>=10?"https://wa.me/"+n:"";}
    if(kind==="tel")return "tel:"+target;
    if(kind==="mailto")return "mailto:"+target;
    if((kind==="external"||kind==="maps")&&/^https:\/\//i.test(target))return target;
    return "";
  };
  const primarySectionTitle=new Set<string>();
  for(const raw of array(root.sections)){
    const section=obj(raw),type=text(section.type);
    if(!type||type==="footer")continue;
    const sectionKey=sectionName(type);
    const instance=(firstSectionId.get(sectionKey)||0)+1;
    firstSectionId.set(sectionKey,instance);
    const sectionId=instance===1?sectionKey:sectionKey+"-"+instance;
    const headline=text(section.headline)||text(section.businessName);
    if(headline&&!primarySectionTitle.has(sectionId)){
      add(sectionId,"heading",headline,{layout:type==="hero"?"hero":type==="faq"?"faq":type==="gallery"?"gallery":"standard"});
      primarySectionTitle.add(sectionId);
    }
    if(type==="hero"&&text(section.eyebrow))add(sectionId,"paragraph",text(section.eyebrow));
    if(text(section.subheadline))add(sectionId,"paragraph",text(section.subheadline));
    for(const body of array(section.body)){const paragraph=text(body);if(paragraph)add(sectionId,"paragraph",paragraph);}
    if(typeof section.body==="string"&&section.body.trim())add(sectionId,"paragraph",section.body.trim());
    if(type==="gallery"){for(const asset of array(section.images))addImage(sectionId,asset);}
    else addImage(sectionId,section.image);
    if(type==="services"||type==="benefits"||type==="audience"||type==="process"){
      const items=type==="process"?array(section.steps):array(section.items);
      for(const item of items){
        const o=obj(item);
        const title=text(o.title);
        const desc=text(o.body);
        if(!title&&!desc)continue;
        const card=add(sectionId,"paragraph",[title,desc].filter(Boolean).join(" — "),{layout:"grid"});
        if(card)addImage(sectionId,o.image,card);
      }
    }
    if(type==="faq")for(const pair of array(section.items)){
      const o=obj(pair);add(sectionId,"paragraph",[text(o.question),text(o.answer)].filter(Boolean).join(" — "),{layout:"faq"});
    }
    if(type==="testimonials")for(const rawItem of array(section.items)){
      const o=obj(rawItem);add(sectionId,"paragraph",[text(o.quote),text(o.author)].filter(Boolean).join(" — "));
    }
    for(const action of [section.primaryCta,section.cta,section.secondaryCta]){
      const o=obj(action),href=link(action);if(href)add(sectionId,"button",text(o.label)||"Saiba mais",{href});
    }
  }
  if(blocks.length<4)throw Error("O projeto do CRM ainda não possui conteúdo suficiente para o Builder 2.0.");
  const instagram=text(obj(business.instagramUrl).value);
  const whatsapp=text(obj(business.whatsappE164).value)||text(obj(business.phoneE164).value);
  return {
    id:projectId,kind:"institutional",title:name,background,
    niche:text(business.niche),templateId:crmTemplateFromConfig(config),
    heroPresentation:"immersive",blocks,motion:{preset:"professional"},
    footer:{
      ...(instagram.startsWith("https://")?{instagram}:{}),
      ...(whatsapp?{whatsapp}:{}),
      showFloatingWhatsapp:Boolean(whatsapp)
    }
  };
}
