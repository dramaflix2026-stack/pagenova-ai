import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authorizedForms } from "@/lib/forms/server";
import { getPageNovaAccess } from "@/lib/trial/server";
import {
  creditGateEnabled,getCreditBalance,PAGENOVA_GOOGLE_CREDITS,
  PAGENOVA_MONTHLY_PRICE_BRL,PAGENOVA_SITE_CREDITS,CreditGateError,
} from "@/lib/credits/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  try{
    const session=await createClient();
    const {data:{user}}=await session.auth.getUser();
    if(!user?.email){
      return NextResponse.json({error:"Faça login para consultar seus créditos."},{status:401});
    }
    const {admin,userId}=await authorizedForms();
    const access=await getPageNovaAccess(admin,user);
    if(access.kind==="trial"){
      return NextResponse.json({
        configured:true,kind:"trial",trial:access.trial,
        priceBrl:PAGENOVA_MONTHLY_PRICE_BRL,
        balance:{active:true,sitesLimit:2,sitesUsed:access.trial?.sitesUsed??0,
          sitesRemaining:access.trial?.sitesRemaining??0,googleLimit:5,
          googleUsed:access.trial?.googleUsed??0,googleRemaining:access.trial?.googleRemaining??0,
          startedAt:access.trial?.startedAt},
      },{headers:{"Cache-Control":"no-store"}});
    }
    let balance;
    try{
      balance=await getCreditBalance(admin,{
        userId,email:user.email.trim().toLowerCase(),
      });
    }catch(error){
      if(error instanceof CreditGateError&&error.code==="NO_CREDIT_CYCLE"){
        return NextResponse.json({
          configured:true,priceBrl:PAGENOVA_MONTHLY_PRICE_BRL,reconciled:creditGateEnabled(),
          balance:{active:false,sitesRemaining:0,googleRemaining:0},
        },{headers:{"Cache-Control":"no-store"}});
      }
      throw error;
    }
    return NextResponse.json({
      configured:true,priceBrl:PAGENOVA_MONTHLY_PRICE_BRL,balance,
      reconciled:creditGateEnabled(),
    },{headers:{"Cache-Control":"no-store"}});
  }catch(error){
    const status=error instanceof CreditGateError?error.status:503;
    return NextResponse.json({
      error:error instanceof CreditGateError?error.message:"Não foi possível verificar seus créditos. Tente novamente.",
    },{status,headers:{"Cache-Control":"no-store"}});
  }
}
