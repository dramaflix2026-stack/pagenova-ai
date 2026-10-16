import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * PageNova's paid-operation credit gate.
 *
 * Contract per subscriber / Kiwify billing cycle:
 *   40 initial site generations shared by CRM and Studio
 *   150 Google Places text-search pages
 * Editing, published previews, history, PDF and page revision are NOT debited.
 *
 * Credit schema has been migrated and active subscriber cycles reconciled.
 * Enforce by default so a missing deployment flag can never grant unlimited
 * paid generations. PAGENOVA_CREDITS_ENFORCE=0 is an explicit emergency
 * suspension only; failed RPCs always fail closed while enforcement is on.
 */
export const PAGENOVA_SITE_CREDITS=40;
export const PAGENOVA_GOOGLE_CREDITS=150;
export const PAGENOVA_MONTHLY_PRICE_BRL=147;
export type CreditKind="site_generation"|"google_page";
export type CreditAccount={userId:string;email:string};
export type CreditBalance={
  active:boolean;cycleId?:string;sitesUsed?:number;sitesLimit?:number;
  sitesRemaining:number;googleUsed?:number;googleLimit?:number;
  googleRemaining:number;startedAt?:string;
};
export type CreditReservation={
  allowed:boolean;created?:boolean;operationId?:string;
  reason?:string;state?:string;jobId?:string|null;
};
export class CreditGateError extends Error {
  constructor(message:string,public readonly status:number,public readonly code:string){
    super(message);this.name="CreditGateError";
  }
}
export function creditGateEnabled():boolean {
  return process.env.PAGENOVA_CREDITS_ENFORCE !== "0";
}
function must<T>(data:T|null,error:{code?:string;message:string}|null,operation:string):T {
  if(error||data==null) {
    console.error("[PageNova Credits] RPC unavailable",{
      operation,code:error?.code||"NO_DATA",
    });
    throw new CreditGateError("Saldo de créditos temporariamente indisponível. Nenhuma geração foi iniciada.",503,"CREDITS_UNAVAILABLE");
  }
  return data;
}
export async function bootstrapCredits(admin:SupabaseClient,email:string):Promise<void>{
  const {data,error}=await admin.rpc("pagenova_credits_bootstrap",{p_email:email});
  const result=must(data,error,"bootstrap") as {error?:string};
  if(result.error==="no_active_order"||result.error==="order_already_closed") {
    throw new CreditGateError("Não há um ciclo ativo de créditos para esta assinatura. Verifique a renovação.",403,"NO_CREDIT_CYCLE");
  }
}
export async function getCreditBalance(admin:SupabaseClient,account:CreditAccount):Promise<CreditBalance>{
  await bootstrapCredits(admin,account.email);
  const {data,error}=await admin.rpc("pagenova_credits_balance",{
    p_email:account.email,p_owner_id:account.userId,
  });
  return must(data,error,"balance") as CreditBalance;
}
export async function reserveCredit(admin:SupabaseClient,account:CreditAccount,
  kind:CreditKind,key:string):Promise<CreditReservation>{
  if(!creditGateEnabled())throw new CreditGateError("O medidor de créditos ainda não foi ativado.",503,"METER_NOT_ACTIVE");
  await bootstrapCredits(admin,account.email);
  const {data,error}=await admin.rpc("pagenova_credits_reserve",{
    p_email:account.email,p_owner_id:account.userId,p_kind:kind,p_key:key,
  });
  const reservation=must(data,error,"reserve") as CreditReservation;
  if(!reservation.allowed) {
    if(reservation.reason==="site_limit")throw new CreditGateError(
      "Você utilizou as 40 gerações de sites deste ciclo. A edição dos sites existentes continua disponível.",402,"SITE_CREDITS_EXHAUSTED");
    if(reservation.reason==="google_limit")throw new CreditGateError(
      "Você utilizou as 150 páginas de pesquisa do Google deste ciclo. O histórico continua disponível sem custo.",402,"GOOGLE_CREDITS_EXHAUSTED");
    throw new CreditGateError("Assinatura sem ciclo de créditos ativo. Verifique sua renovação.",403,"NO_CREDIT_CYCLE");
  }
  if(!reservation.operationId)throw new CreditGateError("Falha ao reservar crédito.",503,"RESERVATION_FAILED");
  return reservation;
}
export async function settleCredit(admin:SupabaseClient,account:CreditAccount,
  operationId:string,success:boolean,jobId?:string):Promise<void>{
  const {data,error}=await admin.rpc("pagenova_credits_settle",{
    p_owner_id:account.userId,p_operation_id:operationId,
    p_success:success,p_job_id:jobId||null,
  });
  must(data,error,"settle");
}
export async function settleJobCredit(admin:SupabaseClient,account:CreditAccount,
  jobId:string,success:boolean):Promise<void>{
  const {data,error}=await admin.rpc("pagenova_credits_settle_job",{
    p_owner_id:account.userId,p_job_id:jobId,p_success:success,
  });
  must(data,error,"settle_job");
}
export function creditErrorResponse(err:unknown):Response {
  if(err instanceof CreditGateError){
    return Response.json({error:{code:err.code,message:err.message}},{status:err.status});
  }
  return Response.json({error:{code:"CREDITS_UNAVAILABLE",message:"Não foi possível confirmar o saldo. Tente novamente mais tarde."}},{status:503});
}
