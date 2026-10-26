import type {User} from "@supabase/supabase-js";
import {authorizedForms} from "@/lib/forms/server";
import {getPageNovaAccess,reserveTrialCredit,settleTrialCredit} from "@/lib/trial/server";
import {creditGateEnabled,reserveCredit,settleCredit,creditErrorResponse,type CreditAccount} from "@/lib/credits/server";
import {reservePaidAiBudget} from "@/lib/paid-ai-budget";

/**
 * The public Studio Builder shares the SAME site-generation wallet as CRM.
 * Only creation gets charged; editing, imports, previews and publishing don't.
 * The legacy meter can be temporarily in usage-only mode during reconciliation.
 */
export async function reserveBuilderV2Generation(user:Pick<User,"id"|"email"|"email_confirmed_at">,key:string){
  const {admin}=await authorizedForms();
  const access=await getPageNovaAccess(admin,user);
  if(access.kind==="none")throw new Error("Acesso PageNova necessário para gerar sites.");
  const account:CreditAccount={userId:user.id,email:user.email?.trim().toLowerCase()||""};
  const reference="studio-v2:"+key;
  let paidOperation:string|null=null,trialOperation:string|null=null;
  if(access.kind==="trial"){
    const reservation=await reserveTrialCredit(admin,user.id,"site_generation",reference);
    if(!reservation.allowed)throw new Error("Você já utilizou suas gerações do teste grátis. Edições continuam disponíveis.");
    if(!reservation.created||!reservation.operationId)throw new Error("Esta geração já foi solicitada. Verifique seu histórico antes de reenviar.");
    trialOperation=reservation.operationId;
  }else if(creditGateEnabled()){
    const reservation=await reserveCredit(admin,account,"site_generation",reference);
    if(!reservation.created||!reservation.operationId)throw new Error("Esta geração já foi solicitada. Verifique seu histórico antes de reenviar.");
    paidOperation=reservation.operationId;
  }
  const finish=async(success:boolean)=>{
    if(trialOperation)await settleTrialCredit(admin,user.id,trialOperation,success);
    else if(paidOperation)await settleCredit(admin,account,paidOperation,success);
    else if(success){
      // Same usage-only recording as the CRM proxy while reconciliation runs.
      const {error}=await admin.rpc("pagenova_usage_record",{
        p_email:account.email,p_owner_id:account.userId,p_kind:"site_generation",p_key:reference,p_job_id:null,
      });
      if(error)console.error("[Builder V2] Studio usage recording failed",error.code);
    }
  };
  const budget=await reservePaidAiBudget(admin,user.id,"crm_site_generation");
  if(!budget.ok){
    await finish(false);
    throw new Error(budget.message);
  }
  return {finish};
}
export function generationCreditError(error:unknown):Response{
  const generic=creditErrorResponse(error);
  if(error instanceof Error&&!(error.name==="CreditGateError")){
    // Don't leak credentials or unexpected database details.
    const safe=/^(?:Você já utilizou|Esta geração já foi solicitada|Acesso PageNova necessário|Não foi possível confirmar)/.test(error.message)
      ?error.message:"Não foi possível autorizar uma geração. Nenhum crédito foi cobrado.";
    return Response.json({error:safe},{status:403});
  }
  return generic;
}
