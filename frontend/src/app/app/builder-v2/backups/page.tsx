"use client";
import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {type CloudBackup,validBackupPayload} from "@/lib/project-sync-contract";
import {captureBackup,localRevisions,type LocalRevision} from "@/lib/project-sync-local";
import {backupLocalProject,studioProjectId,currentBackupUser} from "@/lib/project-sync";
import {savePageNovaProject} from "@/lib/pagenova-project-store";
type Item=Omit<CloudBackup,"payload">&{local?:LocalRevision};
const key="pagenova-builder-v2-private-v1";
export default function BackupRecovery(){
  const router=useRouter();
  const [items,setItems]=useState<Item[]>([]),[user,setUser]=useState(""),[notice,setNotice]=useState("Carregando backups..."),[busy,setBusy]=useState(false);
  async function load(project?:string){
    setBusy(true);
    try{
      let cursor:string|null=null;const all:Item[]=[];let userId="";
      do{
        const params=new URLSearchParams();if(project)params.set("project",project);if(cursor)params.set("before",cursor);
        const r=await fetch(`/api/builder-v2/projects?${params}`,{cache:"no-store"});
        if(!r.ok)throw Error("A nuvem está indisponível. Seus backups locais continuam disponíveis.");
        const data=await r.json();userId=data.userId;cursor=data.nextCursor;all.push(...data.projects);
      }while(cursor);
      setUser(userId);
      const local=await localRevisions(userId);
      const cloudIds=new Set(all.map(x=>x.revision));
      setItems([...all,...local.filter(x=>!cloudIds.has(x.operationId)&&(!project||x.projectId===project)).map(x=>({
        project_id:x.projectId,revision:x.operationId,title:String(x.payload.title||x.payload.name||"Projeto"),kind:x.kind,created_at:x.at,conflict:x.status==="conflict",local:x
      }))]);
      setNotice("A recuperação cria uma cópia. Os projetos e versões originais são preservados.");
    }catch(e){
      const owner=currentBackupUser();
      if(owner){setUser(owner);const local=await localRevisions(owner);setItems(local.filter(x=>!project||x.projectId===project).map(x=>({project_id:x.projectId,revision:x.operationId,title:String(x.payload.title||x.payload.name||"Projeto"),kind:x.kind,created_at:x.at,conflict:x.status==="conflict",local:x})));}
      setNotice(e instanceof Error?e.message:"Não foi possível carregar os backups.");
    }
    finally{setBusy(false);}
  }
  useEffect(()=>{
    let active=true;
    // Defer startup to keep effect setup free of synchronous state writes.
    queueMicrotask(()=>{if(active)void load();});
    return()=>{active=false;};
  },[]);
  async function restore(item:Item){
    if(!window.confirm(`Recuperar “${item.title}” como novo projeto? O projeto atual será guardado antes.`))return;
    setBusy(true);
    try{
      let payload=item.local?.payload;
      if(!payload){const r=await fetch(`/api/builder-v2/projects?revision=${item.revision}`,{cache:"no-store"});
        if(!r.ok)throw Error("Não foi possível baixar a revisão.");
        const data=await r.json();if(data.userId!==user)throw Error("A conta mudou. Atualize a página.");payload=data.backup?.payload;}
      if(!validBackupPayload(payload,item.kind))throw Error("Backup inválido. Nenhum projeto foi alterado.");
      const id=crypto.randomUUID();const copy={...payload,id};
      if(item.kind==="studio"){
        const current=localStorage.getItem(key);
        if(current){
          // Raw original survives even if it is malformed and cannot be parsed.
          localStorage.setItem(`${key}:recovery-original:${crypto.randomUUID()}`,current);
          let site;try{site=JSON.parse(current);}catch{/* raw original remains intact */}
          if(site)await captureBackup(user,studioProjectId(site,key),"studio",site);
        }
        await captureBackup(user,`studio:${id}`,"studio",copy);
        localStorage.setItem(key,JSON.stringify(copy));
        router.push("/app/builder-v2");
      }else{
        await captureBackup(user,`indexeddb:${id}`,"indexeddb",copy);
        await savePageNovaProject(id,copy);
        await backupLocalProject(`indexeddb:${id}`,"indexeddb",copy);
        setNotice("Projeto recuperado como cópia. Disponível em Meus Sites/Projetos.");
      }
    }catch(e){setNotice(e instanceof Error?e.message:"Falha na recuperação. Originais preservados.");}
    finally{setBusy(false);}
  }
  return <main className="mx-auto max-w-5xl p-6 text-white">
    <a href="/app/builder-v2" className="text-lime-300">← Voltar ao Builder</a>
    <h1 className="mt-6 text-2xl font-bold">Backups dos projetos</h1>
    <p role="status" className="my-4 text-sm text-white/70">{notice}</p>
    <button type="button" disabled={busy} onClick={()=>void load()} className="mb-4 rounded-lg border border-white/20 px-4 py-2 disabled:opacity-40">Atualizar projetos</button>
    <div className="space-y-3">{items.map(item=><article key={item.revision} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/5 p-4">
      <div><h2 className="font-semibold">{item.title}</h2><p className="text-xs text-white/60">{new Date(item.created_at).toLocaleString("pt-BR")} · {item.local?"Cópia local":"Nuvem"}{item.conflict?" · Versão preservada em conflito/histórico":""}</p></div>
      <div className="flex gap-2"><button disabled={busy} onClick={()=>void load(item.project_id)} className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-40">Ver versões</button><button disabled={busy} onClick={()=>void restore(item)} className="rounded-lg bg-lime-300 px-3 py-2 text-sm font-bold text-black disabled:opacity-40">Recuperar cópia</button></div>
    </article>)}</div>
  </main>;
}
