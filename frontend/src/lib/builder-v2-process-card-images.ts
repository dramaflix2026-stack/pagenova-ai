/**
 * Free deterministic process-card images, shared by the four institutional
 * templates. No network call, image API, or per-lead generation.
 * Public niche assets are the exact approved Studio image bank.
 */
export type ProcessCardPhoto={
  id:string;src?:string;mobileSrc?:string;forCardId?:string;
  text?:string;imageFit?:"cover"|"contain";imagePosition?:string;userUploaded?:boolean;
};
type ImageBank=Record<string,{desktop:string[];mobile:string[]}>;
export function matchApprovedNicheBank(
  niche:string|undefined,title:string,catalog:ImageBank
):{name:string;desktop:string[];mobile:string[]}|null{
  const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const input=normalize([niche,title].filter(Boolean).join(" "));
  const main=normalize(niche||"");
  const aliases:Array<[RegExp,string]>=[
    [/\b(?:odontolog|dentist|dentista|ortodont|implantodont|endodont|saude bucal)/,"Odontologia"],
    [/\b(?:medic|hospital|clinica geral|consultorio medico)/,"Clínica médica"],
    [/\b(?:psicolog|psicoterap)/,"Psicologia"],
    [/\b(?:advoga|juridic)/,"Advocacia"],
    [/\b(?:arquit|interior design)/,"Arquitetura"],
    [/\b(?:fisioterap)/,"Fisioterapia"],
    [/\b(?:veterinar)/,"Veterinária"],
    [/\b(?:hamburguer|burger)/,"Hamburgueria"],
    [/\b(?:pizzari|pizza)/,"Pizzaria"],
  ];
  const alias=aliases.find(([re])=>re.test(input))?.[1];
  const matched=alias&&catalog[alias]?alias:
    Object.keys(catalog).find(key=>normalize(key)===main)||
    Object.keys(catalog).find(key=>{
      const normalizedKey=normalize(key);
      return normalizedKey.length>=5&&new RegExp("(^| )"+normalizedKey+"( |$)").test(input);
    });
  const bank=matched?catalog[matched]:undefined;
  return bank?.desktop?.length>=4&&bank?.mobile?.length>=4?{name:matched!,desktop:bank.desktop,mobile:bank.mobile}:null;
}

export function distinctProcessCardPhotos<T extends ProcessCardPhoto>({
  cards,photos,niche,title,catalog,baseUrl,crmImported=false,appendExtra=false
}:{
  cards:Array<{id:string}>;photos:T[];niche?:string;title:string;
  catalog:ImageBank;baseUrl:string;crmImported?:boolean;appendExtra?:boolean;
}):Array<T|ProcessCardPhoto|undefined>{
  const bank=matchApprovedNicheBank(niche,title,catalog);
  const approved:ProcessCardPhoto[]=bank?bank.desktop
    .map((id,index)=>bank.mobile[index]?{
      id:"approved-process-"+bank.name+"-"+index,
      src:baseUrl+id+".png",mobileSrc:baseUrl+bank.mobile[index]+".png",
      text:"Imagem ilustrativa do segmento",imageFit:"cover" as const
    }:undefined).filter(Boolean) as ProcessCardPhoto[]:[];
  const used=new Set<string>();
  const choose=(items:Array<T|ProcessCardPhoto>)=>{
    const candidate=items.find(photo=>!!photo.src&&!used.has(photo.src));
    if(candidate?.src)used.add(candidate.src);
    return candidate;
  };
  const distinct=photos.filter((photo):photo is T&{src:string}=>!!photo.src);
  const output:Array<T|ProcessCardPhoto|undefined>=[];
  for(const card of cards){
    // Explicit photos assigned to a card always win, including edits via chat.
    const linked=distinct.filter(photo=>photo.forCardId===card.id);
    // For CRM, prefer the Studio's six approved niche photos rather than
    // recycling the same 1–2 Google/hero photos through every process step.
    output.push(choose(linked)
      ||(crmImported?choose(approved):choose(distinct.filter(photo=>!photo.forCardId)))
      ||(crmImported?choose(distinct.filter(photo=>!photo.forCardId)):choose(approved)));
  }
  if(appendExtra){
    // Fourth card uses another DISTINCT asset, not the hero repeated by index.
    output.push((crmImported?choose(approved):choose(distinct.filter(photo=>!photo.forCardId)))
      ||(crmImported?choose(distinct.filter(photo=>!photo.forCardId)):choose(approved)));
  }
  return output;
}
