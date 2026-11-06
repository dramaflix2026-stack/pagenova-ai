/**
 * TP1 visual niche isolation.
 *
 * Old sites can retain a barbershop niche and stock photos even after a
 * makeup brief was generated. Repair ONLY the rendering projection; never
 * mutate saved customer data or overwrite a user-uploaded photograph.
 */
type MakeupBlock={id:string;type:"heading"|"paragraph"|"button"|"image";text:string;section?:string;src?:string;mobileSrc?:string;userUploaded?:boolean};
type MakeupSite={title:string;niche?:string;header?:{brand?:string;ctaLabel?:string;navItems?:Array<{label:string;href:string}>};blocks:MakeupBlock[]};

export const MAKEUP_RE = /maquiag(?:em|ens)|maquiador(?:a|es|as)?|make[\s-]?up/i;
export const MAKEUP_PHOTOS = [
 "https://images.pexels.com/photos/6954214/pexels-photo-6954214.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/12346564/pexels-photo-12346564.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/7510157/pexels-photo-7510157.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/7881276/pexels-photo-7881276.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/8394923/pexels-photo-8394923.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/33607402/pexels-photo-33607402.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/11041338/pexels-photo-11041338.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/12957390/pexels-photo-12957390.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/32388554/pexels-photo-32388554.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/29588093/pexels-photo-29588093.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/31455821/pexels-photo-31455821.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/5655050/pexels-photo-5655050.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/10188480/pexels-photo-10188480.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/11951518/pexels-photo-11951518.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/7510147/pexels-photo-7510147.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/11219295/pexels-photo-11219295.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/12957391/pexels-photo-12957391.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/30089119/pexels-photo-30089119.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/37356607/pexels-photo-37356607.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/37356602/pexels-photo-37356602.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/19893107/pexels-photo-19893107.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/29611519/pexels-photo-29611519.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/36496720/pexels-photo-36496720.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/37377913/pexels-photo-37377913.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/33986816/pexels-photo-33986816.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/35983913/pexels-photo-35983913.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/37710475/pexels-photo-37710475.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/38765476/pexels-photo-38765476.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/3985332/pexels-photo-3985332.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/7446659/pexels-photo-7446659.jpeg?auto=compress&cs=tinysrgb&w=1200",
 "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200",
] as const;
export const MAKEUP_GALLERY_PHOTOS = [
 MAKEUP_PHOTOS[10],MAKEUP_PHOTOS[11],MAKEUP_PHOTOS[12],MAKEUP_PHOTOS[13]
];

const OLD_BARBER_PHOTOS = /(?:pexels-photo-|\/photos\/)(?:7518731|4625645|7518740|7518746|5584458|19050581|3998429|2076930|1813272|1805600)(?:\D|$)|photo-(?:1506794778202-cad84cf45f1d|1500648767791-00dcc994a43e|1507003211169-0a1dd7228f2d)/i;
const BARBER_COPY = /\b(?:barbearia|barbeir[oa]s?|barbershop|barber shop|barba|cortes?\s+(?:masculin[oa]s?|de\s+cabelo)|cuidado\s+masculino|estilo\s+masculino|cortes?\s+precisos?|corte\s+e\s+barba|tesoura\s+e\s+pente|acabamento\s+e\s+contornos|t[eé]cnica\s+do\s+barbeiro)\b/i;
const FAKE_BARBER_NAMES = /\b(?:Rafael Almeida|Lucas Ferreira|Bruno Martins|Andr[eé] Costa)\b/i;

