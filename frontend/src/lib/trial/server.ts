import type { SupabaseClient, User } from "@supabase/supabase-js";

export type PageNovaTrial={
  active:boolean;reason?:string;startedAt?:string;expiresAt?:string;
  sitesLimit?:number;sitesUsed?:number;sitesRemaining?:number;
  googleLimit?:number;googleUsed?:number;googleRemaining?:number;
};
export type PageNovaAccess={kind:"paid"|"trial"|"none";trial?:PageNovaTrial;reason?:string};
export class TrialUnavailable extends Error{
  constructor(message="Não foi possível verificar o período de avaliação.",public status=503){
    super(message);this.name="TrialUnavailable";
  }
}
export function isTrialEnabled(){return process.env.PAGENOVA_TRIAL_ENABLED!=="0";}

export async function getPageNovaAccess(
 admin:SupabaseClient,user:Pick<User,"id"|"email"|"email_confirmed_at">,
 start=false,
):Promise<PageNovaAccess>{
 const email=user.email?.trim().toLowerCase();
 if(!email)return {kind:"none",reason:"missing_email"};
 const {data:paid,error:paidError}=await admin.from("entitlements")
  .select("id").eq("product","pagenova-ai").eq("status","active")
  .ilike("email",email).limit(1).maybeSingle();
 if(paidError){
  console.error("[PageNova access] Paid entitlement verification failed",{code:paidError.code});
  throw new TrialUnavailable();
 }
 if(paid)return {kind:"paid"};
 if(!isTrialEnabled())return {kind:"none",reason:"trials_disabled"};
 // Never initiate a free trial for an unconfirmed identity.
 if(!user.email_confirmed_at)return {kind:"none",reason:"email_not_verified"};
 const {data,error}=await admin.rpc("pagenova_trial_access",{
  p_owner_id:user.id,p_email:email,p_start:start,
 });
 if(error||!data||typeof data!=="object"){
  console.error("[PageNova trial] Trial access RPC unavailable",{code:error?.code||"NO_DATA"});
  throw new TrialUnavailable();
 }
 const trial=data as PageNovaTrial;
 return trial.active?{kind:"trial",trial}:{kind:"none",trial,reason:trial.reason||"expired"};
}

export type TrialKind="site_generation"|"google_page";
export type TrialReservation={allowed:boolean;created?:boolean;operationId?:string;jobId?:string|null;state?:string;reason?:string};
export async function reserveTrialCredit(
 admin:SupabaseClient,ownerId:string,kind:TrialKind,key:string,
):Promise<TrialReservation>{
 const {data,error}=await admin.rpc("pagenova_trial_reserve",{
  p_owner_id:ownerId,p_kind:kind,p_key:key,
 });
 if(error||!data||typeof data!=="object"){
  console.error("[PageNova trial] Reserve RPC failed",{code:error?.code||"NO_DATA"});
  throw new TrialUnavailable("Não foi possível reservar um crédito do teste.");
 }
 return data as TrialReservation;
}
export async function settleTrialCredit(
 admin:SupabaseClient,ownerId:string,operationId:string,success:boolean,jobId?:string,
){
 const {data,error}=await admin.rpc("pagenova_trial_settle",{
  p_owner_id:ownerId,p_operation_id:operationId,p_success:success,p_job_id:jobId||null,
 });
 if(error||!data){
  console.error("[PageNova trial] Settlement failed",{code:error?.code||"NO_DATA"});
  throw new TrialUnavailable("Não foi possível conciliar o crédito do teste.");
 }
}
export async function settleTrialJob(admin:SupabaseClient,jobId:string,success:boolean){
 const {data,error}=await admin.rpc("pagenova_trial_settle_job",{
  p_job_id:jobId,p_success:success,
 });
 if(error||!data){
  console.error("[PageNova trial] Job settlement failed",{code:error?.code||"NO_DATA"});
  throw new TrialUnavailable("Não foi possível conciliar a geração.");
 }
 return data as {found?:boolean};
}
