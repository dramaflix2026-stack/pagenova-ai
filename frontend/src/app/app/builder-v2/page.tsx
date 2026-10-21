"use client";

import { useEffect, useState } from "react";

type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; section?: string; fontSize?: number; radius?: number; spacing?: number; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
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
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [history, setHistory] = useState<Site[]>([]);
  useEffect(() => { try { const saved = localStorage.getItem(storageKey); if (saved) setSite(JSON.parse(saved)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(storageKey, JSON.stringify(site)); }, [site, loaded]);
  function applyGlobalAlignment(current: Site, prompt: string): {site: Site; summary: string} | null {
    const normalized = prompt.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
    const align = /centraliz|alinhe?.*centro|alinh.*centro/.test(normalized) ? "center" :
      /alinhe?.*esquerda|alinh.*esquerda/.test(normalized) ? "left" :
      /alinhe?.*direita|alinh.*direita/.test(normalized) ? "right" : null;
    if (!align || !/todos|todas|tudo|site inteiro|site todo|pagina inteira|pagina toda/.test(normalized)) return null;
    if (!/textos|titulos|descricoes|paragrafos|botoes|elementos|conteudo|site|pagina|tudo/.test(normalized)) return null;
    if (/nao (?:centralize|alinhe|altere)|exceto|menos|somente|apenas|so o|so a/.test(normalized)) return null;
    const next: Site = {...current,blocks:current.blocks.map(block => ({
      ...block,
      align: block.type === "image" ? block.align : align
    }))};
    const affected = next.blocks.filter(b=>b.type!=="image");
    if (!affected.length || affected.some(b=>b.align!==align)) return null;
    return {site:next,summary:"Alinhamento "+(align==="center"?"centralizado":align==="left"?"à esquerda":"à direita")+" aplicado e conferido em "+affected.length+" elementos. Imagens e textos preservados."};
  }
  async function send() {
    const prompt = instruction.trim(); if (!prompt || busy) return;
    setBusy(true);
    setMessages(prev => [...prev, { role: "user", text: prompt }]);
    const direct = applyGlobalAlignment(site, prompt);
    if (direct) {
      setHistory(prev=>[...prev.slice(-19),site]);
      setSite(direct.site);
      setMessages(prev => [...prev, {role:"assistant",text:direct.summary}]);
      setInstruction(""); setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/builder-v2/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site, instruction: prompt, image: reference })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível editar o site.");
      if (!data.site?.blocks) throw new Error("Resposta inválida da IA.");
      const incoming = data.site as Site;
      const normalized = prompt.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
      const requested = /centraliz|alinhe?.*centro|alinh.*centro/.test(normalized) ? "center" : /alinhe?.*esquerda|alinh.*esquerda/.test(normalized) ? "left" : /alinhe?.*direita|alinh.*direita/.test(normalized) ? "right" : null;
      if (requested && /todos|todas|tudo/.test(normalized) && /textos|titulos|descricoes|paragrafos|elementos/.test(normalized)) {
        const relevant = incoming.blocks.filter(b=>b.type!=="image");
        if (relevant.some(b=>b.align!==requested)) throw new Error("A IA não aplicou o alinhamento em todos os elementos. O projeto foi preservado.");
      }
      setHistory(prev=>[...prev.slice(-19),site]);
      setSite(incoming);
      setMessages(prev => [...prev, { role: "assistant", text: data.summary || "Alteração aplicada." }]);
      setInstruction(""); setReference(null);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", text: error instanceof Error ? error.message : "Erro ao editar. O projeto foi preservado." }]);
    } finally { setBusy(false); }
  }
  function undo() { if (!history.length || busy) return; setSite(history[history.length-1]); setHistory(prev=>prev.slice(0,-1)); setMessages(prev=>[...prev,{role:"assistant",text:"Última alteração desfeita."}]); }
  function attachImage(file?: File) {
    if (!file) return;
    if (file.size > 2_000_000) { setMessages(prev => [...prev,{role:"assistant",text:"Use uma imagem de até 2 MB."}]); return; }
    const reader = new FileReader();
    reader.onload = () => setReference(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }
  const sections = site.blocks.reduce<Array<{id:string;blocks:Block[]}>>((acc,block)=>{
    const id = block.section || "principal";
    const last = acc[acc.length-1];
    if(last?.id===id) last.blocks.push(block);
    else acc.push({id,blocks:[block]});
    return acc;
  },[]);
  return <main className="min-h-screen bg-[#0b1110] px-4 py-8 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Ambiente experimental privado</p><h1 className="text-3xl font-bold">PageNova Builder 2.0</h1><p className="mt-2 text-sm text-white/60">Motor estruturado: escrever → gerar → modificar. Não altera seus projetos atuais.</p></div><a href="/app/builder" className="rounded-xl border border-white/20 px-4 py-2 text-sm">Voltar ao editor atual</a></div>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <section className="flex min-h-[580px] flex-col rounded-2xl border border-white/15 bg-[#141d1a] p-4"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-semibold">Chat com IA</h2><button type="button" onClick={undo} disabled={!history.length || busy} className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-40">↶ Desfazer</button></div><div aria-live="polite" className="mb-4 flex-1 space-y-3 overflow-y-auto">{messages.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-7 bg-lime-300 text-black" : "mr-7 bg-white/10"}`}>{m.text}</div>)}</div><form onSubmit={e=>{e.preventDefault();void send();}} className="space-y-3"><textarea aria-label="Descreva a criação ou alteração" value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder="Crie um site para uma clínica odontológica... ou Centralize todos os textos e o botão..." rows={4} className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white outline-none focus:border-lime-300"/><label className="block cursor-pointer rounded-xl border border-white/20 p-3 text-center text-sm">📎 Anexar imagem de referência<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>attachImage(e.target.files?.[0])}/></label>{reference && <p className="text-xs text-lime-300">Imagem anexada à conversa</p>}<button type="submit" disabled={busy} className="w-full rounded-xl bg-lime-300 p-3 font-bold text-black disabled:opacity-60">{busy ? "IA trabalhando..." : "Enviar e aplicar →"}</button></form><p className="mt-3 text-xs text-white/50">A IA recebe o site atual e suas instruções. Salvamento local experimental; publicação e persistência no servidor ainda não estão disponíveis.</p></section>
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-white text-black"><div className="flex items-center justify-between border-b border-black/10 px-6 py-4"><span className="font-bold">{site.title}</span><span className="text-xs text-gray-500">Prévia responsiva</span></div><div style={{backgroundColor:site.background}}>{sections.map((group,index)=>{
          const blocks=group.blocks;
          const first=blocks[0];
          const id=group.id.toLowerCase();
          const layout=first?.layout || (/servic|especialidade|benefic|diferencia/.test(id)?"grid":/pergunt|faq/.test(id)?"faq":/galeria|foto/.test(id)?"gallery":/equipe|estrutura|sobre/.test(id)?"split":index===0?"hero":"standard");
          const heading=blocks.filter(b=>b.type==="heading");
          const images=blocks.filter(b=>b.type==="image");
          const paragraphs=blocks.filter(b=>b.type==="paragraph");
          const buttons=blocks.filter(b=>b.type==="button");
          const render=(b:Block)=> <div key={b.id} data-block-id={b.id} style={{textAlign:b.align,marginBlock:b.spacing!==undefined?Math.min(60,Math.max(0,b.spacing)):undefined}}>
            {b.type==="heading"?<h2 style={{color:b.color,fontSize:b.fontSize?Math.min(80,Math.max(16,b.fontSize)):undefined}} className="text-2xl font-bold leading-tight tracking-tight md:text-5xl">{b.text}</h2>:b.type==="paragraph"?<p style={{color:b.color,fontSize:b.fontSize?Math.min(40,Math.max(12,b.fontSize)):undefined}} className="text-base leading-relaxed md:text-lg">{b.text}</p>:b.type==="image"?<>{b.src?<img src={b.src} alt={b.text||"Imagem"} className="w-full rounded-2xl object-cover" onError={e=>{e.currentTarget.style.display="none";e.currentTarget.nextElementSibling?.classList.remove("hidden");}}/>:null}<div className={b.src?"hidden rounded-2xl border border-dashed border-gray-300 bg-gray-100 p-10 text-center text-sm text-gray-500":"rounded-2xl border border-dashed border-gray-300 bg-gray-100 p-10 text-center text-sm text-gray-500"}>Imagem a adicionar</div></>:<a href="#contato" style={{backgroundColor:b.color,borderRadius:b.radius!==undefined?b.radius:undefined}} className="inline-block rounded-xl px-6 py-3 font-semibold text-white">{b.text}</a>}
          </div>;
          const textItems=paragraphs.filter(b=>!/^\s*\(?(apresente|adicione|insira|coloque|crie)\s.+layout/i.test(b.text));
          return <section key={group.id+"-"+index} data-section-id={group.id} style={{backgroundColor:first?.background||(index%2?"#f7f8f6":site.background)}} className="px-5 py-12 md:px-12 md:py-20">
            <div className="mx-auto max-w-6xl">
              {layout==="grid"||layout==="gallery"?<><div className="mb-7 space-y-3">{heading.map(render)}</div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(layout==="gallery"?images:textItems).map(b=><article key={b.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">{render(b)}</article>)}</div><div className="mt-7 flex flex-wrap gap-3">{buttons.map(render)}</div></>:
              layout==="faq"?<><div className="mb-6">{heading.map(render)}</div><div className="space-y-3">{textItems.map(b=><details key={b.id} className="rounded-xl border border-black/10 bg-white p-4"><summary className="cursor-pointer font-semibold" style={{color:b.color}}>{b.text.split("?")[0]}{b.text.includes("?")?"?":""}</summary><p className="mt-3 text-sm leading-relaxed">{b.text.includes("?")?b.text.slice(b.text.indexOf("?")+1).trim():b.text}</p></details>)}</div></>:
              layout==="split"||layout==="hero"?<div className={images.length?"grid items-center gap-8 md:grid-cols-2":"mx-auto max-w-3xl"}><div className="space-y-5">{heading.map(render)}{textItems.map(render)}{buttons.map(render)}</div>{images.length>0?<div className="space-y-4">{images.map(render)}</div>:null}</div>:
              <div className="mx-auto max-w-3xl space-y-5">{blocks.filter(b=>b.type!=="paragraph"||textItems.includes(b)).map(render)}</div>}
            </div>
          </section>;
        })}</div></section>
      </div>
    </div>
  </main>;
}