const COPY:Record<string,{heading:string[];paragraph:string[]}>={
 inicio:{
  heading:["Realce sua beleza natural com nosso estúdio de maquiagem"],
  paragraph:["Maquiagem profissional e produções femininas que valorizam seus traços e a sua personalidade."]},
 sobre:{
  heading:["Uma experiência de beleza feita para você"],
  paragraph:["Cada produção é pensada para realçar sua beleza natural, respeitando suas preferências e a ocasião.","A atenção aos detalhes transforma cada atendimento em um momento especial."]},
 servicos:{
  heading:["Nossas especialidades","Maquiagem social","Maquiagem para eventos","Maquiagem para noivas","Maquiagem editorial"],
  paragraph:["Conheça possibilidades de maquiagem para diferentes ocasiões.","Uma produção personalizada para expressar seu estilo.","Beleza preparada para seus momentos especiais.","Uma proposta delicada e elegante para uma ocasião marcante.","Produções criativas para fotos e projetos."]},
 diferenciais:{
  heading:["Por que escolher nosso estúdio de maquiagem?","Técnica e delicadeza","Atenção individual","Beleza autêntica","Acabamento cuidadoso"],
  paragraph:["Cada detalhe é pensado para valorizar a sua identidade.","Combinações de cores e texturas com atenção ao resultado.","Seu estilo e suas referências orientam a produção.","Uma maquiagem que destaca suas características naturais.","Finalização pensada para cada ocasião."]},
 experiencia:{
  heading:["Uma experiência de maquiagem pensada em cada etapa"],
  paragraph:["Do primeiro contato à finalização, tudo começa com suas preferências."]},
 "como-funciona":{
  heading:["Como funciona seu atendimento","Conversa e referências","Preparação","Maquiagem","Finalização"],
  paragraph:["Conheça as etapas de uma experiência de beleza.","Alinhamos sua ocasião e o estilo desejado.","Organizamos referências e possibilidades.","A maquiagem é feita com atenção aos detalhes.","Conferimos o resultado com você."]},
 galeria:{
  heading:["Galeria de maquiagem e inspirações"],
  paragraph:["Fotografias ilustrativas do universo da maquiagem e da beleza feminina. Não representam necessariamente trabalhos realizados pelo estúdio."]},
 depoimentos:{
  heading:["Experiências e histórias"],
  paragraph:["Este espaço pode receber depoimentos reais, após a autorização de cada cliente."]},
 faq:{
  heading:["Dúvidas frequentes"],
  paragraph:["Consulte as principais dúvidas sobre maquiagem e agendamento."]},
 contato:{
  heading:["Entre em contato com nosso estúdio"],
  paragraph:["Converse conosco para consultar serviços, disponibilidade e condições de atendimento."]},
 trajetoria:{
  heading:["Nossa trajetória"],
  paragraph:["A maquiagem é uma forma de expressão que valoriza a beleza e a individualidade."]}
};
const sectionKey=(section?:string)=>{
 const s=(section||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(/inicio|hero|home|capa/.test(s))return "inicio";
 if(/sobre|essencia|about/.test(s))return "sobre";
 if(/servic|especialidade/.test(s))return "servicos";
 if(/diferencia/.test(s))return "diferenciais";
 if(/experiencia|journey/.test(s))return "experiencia";
 if(/como.funciona|processo|etapas/.test(s))return "como-funciona";
 if(/galeria|portfolio/.test(s))return "galeria";
 if(/depoiment|testimonial|avaliac|relato/.test(s))return "depoimentos";
 if(/perguntas|duvidas|faq/.test(s))return "faq";
 if(/contato|agendamento/.test(s))return "contato";
 if(/trajetoria|historia/.test(s))return "trajetoria";
 return s;
};

export function isTP1MakeupSite(site:MakeupSite,selectedNiche?:string):boolean {
 const brand=[site.header?.brand,site.title,selectedNiche].filter(Boolean).join(" ");
 if(MAKEUP_RE.test(brand))return true;
 // When the visible brand belongs to a different industry, do not re-route it
 // based on a stray mention of makeup in the description.
 if(/barbearia|barbershop|barbeiro/i.test(brand))return false;
 return MAKEUP_RE.test(site.niche||"");
}

export function prepareTP1MakeupSite<T extends MakeupSite>(site:T,selectedNiche?:string):T {
 if(!isTP1MakeupSite(site,selectedNiche))return site;
 const counts:Record<string,number>={};
 const imageCounts:Record<string,number>={};
 const normalizedBlocks=site.blocks.flatMap(block=>{
  const section=sectionKey(block.section);
  if(section==="depoimentos"&&block.type==="paragraph"&&
    (BARBER_COPY.test(block.text||"")||FAKE_BARBER_NAMES.test(block.text||"")))return [];
  const next={...block};
  if(block.type==="image"){
    const index=imageCounts[section]||0;
    imageCounts[section]=index+1;
    const replacement=section==="galeria"?MAKEUP_GALLERY_PHOTOS[index%MAKEUP_GALLERY_PHOTOS.length]:
      section==="sobre"?MAKEUP_PHOTOS[(index+1)%MAKEUP_PHOTOS.length]:
      section==="servicos"?MAKEUP_PHOTOS[(index+2)%MAKEUP_PHOTOS.length]:
      MAKEUP_PHOTOS[(index+3)%MAKEUP_PHOTOS.length];
    if(block.src&&!block.userUploaded&&OLD_BARBER_PHOTOS.test(block.src)){
      next.src=replacement;
      if(block.mobileSrc&&OLD_BARBER_PHOTOS.test(block.mobileSrc))next.mobileSrc=replacement;
      next.text="Imagem ilustrativa de maquiagem profissional";
    }
    return [next];
  }
  if(block.type!=="heading"&&block.type!=="paragraph"&&block.type!=="button")return [next];
  const key=section+":"+block.type;
  const index=counts[key]||0;
  counts[key]=index+1;
  if(BARBER_COPY.test(block.text||"")){
    if(block.type==="button"){
      next.text="Conheça os serviços";
    }else{
      const copy=COPY[section]?.[block.type]||COPY.sobre[block.type as "heading"|"paragraph"];
      next.text=copy[Math.min(index,copy.length-1)]||copy[0];
    }
  }
  return [next];
 });
 const header=site.header?{...site.header,
   ...(BARBER_COPY.test(site.header.ctaLabel||"")?{ctaLabel:"Agende sua maquiagem"}:{}),
   navItems:site.header.navItems?.map(item=>BARBER_COPY.test(item.label)?{...item,label:"Serviços"}:item)}:undefined;
 // No update to site.blocks in database: this is a safe render projection for
 // this exact explicit niche, including sites already generated before the fix.
 return {...site,niche:"Estúdio de Maquiagem",header,blocks:normalizedBlocks} as T;
}
