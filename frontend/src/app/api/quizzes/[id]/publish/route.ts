import {NextRequest} from "next/server";
import {authorizedForms,errorsAsResponse,FormServiceError} from "@/lib/forms/server";
import {publishOwnedQuiz} from "@/lib/quizzes/server";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
  try{
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const {admin,userId}=await authorizedForms();
    const {id}=await context.params;
    const quiz=await publishOwnedQuiz(admin,userId,id);
    return Response.json({quiz,url:"/q/"+quiz.id},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorsAsResponse(e);}
}