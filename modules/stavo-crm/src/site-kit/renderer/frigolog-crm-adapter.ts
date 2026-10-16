/**
 * Maps CRM content into the exact FRIGOLOG React template.
 * The same CSS and React component source are generated at build for both
 * the frontend preview and this renderer. No layout is recreated here.
 */
import type { SiteSchemaModel, SiteSection, AssetRef } from '@site-kit/schemas/site-schema';
import type { RenderContext } from '@site-kit/primitives/render-utils';
import { hrefFor } from '@site-kit/primitives/render-utils';
import type { UniversalSiteData, TemplateBenefit, TemplateService } from './frigolog-template-data.generated';

type OfType<K extends SiteSection['type']> = Extract<SiteSection,{type:K}>;
const pick = <K extends SiteSection['type']>(s:SiteSection[], type:K):OfType<K>|undefined =>
  s.find(x => x.type===type && x.visible) as OfType<K>|undefined;
const clean=(value:string|null|undefined,fallback:string):string=>
  (value?.trim() || fallback).slice(0,1200);

export function cleanLeadBrand(name:string,niche?:string):string {
  const found=/^(.*?)\s+\(([^)]{3,80})\)\s*$/.exec(name.trim());
  if(!found) return name.trim();
  const norm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const tag=norm(found[2]!);
  const category=norm(niche??'');
  return ((category && (category===tag||category.includes(tag)||tag.includes(category)))||tag.includes('/'))
    ? found[1]!.trim():name.trim();
}
const image=(ref:AssetRef|null|undefined,ctx:RenderContext,alt:string)=>{
  const asset=ref?ctx.resolveAsset(ref.assetId):null;
  return {src:asset?.url??'',alt:clean(ref?.alt,alt)};
};
const benefit=(title:string,description:string):TemplateBenefit=>({
  title:clean(title,'Informações'), description:clean(description,'Consulte a equipe para saber mais.'),
});
const four=<T extends {title:string;description:string}>(items:T[],fallbacks:T[]):[T,T,T,T]=>{
  const result=[...items,...fallbacks].filter(x=>x.title.trim()).slice(0,4);
  while(result.length<4) result.push(fallbacks[0]!);
  return result as [T,T,T,T];
};
function urlFor(model:SiteSchemaModel):string {
  const url=hrefFor(model.objective.primaryCta);
  if(/^(https:\/\/|\/|#|tel:|mailto:)/.test(url)) return url;
  const number=model.business.whatsappE164?.value?.replace(/\D/g,'');
  return number?'https://wa.me/'+number:'#contato';
}
export function adaptCrmToFrigolog(model:SiteSchemaModel,ctx:RenderContext):UniversalSiteData {
  const sections=model.sections;
  const hero=pick(sections,'hero'), benefits=pick(sections,'benefits');
  const services=pick(sections,'services'), about=pick(sections,'about');
  const process=pick(sections,'process'), cta=pick(sections,'cta');
  const gallery=pick(sections,'gallery'), authority=pick(sections,'authority');
  const footer=pick(sections,'footer');
  const niche=clean(model.business.niche,'Serviços e atendimento');
  const name=cleanLeadBrand(model.business.name,model.business.niche);
  const brandWordmark=clean(model.navigation.wordmark,name);
  const region=[model.business.city,model.business.state].filter(Boolean).join(', ');
  const logo=image(model.navigation.logo,ctx,name).src;
  const benefitItems=(benefits?.items??[]).map(item=>benefit(item.title,item.body??''));
  const serviceItems:TemplateService[]=[
    ...(services?.items??[]).map(item=>benefit(item.title,item.body??'')),
    ...(model.business.services??[]).map(item=>benefit(item.name,item.description??'')),
  ];
  const highlights=four(benefitItems,[
    ...serviceItems,
    benefit('Atendimento','Converse com a equipe para conhecer as opções.'),
    benefit('Informações','Tire suas dúvidas antes de decidir.'),
    benefit('Contato','Entre em contato com o estabelecimento.'),
    benefit('Localização',region||'Consulte a área de atendimento.'),
  ]);
  const serviceCards=four(serviceItems,[
    benefit('Conheça o atendimento','Saiba mais sobre os serviços disponíveis.'),
    benefit('Tire suas dúvidas','Converse com a equipe antes de agendar.'),
    benefit('Informações','Conheça as opções para seu caso.'),
    benefit('Próximos passos','Entre em contato para saber como começar.'),
  ]);
  const paragraphs=(about?.body??[]).filter(Boolean);
  const aboutParagraphs=[
    clean(paragraphs[0],name+' oferece informações sobre '+niche.toLowerCase()+'.'),
    clean(paragraphs[1],'Entre em contato para conhecer o atendimento de '+name+'.'),
  ] as [string,string];
  const aboutBenefits=[
    ...benefitItems.slice(0,3).map(x=>x.title),
    'Converse diretamente com a equipe',
    'Tire suas dúvidas sobre o atendimento',
    'Solicite informações antes de agendar',
  ].slice(0,3) as [string,string,string];
  // These are the real process steps produced by the plan assembler.
  // Previously the FRIGOLOG bridge discarded their text AND their images.
  const processSteps=(process?.steps??[]).filter(step=>step.title.trim()).slice(0,3);
  const operationImage=processSteps.find(step=>step.image)?.image
    ?? gallery?.images[0]
    ?? authority?.image;
  return {
    brand:{
      name:brandWordmark,tagline:clean([niche.toUpperCase(),region.toUpperCase()].filter(Boolean).join(' · '),niche.toUpperCase()),
      ...(logo?{logoUrl:logo}:{})
    },
    palette:{
      primary:model.theme.colors.primary,accent:model.theme.colors.accent,
      background:model.theme.colors.background,foreground:model.theme.colors.text
    },
    hero:{
      eyebrow:clean(hero?.eyebrow,[niche.toUpperCase(),region.toUpperCase()].filter(Boolean).join(' · ')),
      title:clean(hero?.headline,'Conheça '+name+'.'),
      description:clean(hero?.subheadline,'Entre em contato com '+name+' para saber mais.'),
      image:image(hero?.image,ctx,'Imagem de '+name),
      ctaLabel:clean(hero?.primaryCta.label,model.objective.primaryCta.label),
    },
    highlights,
    services:{
      eyebrow:'O QUE FAZEMOS',heading:clean(services?.headline,'Conheça os serviços de '+name+'.'),
      items:serviceCards,
    },
    about:{
      eyebrow:'QUEM SOMOS',heading:clean(about?.headline,'Conheça '+name+'.'),
      paragraphs:aboutParagraphs,benefits:aboutBenefits,
      image:image(about?.image??authority?.image,ctx,'Fotografia de '+name),
      ctaLabel:clean(about?.cta?.label,'Saiba mais'),
    },
    coverage:{
      eyebrow:'COMO TRABALHAMOS',heading:clean(process?.headline,'Conheça nosso atendimento.'),
      description:clean(process?.subheadline??model.business.description,
        'Entre em contato com '+name+' para entender os próximos passos.'),
      image:image(operationImage,ctx,'Imagem ilustrativa do atendimento de '+name),
      steps:processSteps.map(step=>benefit(step.title,step.body??'Entre em contato para saber mais.')),
    },
    contact:{
      eyebrow:'VAMOS CONVERSAR?',heading:clean(cta?.headline,'Fale com '+name+'.'),
      description:clean(cta?.body,'Converse com a equipe de '+name+'.'),
      ctaLabel:clean(cta?.primaryCta.label,model.objective.primaryCta.label),
      ctaUrl:urlFor(model),
    },
    footer:{copyright:clean(footer?.tagline,'© '+new Date().getFullYear()+' '+name+'. Todos os direitos reservados.')},
  };
}
