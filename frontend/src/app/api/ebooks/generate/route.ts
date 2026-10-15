import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import type {EbookTheme} from "@/lib/ebooks/schema";
import {LOCAL_ENGINE_MODE} from "@/lib/studio/local-engine";
import {editorialEbook} from "@/lib/ebooks/editorial-engine";
import {detectEbookIntent,buildCookbook} from "@/lib/ebooks/cookbook-engine";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  await authorizedForms();
  const raw=await request.text();
  if(raw.length>3500000)throw new FormServiceError("Anexos excedem o limite.",413);
  const input=JSON.parse(raw) as Record<string,unknown>;
  const prompt=typeof input.prompt==="string"?input.prompt.trim():"";
  const references=Array.isArray(input.references)?input.references:[];
  if(!prompt&&!references.length)throw new FormServiceError("Descreva um assunto para o eBook.");
  if(prompt.length>50000)throw new FormServiceError("O texto excede 50 mil caracteres.",413);
  const themeOptions=["editorial","midnight","forest","corporate","modern","premium"];
  const theme=themeOptions.includes(String(input.theme))?input.theme as EbookTheme:"editorial";
  const pageCount=[6,8,10,12,16].includes(Number(input.pageCount))?Number(input.pageCount):8;
  const imageMode=input.imageMode==="none"?"none":"web";
  const author=typeof input.author==="string"?input.author.trim().slice(0,140):"";
  let intent:ReturnType<typeof detectEbookIntent>;
  try { intent=detectEbookIntent(prompt); }
  catch(error) { throw new FormServiceError(error instanceof Error?error.message:"Pedido de receitas inválido.",422); }
  const ebook=intent.kind==="cookbook"
    ?buildCookbook({prompt,count:intent.requestedItems,author,theme,imageMode})
    :editorialEbook({prompt:prompt||"Referências visuais fornecidas pelo autor; complete o briefing textual.",pageCount,author,theme,imageMode});
  const delivered=intent.kind==="cookbook"?ebook.pages.filter(page=>page.kind==="recipe").length:null;
  return Response.json({ebook,usage:null,engine:intent.kind==="cookbook"?"curated-cookbook-v1":"editorial-planner-local-v2",
    paidApiCalls:0,editorialPlan:{kind:intent.kind,requestedItems:intent.requestedItems,deliveredItems:delivered,
    pages:ebook.pages.length,validated:intent.kind==="cookbook"?delivered===intent.requestedItems:true}},
    {headers:{"Cache-Control":"no-store"}});
 }catch(error){return errorsAsResponse(error);}
}