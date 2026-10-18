import Link from "next/link";
import { MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

export default function PageNovaChatAI() {
  return <main className="mx-auto max-w-5xl px-5 py-12 text-white">
    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200"><Sparkles className="h-4 w-4"/> Inteligência Artificial</div>
    <h1 className="text-3xl font-bold md:text-5xl">PageNova Chat AI</h1>
    <p className="mt-4 max-w-2xl text-white/65">Seu futuro assistente para ideias, textos, estratégias e criação de conteúdo, integrado à PageNova.</p>
    <section className="mt-10 rounded-3xl border border-emerald-400/20 bg-[#111d15] p-8">
      <MessageCircle className="h-10 w-10 text-emerald-300"/>
      <h2 className="mt-5 text-xl font-semibold">Estamos preparando seu chat com IA</h2>
      <p className="mt-3 text-sm leading-6 text-white/65">As conversas serão disponibilizadas após a ativação segura da API, do histórico privado e dos limites mensais de uso. Nenhum crédito será consumido nesta tela.</p>
      <div className="mt-6 flex items-center gap-2 text-sm text-emerald-200"><ShieldCheck className="h-4 w-4"/> Acesso integrado à sua conta PageNova</div>
      <Link href="/app/builder" className="mt-8 inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-[#0b100d] hover:bg-emerald-300">Continuar criando sites</Link>
    </section>
  </main>;
}
