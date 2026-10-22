"use client";

import { useEffect, useState } from "react";

type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; section?: string; fontSize?: number; radius?: number; spacing?: number; href?: string; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
type Site = { title: string; background: string; blocks: Block[]; footer?: { cnpj?: string; address?: string; email?: string; instagram?: string; facebook?: string; youtube?: string; whatsapp?: string; showMenu?: boolean } };
type ChatMessage = { role: "user" | "assistant"; text: string };
type SavedVersion = { id: string; at: string; label: string; site: Site };
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
const nicheGroups: Record<string,string[]> = {
  "Saúde e bem-estar": ["Clínica médica","Odontologia","Psicologia","Fisioterapia","Nutrição","Estética","Dermatologia","Academia","Pilates","Veterinária","Farmácia","Oftalmologia","Terapia ocupacional","Fonoaudiologia","Quiropraxia","Clínica de exames","Clínica de vacinação"],
  "Beleza": ["Barbearia","Salão de beleza","Manicure","Maquiagem","Spa","Cabeleireiro","Design de sobrancelhas","Depilação","Massoterapia","Tatuagem","Estúdio de unhas","Clínica capilar"],
  "Profissionais": ["Advocacia","Contabilidade","Consultoria empresarial","Arquitetura","Engenharia","Marketing digital","Agência de publicidade","Tecnologia","Corretora de seguros","Recursos humanos","Fotografia","Assessoria de imprensa","Consultoria financeira","Despachante","Tradução"],
  "Casa e construção": ["Imobiliária","Construtora","Reformas","Eletricista","Encanador","Marcenaria","Móveis planejados","Paisagismo","Limpeza residencial","Energia solar","Decoração","Serralheria","Pintura","Vidraçaria","Dedetização"],
  "Alimentação": ["Restaurante","Pizzaria","Hamburgueria","Cafeteria","Padaria","Confeitaria","Marmitaria","Churrascaria","Sorveteria","Buffet","Comida japonesa","Açaí","Doceria","Food truck","Produtos naturais"],
  "Comércio": ["Loja de roupas","Moda feminina","Moda masculina","Joalheria","Ótica","Calçados","Pet shop","Eletrônicos","Cosméticos","Papelaria","Presentes","Loja de suplementos","Floricultura","Brinquedos","Artigos esportivos","Materiais de construção"],
  "Automotivo": ["Oficina mecânica","Estética automotiva","Lava-rápido","Autopeças","Locadora de veículos","Transportadora","Motocicletas","Autoescola","Funilaria","Guincho"],
  "Educação e eventos": ["Escola","Curso online","Escola de idiomas","Reforço escolar","Mentoria","Eventos","Casamentos","Cerimonial","DJ","Produtora audiovisual","Escola de música","Treinamento corporativo"],
  "Turismo": ["Hotel","Pousada","Agência de viagens","Turismo local","Aluguel por temporada","Camping","Resort","Guia turístico"],
  "Outros": ["Agronegócio","ONG","Associação","Serviços financeiros","Personal trainer","Consultoria de imagem","Lavanderia","Segurança eletrônica","Gráfica","Serviços gerais","Organização de eventos","Coworking","Assistência técnica"]
};
const nicheNames = Object.values(nicheGroups).flat();
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
  const [nicheMenuOpen, setNicheMenuOpen] = useState(false);
  const [nicheQuery, setNicheQuery] = useState("");
  const [nicheGroup, setNicheGroup] = useState("Todos");
  const [selectedNiche, setSelectedNiche] = useState("");
  const chooseNiche = (niche:string) => {
    setSelectedNiche(niche);
    setInstruction(current => {
      const suggestion = "Crie um site profissional para um negócio do nicho de "+niche+". Utilize o template universal existente, com textos específicos para esse segmento. Priorize fotografias reais e naturais, sem avatares ou aparência artificial. Respeite minhas próximas instruções no chat.";
      return current.trim() ? current.trim()+"\\n\\n"+suggestion : suggestion;
    });
    setNicheMenuOpen(false);
  };

  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [history, setHistory] = useState<Site[]>([]);
  const [redoHistory, setRedoHistory] = useState<Site[]>([]);
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [cloudStatus, setCloudStatus] = useState("Carregando histórico na nuvem...");
  const [cloudVersions, setCloudVersions] = useState<SavedVersion[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/builder-v2/versions", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw Error("unavailable");
      const result: { versions?: SavedVersion[] } = await response.json();
      if (active) { setCloudVersions(result.versions ?? []); setCloudStatus("Histórico na nuvem conectado"); }
    }).catch(() => { if (active) setCloudStatus("Nuvem indisponível — histórico local preservado"); });
    return () => { active = false; };
  }, []);
  async function saveCloudVersion(snapshot: Site, label: string) {
    try {
      const response = await fetch("/api/builder-v2/versions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: snapshot, label })
      });
      if (!response.ok) throw Error("save failed");
      const result: { version: SavedVersion } = await response.json();
      setCloudVersions(previous => [result.version, ...previous].slice(0, 25));
      setCloudStatus("Versão salva na nuvem");
    } catch { setCloudStatus("Falha ao salvar na nuvem — cópia local preservada"); }
  }
  function saveNamedVersion() {
    if (!site.blocks.length) return;
    const label = window.prompt("Nome da versão (ex.: Aprovada pelo cliente):", "Versão aprovada");
    if (!label?.trim()) return;
    recordVersion(site, label.trim().slice(0, 120));

  }

  useEffect(() => { try { const saved = localStorage.getItem(storageKey); if (saved) setSite(JSON.parse(saved)); const savedVersions = localStorage.getItem(storageKey + ":versions"); if (savedVersions) { const parsed: unknown = JSON.parse(savedVersions); if (Array.isArray(parsed)) setVersions(parsed.filter((item): item is SavedVersion => !!item && typeof item === "object" && typeof item.id === "string" && !!item.site && Array.isArray(item.site.blocks)).slice(-25)); } } catch {} setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(storageKey, JSON.stringify(site)); setStorageError(""); } catch { setStorageError("Não foi possível salvar o site neste navegador. Libere espaço para evitar perda de alterações."); } }, [site, loaded]);
  useEffect(() => { if (!loaded) return; try { localStorage.setItem(storageKey + ":versions", JSON.stringify(versions)); } catch { setStorageError("O histórico atingiu o limite de armazenamento do navegador. Exclua versões antigas."); } }, [versions, loaded]);
  function recordVersion(previous: Site, label: string) { if (!previous.blocks.length) return; const snapshot = structuredClone(previous); setVersions(prev => [...prev.slice(-24), { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString(), label, site: snapshot }]); void saveCloudVersion(snapshot, label); }
  function restoreVersion(version: SavedVersion) { if (busy || !window.confirm(`Restaurar a versão de ${new Date(version.at).toLocaleString("pt-BR")}? A versão atual será guardada no histórico.`)) return; recordVersion(site, "Antes da restauração"); setHistory(prev=>[...prev.slice(-19),site]); setRedoHistory([]); setSite(structuredClone(version.site)); setMessages(prev=>[...prev,{role:"assistant",text:"Versão restaurada com sucesso."}]); setShowVersions(false); }
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
    const ids=Array.from(new Set(current.blocks.map(b=>b.section||"principal"))).filter(id=>!/faq|contato|rodape|footer|galeria|gallery|portf[oó]lio/i.test(id));
    const galleryId=Array.from(new Set(current.blocks.map(b=>b.section||"principal"))).find(id=>/galeria|gallery|foto|portf[oó]lio/i.test(id));
    const slots=Array.from({length:6},(_,i)=>i>=3&&galleryId?galleryId:ids[i%Math.max(1,ids.length)]||"principal");
    const jobs=only===undefined?slots.map((section,index)=>({section,index})): [{section:slots[only]||"principal",index:only}];
    const responses=await Promise.allSettled(jobs.map(async ({section,index})=>{
      const isArchitecture=/arquitet|interior|atelier|ateli[eê]/i.test(current.title+" "+prompt);
      const visualDirections=isArchitecture
        ? ["Wide-angle architectural photograph of a sophisticated residential living room with warm natural light, authentic construction and furniture.","Architectural close-up of stone, timber joinery, refined natural material junctions and thoughtful lighting.","Editorial photograph of an elegant contemporary interior with clean spatial composition and lived-in realism.","Wide interior photograph of a serene dining or living space with sophisticated material palette.","Architectural detail of custom furniture, tactile finishes and light-shadow interplay.","Beautifully composed contemporary residential architecture, distinct room and camera angle."]
        : ["Wide establishing photograph of the actual business environment.","Authentic close-up of the specific service or product.","A second realistic angle of the business environment.","Natural editorial photograph showing relevant work in context.","Detail photograph of relevant materials, products or equipment.","Distinct contextual photograph illustrating the actual industry."];
      const description=[only===undefined?"":prompt,"IMPORTANT: business is "+current.title+". "+visualDirections[index%6],"Photograph must represent the business sector faithfully. No unrelated professions, medical consultations or treatment unless this business is explicitly healthcare. No invented signage or identifiable employees. Each image must have a distinct subject and camera angle. Natural light, premium editorial art direction, believable textures. Slot "+(index+1)+".",current.blocks.filter(b=>(b.section||"principal")===section&&b.type!=="image").map(b=>b.text).join(". ").slice(0,300)].filter(Boolean).join(" ");

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
  function applySingleButtonAlignment(current:Site,prompt:string):{site:Site;summary:string}|null {
    const normalized=prompt.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    if(!/botao|cta/.test(normalized)||!/alinh|centraliz|posicion/.test(normalized))return null;
    // A targeted shortcut must never swallow instructions about other elements.
    const clauses=normalized.split(/(?:\b\d+[.)]\s*|[.;]\s*)/).map(x=>x.trim()).filter(Boolean);
    if(clauses.some(x=>/(?:alinhe|alinhamento|centralize|centralizar)/.test(x)&&/(?:subtitulo|titulo|paragrafo|texto principal)/.test(x)))return null;
    if(/(?:altere|mude|troque|modifique)\s+(?:a\s+)?(?:cor|texto|fonte|tamanho)/.test(normalized))return null;
    const direction=/centro|centraliz|centralizado/.test(normalized)?"center":/esquerda/.test(normalized)?"left":/direita/.test(normalized)?"right":null;
    if(!direction)return null;
    const buttons=current.blocks.filter(b=>b.type==="button");
    if(!buttons.length)return null;
    const explicit=buttons.find(b=>normalized.includes(b.text.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,""))&&b.text.length>3);
    const hero=buttons.find(b=>/^(inicio|hero|home|principal)$/i.test(b.section||""));
    const selected=explicit||((/esse botao|deste botao|botao do hero|botao principal|botao inicial/.test(normalized)||buttons.length===1)?hero||buttons[0]:null);
    if(!selected)return null;
    return {site:{...current,blocks:current.blocks.map(b=>b.id===selected.id?{...b,align:direction}:b)},summary:"Alinhamento do botão aplicado. Todo o restante do site foi preservado."};
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
        recordVersion(site, "Antes de alterar imagens");setRedoHistory([]);setHistory(prev=>[...prev.slice(-19),site]);setSite(updated);setInstruction("");
      } catch(error) {setMessages(prev=>[...prev,{role:"assistant",text:error instanceof Error?error.message:"Falha ao gerar imagem."}]);}
      finally {setBusy(false);}
      return;
    }
    const structuralRequest = /(?:adicione|crie|criar|incluir|inclua|nova|novo|remova|exclua|mova|coloque|reorganize)[\\s\\S]{0,90}(?:se[cç][aã]o|bloco|etapas|par[aá]grafo)|(?:se[cç][aã]o)[\\s\\S]{0,90}(?:adicione|crie|criar|incluir|inclua|nova|novo)/i.test(prompt);
    const direct = structuralRequest ? null : (applySingleButtonAlignment(site, prompt) || applyGlobalAlignment(site, prompt));
    if (direct) {
      recordVersion(site, "Antes de editar alinhamento");setRedoHistory([]);setHistory(prev=>[...prev.slice(-19),site]);
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
      recordVersion(site, "Antes da edição com IA");setRedoHistory([]);setHistory(prev=>[...prev.slice(-19),site]);
      setSite(incoming);
      if (!site.blocks.length) {
        try { const illustrated=await generateVisuals(incoming,selectedNiche ? prompt+" Contexto visual do nicho: "+selectedNiche+". Fotografia editorial natural, cenas e ambientes coerentes com a profissão; evite rostos em primeiro plano, avatares, pele artificial e elementos genéricos de IA." : prompt);setSite(illustrated); }
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
  function newProject() { if (busy) return; recordVersion(site, "Antes de criar novo site");setHistory([]);setRedoHistory([]); setSite(initial); setMessages([{role:"assistant",text:"Novo projeto iniciado. Descreva o site que deseja criar."}]); setInstruction(""); setReference(null); setGenerationError(""); }
  function undo() { if (!history.length || busy) return; recordVersion(site, "Antes de desfazer"); setRedoHistory(prev=>[...prev.slice(-19),site]);setSite(history[history.length-1]); setHistory(prev=>prev.slice(0,-1)); setMessages(prev=>[...prev,{role:"assistant",text:"Última alteração desfeita."}]); }
  function redo() { if (!redoHistory.length || busy) return; recordVersion(site, "Antes de refazer");setHistory(prev=>[...prev.slice(-19),site]);setSite(redoHistory[redoHistory.length-1]);setRedoHistory(prev=>prev.slice(0,-1));setMessages(prev=>[...prev,{role:"assistant",text:"Alteração refeita."}]); }
  function attachImage(file?: File) {
    if (!file) return;
    if (file.size > 2_000_000) { setMessages(prev => [...prev,{role:"assistant",text:"Use uma imagem de até 2 MB."}]); return; }
    const reader = new FileReader();
    reader.onload = () => setReference(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }
  const stripLayoutMetadata = (value:string) => value.replace(/\b(?:hero|tratamentos?|apresenta[cç][aã]o|diferenciais|galeria|contato|faq)\s+layout\s+(?:hero|grid|split|banner|faq|gallery|standard)?\s*(?:com\s+)?(?:fundo\s+)?(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto)?/giu,"").replace(/\b(?:layout\s+(?:hero|grid|split|banner|faq|gallery|standard)|fundo\s+(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto))\b/giu,"").replace(/\s{2,}/g," ").trim();
  const publicHeading = (value:string,section:string) => {const cleaned=stripLayoutMetadata(value);if(cleaned&& !/^(?:hero|grid|split|banner|standard|gallery|faq)$/i.test(cleaned))return cleaned;return /tratament|servi[cç]/i.test(section)?"Nossos tratamentos":/apresent|sobre|cl[ií]nica/i.test(section)?"Conheça nosso espaço":/diferenc|escolh/i.test(section)?"Por que nos escolher":/galeria|resultad/i.test(section)?"Galeria de imagens":/contato|agend/i.test(section)?"Entre em contato":/faq|pergunt/i.test(section)?"Dúvidas frequentes":"Conheça nossos serviços";};
  const isDesignInstruction = (value:string) => /(?:hero\\s+layout|background\\s*#(?:[0-9a-f]{3,8})|layout\\s+(?:grid|split|standard)|fundo\\s+(?:marfim|branco|azul.marinho)|bordas?\\s+douradas?|[ií]cones?\\s+dourados?|imagem\\s+(?:a adicionar|impactante)|t[ií]tulo principal impactante|subt[ií]tulo suave|cabe[cç]alho elegante e responsivo)/i.test(value);
  const previewBlocks = site.blocks.filter(b=>(b.type==="heading"||!isDesignInstruction(b.text)) && (b.type!=="image" || !!b.src)).map(b=>({...b,section:b.section||"principal"}));
  const missingContact = previewBlocks.length>0 && !site.blocks.some(b=>/contato|agendamento|whatsapp/i.test(b.section||""));
  const sections = previewBlocks.reduce<Array<{id:string;blocks:Block[]}>>((acc,block)=>{
    const id = block.section || "principal";
    const existing = acc.find(group=>group.id===id);
    if(existing) existing.blocks.push(block);
    else acc.push({id,blocks:[block]});
    return acc;
  },[]);
  return <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#0b1110] px-3 py-5 text-white sm:px-4 sm:py-8">
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Ambiente experimental privado</p><h1 className="break-words text-2xl font-bold leading-tight sm:text-3xl">PageNova Builder 2.0</h1><p className="mt-2 text-sm text-white/60">Motor estruturado: escrever → gerar → modificar. Não altera seus projetos atuais.</p></div><a href="/app/builder" className="rounded-xl border border-white/20 px-4 py-2 text-sm">Voltar ao editor atual</a></div>
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="flex min-w-0 min-h-[480px] flex-col rounded-2xl border border-white/15 bg-[#141d1a] p-3 sm:min-h-[580px] sm:p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="w-full text-base font-semibold sm:w-auto sm:mr-auto">Chat com IA</h2><button type="button" onClick={newProject} disabled={busy} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300 disabled:opacity-40">+ Novo site</button><button type="button" onClick={undo} disabled={!history.length || busy} className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-40">↶ Desfazer</button><button type="button" onClick={redo} disabled={!redoHistory.length || busy} className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-40">↷ Refazer</button><button type="button" onClick={()=>setShowVersions(v=>!v)} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300">Histórico ({versions.length + cloudVersions.length})</button><button type="button" onClick={saveNamedVersion} disabled={!site.blocks.length || busy} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300 disabled:opacity-40">Salvar versão nomeada</button></div><p className="mb-2 text-xs text-white/60" role="status">{cloudStatus}</p>{storageError && <p role="alert" className="mb-3 rounded-lg border border-amber-400/50 p-2 text-xs text-amber-200">{storageError}</p>}{showVersions && <div className="mb-3 max-h-64 overflow-y-auto rounded-xl border border-white/20 p-3"><p className="mb-2 text-xs text-white/70">Versões locais e na nuvem. Salve uma versão nomeada antes de aprovar alterações.</p>{(versions.length + cloudVersions.length)===0 ? <p className="text-xs text-white/60">Nenhuma versão anterior ainda.</p> : [...cloudVersions, ...[...versions].reverse()].map(version=><div key={version.id} className="mb-2 flex items-center justify-between gap-2 border-b border-white/10 pb-2"><div className="min-w-0"><p className="text-xs">{version.label}</p><p className="text-[11px] text-white/60">{new Date(version.at).toLocaleString("pt-BR")}</p></div><button type="button" disabled={busy} onClick={()=>restoreVersion(version)} className="rounded-md border border-lime-300/50 px-2 py-1 text-xs text-lime-300 disabled:opacity-40">Restaurar</button></div>)}</div>}<div aria-live="polite" className="mb-4 flex-1 space-y-3 overflow-y-auto">{messages.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-7 bg-lime-300 text-black" : "mr-7 bg-white/10"}`}>{m.text}</div>)}</div><div className="mb-3 rounded-xl border border-white/20 bg-white/5 p-3"><button type="button" aria-expanded={nicheMenuOpen} onClick={()=>setNicheMenuOpen(open=>!open)} className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-white"><span>▦ Escolher nicho {selectedNiche ? "· "+selectedNiche : ""}</span><span aria-hidden="true">{nicheMenuOpen ? "▲" : "▼"}</span></button>{nicheMenuOpen&&<div className="mt-3 space-y-2"><input aria-label="Pesquisar nichos" value={nicheQuery} onChange={e=>setNicheQuery(e.target.value)} placeholder="Pesquisar profissão ou negócio..." className="w-full rounded-lg border border-white/20 bg-black/30 p-2 text-sm text-white outline-none focus:border-lime-300"/><select aria-label="Categoria do nicho" value={nicheGroup} onChange={e=>setNicheGroup(e.target.value)} className="w-full rounded-lg border border-white/20 bg-[#18251d] p-2 text-sm text-white"><option>Todos</option>{Object.keys(nicheGroups).map(group=><option key={group}>{group}</option>)}</select><div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">{nicheNames.filter(n=>(nicheGroup==="Todos"||nicheGroups[nicheGroup]?.includes(n))&&n.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").includes(nicheQuery.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,""))).map(n=><button type="button" key={n} onClick={()=>chooseNiche(n)} className="rounded-lg border border-white/10 p-2 text-left text-xs text-white/90 hover:border-lime-300 hover:bg-white/10">{n}</button>)}</div><p className="text-xs text-white/50">Selecionar apenas preenche o chat. Você pode editar o texto antes de enviar.</p></div>}</div><form onSubmit={e=>{e.preventDefault();void send();}} className="space-y-3"><textarea aria-label="Descreva a criação ou alteração" value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder="Crie um site para uma clínica odontológica... ou Centralize todos os textos e o botão..." rows={4} className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white outline-none focus:border-lime-300"/><label className="block cursor-pointer rounded-xl border border-white/20 p-3 text-center text-sm">📎 Anexar imagem de referência<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>attachImage(e.target.files?.[0])}/></label>{reference && <p className="text-xs text-lime-300">Imagem anexada à conversa</p>}<button type="submit" disabled={busy} className="w-full rounded-xl bg-lime-300 p-3 font-bold text-black disabled:opacity-60">{busy ? "IA trabalhando..." : "Enviar e aplicar →"}</button></form>{generationError && <p role="alert" className="mt-3 rounded-lg border border-red-400 bg-red-950/60 p-3 text-sm text-red-100">Erro na geração: {generationError}</p>}<p className="mt-3 text-xs text-white/50">A IA recebe o site atual e suas instruções. Salvamento local experimental; publicação e persistência no servidor ainda não estão disponíveis.</p></section>
        <section className="overflow-hidden rounded-2xl border border-white/15 bg-white text-black"><div className="flex items-center justify-between border-b border-black/10 px-6 py-4"><span className="font-bold">{site.title}</span><span className="text-xs text-gray-500">Prévia responsiva</span></div><div style={{backgroundColor:site.background}}>{!site.blocks.length && <div className="flex min-h-[420px] flex-col items-center justify-center px-8 py-16 text-center"><p className="text-2xl font-bold text-slate-900">Seu site ainda não foi gerado</p><p className="mt-3 max-w-md text-slate-600">Escreva no chat, por exemplo: Faça um site premium para advogados. Depois clique em Enviar e aplicar.</p></div>}{sections.map((group,index)=>{
          const blocks=group.blocks;
          const first=blocks[0];
          const id=group.id.toLowerCase();
          const layout=(/pergunt|faq/i.test(id+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "))?"faq":undefined) || (/galeria|foto|portf[oó]lio/i.test(id)?"gallery":undefined) || first?.layout || (/servic|tratament|especialidade|benefic|diferencia|atuacao|atua[cç][aã]o|processo|etapas/.test(id)?"grid":/pergunt|faq/.test(id)?"faq":/galeria|foto/.test(id)?"gallery":/equipe|estrutura|sobre|institucional/.test(id)?"split":index===0?"hero":"standard");
          const preset=designPresets.find(p=>p.match.test(site.title))||designPresets[3];
          const theme = /advoga|jurid|direito|escritorio/i.test(site.title) ? premiumThemes.legal : /clinic|odonto|medic|saude/i.test(site.title) ? premiumThemes.health : premiumThemes.creative;
          const sectionBackground=first?.background||(index===0?theme.dark:index%2?theme.light:site.background);
          
          const heading=blocks.filter(b=>b.type==="heading").slice(0,1);
          const images=blocks.filter(b=>b.type==="image"&&!!b.src);
          const paragraphs=blocks.filter(b=>b.type==="paragraph");
          const buttons=blocks.filter(b=>b.type==="button");
          const visualLayout=layout==="standard"&&paragraphs.length>=3?"grid":layout;
          const editorialTone=/est[eé]tica|beleza|spa|luxo|premium|arquitetura|interior|moda/i.test(site.title+" "+group.id);
          const displayFont=editorialTone?"Georgia, Times New Roman, serif":"inherit";
          const isGallery=visualLayout==="gallery"||/portf[oó]lio|galeria/i.test(id+" "+blocks.filter(b=>b.type==="heading").map(b=>b.text).join(" "));
          const clean=(value:string)=>value.replace(/\s*[-–—]\s*(?:(?:grid|hero|faq|banner|split|standard|gallery)|(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto))(?:\s*[-–—]\s*(?:(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto)))*/giu,"").replace(/\s*[-–—,;]?\s*(?:layout|design|background|fundo)\s*:\s*[^,;]+/giu,"").replace(/\s*[-–—]\s*$/u,"").trim();
          const textItems=paragraphs.filter(b=>!/^\s*\(?(apresente|adicione|insira|coloque|crie)\s.+layout/i.test(b.text));
          const galleryImages=isGallery?(images.length?images:previewBlocks.filter(b=>b.type==="image"&&b.section===group.id)).slice(0,6):images;
          const cardItems=isGallery?galleryImages:textItems.slice(0,6);
          const isProcess=/etapas|processo|passos|como-funciona|atendimento|metodologia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const isPrinciples=/princip|diferencia|valores|filosofia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const processPhotos=isProcess?Array.from(new Map(previewBlocks.filter(b=>b.type==="image"&&!!b.src).map(b=>[b.src,b])).values()).slice(0,6):[];
          const cardText=(b:Block)=>{const parts=clean(b.text).split(/:\s|\s[—–]\s/);const description=parts.length>1?parts.slice(1).join(" — ").trim():clean(b.text);const name=parts.length>1?parts[0].trim():"";return {name,description:name&&description.toLocaleLowerCase("pt-BR").startsWith(name.toLocaleLowerCase("pt-BR"))?description.slice(name.length).replace(/^[\s,.:—–-]+/,"").trim()||description:description};};
          const safeColor=(color:string)=>{const c=readableColor(color,sectionBackground);const dark=/^#(?:1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(sectionBackground);return dark&&/^#(?:0[0-9a-f]|1[0-9a-f]|2[0-9a-f]|3[0-9a-f])/i.test(c)?"#f7f4eb":c;};
          const render=(b:Block)=> {
            if(b.type==="heading") return <h2 key={b.id} data-block-id={b.id} style={{textAlign:b.align,color:safeColor(b.color),fontFamily:displayFont,fontSize:b.fontSize?`${b.fontSize}px`:undefined}} className={visualLayout==="hero"?"max-w-3xl text-[clamp(2.5rem,6vw,5.4rem)] font-medium leading-[1.04] tracking-[-.05em]":"max-w-3xl text-[clamp(2rem,4vw,3.6rem)] font-medium leading-[1.1] tracking-[-.045em]"}>{publicHeading(b.text,id)}</h2>;
            if(b.type==="paragraph") return <p key={b.id} data-block-id={b.id} style={{textAlign:b.align,color:safeColor(b.color),fontSize:b.fontSize?`${b.fontSize}px`:undefined}} className="max-w-2xl text-[15px] leading-[1.7] md:text-lg">{clean(b.text).replace(/(?:telefone\s*:\s*)?\(?11\)?\s*1234[-\s]?5678/gi,"")}</p>;
            if(b.type==="image") return b.src?<img key={b.id} data-block-id={b.id} src={b.src} alt={b.text||"Fotografia do negócio"} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover"/>:null;
            return <span key={b.id} className="flex w-full" style={{justifyContent:b.align==="center"?"center":b.align==="right"?"flex-end":"flex-start"}}><a data-block-id={b.id} href={b.href&&/^(https?:\/\/|mailto:|tel:|#)/.test(b.href)?b.href:(/agend|contato|convers|consulta|orçamento|saiba mais/i.test(b.text)?"#contato":undefined)} style={{backgroundColor:b.color,color:readableColor("#ffffff",b.color)}} className="inline-flex min-h-12 items-center justify-center rounded-xl px-7 py-3 text-sm font-semibold">{clean(b.text)}</a></span>;
          };
          const isContact=/contato|agend|fale.conosco/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const hasContactAction=buttons.some(b=>!!b.href&&/^(https?:\/\/|mailto:|tel:)/i.test(b.href));
          const sectionImages=isPrinciples?[]:isGallery?galleryImages:images;
          const uniqueImages=sectionImages.filter((b,i,all)=>!!b.src&&all.findIndex(other=>other.src===b.src)===i);
          const visualCards=cardItems.filter(b=>b.type==="paragraph").filter(b=>b.text.trim().length>0).filter(b=>!/^solu[cç][oõ]es sofisticadas/i.test(b.text.trim())).filter(b=>!/^\s*(?:conheça|descubra|oferecemos|apresentamos|explore)\b/i.test(b.text.trim())||/[:—–]/.test(b.text));
          const seenCardTitles=new Set<string>();
          const uniqueVisualCards=visualCards.filter(item=>{const title=cardText(item).name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ");if(!title)return true;if(seenCardTitles.has(title))return false;seenCardTitles.add(title);return true;});
          const sectionHasPhotos=uniqueImages.length>0&&visualCards.length>0;
          const isTreatments=/tratament|servi[cç]os|procediment/i.test(id);
          const isDifferentials=/diferencia|por.que|vantagen|escolher|escolha|excel[eê]ncia|compromisso|jornada|valores|filosofia|hist[oó]ria|ess[eê]ncia/i.test(id+" "+heading.map(b=>b.text).join(" "));
          const editorialCards=uniqueVisualCards.filter(item=>{const card=cardText(item);return card.description.length>8;});
          const editorialTitle=(item:Block,i:number)=>{const card=cardText(item);return card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(isDifferentials?["Atenção aos detalhes","Experiência acolhedora","Cuidado em cada etapa","Compromisso com você","Um espaço para você"][i%5]:["Cuidado personalizado","Conheça nossos serviços","Sua experiência","Nosso atendimento"][i%4]);};
          const useEditorialGrid=visualLayout==="grid"&&(isTreatments||isDifferentials)&&editorialCards.length>=2;
          const treatmentHasCompletePhotos=uniqueImages.length>=editorialCards.slice(0,6).length;
          const useTextOnlyTreatments=isTreatments&&!treatmentHasCompletePhotos;
          const headingNode=<div className="mb-9 max-w-3xl space-y-3">{heading.map(b=>isGallery&&b.type==="heading"&&/resultados/i.test(b.text)?render({...b,text:b.text.replace(/resultados/gi,"Imagens")}):render(b))}</div>;
          const imageNode=(b:Block,i:number)=><div key={b.id} className={i===0?"overflow-hidden rounded-[1.75rem]":"overflow-hidden rounded-2xl"}>{b.src?render(b):<div data-block-id={b.id} className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-[#c5cbbf] bg-[#f1f1e9] text-center text-sm text-[#52615a]">{b.text||"Adicionar imagem"}</div>}</div>;
          return <section id={isContact?"contato":group.id} key={group.id+"-"+index} data-section-id={group.id} style={{backgroundColor:sectionBackground}} className="overflow-hidden px-5 py-16 sm:px-8 md:px-14 md:py-24">
            <div className="mx-auto max-w-6xl">
              {isGallery?<>{headingNode}<div className="grid grid-cols-2 gap-3 md:hidden">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className={i===0?"col-span-2":""}>{imageNode(b,i)}</div>)}</div><div className="hidden md:block md:space-y-12">{sectionImages.slice(0,6).map((b,i)=><div key={b.id} className="grid items-center gap-10 md:grid-cols-2"><div className={i%2===1?"md:order-2":""}>{imageNode(b,i)}</div><div className={i%2===1?"md:order-1":""}><h3 className="mb-4 text-2xl font-semibold text-[#24332e]">{textItems[i]?cardText(textItems[i]).name||"Nossa atuação":"Nossa atuação"}</h3><p className="text-lg leading-relaxed text-[#52615a]">{textItems[i]?cardText(textItems[i]).description:"Conheça mais sobre nosso trabalho e nossa abordagem."}</p></div></div>)}</div></>:
              (visualLayout==="faq"||/faq|perguntas.frequentes/i.test(id))?<>{headingNode}<div className="mx-auto max-w-3xl space-y-3">{textItems.map(b=>{const at=b.text.indexOf("?");return <details key={b.id} className="group rounded-xl border border-[#e9e4da] bg-white px-5 py-4 text-[#24332e]"><summary className="cursor-pointer list-none font-semibold leading-snug">{at>=0?b.text.slice(0,at+1):b.text}<span className="float-right ml-3 text-lg">+</span></summary>{at>=0&&b.text.slice(at+1).trim()&&<p className="mt-3 border-t border-[#eee9e0] pt-3 text-sm leading-relaxed">{b.text.slice(at+1).trim()}</p>}</details>})}</div></>:
              (visualLayout==="hero"||visualLayout==="split")&&!isPrinciples?<div className={sectionImages.length?"grid items-center gap-8 md:grid-cols-2 md:gap-14":"mx-auto max-w-3xl"}>
                <div className="space-y-5">{blocks.filter(b=>b.type==="heading"||b.type==="button"||(b.type==="paragraph"&&textItems.slice(0,3).some(item=>item.id===b.id))).map(render)}</div>
                {sectionImages.length>0&&<div className="relative">{sectionImages.slice(0,1).map(imageNode)}</div>}
              </div>:
              useEditorialGrid?<div className="space-y-8 md:space-y-12">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">{headingNode}<p className="max-w-sm text-sm leading-relaxed opacity-65">{isTreatments?"Explore os serviços e descubra como podemos ajudar em seu projeto.":"Conheça os aspectos que orientam nossa proposta de trabalho."}</p></div>
                {isTreatments&&!useTextOnlyTreatments?<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{editorialCards.slice(0,6).map((item,i)=>{const card=cardText(item);const photo=uniqueImages[i];return <article key={item.id} data-block-id={item.id} className={`group relative overflow-hidden rounded-[1.75rem] bg-[#eee9df] shadow-[0_18px_48px_rgba(18,28,24,.10)] transition-transform duration-500 hover:-translate-y-2 ${i%3===1?"lg:translate-y-8":""}`}>{photo?<div className="aspect-[4/5] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105">{render(photo)}</div>:<div className="flex aspect-[4/3] items-end bg-gradient-to-br from-[#dcd7c9] via-[#f0ede6] to-[#c6c5b6] p-7"><span className="font-serif text-6xl text-[#5a6851]/35">{String(i+1).padStart(2,"0")}</span></div>}<div className="space-y-3 p-6 md:p-8"><span className="text-[10px] font-semibold uppercase tracking-[.25em] text-[#718066]">Tratamento {String(i+1).padStart(2,"0")}</span><h3 className="font-serif text-[clamp(1.5rem,2vw,2rem)] leading-tight text-[#24332e]">{editorialTitle(item,i)}</h3><p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>:<div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-20">{!useTextOnlyTreatments&&uniqueImages[0]&&<div className="relative overflow-hidden rounded-[2rem] shadow-[22px_24px_0_-8px_rgba(113,128,102,.15)] [&_img]:aspect-[4/5] [&_img]:w-full [&_img]:object-cover">{render(uniqueImages[0])}</div>}<div className="divide-y divide-[#8a907e]/25">{editorialCards.slice(0,isTreatments?6:5).map((item,i)=>{const card=cardText(item);return <div key={item.id} data-block-id={item.id} className="grid grid-cols-[2.5rem_1fr] gap-4 py-6 first:pt-0"><span className="pt-1 text-xs font-semibold tracking-widest text-[#778567]">{String(i+1).padStart(2,"0")}</span><div><h3 className="font-serif text-[clamp(1.4rem,2vw,2rem)] leading-snug text-[#24332e]">{editorialTitle(item,i)}</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></div>})}</div></div>}
                {buttons.length>0&&<div className="flex flex-wrap gap-3">{buttons.map(render)}</div>}
              </div>:
              (visualLayout==="grid"||isProcess||isPrinciples)&&!isContact?<>{headingNode}<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{uniqueVisualCards.map((item,i)=>{const card=cardText(item);const photo=isPrinciples?undefined:isProcess?processPhotos[i%Math.max(1,processPhotos.length)]:sectionHasPhotos?uniqueImages[i]:undefined;return <article key={item.id} className={`group overflow-hidden border border-[#e7e4dd] bg-white shadow-[0_8px_30px_rgba(20,35,29,0.045)] transition duration-300 hover:-translate-y-1 hover:shadow-lg ${isProcess?"rounded-lg border-l-4 border-l-[#9c947b]":"rounded-2xl"}`}>{photo&&<div className="aspect-[16/10] overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:rounded-none [&_img]:object-cover">{render(photo)}</div>}<div className="p-5 md:p-7">{isProcess&&!/^\s*\d{1,2}\s*$/.test(card.name)&&<span className="mb-4 inline-flex rounded-lg bg-[#f5f0e4] px-3 py-2 text-xs font-semibold text-[#92773b]">{String(i+1).padStart(2,"0")}</span>}<h3 data-block-id={item.id} style={{color:/^#[0-9a-fA-F]{6}$/.test(item.color||"")?item.color:"#24332e"}} className="mb-2 text-lg font-bold leading-snug">{card.name&&!/^destaque\s*\d+$/i.test(card.name)?card.name:(card.description.split(/[,.]/)[0].trim().split(" ").slice(0,5).join(" ")||"Nossa proposta")}</h3><p className="text-sm leading-relaxed text-[#4d5652]">{card.description}</p></div></article>})}</div>{buttons.length>0&&<div className="mt-7 flex flex-wrap gap-3">{buttons.map(render)}</div>}</>:
              isContact||visualLayout==="banner"?<div className="mx-auto max-w-3xl space-y-5 text-center [&_h2]:mx-auto [&_h2]:text-center [&_p]:mx-auto [&_p]:text-center">{heading.map(render)}{textItems.filter(b=>!/\b(?:xx|xxx|rua principal|contato@clinic)/i.test(b.text)).slice(0,2).map(b=>isContact?render({...b,text:b.text.replace(/Use o formulário abaixo[^.]*\.?/gi,"Envie sua mensagem pelos canais de atendimento disponíveis.").replace(/formulário abaixo/gi,"canal de atendimento")}):render(b))}{buttons.map(render)}{isContact&&<form onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const subject=encodeURIComponent("Contato pelo site "+site.title);const body=encodeURIComponent("Nome: "+data.get("name")+"\nE-mail: "+data.get("email")+"\nMensagem: "+data.get("message"));if(site.footer?.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.footer.email)){window.location.href="mailto:"+site.footer.email+"?subject="+subject+"&body="+body;}else{window.location.href="mailto:?subject="+subject+"&body="+body;}}} className="mx-auto mt-8 grid max-w-xl gap-4 rounded-2xl border border-[#e2dfd5] bg-white p-5 text-left shadow-sm sm:p-8"><p className="text-sm text-[#46534b]">Preencha os dados para preparar sua mensagem no aplicativo de e-mail. Configure o e-mail de destino para receber contatos diretamente.</p><label className="grid gap-2 text-sm font-medium text-[#24332e]">Nome<input name="name" required maxLength={100} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">E-mail<input name="email" type="email" required maxLength={160} className="min-h-12 rounded-lg border border-[#d9ddd5] px-4 text-[#24332e]"/></label><label className="grid gap-2 text-sm font-medium text-[#24332e]">Mensagem<textarea name="message" required maxLength={3000} rows={4} className="rounded-lg border border-[#d9ddd5] px-4 py-3 text-[#24332e]"/></label><button type="submit" className="min-h-12 rounded-xl bg-[#243e32] px-6 font-semibold text-white">Preparar mensagem</button></form>}</div>:
              <div className={sectionImages.length?"grid items-center gap-8 md:grid-cols-2 md:gap-14":"mx-auto max-w-3xl space-y-5"}><div className="space-y-5">{heading.map(render)}{textItems.slice(0,3).map(render)}{buttons.map(render)}</div>{sectionImages.slice(0,1).map(imageNode)}</div>}
            </div>
          </section>;
        })}{site.blocks.length>0&&<footer className="bg-[#102a22] px-6 py-12 text-[#f7f5ed] md:px-14 md:py-16"><div className="mx-auto grid max-w-6xl gap-10 border-b border-white/15 pb-12 md:grid-cols-[1.5fr_1fr_1fr]"><div><div className="mb-5 h-1 w-12 rounded-full bg-[#d4c19b]"/><p className="max-w-sm text-2xl font-bold leading-tight tracking-tight">{site.title.split(/\s+[–—-]\s+/)[0].trim()}</p><p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{/advoca|jur[ií]dic|direito/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Atuação jurídica com clareza e responsabilidade.":/arquitet|interior|atelier/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Arquitetura e interiores pensados para cada espaço.":/cl[ií]nica|sa[uú]de|est[eé]tica/i.test(site.title+" "+site.blocks.map(b=>b.text).slice(0,10).join(" "))?"Informações e atendimento em um só lugar.":"Conheça nossos serviços e entre em contato."}</p></div><nav aria-label="Menu do rodapé"><h3 className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#d4c19b]">Explore</h3><div className="flex flex-col gap-3">{sections.filter(g=>!/rodape|footer|faq/i.test(g.id)).slice(0,6).map((g,i)=><a key={g.id} className="w-fit max-w-full break-words text-sm leading-relaxed text-white/70 transition hover:text-white" href={/contato|agend|fale.conosco/i.test(g.id)?"#contato":"#"+g.id}>{i===0?"Início":/tratament|serviç|produto/i.test(g.id)?"Serviços":/hist[oó]ria|sobre|cl[ií]nica|ess[eê]ncia/i.test(g.id)?"Sobre nós":/diferenc|escolh/i.test(g.id)?"Diferenciais":/galeria|ambiente|resultad/i.test(g.id)?"Galeria":/contato|agend/i.test(g.id)?"Contato":publicHeading(g.blocks.find(b=>b.type==="heading")?.text||g.id,g.id).replace(/:.*/,"")}</a>)}</div></nav><div>{(site.footer?.cnpj||site.footer?.address||site.footer?.instagram||site.footer?.facebook||site.footer?.youtube||site.footer?.whatsapp)&&<h3 className="mb-5 text-xs font-bold uppercase tracking-[.18em] text-[#d4c19b]">Conecte-se</h3>}<div className="space-y-4 text-sm text-white/70">{site.footer?.cnpj&&<p><span className="mr-2 text-[#d4c19b]">▣</span>CNPJ: {site.footer.cnpj}</p>}{site.footer?.address&&<p><span className="mr-2 text-[#d4c19b]">⌖</span>{site.footer.address}</p>}<div className="flex flex-wrap gap-2">{([["Instagram",site.footer?.instagram],["Facebook",site.footer?.facebook],["YouTube",site.footer?.youtube],["WhatsApp",site.footer?.whatsapp]] as const).filter(entry=>!!entry[1]&&entry[1].startsWith("https://")).map(([label,url])=><a key={label} aria-label={label} href={url||"#"} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-xs font-bold text-white transition hover:border-[#d4c19b] hover:bg-white/10">{label==="Instagram"?"◎":label==="Facebook"?"f":label==="YouTube"?"▶":"✆"}</a>)}</div></div></div></div><div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-between gap-3 text-xs text-white/45"><span>© {new Date().getFullYear()} {site.title.split(/\s+[–—-]\s+/)[0].trim()}. Todos os direitos reservados.</span><span>Criado com PageNova AI</span></div></footer>}</div></section>
      </div>
    </div>
  </main>;
}
