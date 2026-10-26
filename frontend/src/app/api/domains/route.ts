import {NextRequest,NextResponse} from "next/server";
import {authorizedForms,errorsAsResponse} from "@/lib/forms/server";
import {checkVercelDomain,normalizeCustomerDomain,registerVercelDomain,vercelDomainAvailable} from "@/lib/pagenova-custom-domains";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const NO_CACHE={"Cache-Control":"no-store"} as const;
type DomainBody={projectId?:unknown;domain?:unknown};

export async function GET(){
  try{
    const {admin,userId}=await authorizedForms();
    const [siteResult,domainResult]=await Promise.all([
      admin.from("pagenova_site_publications").select("project_id,slug,title,published_at")
        .eq("owner_id",userId).order("published_at",{ascending:false}).limit(100),
      admin.from("pagenova_custom_domains").select("domain,project_id,slug,state,verification,dns_instructions,updated_at")
        .eq("owner_id",userId).order("updated_at",{ascending:false}).limit(100)
    ]);
    if(siteResult.error||domainResult.error)throw new Error("domain registry unavailable");
    return NextResponse.json({
      connectionAvailable:vercelDomainAvailable(),
      sites:(siteResult.data||[]).map(row=>({id:row.project_id,slug:row.slug,title:row.title,
        publishedAt:row.published_at,url:"/p/"+row.slug})),
      domains:(domainResult.data||[]).map(row=>({domain:row.domain,projectId:row.project_id,slug:row.slug,
        state:row.state,verification:row.verification,dnsInstructions:row.dns_instructions,updatedAt:row.updated_at}))
    },{headers:NO_CACHE});
  }catch(error){
    return errorsAsResponse(error)??NextResponse.json({error:"Não foi possível consultar seus sites publicados."},{status:503,headers:NO_CACHE});
  }
}

export async function POST(request:NextRequest){
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
  try{
    const {admin,userId}=await authorizedForms();
    if(!vercelDomainAvailable())return NextResponse.json({
      error:"A conexão automática de domínios está em preparação. Nenhum registro DNS deve ser alterado ainda."
    },{status:503,headers:NO_CACHE});
    const body=await request.json() as DomainBody;
    const projectId=typeof body.projectId==="string"?body.projectId.trim():"";
    const domain=normalizeCustomerDomain(body.domain as string);
    if(!domain||!/^[a-zA-Z0-9_-]{8,128}$/.test(projectId))
      return NextResponse.json({error:"Selecione um site publicado e informe um domínio válido."},{status:422});
    const {data:publication,error:publicationError}=await admin.from("pagenova_site_publications")
      .select("slug,project_id").eq("owner_id",userId).eq("project_id",projectId).maybeSingle();
    if(publicationError||!publication)return NextResponse.json({error:"Este site não possui uma publicação válida na sua conta."},{status:403});
    const {data:existing,error:readError}=await admin.from("pagenova_custom_domains")
      .select("owner_id,project_id").eq("domain",domain).maybeSingle();
    if(readError)throw readError;
    if(existing&&(existing.owner_id!==userId||existing.project_id!==projectId))
      return NextResponse.json({error:"Este domínio já está associado a outro projeto."},{status:409});
    if(!existing){
      const {error:reservationError}=await admin.from("pagenova_custom_domains").insert({
        domain,owner_id:userId,project_id:projectId,slug:publication.slug,state:"pending"
      });
      if(reservationError){
        return NextResponse.json({error:"Não foi possível reservar o domínio. Ele pode estar associado a outro projeto."},{status:409});
      }
    }
    let state;
    try{
      state=existing?await checkVercelDomain(domain):await registerVercelDomain(domain);
    }catch(error){
      await admin.from("pagenova_custom_domains").update({state:"error",last_error:"vercel_error",updated_at:new Date().toISOString()})
        .eq("domain",domain).eq("owner_id",userId);
      return NextResponse.json({error:error instanceof Error?error.message:"Não foi possível registrar o domínio."},{status:502});
    }
    const status=state.configured?"active":"needs_configuration";
    const {error:updateError}=await admin.from("pagenova_custom_domains").update({
      state:status,slug:publication.slug,verification:state.verification,dns_instructions:state.dnsInstructions,
      last_error:null,updated_at:new Date().toISOString()
    }).eq("domain",domain).eq("owner_id",userId);
    if(updateError)throw updateError;
    return NextResponse.json({domain,projectId,state:status,verified:state.verified,
      verification:state.verification,dnsInstructions:state.dnsInstructions
    },{status:201,headers:NO_CACHE});
  }catch(error){
    if(error instanceof SyntaxError)return NextResponse.json({error:"Dados inválidos."},{status:400});
    return errorsAsResponse(error)??NextResponse.json({error:"Não foi possível criar a conexão."},{status:503,headers:NO_CACHE});
  }
}

export async function PATCH(request:NextRequest){
  const origin=request.headers.get("origin");
  if(origin&&origin!==request.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
  try{
    const {admin,userId}=await authorizedForms();
    if(!vercelDomainAvailable())return NextResponse.json({error:"Verificação automática ainda indisponível."},{status:503});
    const body=await request.json() as {domain?:unknown};
    const domain=normalizeCustomerDomain(body.domain as string);
    if(!domain)return NextResponse.json({error:"Domínio inválido."},{status:422});
    const {data:existing}=await admin.from("pagenova_custom_domains")
      .select("project_id").eq("domain",domain).eq("owner_id",userId).maybeSingle();
    if(!existing)return NextResponse.json({error:"Domínio não encontrado nesta conta."},{status:404});
    const state=await checkVercelDomain(domain);
    const status=state.configured?"active":"needs_configuration";
    const {error}=await admin.from("pagenova_custom_domains").update({
      state:status,verification:state.verification,dns_instructions:state.dnsInstructions,
      updated_at:new Date().toISOString()
    }).eq("domain",domain).eq("owner_id",userId);
    if(error)throw error;
    return NextResponse.json({domain,state:status,verified:state.verified,
      verification:state.verification,dnsInstructions:state.dnsInstructions},{headers:NO_CACHE});
  }catch(error){
    return errorsAsResponse(error)??NextResponse.json({error:"Não foi possível verificar o domínio agora."},{status:503,headers:NO_CACHE});
  }
}
