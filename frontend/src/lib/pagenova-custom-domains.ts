/**
 * Custom-domain validation and Vercel platform adapter.
 * NEVER display generic DNS as if it were a project-specific instruction.
 * The runtime must have a scoped Vercel access token; connector credentials
 * in ChatGPT do not grant customer-facing applications API access.
 */
export function normalizeCustomerDomain(raw:string):string|null {
  if(typeof raw!=="string")return null;
  const text=raw.trim().toLowerCase().replace(/\.$/,"");
  if(text.length<4||text.length>253||/[\/\\:@?#*\s]/.test(text))return null;
  const labels=text.split(".");
  if(labels.length<2||labels.some(label=>label.length<1||label.length>63||!(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))))return null;
  if(!/^[a-z]{2,63}$/.test(labels[labels.length-1]))return null;
  if(text==="pagenovaai.com.br"||text.endsWith(".pagenovaai.com.br")||text.endsWith(".vercel.app")||text==="localhost")return null;
  return text;
}
export type VercelDomainVerification={type:string;domain:string;value:string;reason?:string};
export type VercelDomainState={
  verified:boolean;
  configured:boolean;
  verification:VercelDomainVerification[];
  dnsInstructions:{a?:{name:string;value:string};cname?:{name:string;value:string}};
  problem?:string;
};
type JsonObject=Record<string,unknown>;
export function vercelDomainAvailable(){
  return Boolean(process.env.PAGENOVA_VERCEL_TOKEN&&
    (process.env.PAGENOVA_VERCEL_PROJECT_ID||process.env.VERCEL_PROJECT_ID));
}
function projectId(){return process.env.PAGENOVA_VERCEL_PROJECT_ID||process.env.VERCEL_PROJECT_ID||"";}
function teamQuery(){const id=process.env.PAGENOVA_VERCEL_TEAM_ID;return id?"?teamId="+encodeURIComponent(id):"";}
async function vercel(path:string,method:"GET"|"POST"|"DELETE"="GET",body?:object):Promise<JsonObject>{
  const token=process.env.PAGENOVA_VERCEL_TOKEN;
  if(!token||!projectId())throw new Error("Serviço de domínios ainda não configurado.");
  const response=await fetch("https://api.vercel.com"+path+(path.includes("?")?"&":"?")+teamQuery().replace(/^\?/,""),{
    method,headers:{Authorization:"Bearer "+token,Accept:"application/json",...(body?{"Content-Type":"application/json"}:{})},
    body:body?JSON.stringify(body):undefined,
    cache:"no-store",signal:AbortSignal.timeout(12000)
  });
  const json=await response.json().catch(()=>({})) as JsonObject;
  if(!response.ok){
    const info=json.error as {code?:string;message?:string}|undefined;
    const code=String(info?.code||response.status);
    // Do not leak upstream infrastructure identifiers or auth messages.
    if(response.status===409||code.includes("already")||code.includes("conflict"))
      throw new Error("Este domínio já está em uso. Verifique a titularidade no provedor.");
    if(response.status===401||response.status===403)throw new Error("A configuração da conexão precisa ser revisada pelo suporte.");
    if(response.status===429)throw new Error("Muitas consultas. Tente novamente em alguns minutos.");
    throw new Error("Não foi possível consultar a configuração do domínio. Tente novamente.");
  }
  return json;
}
function arr(obj:JsonObject,key:string):JsonObject[]{
 const v=obj[key];return Array.isArray(v)?v.filter(x=>x&&typeof x==="object"):[];
}
function extractDomainState(project:JsonObject,configuration:JsonObject):VercelDomainState{
  const verification=arr(project,"verification").map(v=>({
    type:String(v.type||"TXT"),domain:String(v.domain||""),
    value:String(v.value||""),reason:typeof v.reason==="string"?v.reason:undefined
  })).filter(v=>v.domain&&v.value);
  // Vercel can return project-specific recommended values. If absent, show
  // a link to provider instructions instead of guessing a generic record.
  const recommendedCname=arr(configuration,"recommendedCNAME")[0];
  const recommendedIpv4=arr(configuration,"recommendedIPv4")[0];
  const cnameValue=typeof recommendedCname?.value==="string"?recommendedCname.value:undefined;
  const aValue=typeof recommendedIpv4?.value==="string"?recommendedIpv4.value:undefined;
  const dnsInstructions={
    ...(aValue?{a:{name:"@",value:aValue}}:{}),
    ...(cnameValue?{cname:{name:"www",value:cnameValue}}:{})
  };
  const verified=project.verified===true;
  const configured=verified&&configuration.misconfigured===false;
  return {verified,configured,verification,dnsInstructions};
}
export async function registerVercelDomain(domain:string):Promise<VercelDomainState>{
  const result=await vercel("/v10/projects/"+encodeURIComponent(projectId())+"/domains","POST",{name:domain});
  const config=await vercel("/v6/domains/"+encodeURIComponent(domain)+"/config").catch(()=>({}));
  return extractDomainState(result,config);
}
export async function checkVercelDomain(domain:string):Promise<VercelDomainState>{
  const pid=encodeURIComponent(projectId());
  // May require a TXT challenge; this POST is idempotent for domains
  // that Vercel already considers verified.
  const initial=await vercel("/v9/projects/"+pid+"/domains/"+encodeURIComponent(domain));
  let project=initial;
  if(initial.verified!==true){
    project=await vercel("/v9/projects/"+pid+"/domains/"+encodeURIComponent(domain)+"/verify","POST").catch(()=>initial);
  }
  const config=await vercel("/v6/domains/"+encodeURIComponent(domain)+"/config").catch(()=>({}));
  return extractDomainState(project,config);
}

/** Remove only the project binding; never delete the customer-owned registration. */
export async function unregisterVercelDomain(domain:string):Promise<void>{
  await vercel("/v9/projects/"+encodeURIComponent(projectId())+"/domains/"+encodeURIComponent(domain),"DELETE");
}
