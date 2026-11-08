/**
 * Local-only visual quality fixture for the three universal builder models.
 *
 * Never include this route in Production: the proxy rejects it before session
 * handling, and this server component also returns notFound outside dev.
 *
 * It renders the exact BuilderV2Site component, not a mock UI. The content is
 * deliberately synthetic and uses no customer data, unpublished sites, CRM or
 * Supabase state. Its purpose is to surface cross-niche photo and layout bugs.
 */
import {notFound} from "next/navigation";
import {BuilderV2Site,type BuilderV2SiteData} from "@/components/builder-v2-site";
import {BRIEFING_TEMPLATE_FAMILIES} from "@/lib/briefing-template-families";

type QAParams={niche?:string;model?:string};
export default async function BuilderV2QualityFixture({searchParams}:{searchParams:Promise<QAParams>}){
  if(process.env.NODE_ENV!=="development")notFound();
  const params=await searchParams;
  const niche=typeof params.niche==="string"?params.niche.trim():"";
  const model=params.model==="02"?"02":params.model==="03"?"03":"01";
  const family=BRIEFING_TEMPLATE_FAMILIES.find(f=>f.niches.some(n=>n===niche));
  if(!family)notFound();
  const block=(id:string,section:string,type:"heading"|"paragraph",text:string):BuilderV2SiteData["blocks"][number]=>({
    id,section,type,text,align:"left",color:"#222222",
  });
  const blocks:BuilderV2SiteData["blocks"]=[
    block("qa-hero-head","inicio","heading","Conheça o universo de "+niche),
    block("qa-hero-description","inicio","paragraph","Uma prévia ilustrativa para conferir a identidade visual e a apresentação deste segmento."),
    block("qa-about-heading","sobre","heading","Uma experiência pensada para você"),
    block("qa-about-copy","sobre","paragraph","Textos e imagens desta página são exemplos de teste visual, não informações de uma empresa real."),
    block("qa-services-heading","servicos","heading","Nossos serviços e especialidades"),
    block("qa-services-copy","servicos","paragraph","Conheça possibilidades e referências do segmento."),
    block("qa-specialties-heading","especialidades","heading","Nossas especialidades"),
    block("qa-specialties-copy","especialidades","paragraph","Uma seleção de serviços, experiências e produtos para descobrir."),
    block("qa-process-heading","processo","heading","Como funciona"),
    block("qa-process-copy","processo","paragraph","Consulte as informações e entre em contato para saber mais."),
    block("qa-gallery-heading","galeria","heading","Nossa galeria"),
    block("qa-contact-heading","contato","heading","Entre em contato"),
  ];
  const site:BuilderV2SiteData={
    id:"qa-"+family.id+"-"+model+"-"+niche,
    title:niche,
    niche,
    kind:"institutional",
    templateId:"prompt-adaptive",
    briefingLayoutVariant:model,
    background:"#faf8f3",
    blocks,
    heroPresentation:"immersive",
    socialProof:{enabled:false},
  };
  return <div data-qa-builder-v2="true" data-qa-family={family.id} data-qa-niche={niche} data-qa-variant={model} className="min-h-screen">
    <div style={{background:"#191d1a",color:"#ffffff",fontSize:12,textAlign:"center",padding:9}}>
      PRÉVIA TÉCNICA LOCAL · {niche} · MODELO {model} · NÃO PUBLICAR
    </div>
    <BuilderV2Site site={site} selectedNiche={niche} publishedMode={false} templateId="prompt-adaptive"/>
  </div>;
}
