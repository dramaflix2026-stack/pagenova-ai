import { NextRequest } from "next/server";
import { authorizedForms, errorsAsResponse, FormServiceError } from "@/lib/forms/server";

export const runtime = "nodejs";
export const maxDuration = 35;

type WikiPage = {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    url?: string;
    descriptionurl?: string;
    width?: number;
    height?: number;
    extmetadata?: {
      LicenseShortName?: {value?: string};
      LicenseUrl?: {value?: string};
      Artist?: {value?: string};
      Credit?: {value?: string};
    };
  }>;
};
type ImageCandidate = {url:string;credit:string;source:string;score:number};
const commonWords = new Set([
  "professional","photograph","photo","editorial","style","image","illustration","realistic",
  "vertical","horizontal","portrait","landscape","overhead","vibrant","colorful",
  "rustic","wooden","detailed","texture","depth","field","studio","focus","conceptual",
  "high","quality","light","lighting","natural","background","minimalist","beautiful",
  "composition","with","from","above","close","up","shot","closeup","isolated","a",
  "an","the","and","of","in","on","for","to","fresh","healthy","clean","food",
  "white","table","plate","flat","lay","modern","soft","warm","bright","showing",
  "arranged","ingredients","homemade","balanced","concept","visual","premium",
  "sem","com","uma","umas","para","sobre","mais","menos","como","que","por",
  "dos","das","de","da","do","no","na","os","as","um","uma","seu","sua","e",
  "receita","receitas","dicas","prático","guia","capítulo","introdução","passos",
]);
const aliases: Record<string,string> = {
  "aveia":"oatmeal","banana":"banana","barrinha":"granola bar","caseira":"homemade",
  "smoothie":"smoothie","verde":"green","suco":"juice","frutas":"fruits",
  "salada":"salad","frango":"chicken","ovo":"egg","omelete":"omelette",
  "iogurte":"yogurt","lanche":"snack","lancheira":"lunchbox","legumes":"vegetables",
  "batata":"potato","café":"coffee","manha":"breakfast","manhã":"breakfast",
  "almoço":"lunch","jantar":"dinner","refeição":"meal","refeições":"meal",
  "emagrecimento":"nutrition","saudável":"healthy","alimentação":"nutrition",
  "fitness":"fitness","livro":"book","negócios":"business","beleza":"beauty",
  "pele":"skin","cabelos":"hair","natureza":"nature","viagem":"travel",
  "flores":"flowers","educação":"education","marketing":"marketing",
};
function clean(value:string):string {
  return value.replace(/<[^>]*>/g," ").replace(/&(?:amp|quot|lt|gt|nbsp);/g," ")
    .replace(/\s+/g," ").trim().slice(0,120);
}
function words(value:string):string[]{
  const basic=value.replace(/[^a-zA-ZÀ-ÿ0-9\s-]/g," ").toLowerCase()
    .split(/\s+/).filter(Boolean);
  return basic.map(w=>aliases[w]||w).flatMap(w=>w.split(" "))
    .filter(w=>w.length>2&&!commonWords.has(w));
}
const visualSubjects=new Set([
  "smoothie","banana","oatmeal","breakfast","salad","chicken","omelette","eggs",
  "yogurt","granola","soup","coffee","vegetables","fruits","fruit","rice",
  "avocado","apple","strawberry","blueberry","fish","salmon","bread",
  "pancakes","pasta","quinoa","potato","meal","snack","dessert",
  "flowers","forest","mountain","ocean","architecture","interior","office",
  "business","computer","education","books","fitness","nature",
]);
function queries(prompt:string,title:string,topic:string):string[]{
  const prompts=words(prompt);
  const titles=words(title);
  const topicWords=words(topic);
  const subject=[...titles,...prompts].find(term=>visualSubjects.has(term));
  const context=[...titles,...prompts].filter(term=>term!==subject).slice(0,3);
  const strategies=[
    // Commons indexes filenames/categories. Short, concrete nouns are more
    // reliable than an entire AI art prompt or marketing phrase.
    subject?[subject,...context].slice(0,2).join(" "):"",
    prompts.slice(0,3).join(" "),
    titles.slice(0,3).join(" "),
    subject||"",
    topicWords.slice(0,2).join(" "),
    prompts.find(w=>w.length>4)||"",
  ].filter(Boolean);
  return [...new Set(strategies.map(q=>q.slice(0,80).trim()))].slice(0,6);
}
function licenseAllowed(name:string):boolean {
  const value=clean(name).trim().toUpperCase();
  if(!value||/NON.?COMMERCIAL|\bNC\b|BY-NC|BY-ND|NO.?DERIVATIVES|GFDL|UNKNOWN/i.test(value))return false;
  return /^(?:CC0(?:\s|$|-)|CC\s*BY(?:\s|$|-SA|-)|PUBLIC\s*DOMAIN|PD(?:-|$|\s))/i.test(value);
}
function mediaUrl(url:string):boolean {
  try {
    const parsed=new URL(url);
    return parsed.protocol==="https:"&&parsed.hostname==="upload.wikimedia.org"&&
      parsed.pathname.startsWith("/wikipedia/commons/")&&
      /\.(jpg|jpeg|png|webp)(?:\/[^/]+)?$/i.test(parsed.pathname);
  }catch{return false;}
}
async function lookup(query:string,signal:AbortSignal):Promise<ImageCandidate[]>{
  const url=new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action","query");
  url.searchParams.set("generator","search");
  url.searchParams.set("gsrsearch",query);
  url.searchParams.set("gsrnamespace","6");
  url.searchParams.set("gsrlimit","24");
  url.searchParams.set("prop","imageinfo");
  url.searchParams.set("iiprop","url|size|extmetadata");
  url.searchParams.set("iiurlwidth","1000");
  url.searchParams.set("format","json");
  url.searchParams.set("formatversion","2");
  const response=await fetch(url.toString(),{
    headers:{"User-Agent":"PageNovaAI-EbookStudio/1.1 (licensed-media-search)","Accept":"application/json"},
    signal,cache:"no-store",
  });
  if(!response.ok)throw new Error("Wikimedia indisponível (HTTP "+response.status+").");
  const json=await response.json() as {
    query?:{pages?:WikiPage[]};error?:{info?:string};
  };
  if(json.error)throw new Error(json.error.info||"Erro na busca de imagens.");
  const terms=words(query);
  return (json.query?.pages||[]).flatMap((page):ImageCandidate[]=>{
    const photo=page.imageinfo?.[0];
    if(!photo)return [];
    const imageUrl=photo.thumburl||photo.url||"";
    const license=clean(photo.extmetadata?.LicenseShortName?.value||"");
    if(!licenseAllowed(license)||!mediaUrl(imageUrl))return [];
    if(photo.width&&photo.height&&(photo.width<500||photo.height<350))return [];
    const title=clean(page.title||"").replace(/^File:/i,"");
    const lower=title.toLowerCase();
    const relevant=terms.reduce((total,term)=>total+(lower.includes(term.toLowerCase())?3:0),0);
    const nonPhoto=/icon|logo|diagram|symbol|screenshot|map|clip.?art|cartoon|illustration/i.test(title)?-10:0;
    const quality=(photo.width||1200)>=1200?2:0;
    const creditName=clean(photo.extmetadata?.Artist?.value||
      photo.extmetadata?.Credit?.value||"Autor não informado");
    const source=photo.descriptionurl||"";
    const attribution=[creditName,license,source].filter(Boolean).join(" · ");
    return [{url:imageUrl,credit:attribution,source,score:relevant+quality+nonPhoto}];
  }).sort((a,b)=>b.score-a.score);
}

