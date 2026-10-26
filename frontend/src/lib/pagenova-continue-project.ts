const STUDIO_STORAGE_KEY="pagenova-builder-v2-private-v1";

export type PageNovaDraftStorage={
  getItem(key:string):string|null;
  key(index:number):string|null;
  length:number;
};

/**
 * Resolve a user's existing on-device draft without a paid API call.
 * Legacy projects and visitors without a local draft can still open Meus Sites.
 */
export function resolvePageNovaContinueHref(storage:PageNovaDraftStorage):string {
  const isEditableDraft=(key:string)=>{
    try{
      const raw=storage.getItem(key);
      if(!raw)return false;
      const data:unknown=JSON.parse(raw);
      if(!data||typeof data!=="object")return false;
      const blocks=(data as {blocks?:unknown}).blocks;
      return Array.isArray(blocks)&&blocks.length>0;
    }catch{return false;}
  };
  if(isEditableDraft(STUDIO_STORAGE_KEY))return "/app/builder-v2";

  // Lead-imported projects use separate drafts tied to their real CRM IDs.
  // Exclude history records and never accept arbitrary URL parameters.
  for(let i=storage.length-1;i>=0;i--){
    const key=storage.key(i);
    if(!key||!key.startsWith(STUDIO_STORAGE_KEY+":crm:"))continue;
    const projectId=key.slice((STUDIO_STORAGE_KEY+":crm:").length);
    if(!/^[a-zA-Z0-9_-]{20,40}$/.test(projectId))continue;
    if(isEditableDraft(key))return "/app/builder-v2?crmProject="+encodeURIComponent(projectId);
  }
  return "/app/paginas";
}
