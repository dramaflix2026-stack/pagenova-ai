"use client";

import { useEffect, useState } from "react";

type Block = { id: string; type: "heading" | "paragraph" | "button"; text: string; color: string; align: "left" | "center" | "right" };
type Site = { title: string; background: string; blocks: Block[] };
type ChatMessage = { role: "user" | "assistant"; text: string };
const initial: Site = { title: "Meu novo site", background: "#ffffff", blocks: [
  { id: "hero-title", type: "heading", text: "Seu próximo grande projeto começa aqui", color: "#172b26", align: "left" },
  { id: "hero-description", type: "paragraph", text: "Uma experiência criada para apresentar sua marca com clareza.", color: "#52645c", align: "left" },
  { id: "hero-cta", type: "button", text: "Fale conosco", color: "#1c5942", align: "left" }
] };
const storageKey = "pagenova-builder-v2-private-v1";
function applyInstruction(site: Site, instruction: string): { site: Site; summary: string } | null {
  const text = instruction.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const next: Site = JSON.parse(JSON.stringify(site));
  if (/crie|gere|construa|faca.*site|novo site/.test(text)) {
    const subject = instruction.match(/(?:para|sobre|de)\s+(?:uma?\s+)?(.+?)(?:[.!]|$)/i)?.[1]?.trim() || "sua empresa";
    next.title = subject.charAt(0).toUpperCase() + subject.slice(1);
    next.blocks[0].text = "Bem-vindo à " + next.title;
    next.blocks[1].text = "Conheça nossos serviços e descubra como podemos ajudar você.";
    next.blocks[2].text = "Entre em contato";
    return { site: next, summary: "Site gerado com componentes editáveis. Você já pode pedir alterações." };
  }
  const align = /centraliz|alinhe?.*centro/.test(text) ? "center" : /(?:alinhe?|alinh).*esquerda/.test(text) ? "left" : /(?:alinhe?|alinh).*direita/.test(text) ? "right" : null;
  if (align) {
    const selected = /botao/.test(text) && !/todos|textos|secao|principal|tudo/.test(text)
      ? next.blocks.filter(b => b.type === "button")
      : /titulo/.test(text) && !/todos|textos|secao|principal|tudo/.test(text)
      ? next.blocks.filter(b => b.type === "heading") : next.blocks;
    selected.forEach(b => { b.align = align; });
    return { site: next, summary: "Alinhamento atualizado e salvo nos componentes." };
  }
  const color = text.match(/#[0-9a-f]{6}\b/)?.[0] || Object.entries({ azul: "#2563eb", verde: "#16a34a", vermelho: "#dc2626", preto: "#111111", branco: "#ffffff", amarelo: "#eab308", rosa: "#ec4899" }).find(([name]) => text.includes(name))?.[1];
  if (color && /cor|fundo|background/.test(text)) {
    if (/fundo|background/.test(text)) next.background = color;
    else (/(?:botao|cta)/.test(text) ? next.blocks.filter(b => b.type === "button") : next.blocks).forEach(b => { b.color = color; });
    return { site: next, summary: "Cor atualizada e salva." };
  }
  const replacement = instruction.match(/(?:troque|altere|mude|substitua)\s+(?:o\s+)?(?:texto\s+(?:do|da)\s+)?(titulo|bot[aã]o|descri[cç][aã]o|par[aá]grafo)\s+(?:para|por)\s+["“]?(.+?)["”]?\s*[.!]?$/i);
  if (replacement) {
    const kind = /titulo/i.test(replacement[1]) ? "heading" : /bot/i.test(replacement[1]) ? "button" : "paragraph";
    const block = next.blocks.find(b => b.type === kind);
    if (block) { block.text = replacement[2].trim().replace(/[”"]$/, ""); return { site: next, summary: "Texto atualizado e salvo." }; }
  }
  return null;
}
export default function BuilderV2() {
  const [site, setSite] = useState<Site>(initial);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "Descreva o site que quer criar. Depois, continue conversando para modificá-lo." }]);
  const [instruction, setInstruction] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { const saved = localStorage.getItem(storageKey); if (saved) setSite(JSON.parse(saved)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(storageKey, JSON.stringify(site)); }, [site, loaded]);
  function send() {
    const prompt = instruction.trim(); if (!prompt) return;
    const result = applyInstruction(site, prompt);
    setMessages(prev => [...prev, { role: "user", text: prompt }, { role: "assistant", text: result?.summary || "Ainda não sei executar esse pedido neste protótipo. Nenhuma alteração foi feita." }]);
    if (result) setSite(result.site);
    setInstruction("");
  }
  return <main className="min-h-screen bg-[#0b1110] px-4 py-8 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Ambiente experimental privado</p><h1 className="text-3xl font-bold">PageNova Builder 2.0</h1><p className="mt-2 text-sm text-white/60">Motor estruturado: escrever → gerar → modificar. Não altera seus projetos atuais.</p></div><a href="/app/builder" className="rounded-xl border border-white/20 px-4 py-2 text-sm">Voltar ao editor atual</a></div>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <section className="flex min-h-[580px] flex-col rounded-2xl border border-white/15 bg-[#141d1a] p-4"><h2 className="mb-3 font-semibold">Chat com IA — protótipo</h2><div aria-live="polite" className="mb-4 flex-1 space-y-3 overflow-y-auto">{messages.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-7 bg-lime-300 text-black" : "mr-7 bg-white/10"}`}>{m.text}</div>)}</div><form onSubmit={e=>{e.preventDefault();send();}} className="space-y-3"><textarea aria-label="Descreva a criação ou alteração" value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder="Crie um site para uma clínica odontológica... ou Centralize todos os textos e o botão..." rows={4} className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white outline-none focus:border-lime-300"/><button type="submit" className="w-full rounded-xl bg-lime-300 p-3 font-bold text-black">Enviar e aplicar →</button></form><p className="mt-3 text-xs text-white/50">Primeira etapa: comandos locais verificáveis. A integração com o modelo de IA e o salvamento no servidor vêm depois.</p></section>
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-white text-black"><div className="flex items-center justify-between border-b border-black/10 px-6 py-4"><span className="font-bold">{site.title}</span><span className="text-xs text-gray-500">Prévia responsiva</span></div><div className="flex min-h-[480px] flex-col justify-center gap-6 px-8 py-16 md:px-16" style={{backgroundColor:site.background}}>{site.blocks.map(b=><div key={b.id} style={{textAlign:b.align}}>{b.type==="heading"?<h2 style={{color:b.color}} className="text-4xl font-bold leading-tight md:text-6xl">{b.text}</h2>:b.type==="paragraph"?<p style={{color:b.color}} className="text-lg leading-relaxed">{b.text}</p>:<a href="#contato" style={{backgroundColor:b.color}} className="inline-block rounded-xl px-7 py-4 font-semibold text-white">{b.text}</a>}</div>)}</div></section>
      </div>
    </div>
  </main>;
}