export async function GET(req:NextRequest){
  try{
    await authorizedForms();
    const prompt=(req.nextUrl.searchParams.get("q")||"").trim();
    const title=(req.nextUrl.searchParams.get("title")||"").trim();
    const topic=(req.nextUrl.searchParams.get("topic")||"").trim();
    if(!prompt&&!title)throw new FormServiceError("Informe o assunto da imagem.",400);
    const excluded=new Set((req.nextUrl.searchParams.get("exclude")||"")
      .split(",").map(x=>x.trim()).filter(Boolean));
    const terms=queries(prompt.slice(0,360),title.slice(0,150),topic.slice(0,150));
    if(!terms.length)return Response.json({
      image:null,notice:"Não foi possível extrair palavras-chave para pesquisar fotos.",
    },{headers:{"Cache-Control":"no-store"}});
    let checked=0,providerErrors=0;
    const seen=new Set<string>();
    let choices:ImageCandidate[]=[];
    for(const query of terms){
      try{
        const found=await lookup(query,AbortSignal.timeout(7000));
        checked++;
        for(const img of found) {
          if(!seen.has(img.url)&&!excluded.has(img.url)){seen.add(img.url);choices.push(img);}
        }
        // Stop early when we found several usable, licensed photos.
        if(choices.length>=3)break;
      }catch(error){
        providerErrors++;
        console.warn("[Ebook images] Commons search failed",{
          query,reason:error instanceof Error?error.name:"unknown",
        });
      }
    }
    choices=choices.sort((a,b)=>b.score-a.score);
    if(!choices.length){
      return Response.json({image:null,
        notice:providerErrors&&!checked
          ?"O banco de fotos está indisponível no momento. Tente novamente."
          :"Não encontrei fotos com licença comercial compatível para este assunto.",
        searched:terms,
      },{headers:{"Cache-Control":"no-store"}});
    }
    // Rank by relevance first; CC attribution and original source are retained.
    const selected=choices[0];
    return Response.json({
      image:{url:selected.url,credit:selected.credit,source:selected.source},
      candidates:choices.slice(0,6).map(({url,credit,source})=>({url,credit,source})),
      searched:terms,
    },{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorsAsResponse(error);}
}
