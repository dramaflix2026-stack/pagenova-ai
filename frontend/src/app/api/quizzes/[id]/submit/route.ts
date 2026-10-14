import {NextRequest} from "next/server";
import {errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {quizAdmin,submitPublicQuiz} from "@/lib/quizzes/server";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const type=request.headers.get("content-type")||"";
    if(!type.includes("application/json"))throw new FormServiceError("Envie respostas em JSON.",415);
    const text=await request.text();
    if(text.length>12000)throw new FormServiceError("Respostas grandes demais.",413);
    let body:unknown;
    try{body=JSON.parse(text);}catch{throw new FormServiceError("Respostas inválidas.",400);}
    const {id}=await context.params;
    const result=await submitPublicQuiz(quizAdmin(),id,body);
    return Response.json(result,{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorsAsResponse(e);}
}