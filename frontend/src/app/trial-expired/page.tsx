import Link from "next/link";

export const metadata={title:"Avaliação encerrada | PageNova AI"};
export default function TrialExpiredPage(){
 return <main className="flex min-h-screen items-center justify-center bg-[#07110e] px-5 py-12 text-white">
  <section className="w-full max-w-xl rounded-3xl border border-emerald-400/20 bg-[#10241c] p-8 text-center shadow-2xl sm:p-12">
   <span className="text-xs font-bold uppercase tracking-[.17em] text-emerald-300">PageNova AI</span>
   <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Seus 5 dias grátis chegaram ao fim</h1>
   <p className="mt-5 text-sm leading-7 text-white/65">Seu período gratuito terminou automaticamente. Você não foi cobrado e os projetos que criou continuam preservados.</p>
   <p className="mt-4 text-sm leading-7 text-white/65">Para voltar a editar, publicar e utilizar as ferramentas, escolha o plano PageNova de R$ 147/mês. Use o mesmo e-mail do cadastro na compra.</p>
   <div className="mt-8 flex flex-col gap-3">
    <a href="https://pay.kiwify.com.br/a13pNpS" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#36d9a1] px-6 py-4 text-sm font-extrabold text-[#062018] transition hover:bg-[#6feabc]">Assinar e continuar meus projetos →</a>
    <Link href="/login" className="rounded-xl border border-white/20 px-6 py-3 text-xs font-bold text-white/75">Entrar com outra conta</Link>
    <Link href="/" className="mt-1 text-xs text-white/45 underline underline-offset-4">Voltar ao site</Link>
   </div>
  </section>
 </main>
}