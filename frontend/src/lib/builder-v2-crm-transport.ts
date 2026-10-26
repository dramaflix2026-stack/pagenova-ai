import {convertCrmSiteToBuilder,crmAssetIds,type ImportedCrmSite} from "@/lib/builder-v2-crm-import";

/**
 * Authenticated, one-time transfer of a completed CRM project to the existing
 * Builder V2. Never create a new CRM job or call OpenAI here.
 * Images are copied to the existing user-owned site-images storage so
 * published Builder URLs don't depend on a private CRM session cookie.
 */
export async function importReadyCrmProject(projectId:string):Promise<ImportedCrmSite>{
  if(!/^[a-zA-Z0-9_-]{20,40}$/.test(projectId))throw Error("Projeto CRM inválido.");
  const get=async(path:string)=>{
    const response=await fetch(path,{credentials:"same-origin",cache:"no-store"});
    if(!response.ok)throw Error(response.status===401||response.status===403
      ?"Entre na sua conta para acessar as fotos e dados deste lead.":"Não foi possível consultar o projeto CRM ("+response.status+").");
    return response.json() as Promise<Record<string,unknown>>;
  };
  const project=await get("/api/crm/site-projects/"+encodeURIComponent(projectId));
  const status=typeof (project.project as Record<string,unknown>|undefined)?.status==="string"
    ?(project.project as Record<string,unknown>).status:"";
  if(status!=="READY"&&status!=="PUBLISHED")throw Error("Este projeto ainda está gerando. Abra o Builder 2.0 quando estiver pronto.");
  const response=await get("/api/crm/site-projects/"+encodeURIComponent(projectId)+"/config");
  const config=response.config;
  if(!config||typeof config!=="object")throw Error("O CRM ainda não entregou o site gerado.");
  const assets=await get("/api/crm/site-projects/"+encodeURIComponent(projectId)+"/assets");
  const items=Array.isArray(assets.assets)?assets.assets as Array<Record<string,unknown>>:[];
  const referenced=crmAssetIds(config);
  const urls:Record<string,string>={};
  // Keep the CRM hero intact. Other verified assets follow its existing order.
  const transfer=async(assetId:string)=>{
    const asset=items.find(item=>item.id===assetId&&!item.deletedAt);
    if(!asset)return;
    if(!["GOOGLE_PLACES","UPLOAD","AI_GENERATED"].includes(String(asset.source||"")))return;
    const media=await fetch(
      "/api/crm/site-projects/"+encodeURIComponent(projectId)+"/assets/"+encodeURIComponent(assetId)+"/file",
      {credentials:"same-origin",cache:"no-store"}
    );
    if(!media.ok)return;
    const bytes=await media.blob();
    if(bytes.size<100||bytes.size>8_000_000||!["image/png","image/jpeg","image/webp"].includes(bytes.type))return;
    const form=new FormData();
    form.append("projectId",projectId);
    form.append("file",new File([bytes],assetId+".webp",{type:bytes.type}));
    const saved=await fetch("/api/builder-v2/assets",{method:"POST",body:form,credentials:"same-origin"});
    if(!saved.ok)return;
    const result=await saved.json() as {src?:string};
    if(typeof result.src==="string"&&result.src.startsWith("https://"))urls[assetId]=result.src;
  };
  // Image transfer previously happened strictly one by one, making a ready
  // CRM site appear to regenerate on slow mobile connections. Three concurrent
  // copies keep the original approved cover and photos but cut handoff latency.
  for(let index=0;index<referenced.length;index+=3){
    await Promise.all(referenced.slice(index,index+3).map(transfer));
  }
  return convertCrmSiteToBuilder(config,urls,projectId);
}
