import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {listOwnedQuizzes,saveOwnedQuiz} from "@/lib/quizzes/server";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){
  try{const {admin,userId}=await authorizedForms();
    return Response.json({quizzes:await listOwnedQuizzes(admin,userId)},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorsAsResponse(e);}
}
export async function POST(request:NextRequest){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const {admin,userId}=await authorizedForms();
    const text=await request.text();
    if(text.length>160000)throw new FormServiceError("Quiz grande demais.",413);
    let body:{id?:string;quiz?:unknown};
    try{body=JSON.parse(text);}catch{throw new FormServiceError("JSON inválido.");}
    if(!body||!body.quiz)throw new FormServiceError("Envie o quiz.");
    return Response.json({quiz:await saveOwnedQuiz(admin,userId,body.quiz,body.id)},
      {headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorsAsResponse(e);}
}