import {authorizedForms,errorsAsResponse} from "@/lib/forms/server";
import {getOwnedQuiz} from "@/lib/quizzes/server";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  try{const {admin,userId}=await authorizedForms();const {id}=await context.params;
    return Response.json({quiz:await getOwnedQuiz(admin,userId,id)},{headers:{"Cache-Control":"no-store"}});
  }catch(e){return errorsAsResponse(e);}
}