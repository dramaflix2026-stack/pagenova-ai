import {authorizedForms,errorsAsResponse} from "@/lib/forms/server";
import {listQuizResponses} from "@/lib/quizzes/server";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){
  try{const {admin,userId}=await authorizedForms();
    const {id}=await context.params;
    return Response.json({responses:await listQuizResponses(admin,userId,id)},
      {headers:{"Cache-Control":"private,no-store"}});
  }catch(e){return errorsAsResponse(e);}
}