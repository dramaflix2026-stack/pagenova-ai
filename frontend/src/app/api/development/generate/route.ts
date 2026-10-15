import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
export const runtime="nodejs";export const dynamic="force-dynamic";export const maxDuration=120;
type Source={path:string;content:string};
const schema={
 type:"object",additionalProperties:false,
 properties:{
  name:{type:"string"},summary:{type:"string"},nextSteps:{type:"array",items:{type:"string"}},
  files:{type:"array",items:{type:"object",additionalProperties:false,properties:{
   path:{type:"string"},content:{type:"string"},
  },required:["path","content"]}}
 },required:["name","summary","nextSteps","files"]
};
function outputText(raw:unknown):string{
 const v=raw as {output_text?:string;output?:Array<{content?:Array<{type?:string;text?:string}>}>};
 return v.output_text||v.output?.flatMap(x=>x.content||[]).filter(x=>x.type==="output_text").map(x=>x.text||"").join("")||"";
}
function safePath(path:string):boolean{
 return path.length<=140&&!path.includes("\\")&&!path.includes("..")&&!path.startsWith("/")&&
  /^[a-zA-Z0-9._/-]+$/.test(path)&&!/(?:^|\/)\.env|(?:^|\/)\.git|(?:^|\/)node_modules|(?:^|\/)package-lock\.json/i.test(path)&&
  /^(?:app\/|src\/|components\/|lib\/|public\/|assets\/|scripts\/|README\.md$|package\.json$|app\.json$|tsconfig\.json$|babel\.config\.js$|next\.config\.(?:ts|js)$|expo-env\.d\.ts$|metro\.config\.js$|tailwind\.config\.(?:js|ts)$|postcss\.config\.(?:js|mjs)$)/.test(path);
}
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  await authorizedForms();
  const text=await request.text();
  if(text.length>360000)throw new FormServiceError("O projeto enviado é muito grande para uma revisão.",413);
  const raw=JSON.parse(text) as {kind?:unknown;prompt?:unknown;existing?:Source[]};
  const kind=raw.kind==="apps"?"apps":raw.kind==="systems"?"systems":null;
  const prompt=typeof raw.prompt==="string"?raw.prompt.trim():"";
  if(!kind||prompt.length<12||prompt.length>50000)throw new FormServiceError("Escolha o tipo e descreva o aplicativo ou sistema.");
  const existing=Array.isArray(raw.existing)?raw.existing.filter((f):f is Source=>typeof f?.path==="string"&&typeof f.content==="string"&&safePath(f.path)&&f.content.length<=35000).slice(0,20):[];
  const key=process.env.OPENAI_API_KEY;
  if(!key)throw new FormServiceError("A criação de código por IA não está configurada.",503);
  const stack=kind==="apps"?"Expo/React Native (TypeScript). Inclua package.json, app.json, App.tsx ou app/index.tsx e README.md. Componentes e navegação devem funcionar no Expo Go sem serviços privados.":"Next.js App Router (TypeScript/React). Inclua package.json, app/page.tsx, app/layout.tsx, app/globals.css e README.md. O resultado deve iniciar com npm install e npm run dev.";
  const response=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},
   body:JSON.stringify({model:process.env.PAGENOVA_DEVELOPMENT_MODEL||"gpt-4.1",
    store:false,max_output_tokens:12500,
    instructions:[
     "Você é um engenheiro de software especializado em projetos utilizáveis e autocontidos.",
     "Crie um MVP REAL, compilável e responsivo, não apenas um plano, apresentação ou simulação da interface.",
     "Tecnologia obrigatória: "+stack,
     "Entregue de 5 a 16 arquivos de texto com caminhos relativos seguros. Não inclua bytes binários, dependências obscuras, funções perigosas, comandos shell executáveis nem segredos.",
     "Não invente integrações funcionais com pagamento, banco de dados, push, autenticação, servidores ou publicação em lojas. Marque dependências externas explicitamente e implemente fallback local quando apropriado.",
     "Não use APIs de terceiros sem instrução explícita. Não inclua chaves, tokens, endpoints privados ou credenciais no código.",
     "Use dados ilustrativos identificados como demonstração onde não há backend. Elementos interativos devem ter comportamento real no navegador/React Native.",
     "Para uma revisão, preserve funcionalidades e arquivos existentes quando o pedido não exigir modificações. Retorne o conjunto completo de arquivos finais.",
     "Resumo e próximos passos devem especificar limites, comandos de build/teste e o processo de publicação necessário.",
     "Toda escrita em português brasileiro e toda resposta estritamente em JSON."
    ].join("\n"),
    input:(existing.length?"PROJETO ATUAL:\n"+JSON.stringify(existing).slice(0,185000)+"\n\nALTERAÇÃO SOLICITADA:\n":"NOVO PROJETO:\n")+prompt,
    text:{format:{type:"json_schema",name:"pagenova_development_project",strict:true,schema}},
   }),signal:AbortSignal.timeout(105000)
  });
  const result=await response.json().catch(()=>({})) as {error?:{message?:string};usage?:unknown};
  if(!response.ok)throw new FormServiceError("Falha ao gerar o projeto: "+(result.error?.message||"Tente novamente."),502);
  let parsed:{name:string;summary:string;nextSteps:string[];files:Source[]};
  try{parsed=JSON.parse(outputText(result));}catch{throw new FormServiceError("A IA não retornou arquivos válidos. Tente novamente.",502);}
  if(!parsed||!Array.isArray(parsed.files)||parsed.files.length<2||parsed.files.length>25)
    throw new FormServiceError("Não foi possível criar uma estrutura de arquivos válida.",502);
  let total=0;const seen=new Set<string>();
  const files=parsed.files.map(f=>{
    if(typeof f?.path!=="string"||typeof f.content!=="string"||!safePath(f.path)||seen.has(f.path))
      throw new FormServiceError("A IA retornou um arquivo inválido ou repetido.",502);
    seen.add(f.path);total+=f.content.length;
    if(f.content.length>50000||total>280000)throw new FormServiceError("O projeto excedeu os limites de exportação.",502);
    return {path:f.path,content:f.content};
  });
  return Response.json({
    name:String(parsed.name||"Novo projeto").slice(0,100),
    summary:String(parsed.summary||"Projeto gerado.").slice(0,2500),
    files,nextSteps:Array.isArray(parsed.nextSteps)?parsed.nextSteps.map(x=>String(x).slice(0,500)).slice(0,12):[],
    usage:result.usage||null
  },{headers:{"Cache-Control":"no-store"}});
 }catch(e){return errorsAsResponse(e);}
}
