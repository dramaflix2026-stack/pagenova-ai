const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const numberWords:Record<string,number>={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12};
const quantity="(?:\\d{1,2}|"+Object.keys(numberWords).join("|")+")";
const categories:Record<string,string>={servicos:"servicos?|tratamentos?",diferenciais:"diferenciais?|vantagens?",processo:"etapas?|passos?|processo(?: de atendimento)?",faq:"perguntas(?: frequentes)?|faq",depoimentos:"depoimentos?|testemunhos?",planos:"planos?",equipe:"profissionais?|integrantes|membros",modalidades:"modalidades?|atividades?"};

/** Each match belongs to its own section, even when the brief is one long line. */
export function briefCardCounts(instruction:string):Map<string,number>{
  const text=normalize(instruction).replace(/\*\*/g,"");
  const matches:Array<{at:number;id:string;count:number}>=[];
  for(const [id,terms] of Object.entries(categories)){
    const patterns=[
      new RegExp("\\b("+quantity+")\\s+(?:(?:cards?|itens?)\\s+(?:de\\s+)?)?(?:"+terms+")\\b","g"),
      new RegExp("\\b(?:"+terms+")\\s*(?:(?:com|:|[-–—])\\s*)?(?:exatamente\\s+)?("+quantity+")\\s*(?:cards?|itens?|perguntas?|etapas?)?\\b","g")
    ];
    for(const pattern of patterns)for(const match of text.matchAll(pattern)){
      const count=numberWords[match[1]]??Number(match[1]);
      // A numbered heading isn't a quantity (e.g. 'Serviços\n1. Terapia').
      if(/\d$/.test(match[0])&&/[.)]/.test(text[(match.index||0)+match[0].length]||""))continue;
      if(count>=1&&count<=12)matches.push({at:match.index||0,id,count});
    }
  }
  // Briefings frequently specify a section first and its card count afterwards:
  // "Como funciona o atendimento: serão 4 cards, cada um com uma etapa".
  // Only associate a generic card count when it is close to an explicit section
  // label, on the same line, and not separated by another section heading.
  const sectionAliases:Record<string,RegExp>={
    servicos:/\b(?:servicos?|tratamentos?)\b/g,
    diferenciais:/\b(?:diferenciais?|vantagens?|por que (?:nos )?escolher)\b/g,
    processo:/\b(?:como funciona(?: o atendimento)?|etapas? do atendimento|processo de atendimento)\b/g,
    faq:/\b(?:perguntas frequentes|faq)\b/g,
    depoimentos:/\b(?:depoimentos?|testemunhos?)\b/g,
    planos:/\b(?:planos?)\b/g,
    equipe:/\b(?:equipe|profissionais?)\b/g,
    modalidades:/\b(?:modalidades?)\b/g
  };
  const genericCount=new RegExp("\\b("+quantity+")\\s+(?:cards?|itens?|etapas?|passos?|perguntas?)\\b","g");
  const headings:Array<{at:number;end:number;id:string}>=[];
  for(const [id,pattern] of Object.entries(sectionAliases)){
    for(const match of text.matchAll(pattern))headings.push({at:match.index||0,end:(match.index||0)+match[0].length,id});
  }
  headings.sort((a,b)=>a.at-b.at);
  for(const match of text.matchAll(genericCount)){
    const at=match.index||0;
    const preceding=headings.filter(h=>h.end<=at&&at-h.end<=110).at(-1);
    if(!preceding)continue;
    const between=text.slice(preceding.end,at);
    if(/[.!?\n]/.test(between))continue;
    const count=numberWords[match[1]]??Number(match[1]);
    if(count>=1&&count<=12)matches.push({at,id:preceding.id,count});
  }
  const result=new Map<string,number>();
  for(const match of matches.sort((a,b)=>a.at-b.at))result.set(match.id,match.count);
  return result;
}

export function briefHeadingAlignment(instruction:string):"left"|"center"|"right"|undefined{
  const text=normalize(instruction);
  if(!/todos (?:os )?titulos|titulos (?:de todas as secoes|das secoes|do site)/.test(text))return undefined;
  const direction=text.match(/(?:todos (?:os )?titulos|titulos (?:de todas as secoes|das secoes|do site))[^.!?\n]{0,80}?(centraliz\w*|centro|esquerda|direita)/)?.[1]
    ||text.match(/(centraliz\w*|centro|esquerda|direita)[^.!?\n]{0,50}todos (?:os )?titulos/)?.[1];
  return direction?/esquerda/.test(direction)?"left":/direita/.test(direction)?"right":"center":undefined;
}

export type AdaptiveDesign={surface?:string;text?:string;muted?:string;accent?:string};
export const hexColor=(value:unknown):string|undefined=>typeof value==="string"&&/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)?value:undefined;
export function adaptivePalette(background:string,design:AdaptiveDesign={}){
  const expand=(value:string)=>{const raw=value.slice(1);return raw.length===3?raw.split("").map(c=>c+c).join(""):raw;};
  const bg=hexColor(background)||"#ffffff";
  const luminance=(color:string)=>{
    const channels=expand(color).match(/../g)!.map(n=>parseInt(n,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
  };
  const dark=luminance(bg)<.179;
  const readable=(preferred:unknown,bgColor:string,fallback:string)=>{
    const color=hexColor(preferred);
    if(!color)return fallback;
    const a=luminance(color),b=luminance(bgColor);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5?color:fallback;
  };
  const ink=readable(design.text,bg,dark?"#f5f5f5":"#24332e");
  const muted=readable(design.muted,bg,dark?"#cbd0d4":"#4d5652");
  const surface=hexColor(design.surface)||(dark?"#20242a":"#ffffff");
  const surfaceDark=luminance(surface)<.179;
  return {background:bg,surface,ink,muted,cardInk:readable(design.text,surface,surfaceDark?"#f5f5f5":"#24332e"),cardMuted:readable(design.muted,surface,surfaceDark?"#cbd0d4":"#4d5652"),accent:hexColor(design.accent)||(dark?"#b8d7c5":"#234b3a"),dark};
}
