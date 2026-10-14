import type {EbookPageKind,EbookImageMode} from "./schema";

/**
 * A deterministic editorial art direction pass, before the text-generation call.
 * Rotating content families by topic ensures every project gets a deliberate visual
 * rhythm. AI fills the story; the application controls composition consistency.
 */
export type PageBlueprint={
  page:number;kind:EbookPageKind;purpose:string;
  visual:"photo"|"infographic"|"typography"|"data";
};
const PURPOSE:Record<EbookPageKind,string>={
  cover:"Capa: promessa concreta do livro e composição visual marcante",
  chapter:"Abertura contextual de capítulo, com informação e exemplos distintos",
  feature:"Página editorial com fotografia contextual e texto de apoio",
  quote:"Um insight memorável, contexto e uma aplicação prática",
  summary:"Resumo visual do que o leitor de fato aprendeu",
  back:"Fechamento original com próximos passos claros, sem repetir o resumo",
  checklist:"Checklist específico, cada item com orientação executável",
  steps:"Processo sequencial detalhado e operacional",
  comparison:"Comparação objetiva entre alternativas, com critérios claros",
  timeline:"Linha do tempo de um projeto, processo ou plano de execução",
  caseStudy:"Exemplo aplicado concreto, situação, processo e resultado esperado",
  gallery:"Galeria de três aplicações/casos concretos com legendas explicativas",
  infographic:"Painel de conceitos, números apenas verificáveis e relações visuais",
  insight:"Página de dica profissional com alertas, erros comuns e solução",
};
const SEQUENCES:EbookPageKind[][]=[
  ["chapter","checklist","feature","steps","comparison","timeline","caseStudy","gallery","insight","infographic","summary","quote"],
  ["chapter","comparison","caseStudy","checklist","timeline","feature","steps","infographic","gallery","insight","quote","summary"],
  ["insight","feature","steps","checklist","gallery","comparison","caseStudy","timeline","summary","infographic","chapter","quote"],
];
const VISUAL_PHOTO=new Set<EbookPageKind>(["cover","feature","gallery","caseStudy"]);
const VISUAL_DATA=new Set<EbookPageKind>(["comparison","timeline","infographic"]);
export function planEbookPages(prompt:string,count:number,mode:EbookImageMode):PageBlueprint[]{
  const clean=Math.max(2,Math.min(24,Math.floor(count)));
  let hash=0;
  for(const character of prompt.slice(0,300).toLowerCase()){
    hash=(Math.imul(hash,33)+character.charCodeAt(0))|0;
  }
  const pick=Math.abs(hash)%SEQUENCES.length;
  const palette=SEQUENCES[pick];
  const interior=clean-2;
  let sequence:EbookPageKind[]=[];
  // Ensure unique rhythm even in longer ebooks: avoid adjacent repeats and
  // never place more than two pages from the same family within a five-page span.
  for(let i=0;i<interior;i++){
    let choice=palette[(i+Math.floor(i/palette.length))%palette.length];
    if(sequence.slice(-4).filter(item=>item===choice).length>=2||
      sequence[sequence.length-1]===choice){
      choice=palette.find(item=>item!==sequence[sequence.length-1]&&
        sequence.slice(-4).filter(current=>current===item).length<2)||"insight";
    }
    sequence.push(choice);
  }
  const kinds:EbookPageKind[]=["cover",...sequence,"back"];
  return kinds.map((kind,i)=>({
    page:i+1,kind,purpose:PURPOSE[kind],
    visual:mode==="none"?"infographic":
      VISUAL_PHOTO.has(kind)?"photo":VISUAL_DATA.has(kind)?"data":"typography",
  }));
}
export function isPhotoPage(kind:EbookPageKind):boolean{
  return VISUAL_PHOTO.has(kind)||kind==="chapter";
}
export function layoutQuality(pages:{kind:EbookPageKind;title:string}[]):{
  families:number;repeatedNeighbors:number;duplicateTitles:number
}{
  const families=new Set(pages.map(p=>p.kind)).size;
  const repeatedNeighbors=pages.reduce((a,p,i)=>a+(i>0&&pages[i-1]?.kind===p.kind?1:0),0);
  const titles=new Set(pages.map(p=>p.title.trim().toLowerCase()));
  return {families,repeatedNeighbors,duplicateTitles:pages.length-titles.size};
}
