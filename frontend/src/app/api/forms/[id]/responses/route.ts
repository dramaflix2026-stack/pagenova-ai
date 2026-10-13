import { authorizedForms, errorsAsResponse, listOwnedSubmissions } from "@/lib/forms/server";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** This endpoint is owner-only; public users cannot read submitted answers. */
export async function GET(_request:Request,context:{params:Promise<{id:string}>}) {
  try {
    const {id}=await context.params;
    const {admin,userId}=await authorizedForms();
    const responses=await listOwnedSubmissions(admin,userId,id);
    return Response.json({responses},{headers:{"Cache-Control":"no-store, private"}});
  }catch(error){return errorsAsResponse(error);}
}
