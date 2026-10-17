import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,ArrowRight,CheckCircle2,ExternalLink,HandCoins,ShieldCheck,UsersRound} from "lucide-react";
export const metadata:Metadata={
 title:"Programa de Parceiros | PageNova AI",
 description:"Conheça a proposta de afiliação PageNova AI e saiba como solicitar acesso ao programa de parceiros."
};
function affiliateInvitation():string|null{
 const candidate=process.env.PAGENOVA_KIWIFY_AFFILIATE_INVITE_URL?.trim();
 if(!candidate)return null;
 try{
  const url=new URL(candidate);
  if(url.protocol!=="https:"||url.username||url.password)return null;
  if(!["kiwify.app","kiwify.com.br","www.kiwify.com.br","pay.kiwify.com.br"].includes(url.hostname))return null;
  return url.toString();
 }catch{return null;}
}
const contact="https://wa.me/5521987627887?text="+encodeURIComponent("Olá! Quero saber como me tornar afiliado da PageNova AI. Podem me informar quando o programa estiver disponível?");
export default function Afiliados(){
 const invitation=affiliateInvitation();
 return <main className="pn-landing-v2 min-h-screen bg-[#0b100d] px-4 py-7 text-[#f3f8f1] sm:px-7 sm:py-12">
  <div className="mx-auto max-w-4xl space-y-8">
   <header className="flex flex-wrap items-center justify-between gap-3">
    <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white">
     <ArrowLeft className="size-4"/> Voltar à PageNova
    </Link>
    <img src="/brand/pagenova-logo.png" alt="PageNova AI" width={178} height={54} className="pn-brand-logo h-11 w-auto object-contain"/>
   </header>
   <section className="rounded-3xl border border-[#8fec78]/20 bg-[#142019] p-6 sm:p-10">
    <span className="inline-flex items-center gap-2 rounded-full border border-[#8fec78]/25 bg-[#8fec78]/10 px-3 py-1.5 text-xs font-semibold text-[#a8f494]">
     <UsersRound className="size-4"/> Programa de Parceiros
    </span>
    <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">Ajude outras pessoas a criar com a PageNova.</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
     Estamos estruturando a afiliação da PageNova pela Kiwify. O programa permitirá divulgar nossa plataforma com um link de indicação, sujeito à aprovação e às regras definidas para cada produto.
    </p>
    <div className="mt-7 flex flex-wrap gap-3">
     {invitation?
      <a href={invitation} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#8fec78] px-5 py-3 text-sm font-bold text-[#14220f] hover:bg-[#a8f494]">
       Solicitar afiliação na Kiwify <ExternalLink className="size-4"/>
      </a>:
      <a href={contact} rel="noopener noreferrer" target="_blank" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#8fec78] px-5 py-3 text-sm font-bold text-[#14220f] hover:bg-[#a8f494]">
       Pedir informações sobre afiliação <ArrowRight className="size-4"/>
      </a>}
     <Link href="/" className="inline-flex min-h-12 items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/75 hover:border-[#8fec78]/50">Conhecer a plataforma</Link>
    </div>
    <p className="mt-3 text-xs leading-5 text-white/45">
     {invitation?"A solicitação, aprovação e os links individuais são gerenciados pela Kiwify.":"Convites ainda não habilitados neste site. Você pode falar com a equipe para receber orientações."}
    </p>
   </section>
   <div className="grid gap-3 sm:grid-cols-3">
    {[
     {icon:UsersRound,title:"Compartilhe",text:"Apresente a PageNova à sua audiência."},
     {icon:HandCoins,title:"Venda elegível",text:"A Kiwify registra as compras atribuídas aos links individuais aprovados."},
     {icon:ShieldCheck,title:"Comissão transparente",text:"Percentuais, prazos e critérios serão informados antes da afiliação."},
    ].map(item=><article key={item.title} className="rounded-2xl border border-white/10 bg-[#142019] p-5">
     <item.icon className="size-6 text-[#8fec78]"/>
     <h2 className="mt-4 text-base font-bold">{item.title}</h2>
     <p className="mt-2 text-sm leading-6 text-white/55">{item.text}</p>
    </article>)}
   </div>
   <section className="rounded-2xl border border-white/10 p-6 sm:p-8">
    <h2 className="text-xl font-bold">Como vai funcionar?</h2>
    <div className="mt-5 space-y-4">
     {[
      "Solicite um convite oficial para o produto habilitado na Kiwify.",
      "Aguarde a aprovação, caso o produto exija análise.",
      "Use o link de divulgação disponibilizado na sua conta Kiwify.",
      "Consulte atribuições, comissões e pagamentos diretamente na plataforma de afiliação."
     ].map((step,i)=><div key={step} className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#8fec78]/10 text-xs font-bold text-[#8fec78]">{i+1}</span>
      <p className="pt-0.5 text-sm leading-6 text-white/70">{step}</p>
     </div>)}
    </div>
    <p className="mt-6 flex items-start gap-2 border-t border-white/10 pt-5 text-xs leading-5 text-white/50">
     <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#8fec78]"/>
     Nenhuma comissão fixa está anunciada nesta etapa. Produtos, condições e recorrência dependem da configuração oficial na Kiwify.
    </p>
   </section>
  </div>
 </main>;
}
