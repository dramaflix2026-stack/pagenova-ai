"use client";
import {useRouter} from "next/navigation";
import {useEffect,useState,useCallback} from "react";
import {type CloudBackup,validBackupPayload,validProjectShape} from "@/lib/project-sync-contract";
import {captureBackup,localSourceOwner,approveLegacySources,localRevisions,type LocalRevision} from "@/lib/project-sync-local";
import {backupLocalProject,studioProjectId,currentBackupUser,migrateLocalProjects,flushBackups} from "@/lib/project-sync";
import {savePageNovaProject} from "@/lib/pagenova-project-store";
import {pendingLegacySources,exportLocalArchive,stagePortableImport,listPortableImports,portableProjects} from "@/lib/project-portable-recovery";
type Item=Omit<CloudBackup,"payload">&{local?:LocalRevision;portable?:Record<string,unknown>;sourceOrigin?:string};
const key="pagenova-builder-v2-private-v1";
export default function BackupRecovery(){
  const router=useRouter();
  const [items,setItems]=useState<Item[]>([]),[user,setUser]=useState(""),[notice,setNotice]=useState("Carregando backups..."),[busy,setBusy]=useState(false);
  const [legacySources,setLegacySources]=useState<string[]>([]),[ownership,setOwnership]=useState(false),[transferNotice,setTransferNotice]=useState("");
  const [confirmed,setConfirmed]=useState(0),[pending,setPending]=useState(0),[blocked,setBlocked]=useState(0);
  const refreshLocal=useCallback(async(userId:string)=>{
    setLegacySources(await pendingLegacySources(userId));
    const revisions=await localRevisions(userId);
    setConfirmed(revisions.filter(x=>x.status==="synced"||x.status==="conflict").length);
    setPending(revisions.filter(x=>x.status==="pending").length);setBlocked(revisions.filter(x=>x.status==="blocked").length);
    return portableProjects(await listPortableImports(userId)).map(p=>({revision:p.id,project_id:p.id,title:p.title,kind:p.kind,created_at:p.createdAt,portable:p.payload,sourceOrigin:p.sourceOrigin}));
  },[]);
  async function approveLegacy(){
    if(!ownership||!user||currentBackupUser()!==user)return;
    setBusy(true);try{await approveLegacySources(user,legacySources);await migrateLocalProjects(user);await flushBackups();
      setTransferNotice("Conta confirmada. Originais preservados. Confira as revisões confirmadas e as pendências abaixo.");await load();
    }catch(e){setTransferNotice(e instanceof Error?e.message:"Falha na migração. Originais preservados.");}finally{setBusy(false);}
  }
  async function exportBackup(){
    if(!user||currentBackupUser()!==user)return;setBusy(true);
    try{const text=await exportLocalArchive(user);if(currentBackupUser()!==user)throw Error("A conta mudou. Exportação cancelada.");
      const url=URL.createObjectURL(new Blob([text],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="pagenova-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
      setTransferNotice("Arquivo preparado. Guarde-o antes de mudar de domínio ou navegador. Exportação não comprova sincronização na nuvem.");
    }catch(e){setTransferNotice(e instanceof Error?e.message:"Não foi possível exportar. Originais preservados.");}finally{setBusy(false);}
  }
  async function importBackup(file:File){
    if(!ownership||!user||currentBackupUser()!==user)return;setBusy(true);
    try{if(file.size>128*1024*1024)throw Error("Arquivo acima de 128 MB. Originais preservados.");
      const result=await stagePortableImport(user,await file.text());if(currentBackupUser()!==user)throw Error("A conta mudou. Arquivo preservado somente para a conta original.");
      setTransferNotice(result.created?`${result.count} registros verificados e guardados em área local separada. Use Recuperar cópia; nenhum projeto existente foi substituído.`:"Este arquivo já está guardado nesta conta. Nenhum registro foi duplicado.");await load();
    }catch(e){setTransferNotice(e instanceof Error?e.message:"Importação recusada. Nenhum projeto foi alterado.");}finally{setBusy(false);}
  }
  const load=useCallback(async(project?:string)=>{
    setBusy(true);
    let accountMismatch=false;const expected=currentBackupUser();
    try{
      let cursor:string|null=null;const all:Item[]=[];let userId="";
      do{
        const params=new URLSearchParams();if(project)params.set("project",project);if(cursor)params.set("before",cursor);
        const r=await fetch(`/api/builder-v2/projects?${params}`,{cache:"no-store"});
        if(!r.ok)throw Error("A nuvem está indisponível. Seus backups locais continuam disponíveis.");
        const data=await r.json();if(!expected||data.userId!==expected||currentBackupUser()!==expected){accountMismatch=true;throw Error("A conta mudou. Reabra a página para continuar.");}userId=data.userId;cursor=data.nextCursor;all.push(...data.projects);
      }while(cursor);
      setUser(userId);
      const local=await localRevisions(userId);
      const cloudIds=new Set(all.map(x=>x.revision));
      const portable=await refreshLocal(userId);
      setItems([...all,...portable,...local.filter(x=>!cloudIds.has(x.operationId)&&(!project||x.projectId===project)).map(x=>({
        project_id:x.projectId,revision:x.operationId,title:String(x.payload.title||x.payload.name||"Projeto"),kind:x.kind,created_at:x.at,conflict:x.status==="conflict",local:x
      }))]);
      setNotice("A recuperação cria uma cópia. Os projetos e versões originais são preservados.");
    }catch(e){
      if(accountMismatch){setItems([]);setUser("");setNotice("A conta mudou. Reabra a página para continuar.");return;}
      const owner=currentBackupUser();
      if(owner){setUser(owner);const portable=await refreshLocal(owner);const local=await localRevisions(owner);setItems([...portable,...local.filter(x=>!project||x.projectId===project).map(x=>({project_id:x.projectId,revision:x.operationId,title:String(x.payload.title||x.payload.name||"Projeto"),kind:x.kind,created_at:x.at,conflict:x.status==="conflict",local:x}))]);}
      setNotice(e instanceof Error?e.message:"Não foi possível carregar os backups.");
    }
    finally{setBusy(false);}
  },[refreshLocal]);
  useEffect(()=>{
    let active=true;
    // Defer startup to keep effect setup free of synchronous state writes.
    queueMicrotask(()=>{if(active)void load();});
    return()=>{active=false;};
  },[load]);
  async function restore(item:Item){
    if(!window.confirm(`Recuperar “${item.title}” como novo projeto? O projeto atual será guardado antes.`))return;
    setBusy(true);
    try{
      if(currentBackupUser()!==user)throw Error("A conta mudou. Atualize a página.");
      let payload=item.portable??item.local?.payload;
      if(!payload){const r=await fetch(`/api/builder-v2/projects?revision=${item.revision}`,{cache:"no-store"});
        if(!r.ok)throw Error("Não foi possível baixar a revisão.");
        const data=await r.json();if(data.userId!==user)throw Error("A conta mudou. Atualize a página.");payload=data.backup?.payload;}
      if(!(item.kind==="studio"?validBackupPayload(payload,item.kind):validProjectShape(payload,item.kind)))throw Error("Backup inválido. Nenhum projeto foi alterado.");
      const id=crypto.randomUUID();const copy={...payload,id};
      if(item.kind==="studio"){
        const current=localStorage.getItem(key);
        if(current){
          // Raw original survives even if it is malformed and cannot be parsed.
          localStorage.setItem(`${key}:recovery-original:${crypto.randomUUID()}`,current);
          let site;try{site=JSON.parse(current);}catch{/* raw original remains intact */}
          if(site && await localSourceOwner(studioProjectId(site,key))===user)await captureBackup(user,studioProjectId(site,key),"studio",site);
        }
        await captureBackup(user,`studio:${id}`,"studio",copy);
        if(currentBackupUser()!==user)throw Error("A conta mudou. A cópia foi preservada sem substituir o rascunho ativo.");
        localStorage.setItem(key,JSON.stringify(copy));
        router.push("/app/builder-v2");
      }else{
        if(validBackupPayload(copy,"indexeddb"))await captureBackup(user,`indexeddb:${id}`,"indexeddb",copy);
        await savePageNovaProject(id,copy);
        if(validBackupPayload(copy,"indexeddb"))await backupLocalProject(`indexeddb:${id}`,"indexeddb",copy);
        setNotice(validBackupPayload(copy,"indexeddb")?"Projeto recuperado como cópia. Disponível em Meus Sites/Projetos.":"Cópia local recuperada com seus arquivos. O envio remoto desses arquivos ainda não está disponível; mantenha o backup portátil.");
      }
    }catch(e){setNotice(e instanceof Error?e.message:"Falha na recuperação. Originais preservados.");}
    finally{setBusy(false);}
  }
  return <main className="mx-auto max-w-5xl p-6 text-white">
    <a href="/app/builder-v2" className="text-lime-300">← Voltar ao Builder</a>
    <h1 className="mt-6 text-2xl font-bold">Backups dos projetos</h1>
    <p role="status" className="my-4 text-sm text-white/70">{notice}</p>
    <section className="mb-5 space-y-3 rounded-xl border border-white/15 bg-white/5 p-4" aria-label="Migração e arquivo de segurança">
      <p className="text-sm">{confirmed} revisões confirmadas pelo servidor · {pending} aguardando envio · {blocked} recusadas e preservadas localmente.</p>
      {legacySources.length>0&&<p className="text-sm text-amber-200">Há projetos antigos nesta origem aguardando confirmação da conta. Eles não serão enviados automaticamente para uma conta desconhecida.</p>}
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={ownership} onChange={e=>setOwnership(e.target.checked)} />Confirmo que os projetos antigos deste navegador e o arquivo que escolhi importar pertencem à minha conta.</label>
      <div className="flex flex-wrap gap-2">
        {legacySources.length>0&&<button type="button" disabled={busy||!ownership} onClick={()=>void approveLegacy()} className="rounded-lg bg-lime-300 px-3 py-2 text-sm font-bold text-black disabled:opacity-40">Confirmar conta e copiar projetos antigos</button>}
        <button type="button" disabled={busy||!user} onClick={()=>void exportBackup()} className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-40">Exportar arquivo de segurança</button>
        <label className="rounded-lg border border-white/20 px-3 py-2 text-sm">Importar backup<input aria-label="Importar arquivo de backup" type="file" accept="application/json,.json" disabled={busy||!ownership||!user} className="ml-2 max-w-52 text-xs" onChange={e=>{const file=e.target.files?.[0];if(file)void importBackup(file);e.target.value="";}} /></label>
      </div><p role="status" className="text-sm text-white/70">{transferNotice}</p>
    </section>
    <button type="button" disabled={busy} onClick={()=>void load()} className="mb-4 rounded-lg border border-white/20 px-4 py-2 disabled:opacity-40">Atualizar projetos</button>
    <div className="space-y-3">{items.map(item=><article key={item.revision} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/5 p-4">
      <div><h2 className="font-semibold">{item.title}</h2><p className="text-xs text-white/60">{new Date(item.created_at).toLocaleString("pt-BR")} · {item.portable?"Arquivo portátil · "+item.sourceOrigin:item.local?.status==="blocked"?"Cópia local · envio recusado":item.local?"Cópia local":"Nuvem"}{item.conflict?" · Versão preservada em conflito/histórico":""}</p></div>
      <div className="flex gap-2"><button disabled={busy} onClick={()=>void load(item.project_id)} className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-40">Ver versões</button><button disabled={busy} onClick={()=>void restore(item)} className="rounded-lg bg-lime-300 px-3 py-2 text-sm font-bold text-black disabled:opacity-40">Recuperar cópia</button></div>
    </article>)}</div>
  </main>;
}
