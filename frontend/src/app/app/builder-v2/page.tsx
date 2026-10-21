"use client";

import { useEffect, useState } from "react";

type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; section?: string; fontSize?: number; radius?: number; spacing?: number; href?: string; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
type Site = { title: string; background: string; blocks: Block[] };
type ChatMessage = { role: "user" | "assistant"; text: string };
const initial: Site = { title: "Novo projeto", background: "#ffffff", blocks: [] };
const premiumThemes = {
  legal: {dark:"#101d33",accent:"#c9b782",light:"#f7f5ef"},
  health: {dark:"#164b3b",accent:"#d7e9df",light:"#f6f9f7"},
  creative: {dark:"#202327",accent:"#e5cbb3",light:"#f7f5f1"}
};
function readableColor(color:string,background:string) {
  const rgb=(value:string)=>{const v=value.trim().replace("#","");if(!/^[0-9a-f]{6}$/i.test(v))return null;return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));};
  const fg=rgb(color),bg=rgb(background);
  if(!fg||!bg)return color;
  const l=(v:number[])=>v[0]*.2126+v[1]*.7152+v[2]*.0722;
  const contrast=(a:number,b:number)=>(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  if(contrast(l(fg),l(bg))>=4.5)return color;
  return l(bg)>.4?"#24332e":"#f8f5e9";
}
const designPresets = [
 {id:"legal",match:/advoga|jurid|direito|escritorio/i,hero:"editorial",card:"bordered",accent:"#c9b782"},
 {id:"health",match:/clinic|odonto|medic|saude|terapia/i,hero:"split",card:"soft",accent:"#a6cbb9"},
 {id:"commerce",match:/loja|moda|produto|ecommerce|roupa/i,hero:"split",card:"soft",accent:"#e2a86c"},
 {id:"general",match:/.*/,hero:"editorial",card:"bordered",accent:"#c9b782"}
] as const;
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
  const [generationError, setGenerationError] = useState("");
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
  async function generateVisuals(current: Site, prompt: string, only?: number): Promise<Site> {
    const ids=Array.from(new Set(current.blocks.map(b=>b.section||"principal"))).filter(id=>!/faq|contato|rodape|footer|galeria/i.test(id));
    const galleryId=Array.from(new Set(current.blocks.map(b=>b.section||"principal"))).find(id=>/galeria|gallery|foto/i.test(id));
    const slots=Array.from({length:6},(_,i)=>i>=3&&galleryId?galleryId:ids[i%Math.max(1,ids.length)]||"principal");
    const jobs=only===undefined?slots.map((section,index)=>({section,index})): [{section:slots[only]||"principal",index:only}];
    const responses=await Promise.allSettled(jobs.map(async ({section,index})=>{
      const description=[only===undefined?"":prompt, "Commercial editorial photograph for the specific business and service described below. Show a believable professional environment, real people engaged in the service or relevant equipment. Never use generic laptops, random portraits, decorative plants, stock business imagery, text, logos, collages or unrelated subjects. Natural light, authentic documentary photography, premium art direction. Different composition for each image. Image slot "+(index+1)+".", current.blocks.filter(b=>(b.section||"principal")===section).map(b=>b.text).join(". ").slice(0,450)].filter(Boolean).join(" ");
      const res=await fetch("/api/builder-v2/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siteTitle:current.title,section,description})});
      const data=await res.json();
      if(!res.ok||typeof data.src!=="string")throw new Error(data.error||"Falha na imagem");
      return {section,index,src:data.src as string};
    }));
    const blocks=[...current.blocks];
    let completed=0;
    for(const response of responses){
      if(response.status!=="fulfilled")continue;
      const {section,index,src}=response.value;
      const id="visual-"+index;
      const visual:Block={id,type:"image",text:"Fotografia ilustrativa",color:"#ffffff",align:"center",section,src};
      const previous=blocks.findIndex(b=>b.id===id);
      if(previous>=0)blocks[previous]=visual;
      else {const position=blocks.findIndex(b=>(b.section||"principal")===section&&b.type==="heading");if(position>=0)blocks.splice(position+1,0,visual);}
      completed++;
    }
    if(!completed)throw new Error("Imagens indisponíveis: verifique o armazenamento do Supabase.");
    setMessages(prev=>[...prev,{role:"assistant",text:completed+" imagem(ns) criada(s). "+(completed<jobs.length?"Algumas imagens falharam.":"Pode substituir uma imagem pelo chat.")}]);
    return {...current,blocks};
  }
  async function send() {
    const prompt = instruction.trim(); if (!prompt || busy) return;
    setBusy(true);
    setGenerationError("");
    setMessages(prev => [...prev, { role: "user", text: prompt }]);
    if (/(?:regener|troqu|substitu|nova imagem|nova foto|gere imagens|gerar imagens)/i.test(prompt) && /(?:imagem|foto)/i.test(prompt) && site.blocks.length) {
      try {
        const match=prompt.match(/(?:imagem|foto)\s*(?:n[uú]mero\s*)?(\d+)/i);
        const index=match?Math.max(0,Math.min(5,Number(match[1])-1)):undefined;
        const updated=await generateVisuals(site,prompt,index);
        setHistory(prev=>[...prev.slice(-19),site]);setSite(updated);setInstruction("");
      } catch(error) {setMessages(prev=>[...prev,{role:"assistant",text:error instanceof Error?error.message:"Falha ao gerar imagem."}]);}
      finally {setBusy(false);}
      return;
    }
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
      if (!Array.isArray(data.site?.blocks) || data.site.blocks.length < 4) throw new Error("A IA não entregou um site completo. Nenhum resultado parcial foi aplicado.");
      const incoming = data.site as Site;
      const normalized = prompt.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
      const requested = /centraliz|alinhe?.*centro|alinh.*centro/.test(normalized) ? "center" : /alinhe?.*esquerda|alinh.*esquerda/.test(normalized) ? "left" : /alinhe?.*direita|alinh.*direita/.test(normalized) ? "right" : null;
      if (requested && /todos|todas|tudo/.test(normalized) && /textos|titulos|descricoes|paragrafos|elementos/.test(normalized)) {
        const relevant = incoming.blocks.filter(b=>b.type!=="image");
        if (relevant.some(b=>b.align!==requested)) throw new Error("A IA não aplicou o alinhamento em todos os elementos. O projeto foi preservado.");
      }
      setHistory(prev=>[...prev.slice(-19),site]);
      setSite(incoming);
      if (!site.blocks.length) {
        try { const illustrated=await generateVisuals(incoming,prompt);setSite(illustrated); }
        catch(error) {setMessages(prev=>[...prev,{role:"assistant",text:error instanceof Error?error.message:"Falha nas imagens. O site foi preservado."}]);}
      }
      setGenerationError("");
      setMessages(prev => [...prev, { role: "assistant", text: data.summary || "Alteração aplicada." }]);
      setInstruction(""); setReference(null);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Falha na geração.");
      setMessages(prev => [...prev, { role: "assistant", text: error instanceof Error ? error.message : "Erro ao editar. O projeto foi preservado." }]);
    } finally { setBusy(false); }
  }
  function newProject() { if (busy) return; setHistory(prev=>[...prev.slice(-19),site]); setSite(initial); setMessages([{role:"assistant",text:"Novo projeto iniciado. Descreva o site que deseja criar."}]); setInstruction(""); setReference(null); setGenerationError(""); }
  function undo() { if (!history.length || busy) return; setSite(history[history.length-1]); setHistory(prev=>prev.slice(0,-1)); setMessages(prev=>[...prev,{role:"assistant",text:"Última alteração desfeita."}]); }
  function attachImage(file?: File) {
    if (!file) return;
    if (file.size > 2_000_000) { setMessages(prev => [...prev,{role:"assistant",text:"Use uma imagem de até 2 MB."}]); return; }
    const reader = new FileReader();
    reader.onload = () => setReference(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }
  const isDesignInstruction = (value:string) => /(?:hero\\s+layout|background\\s*#(?:[0-9a-f]{3,8})|layout\\s+(?:grid|split|standard)|fundo\\s+(?:marfim|branco|azul.marinho)|bordas?\\s+douradas?|[ií]cones?\\s+dourados?|imagem\\s+(?:a adicionar|impactante)|t[ií]tulo principal impactante|subt[ií]tulo suave|cabe[cç]alho elegante e responsivo)/i.test(value);
  const previewBlocks = site.blocks.filter(b=>!isDesignInstruction(b.text) && (b.type!=="image" || !!b.src));
  const missingContact = previewBlocks.length>0 && !site.blocks.some(b=>/contato|agendamento|whatsapp/i.test(b.section||""));
  const sections = previewBlocks.reduce<Array<{id:string;blocks:Block[]}>>((acc,block)=>{
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
        <section className="flex min-h-[580px] flex-col rounded-2xl border border-white/15 bg-[#141d1a] p-4"><div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-semibold">Chat com IA</h2><button type="button" onClick={newProject} disabled={busy} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300 disabled:opacity-40">+ Novo site</button><button type="button" onClick={undo} disabled={!history.length || busy} className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-40">↶ Desfazer</button></div><div aria-live="polite" className="mb-4 flex-1 space-y-3 overflow-y-auto">{messages.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-7 bg-lime-300 text-black" : "mr-7 bg-white/10"}`}>{m.text}</div>)}</div><form onSubmit={e=>{e.preventDefault();void send();}} className="space-y-3"><textarea aria-label="Descreva a criação ou alteração" value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder="Crie um site para uma clínica odontológica... ou Centralize todos os textos e o botão..." rows={4} className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white outline-none focus:border-lime-300"/><label className="block cursor-pointer rounded-xl border border-white/20 p-3 text-center text-sm">📎 Anexar imagem de referência<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>attachImage(e.target.files?.[0])}/></label>{reference && <p className="text-xs text-lime-300">Imagem anexada à conversa</p>}<button type="submit" disabled={busy} className="w-full rounded-xl bg-lime-300 p-3 font-bold text-black disabled:opacity-60">{busy ? "IA trabalhando..." : "Enviar e aplicar →"}</button></form>{generationError && <p role="alert" className="mt-3 rounded-lg border border-red-400 bg-red-950/60 p-3 text-sm text-red-100">Erro na geração: {generationError}</p>}<p className="mt-3 text-xs text-white/50">A IA recebe o site atual e suas instruções. Salvamento local experimental; publicação e persistência no servidor ainda não estão disponíveis.</p></section>
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-white text-black"><div className="flex items-center justify-between border-b border-black/10 px-6 py-4"><span className="font-bold">{site.title}</span><span className="text-xs text-gray-500">Prévia responsiva</span></div><div style={{backgroundColor:site.background}}>{!site.blocks.length && <div className="flex min-h-[420px] flex-col items-center justify-center px-8 py-16 text-center"><p className="text-2xl font-bold text-slate-900">Seu site ainda não foi gerado</p><p className="mt-3 max-w-md text-slate-600">Escreva no chat, por exemplo: Faça um site premium para advogados. Depois clique em Enviar e aplicar.</p></div>}{sections.map((group,index)=>{
          const blocks=group.blocks;
          const first=blocks[0];
          const id=group.id.toLowerCase();
          const layout=(/pergunt|faq/i.test(id+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "))?"faq":undefined) || (/galeria|foto/i.test(id)?"gallery":undefined) || first?.layout || (/servic|tratament|especialidade|benefic|diferencia|atuacao|atua[cç][aã]o|processo|etapas/.test(id)?"grid":/pergunt|faq/.test(id)?"faq":/galeria|foto/.test(id)?"gallery":/equipe|estrutura|sobre|institucional/.test(id)?"split":index===0?"hero":"standard");
          const preset=designPresets.find(p=>p.match.test(site.title))||designPresets[3];
          const theme = /advoga|jurid|direito|escritorio/i.test(site.title) ? premiumThemes.legal : /clinic|odonto|medic|saude/i.test(site.title) ? premiumThemes.health : premiumThemes.creative;
          const sectionBackground=first?.background||(index===0?theme.dark:index%2?theme.light:site.background);
          
          const heading=blocks.filter(b=>b.type==="heading");
          const images=blocks.filter(b=>b.type==="image"&&!!b.src);
          const paragraphs=blocks.filter(b=>b.type==="paragraph");
          const buttons=blocks.filter(b=>b.type==="button");
          const visualLayout=layout==="standard"&&paragraphs.length>=3?"grid":layout;
          const isGallery=visualLayout==="gallery";
          const clean=(value:string)=>value.replace(/\s*[-–—]\s*(?:(?:grid|hero|faq|banner|split|standard|gallery)|(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto))(?:\s*[-–—]\s*(?:(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto)))*/giu,"").replace(/\s*[-–—,;]?\s*(?:layout|design|background|fundo)\s*:\s*[^,;]+/giu,"").replace(/\s*[-–—]\s*$/u,"").trim();
          const textItems=paragraphs.filter(b=>!/^\s*\(?(apresente|adicione|insira|coloque|crie)\s.+layout/i.test(b.text));
          const galleryImages=isGallery?(images.length?images:previewBlocks.filter(b=>b.type==="image"&&!!b.src).slice(0,6)):images;
          const cardItems=isGallery?galleryImages:textItems.slice(0,6);
          const isProcess=/etapas|processo|passos|como-funciona/i.test(id);
          const cardText=(b:Block)=>{const parts=clean(b.text).split(/:\s|\s[—–-]\s/);return {name:parts.length>1?parts[0].trim():"",description:parts.length>1?parts.slice(1).join(" — ").trim():clean(b.text)};};
          const render=(b:Block)=> {
            if(b.type==="heading") return <h2 key={b.id} data-block-id={b.id} style={{textAlign:b.align,color:readableColor(b.color,sectionBackground)}} className={visualLayout==="hero"?"max-w-3xl text-[clamp(2rem,4.5vw,4.4rem)] font-bold leading-[1.08] tracking-[-.045em]":"max-w-3xl text-[clamp(1.65rem,3vw,2.65rem)] font-bold leading-[1.15] tracking-[-.035em]"}>{clean(b.text)}</h2>;
            if(b.type==="paragraph") return <p key={b.id} data-block-id={b.id} style={{textAlign:b.align,color:readableColor(b.color,sectionBackground)}} className="max-w-2xl text-[15px] leading-[1.7] md:text-lg">{clean(b.text)}</p>;
            if(b.type==="image") return b.src?<img key={b.id} data-block-id={b.id} src={b.src} alt={b.text||"Fotografia do negócio"} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover"/>:null;
            return <a key={b.id} data-block-id={b.id} href={b.href&&/^(https?:\/\/|mailto:|tel:|#)/.test(b.href)?b.href:undefined} style={{backgroundColor:b.color,color:readableColor("#ffffff",b.color)}} className="inline-flex min-h-12 items-center justify-center rounded-xl px-7 py-3 text-sm font-semibold">{clean(b.text)}</a>;
          };
          const isContact=/contato|agend|fale.conosco/i.test(id);
          const sectionImages=isGallery?galleryImages:images;
          const visualCards=cardItems.filter(b=>b.type==="paragraph");
          const headingNode=<div className="mb-9 max-w-3xl space-y-3">{heading.map(render)}</div>;
          const imageNode=(b:Block,i:number)=><div key={b.id} className={i===0?"overflow-hidden rounded-[1.75rem]":"overflow-hidden rounded-2xl"}>{render(b)}</div>;
          return <section id={isContact?"contato":group.id} key={group.id+"-"+index} data-section-id={group.id} style={{backgroundColor:sectionBackground}} className="px-5 py-12 sm:px-8 md:px-14 md:py-20">
            <div className="mx-auto max-w-6xl">
              {isGallery?<>{headingNode}<div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className={i===0?"col-span-2 md:col-span-2 md:row-span-2":""}>{imageNode(b,i)}</div>)}</div></>:
              visualLayout==="faq"?<>{headingNode}<div className="mx-auto max-w-3xl space-y-3">{textItems.map(b=>{const at=b.text.indexOf("?");return <details key={b.id} className="group rounded-xl border border-[#e9e4da] bg-white px-5 py-4 text-[#24332e]"><summary className="cursor-pointer list-none font-semibold leading-snug">{at>=0?b.text.slice(0,at+1):b.text}<span className="float-right ml-3 text-lg">+</span></summary>{at>=0&&b.text.slice(at+1).trim()&&<p className="mt-3 border-t border-[#eee9e0] pt-3 text-sm leading-relaxed">{b.text.slice(at+1).trim()}</p>}</details>})}</div></>:
              visualLayout==="hero"||visualLayout==="split"?<div className={sectionImages.length?"grid items-center gap-8 md:grid-cols-2 md:gap-14":"mx-auto max-w-3xl"}>
                <div className="space-y-5">{heading.map(render)}{textItems.slice(0,3).map(render)}{buttons.length>0&&<div className="flex flex-wrap gap-3 pt-2">{buttons.map(render)}</div>}</div>
                {sectionImages.length>0&&<div className="relative">{sectionImages.slice(0,1).map(imageNode)}</div>}
              </div>:
              visualLayout==="grid"?<>{headingNode}<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visualCards.map((item,i)=>{const card=cardText(item);const photo=sectionImages.length>1?sectionImages[i]:i===0?sectionImages[0]:undefined;return <article key={item.id} className="overflow-hidden rounded-2xl border border-[#e7e4dd] bg-white shadow-[0_8px_30px_rgba(20,35,29,0.045)]">{photo&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:rounded-none [&_img]:object-cover">{render(photo)}</div>}<div className="p-5 md:p-7">{isProcess&&<span className="mb-4 inline-flex rounded-lg bg-[#f5f0e4] px-3 py-2 text-xs font-semibold text-[#92773b]">{String(i+1).padStart(2,"0")}</span>}{card.name&&<h3 className="mb-2 text-lg font-bold leading-snug text-[#24332e]">{card.name}</h3>}<p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>{buttons.length>0&&<div className="mt-7 flex flex-wrap gap-3">{buttons.map(render)}</div>}</>:
              visualLayout==="banner"||isContact?<div className="mx-auto max-w-3xl space-y-5 text-center [&_h2]:mx-auto [&_h2]:text-center [&_p]:mx-auto [&_p]:text-center">{heading.map(render)}{textItems.filter(b=>!/\b(?:xx|xxx|rua principal|contato@clinic)/i.test(b.text)).slice(0,2).map(render)}{buttons.map(render)}</div>:
              <div className={sectionImages.length?"grid items-center gap-8 md:grid-cols-2 md:gap-14":"mx-auto max-w-3xl space-y-5"}><div className="space-y-5">{heading.map(render)}{textItems.slice(0,3).map(render)}{buttons.map(render)}</div>{sectionImages.slice(0,1).map(imageNode)}</div>}
            </div>
          </section>;
        })}{missingContact?<footer id="contato" className="border-t border-black/10 bg-[#101d33] px-6 py-12 text-center text-white"><p className="text-xl font-semibold">Vamos conversar sobre seu projeto?</p><p className="mt-3 text-sm text-white/70">Personalize os canais de atendimento pelo chat para receber contatos.</p></footer>:null}</div></section>
      </div>
    </div>
  </main>;
}
