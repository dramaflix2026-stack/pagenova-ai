"use client";

import { useEffect,useState } from "react";
import { RefreshCw,ShieldCheck,Search,Globe,Wallet } from "lucide-react";
import { AppHeader } from "@/components/app-header";

type Balance={active:boolean;sitesUsed?:number;sitesLimit?:number;sitesRemaining:number;
  googleUsed?:number;googleLimit?:number;googleRemaining:number;startedAt?:string;};
type CreditsResult={configured:boolean;kind?:"trial";trial?:{expiresAt?:string;startedAt?:string};
  priceBrl:number;contract?:{sites:number;google:number};
  balance?:Balance;message?:string;error?:string};

export default function CreditosPage(){
  const [data,setData]=useState<CreditsResult|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const reload=async()=>{
    setLoading(true);setError("");
    try{
      const response=await fetch("/api/credits",{cache:"no-store"});
      const json=await response.json() as CreditsResult;
      if(!response.ok)throw new Error(json.error||"Saldo indisponível.");
      setData(json);
    }catch(cause){setError(cause instanceof Error?cause.message:"Saldo indisponível.");}
    finally{setLoading(false);}
  };
  useEffect(()=>{void reload();},[]);
  const b=data?.balance;
  const items=[
    {title:"Sites com IA",label:"Gerar site com IA + CRM",icon:Globe,
      limit:b?.sitesLimit||40,used:b?.sitesUsed||0,left:b?.sitesRemaining||0},
    {title:"Pesquisas Google",label:"Páginas pesquisadas no Google Places",
      icon:Search,limit:b?.googleLimit||150,used:b?.googleUsed||0,left:b?.googleRemaining||0},
  ];
  return <main className="min-h-screen bg-[#0b100d] text-white">
    <AppHeader title={data?.kind==="trial"?"Meu teste grátis":"Meus créditos"} description={data?.kind==="trial"?"5 dias para conhecer a PageNova. Sem cartão e sem cobrança automática.":"Acompanhe o consumo do seu ciclo de assinatura."} align="center"/>
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#142019] px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-5 w-5 text-emerald-300"/> {data?.kind==="trial"?"Teste grátis · 5 dias":"Plano PageNova · R$ 147/mês"}</div>
        <button type="button" aria-label="Atualizar saldos" onClick={()=>void reload()}
          disabled={loading} className="rounded-lg border border-white/15 p-2 text-white/70 hover:bg-white/10 disabled:opacity-40">
          <RefreshCw className={"h-4 w-4 "+(loading?"animate-spin":"")}/>
        </button>
      </div>
      {data?.kind==="trial"&&<div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.06] p-5">
        <p className="font-bold text-emerald-200">Sua avaliação gratuita está ativa</p>
        <p className="mt-2 text-sm text-white/70">Válida até {data.trial?.expiresAt?new Date(data.trial.expiresAt).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}):"o fim do período de teste"}.</p>
        <p className="mt-2 text-xs leading-6 text-white/60">Use até 2 gerações de sites pelo CRM e 5 páginas de pesquisa Google. Landing Pages, Formulários, Quizzes e eBooks locais continuam disponíveis enquanto o teste estiver ativo.</p>
        <a href="https://pay.kiwify.com.br/a13pNpS" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-xl bg-emerald-300 px-5 py-3 text-xs font-extrabold text-[#14220f]">Continuar com o plano de R$ 147/mês →</a>
      </div>}
      {error&&<p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
      {loading&&<p role="status" className="mt-6 text-center text-sm text-white/60">Consultando seus créditos...</p>}
      {!loading&&data&&!data.configured&&<div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/[.06] p-5">
        <p className="font-semibold text-amber-100">Controle individual em implantação</p>
        <p className="mt-2 text-sm leading-6 text-white/65">{data.message||"Os saldos ainda não foram ativados."}</p>
        <p className="mt-2 text-sm text-white/60">Contrato: 40 gerações de sites e 150 páginas de pesquisa por ciclo.</p>
      </div>}
      {!loading&&data?.configured&&data.kind!=="trial"&&!b?.active&&<div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/5 p-5 text-sm text-amber-100">
        Não há um ciclo de créditos ativo. Verifique o pagamento ou a renovação da assinatura.
      </div>}
      {!loading&&data?.configured&&b?.active&&<div className="mt-5 grid gap-4 sm:grid-cols-2">
        {items.map(item=>{const Icon=item.icon;const percent=Math.max(0,Math.min(100,item.used/item.limit*100));return <article key={item.title}
          className="rounded-2xl border border-white/10 bg-[#142019] p-5">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><Icon className="h-5 w-5"/></div><div>
            <h2 className="text-base font-semibold">{item.title}</h2>
            <p className="text-xs text-white/45">{item.label}</p>
          </div></div>
          <div className="mt-8 text-4xl font-bold tabular-nums text-emerald-200">{item.left}<span className="ml-2 text-sm font-normal text-white/50">restantes</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-emerald-400" style={{width:percent+"%"}}/></div>
          <p className="mt-3 text-xs text-white/50">{item.used} de {item.limit} utilizados neste ciclo</p>
        </article>})}
      </div>}
      <div className="mt-6 rounded-xl border border-white/10 bg-[#142019] p-5 text-sm leading-7 text-white/65">
        <p className="flex items-center gap-2 font-semibold text-white"><ShieldCheck className="h-5 w-5 text-emerald-300"/> Regras do plano</p>
        <p className="mt-3">{data?.kind==="trial"?"O teste inclui 2 gerações iniciais pelo CRM e 5 páginas Google Places. Os limites são automáticos e não se renovam ao longo dos 5 dias.":"Uma nova geração de site desconta 1 crédito compartilhado entre o Studio e o CRM. Cada página de pesquisa do Google desconta 1 crédito de pesquisa."}</p>
        <p>Alterações em sites, visualizações, publicação e acesso ao histórico de empresas pesquisadas não descontam esses créditos.</p>
        <p>{data?.kind==="trial"?"O teste termina automaticamente após 5 dias, não solicita cartão e não gera cobrança. Seus projetos são preservados para quando assinar.":"Falhas confirmadas são estornadas. A renovação paga inicia um novo ciclo; reembolso ou chargeback revogam o respectivo ciclo."}</p>
        <p className="mt-2 text-xs text-white/45">A geração de ebooks e imagens por IA tem custos de API próprios e não utiliza os créditos de sites ou de pesquisas Google.</p>
      </div>
    </div>
  </main>;
}
