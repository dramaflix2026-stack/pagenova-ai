"use client";
import {useEffect,useState} from "react";
import {createClient as createSupabaseBrowserClient} from "@/lib/supabase/client";
import {measureFirstRequests,type FirstRequestMetrics,type MeasuredEditorEvent} from "@/lib/builder-v2-first-request-metrics";
import {evaluateStrategyEvidence,type StrategyEvidence,type StrategyEvent,type SourceReview,type SourceMemory,type ReuseEdge} from "@/lib/builder-v2-strategy-evidence";

const PAGE=500;
const MAX_ROWS=10000;
/** Opt-in metrics view: all data stays behind authenticated owner RLS.
 * Do not fetch or expose customer prompts, site copy, addresses or solutions. */
export function BuilderV2LearningMetrics({enabled=false}:{enabled?:boolean}){
 const [expanded,setExpanded]=useState(false);
 const [refresh,setRefresh]=useState(0);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [metrics,setMetrics]=useState<FirstRequestMetrics|null>(null);
 const [strategyEvidence,setStrategyEvidence]=useState<StrategyEvidence|null>(null);
 const [strategyError,setStrategyError]=useState("");
 useEffect(()=>{
  if(!expanded||!enabled)return;
  let active=true;
  const load=async()=>{
   setLoading(true);setError("");setStrategyError("");setStrategyEvidence(null);
   try{
    const client=createSupabaseBrowserClient();
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user)throw new Error("Sessão não reconhecida. Entre novamente na PageNova.");
    const countResult=await client.from("builder_editor_learning_events")
     .select("id",{count:"exact",head:true}).eq("user_id",user.id);
    if(countResult.error)throw new Error("Contagem do histórico indisponível.");
    const events:MeasuredEditorEvent[]=[];
    let complete=true;
    for(let offset=0;offset<MAX_ROWS;offset+=PAGE){
     const {data,error:readError}=await client.from("builder_editor_learning_events")
      .select("id,request_id,operation_index,submitted_at,created_at,review_status,execution_status,strategy,intent,target")
      .eq("user_id",user.id).not("request_id","is",null)
      .order("created_at",{ascending:false}).order("id",{ascending:false})
      .range(offset,offset+PAGE-1);
     if(readError)throw new Error("Eventos de edição indisponíveis.");
     const rows=(data||[]) as MeasuredEditorEvent[];
     events.push(...rows);
     if(rows.length<PAGE)break;
     if(offset+PAGE===MAX_ROWS)complete=false;
    }
    const reused=new Set<string>();
    const reuseEdges:ReuseEdge[]=[];
    for(let offset=0;offset<MAX_ROWS;offset+=PAGE){
     const {data,error:reuseError}=await client.from("builder_editor_learning_reuses")
      .select("event_id,source_event_id,technique").eq("user_id",user.id)
      .order("created_at",{ascending:false}).order("event_id",{ascending:false})
      .range(offset,offset+PAGE-1);
     if(reuseError)throw new Error("Atribuições de aprendizado indisponíveis.");
     const rows=data||[];
     for(const row of rows)if(typeof row.event_id==="string"){
      reused.add(row.event_id);
      if(typeof row.source_event_id==="string")
       reuseEdges.push({event_id:row.event_id,source_event_id:row.source_event_id,technique:row.technique});
     }
     if(rows.length<PAGE)break;
     if(offset+PAGE===MAX_ROWS)complete=false;
    }
    if(active)setMetrics(measureFirstRequests(events,reused,countResult.count??events.length,complete));
    // Attribution is intentionally stricter than a reuse link alone.
    // Source review must have been approved before the target command and
    // be backed by a visual-verified solution memory.
    try{
     const ids=[...new Set(reuseEdges.map(row=>row.source_event_id))];
     const sourceEvents:SourceReview[]=[];
     const sourceMemories:SourceMemory[]=[];
     for(let start=0;start<ids.length;start+=100){
      const batch=ids.slice(start,start+100);
      const [reviews,memory]=await Promise.all([
       client.from("builder_editor_learning_events")
        .select("id,review_status,execution_status,reviewed_at")
        .eq("user_id",user.id).in("id",batch),
       client.from("builder_editor_solution_memories")
        .select("event_id,schema_version,verification")
        .eq("user_id",user.id).in("event_id",batch)
      ]);
      if(reviews.error||memory.error)throw new Error("Não foi possível validar a origem das soluções.");
      sourceEvents.push(...(reviews.data||[]) as SourceReview[]);
      sourceMemories.push(...(memory.data||[]) as SourceMemory[]);
     }
     if(active)setStrategyEvidence(evaluateStrategyEvidence(
      events as StrategyEvent[],reuseEdges,sourceEvents,sourceMemories,complete
     ));
    }catch{
     if(active)setStrategyError("A origem das técnicas reutilizadas não foi confirmada. Comparação indisponível.");
    }
   }catch(err){
    if(active){setMetrics(null);setStrategyEvidence(null);setError(err instanceof Error?err.message:"Não foi possível medir este histórico.");}
   }finally{if(active)setLoading(false);}
  };
  void load();
  return()=>{active=false};
 },[expanded,refresh,enabled]);
 if(!enabled)return null;
 return <section aria-label="Métricas de precisão do Editor Universal" className="mt-3 rounded-xl border border-white/15 bg-[#14211a] p-3 text-left text-xs text-white">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h3 className="font-semibold text-lime-300">Precisão de primeira solicitação</h3>
    <p className="mt-1 text-white/60">Medição baseada em solicitações identificadas e avaliadas, não apenas em mensagens de sucesso.</p></div>
   <button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}
     className="rounded-lg border border-lime-300/40 px-3 py-2 font-semibold text-lime-200">{expanded?"Ocultar métricas":"Ver métricas"}</button>
  </div>
  {expanded&&<div className="mt-3 space-y-3 border-t border-white/10 pt-3">
   <div className="flex items-center justify-between gap-2">
    <p className="text-white/70">Apenas eventos da sua conta, com RLS no Supabase.</p>
    <button type="button" disabled={loading} onClick={()=>setRefresh(n=>n+1)}
      className="rounded-md border border-white/25 px-2 py-1 text-white/85 disabled:opacity-50">Atualizar</button>
   </div>
   {loading&&<p role="status" className="text-lime-200">Conferindo avaliações e solicitações...</p>}
   {error&&<p role="alert" className="text-amber-200">{error} Não foi possível calcular uma taxa confiável.</p>}
   {!loading&&metrics&&<div className="space-y-3">
    <div className="grid grid-cols-2 gap-2">
     <div className="rounded-lg bg-white/[.055] p-3"><p className="text-white/60">Solicitações rastreadas</p><p className="mt-1 text-lg font-bold text-white">{metrics.tracedRequests}</p></div>
     <div className="rounded-lg bg-white/[.055] p-3"><p className="text-white/60">Avaliadas e verificáveis</p><p className="mt-1 text-lg font-bold text-white">{metrics.reviewedRequests}</p></div>
     <div className="rounded-lg bg-white/[.055] p-3"><p className="text-white/60">Aprovadas e aplicadas</p><p className="mt-1 text-lg font-bold text-lime-300">{metrics.successfulRequests}</p></div>
     <div className="rounded-lg bg-white/[.055] p-3"><p className="text-white/60">Reprovadas ou sem efeito</p><p className="mt-1 text-lg font-bold text-white">{metrics.failedRequests}</p></div>
    </div>
    <p className="text-white/65">Histórico anterior sem rastreamento: {metrics.legacyEvents} registros; pendentes: {metrics.pendingRequests}; inconclusivos: {metrics.unverifiableRequests}.</p>
    {!metrics.completeDataset?<p role="status" className="text-amber-200">Limite de leitura atingido: medição incompleta. Nenhuma taxa será divulgada.</p>:
     !metrics.minimumSampleReached?<p role="status" className="text-amber-200">Amostra insuficiente para divulgar a taxa: {metrics.reviewedRequests} de 30 solicitações avaliadas necessárias como mínimo operacional. Meta de 98%–99% não comprovada.</p>:
     <div className="rounded-lg border border-white/15 p-3">
      <p>Acerto observado por solicitação: <strong className="text-lg text-lime-300">{metrics.ratePercent}%</strong></p>
      <p className="mt-1 text-white/70">Intervalo Wilson 95%: {metrics.lower95Percent}%–{metrics.upper95Percent}% (n={metrics.reviewedRequests}).</p>
      <p className="mt-1 text-amber-200">{metrics.statisticallySupports98Percent?"Limite inferior compatível com 98%.":"A meta de 98% ainda NÃO está demonstrada com confiança de 95%."}</p>
     </div>}
    <div className="rounded-lg border border-white/15 p-3">
     <p className="font-semibold text-white/90">Comparação descritiva do aprendizado</p>
     <p className="mt-1 text-white/70">Com reutilização auditada: {metrics.withVerifiedReuse.reviewed} solicitações; sem reutilização auditada: {metrics.withoutVerifiedReuse.reviewed}.</p>
     <p className="mt-1 text-white/70">{metrics.comparisonReady?
      "Taxas observadas: "+metrics.withVerifiedReuse.ratePercent+"% com reutilização e "+metrics.withoutVerifiedReuse.ratePercent+"% sem reutilização.":
      "Sem base suficiente para comparar os dois grupos (mínimo de 30 solicitações avaliadas em cada)."}
     </p>
    </div>
    <div className="rounded-lg border border-white/15 p-3" aria-label="Entrega 9: eficácia das estratégias">
     <p className="font-semibold text-lime-300">Estratégias de edição · Entrega 9</p>
     <p className="mt-1 text-white/60">Cada comando avaliado entra uma vez por estratégia. Operações sem atribuição confiável ficam fora da comparação.</p>
     {strategyError&&<p role="status" className="mt-2 text-amber-200">{strategyError}</p>}
     {strategyEvidence&&<div className="mt-3 space-y-3">
      <div className="grid gap-2">
       {strategyEvidence.routes.map(route=><div key={route.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[.045] px-3 py-2">
        <span className="font-semibold">{route.label}</span>
        <span className="text-white/70">{route.reviewed} pedidos · {route.successful} aprovados · {route.failed} reprovados</span>
        <span className={route.ratePercent===null?"text-amber-200":"text-lime-200"}>{route.ratePercent===null?"Amostra pequena":route.ratePercent+"% observado"}</span>
       </div>)}
      </div>
      <p className="text-white/65">Com reutilização de técnica e origem confirmadas: {strategyEvidence.requestsWithVerifiedReuse} solicitações ({strategyEvidence.verifiedReuseOperations} operações). Sem reutilização registrada ou comprovada: {strategyEvidence.withoutVerifiedReuseRecord.reviewed}.</p>
      {strategyEvidence.missingOrLateReuseOperations>0&&
       <p className="text-amber-200">{strategyEvidence.missingOrLateReuseOperations} atribuições sem comprovação temporal ou de origem; não usadas para declarar aprendizado bem-sucedido.</p>}
      <p className="text-white/65">Pedidos com múltiplas estratégias: {strategyEvidence.mixedRouteRequests}; inconclusivos: {strategyEvidence.incompleteRequests+strategyEvidence.unclassifiedRequests}.</p>
      {strategyEvidence.contexts.length>0&&<div className="rounded-lg bg-white/[.045] p-3">
       <p className="font-semibold text-white/90">Contextos auditados</p>
       {strategyEvidence.contexts.slice(0,5).map(ctx=><p key={ctx.route+"-"+ctx.key} className="mt-2 text-white/65">
        {ctx.key}: {ctx.route==="universal"?"Motor Universal":ctx.route==="ai-editor"?"Editor IA":"Edição de texto"} · {ctx.successful}/{ctx.reviewed} aprovados e aplicados
       </p>)}
      </div>}
      <p className="text-amber-200">{strategyEvidence.eligibleForStrategyComparison?
       strategyEvidence.statisticallyPreferredRoute?
        "Uma estratégia apresentou intervalo de confiança superior na amostra observada; isso não prova efeito causal.":
        "Há amostra para comparar, mas nenhuma estratégia demonstrou superioridade estatística.":
       "Comparação inconclusiva: é preciso ter pelo menos 30 solicitações verificadas por estratégia, com histórico completo."}</p>
      <p className="text-[11px] text-white/45">A atribuição exige aprovação anterior à solicitação e memória validada visualmente. “Sem reutilização registrada” não significa ausência de influência da IA. Não há sorteio experimental nem comprovação causal.</p>
     </div>}
    </div>
    <p className="text-[11px] leading-relaxed text-white/45">Uma solicitação = um identificador de comando. Várias operações do mesmo comando contam uma vez e precisam ser avaliadas. Não inferimos que mensagens separadas sejam correções do mesmo trabalho; esta medição não comprova, sozinha, acerto na primeira tentativa de uma tarefa inteira nem efeito causal do aprendizado.</p>
   </div>}
  </div>}
 </section>;
}
