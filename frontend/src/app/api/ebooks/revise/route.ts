import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import type {EbookPage} from "@/lib/ebooks/schema";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
  await authorizedForms();
  const body=await request.json().catch(()=>({})) as {page?:Partial<EbookPage>;instruction?:unknown};
  const page=body.page,instruction=typeof body.instruction==="string"?body.instruction.trim():"";
  if(!page?.title||!instruction||instruction.length>50000)throw new FormServiceError("Informe a página e a alteração.");
  // Conservative local edits: no fabricated text, no surprise changes to existing content.
  const title=/\b(?:alterar|mudar|trocar)\s+(?:o\s+)?t[ií]tulo\s+(?:para|por|:)\s*([^.!?\n]+)/i.exec(instruction);
  const add=/\b(?:adicionar|inclu[ií]r|acrescentar)\s+(?:um\s+)?(?:item|t[oó]pico)\s*(?:sobre|:)?\s*([^.!?\n]+)/i.exec(instruction);
  if(!title&&!add)throw new FormServiceError("No modo sem IA, use o editor para reescrever parágrafos. A revisão automática local aceita 'alterar título para ...' e 'adicionar tópico ...'. Nenhuma API foi chamada.",422);
  const next={kind:page.kind,title:title?title[1].trim().slice(0,140):page.title,
    eyebrow:page.eyebrow,lead:page.lead,body:page.body,
    bullets:[...(Array.isArray(page.bullets)?page.bullets:[]),...(add?[add[1].trim().slice(0,200)]:[])].slice(0,8),
    imagePrompt:page.imagePrompt};
  return Response.json({page:next,usage:null,paidApiCalls:0});
 }catch(error){return errorsAsResponse(error);}
}