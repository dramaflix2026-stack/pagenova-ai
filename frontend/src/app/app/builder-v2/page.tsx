"use client";

import { useEffect, useState } from "react";
import { applySiteMotionInstruction, hasMotionIntent, type SiteMotion } from "@/lib/site-builder-animation";
import { BuilderV2Site } from "@/components/builder-v2-site";
import "./motion.css";
import nichePhotoCatalog from "@/lib/niche-photo-catalog.json";
const nichePhotoBase="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";

type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; mobileSrc?: string; section?: string; fontSize?: number; radius?: number; spacing?: number; href?: string; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
type MenuItem = {id:string;name:string;description:string;price:number;category:string;image?:string};
type RestaurantData = {whatsapp:string;menu:MenuItem[]};
type Site = { kind?:SiteCategory; restaurant?:RestaurantData; templateId?: "institutional-complete" | "minimalist-sophisticated" | "modern-impactful"; title: string; background: string; blocks: Block[]; id?: string; niche?: string; publishedUrl?: string; motion?: SiteMotion; footer?: { cnpj?: string; address?: string; email?: string; instagram?: string; facebook?: string; youtube?: string; whatsapp?: string; showMenu?: boolean } };
type SiteCategory = "institutional" | "restaurant" | "store" | "real-estate" | "catalog" | "landing";
const siteCategories: {id:SiteCategory;title:string;description:string;features:string;ready:boolean;symbol:string}[] = [
  {id:"institutional",title:"Site Institucional",description:"Empresas, clínicas, advocacia e serviços.",features:"Serviços, equipe, galeria, depoimentos e contato",ready:true,symbol:"▦"},
  {id:"restaurant",title:"Restaurante e Delivery",description:"Pizzarias, restaurantes, cafés e lanchonetes.",features:"Cardápio, categorias, preços e pedidos por WhatsApp",ready:true,symbol:"◈"},
  {id:"store",title:"Loja Virtual",description:"Moda, acessórios e comércio eletrônico.",features:"Produtos, variantes, carrinho e checkout",ready:false,symbol:"▣"},
  {id:"real-estate",title:"Imobiliária",description:"Imóveis para compra, venda ou locação.",features:"Imóveis, filtros, detalhes e contato",ready:false,symbol:"⌂"},
  {id:"catalog",title:"Catálogo de Produtos",description:"Veículos, equipamentos e portfólios comerciais.",features:"Itens, filtros, fichas e orçamentos",ready:false,symbol:"▤"},
  {id:"landing",title:"Landing Page",description:"Campanhas, captação de leads e ofertas.",features:"Oferta, formulário, provas sociais e CTA",ready:false,symbol:"◎"}
];
type ChatMessage = { role: "user" | "assistant"; text: string };
type SavedVersion = { id: string; at: string; label: string; site: Site };
const initial: Site = { title: "Novo projeto", background: "#ffffff", blocks: [], motion: {preset:"professional"} };
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
  const [siteCategory,setSiteCategory] = useState<SiteCategory>("institutional");
  const [categoryScreen,setCategoryScreen] = useState(true);
  const [categoryQuery,setCategoryQuery] = useState("");
  const [menuCategory,setMenuCategory]=useState("Pizzas");
  const [menuName,setMenuName]=useState("");
  const [menuDescription,setMenuDescription]=useState("");
  const [menuPrice,setMenuPrice]=useState("");
  const [publishing,setPublishing] = useState(false);
  const [publishError,setPublishError] = useState("");
  const [publishNotice,setPublishNotice] = useState("");
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

  useEffect(() => { try { const saved = localStorage.getItem(storageKey); if (saved) { const parsed=JSON.parse(saved) as Site; setSite(parsed); if(parsed.kind) setSiteCategory(parsed.kind); if(parsed.blocks?.length||parsed.restaurant?.menu?.length) setCategoryScreen(false); } const savedVersions = localStorage.getItem(storageKey + ":versions"); if (savedVersions) { const parsed: unknown = JSON.parse(savedVersions); if (Array.isArray(parsed)) setVersions(parsed.filter((item): item is SavedVersion => !!item && typeof item === "object" && typeof item.id === "string" && !!item.site && Array.isArray(item.site.blocks)).slice(-25)); } } catch {} setLoaded(true); }, []);
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
    const galleryId=Array.from(new Set(current.blocks.map(b=>b.section||"principal"))).find(id=>/galeria|gallery|foto|portf[oó]lio/i.test(id)||current.blocks.some(b=>(b.section||"principal")===id&&b.type==="heading"&&/galeria|gallery|fotos|portf[oó]lio/i.test(b.text)));
    const slots=Array.from({length:6},(_,i)=>i>=3&&galleryId?galleryId:ids[i%Math.max(1,ids.length)]||"principal");
    const jobs=only===undefined?slots.map((section,index)=>({section,index})): [{section:slots[only]||"principal",index:only}];
    // Reuse the approved niche-specific image bank on initial generation. Never regenerate paid assets.
    const bank=(nichePhotoCatalog as Record<string,{desktop:string[];mobile:string[]}>)[selectedNiche];
    if(only===undefined && bank?.desktop?.length===6 && bank?.mobile?.length===6 && bank.desktop.every(Boolean) && bank.mobile.every(Boolean)){
      const blocks=[...current.blocks];
      for(const {section,index} of jobs){
        const id="visual-"+index;
        const visual:Block={id,type:"image",text:"Fotografia ilustrativa",color:"#ffffff",align:"center",section,src:nichePhotoBase+bank.desktop[index]+".png",mobileSrc:nichePhotoBase+bank.mobile[index]+".png"};
        const previous=blocks.findIndex(b=>b.id===id);
        if(previous>=0)blocks[previous]=visual;
        else {const position=blocks.findIndex(b=>(b.section||"principal")===section&&b.type==="heading");if(position>=0)blocks.splice(position+1,0,visual);}
      }
      setMessages(prev=>[...prev,{role:"assistant",text:"6 fotografias do banco do nicho "+selectedNiche+" aplicadas, com versões desktop e mobile. Nenhuma imagem nova foi gerada."}]);
      return {...current,blocks};
    }
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
    if(siteCategory==="restaurant") {
      const add=prompt.match(/(?:adicione|adicionar|inclua|coloque|cadastre)\s+(?:no card[aá]pio\s+)?(?:um[a]?\s+)?(.+?)\s+(?:por|a|pre[cç]o de)\s*R?\$?\s*(\d+(?:[.,]\d{1,2})?)/i);
      if(add){
        const name=add[1].trim();const price=Number(add[2].replace(",", "."));
        if(name&&Number.isFinite(price)&&price>0){
          setSite(prev=>({...prev,kind:"restaurant",restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:[...(prev.restaurant?.menu||[]),{id:crypto.randomUUID(),name,description:"",price,category:"Cardápio"}]}}));
          setMessages(prev=>[...prev,{role:"assistant",text:"Item adicionado ao cadastro de produtos."}]);setInstruction("");setBusy(false);return;
        }
      }
    }
    if (/(?:regener|troqu|substitu|nova imagem|nova foto|gere imagens|gerar imagens)/i.test(prompt) && /(?:imagem|foto)/i.test(prompt) && site.blocks.length) {
      try {
        const match=prompt.match(/(?:imagem|foto)\s*(?:n[uú]mero\s*)?(\d+)/i);
        const index=match?Math.max(0,Math.min(5,Number(match[1])-1)):undefined;
        const updated=await generateVisuals(site,prompt,index);
        const result=hasMotionIntent(prompt)?{...updated,motion:applySiteMotionInstruction(updated,prompt)}:updated;
        recordVersion(site, "Antes de alterar imagens");setRedoHistory([]);setHistory(prev=>[...prev.slice(-19),site]);setSite(result);setInstruction("");
      } catch(error) {setMessages(prev=>[...prev,{role:"assistant",text:error instanceof Error?error.message:"Falha ao gerar imagem."}]);}
      finally {setBusy(false);}
      return;
    }
    const templateCommand=/(?:tro(?:que|car|ca|que)|mude|usar|use|aplique|quero|escolha|alterar|mudar)[\\s\\S]{0,70}(?:template|modelo)[\\s\\S]{0,30}(?:\\b2\\b|\\b1\\b|minimalista|institucional)|(?:template|modelo)\\s*(?:2|1)|minimalista sofisticado|institucional completo|moderno e impactante|(?:template|modelo)\s*3/i.test(prompt);
    if(templateCommand){
      const requested=/minimalista|(?:template|modelo)\\s*2|(?:template|modelo)[\\s\\S]{0,25}\\b2\\b/i.test(prompt)?"minimalist-sophisticated":/impactante|moderno|(?:template|modelo)\s*3|(?:template|modelo)[\s\S]{0,25}\b3\b/i.test(prompt)?"modern-impactful":"institutional-complete";
      recordVersion(site,"Antes de trocar o template");setRedoHistory([]);setHistory(prev=>[...prev.slice(-19),site]);
      setSite(prev=>({...prev,templateId:requested}));setMessages(prev=>[...prev,{role:"assistant",text:requested==="minimalist-sophisticated"?"Template alterado para Minimalista Sofisticado. Todo o conteúdo foi preservado.":requested==="modern-impactful"?"Template alterado para Moderno e Impactante. Todo o conteúdo foi preservado.":"Template alterado para Institucional Completo. Todo o conteúdo foi preservado."}]);setInstruction("");setBusy(false);return;
    }
    const structuralRequest = /(?:adicione|crie|criar|incluir|inclua|nova|novo|remova|exclua|mova|coloque|reorganize)[\\s\\S]{0,90}(?:se[cç][aã]o|bloco|etapas|par[aá]grafo)|(?:se[cç][aã]o)[\\s\\S]{0,90}(?:adicione|crie|criar|incluir|inclua|nova|novo)/i.test(prompt);
    const direct = (structuralRequest || hasMotionIntent(prompt)) ? null : (applySingleButtonAlignment(site, prompt) || applyGlobalAlignment(site, prompt));
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
      if (!site.blocks.length) {incoming.id=site.id||crypto.randomUUID();incoming.niche=selectedNiche||undefined;}
      else {incoming.id=site.id;incoming.niche=site.niche||selectedNiche||undefined;incoming.publishedUrl=site.publishedUrl;}
      const normalized = prompt.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
      const requested = /centraliz|alinhe?.*centro|alinh.*centro/.test(normalized) ? "center" : /alinhe?.*esquerda|alinh.*esquerda/.test(normalized) ? "left" : /alinhe?.*direita|alinh.*direita/.test(normalized) ? "right" : null;
      if (requested && /todos|todas|tudo/.test(normalized) && /textos|titulos|descricoes|paragrafos|elementos/.test(normalized)) {
        const relevant = incoming.blocks.filter(b=>b.type!=="image");
        if (relevant.some(b=>b.align!==requested)) throw new Error("A IA não aplicou o alinhamento em todos os elementos. O projeto foi preservado.");
      }
      recordVersion(site, "Antes da edição com IA");setRedoHistory([]);setHistory(prev=>[...prev.slice(-19),site]);
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
  function newProject() { if (busy || publishing) return; recordVersion(site, "Antes de criar novo site");setHistory([]);setRedoHistory([]); setSite({...initial,id:crypto.randomUUID()});setPublishError("");setPublishNotice("");setSelectedNiche(""); setMessages([{role:"assistant",text:"Novo projeto iniciado. Descreva o site que deseja criar."}]); setInstruction(""); setReference(null); setGenerationError(""); }
  async function publishSite() {
    if(publishing||busy||site.blocks.length<4)return;
    const current:Site={...site,id:site.id||crypto.randomUUID(),niche:site.niche||selectedNiche||undefined};
    setPublishing(true);setPublishError("");setPublishNotice("");
    setSite(current);
    try{
      const response=await fetch("/api/builder-v2/publish",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({site:current})
      });
      const data=await response.json() as {url?:string;error?:string};
      if(!response.ok||!data.url)throw new Error(data.error||"Não foi possível publicar o site.");
      setSite(previous=>previous.id===current.id?{...previous,publishedUrl:data.url}:previous);
      setPublishNotice("Site publicado! Acesse o link público para conferir o resultado.");
    }catch(error){setPublishError(error instanceof Error?error.message:"Falha na publicação. Seu site foi preservado.");}
    finally{setPublishing(false);}
  }
    function undo() { if (!history.length || busy) return; recordVersion(site, "Antes de desfazer"); setRedoHistory(prev=>[...prev.slice(-19),site]);setSite(history[history.length-1]); setHistory(prev=>prev.slice(0,-1)); setMessages(prev=>[...prev,{role:"assistant",text:"Última alteração desfeita."}]); }
  function redo() { if (!redoHistory.length || busy) return; recordVersion(site, "Antes de refazer");setHistory(prev=>[...prev.slice(-19),site]);setSite(redoHistory[redoHistory.length-1]);setRedoHistory(prev=>prev.slice(0,-1));setMessages(prev=>[...prev,{role:"assistant",text:"Alteração refeita."}]); }
  function attachImage(file?: File) {
    if (!file) return;
    if (file.size > 2_000_000) { setMessages(prev => [...prev,{role:"assistant",text:"Use uma imagem de até 2 MB."}]); return; }
    const reader = new FileReader();
    reader.onload = () => setReference(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }
  if (!loaded) return <main className="min-h-screen bg-[#0b1110] p-8 text-white">Carregando PageNova V2...</main>;
  if(categoryScreen) return <main className="min-h-screen bg-[#0b1110] px-4 py-8 text-white sm:py-12"><div className="mx-auto max-w-6xl">
    <div className="mb-10"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-lime-300">PageNova AI · Builder V2 · Ambiente experimental</p><h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Que tipo de site vamos criar?</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">Escolha a finalidade do seu projeto. O chat com IA e o editor serão os mesmos; cada categoria terá os recursos próprios do seu negócio.</p></div>
    <div className="mb-6 flex flex-wrap items-center gap-3"><input aria-label="Buscar tipo de site" value={categoryQuery} onChange={e=>setCategoryQuery(e.target.value)} placeholder="Buscar por tipo ou nicho (ex.: pizzaria, advocacia)..." className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm outline-none focus:border-lime-300"/>{site.blocks.length>0&&<button type="button" onClick={()=>setCategoryScreen(false)} className="rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold hover:bg-white/10">Continuar projeto atual →</button>}</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{siteCategories.filter(item=>{const q=categoryQuery.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");const aliases:Record<SiteCategory,string>={institutional:"advocacia advogado clinica medico escritorio empresa",restaurant:"pizzaria pizza hamburgueria delivery comida cafe",store:"roupa moda ecommerce ecommerce loja", "real-estate":"imoveis imobiliaria casas apartamentos",catalog:"veiculos carros equipamentos",landing:"campanha lead oferta conversao"};return (item.title+" "+item.description+" "+item.features+" "+aliases[item.id]).toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").includes(q);}).map(item=><article key={item.id} className={"flex min-h-[245px] flex-col rounded-2xl border p-6 transition-colors "+(item.ready?"border-lime-300/45 bg-[#17241d]":"border-white/15 bg-white/[.035]")}><div className="mb-5 flex items-center justify-between"><span aria-hidden="true" className="text-3xl text-lime-300">{item.symbol}</span><span className={"rounded-full px-3 py-1 text-[11px] font-semibold "+(item.ready?"bg-lime-300 text-black":"bg-white/10 text-white/65")}>{item.ready?"Disponível":"Em preparação"}</span></div><h2 className="text-xl font-bold">{item.title}</h2><p className="mt-2 text-sm text-white/70">{item.description}</p><p className="mt-3 text-xs leading-relaxed text-white/45">{item.features}</p><div className="mt-auto pt-6"><button type="button" disabled={!item.ready} onClick={()=>{setSiteCategory(item.id);setSite(prev=>({...prev,kind:item.id,restaurant:item.id==="restaurant"?(prev.restaurant||{whatsapp:"",menu:[]}):prev.restaurant}));setCategoryScreen(false);}} className="w-full rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45">{item.ready?(item.id==="restaurant"?"Criar restaurante →":"Criar site institucional →"):"Módulo em desenvolvimento"}</button></div></article>)}</div>
    <p className="mt-8 text-xs text-white/45">Os módulos especializados serão liberados progressivamente. Não geraremos uma loja ou um cardápio usando um template institucional disfarçado.</p>
  </div></main>;
  return <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#0b1110] px-3 py-5 text-white sm:px-4 sm:py-8">
    <div className="mx-auto w-full min-w-0 max-w-6xl"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-white/55">Categoria: {siteCategories.find(item=>item.id===siteCategory)?.title||"Site Institucional"}</span><button type="button" onClick={()=>setCategoryScreen(true)} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">← Tipos de site</button></div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Ambiente experimental privado</p><h1 className="break-words text-2xl font-bold leading-tight sm:text-3xl">PageNova Builder 2.0</h1><p className="mt-2 text-sm text-white/60">Motor estruturado: escrever → gerar → modificar. Não altera seus projetos atuais.</p></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={()=>void publishSite()} disabled={publishing||busy||site.blocks.length<4} className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">{publishing?"Publicando...":site.publishedUrl?"Atualizar publicação":"Publicar site"}</button>{site.publishedUrl&&<a href={site.publishedUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-lime-300/60 px-4 py-2 text-sm font-bold text-lime-300">Abrir site publicado ↗</a>}{site.publishedUrl&&<button type="button" onClick={()=>void navigator.clipboard.writeText(site.publishedUrl||"")} className="rounded-xl border border-white/20 px-4 py-2 text-sm">Copiar URL</button>}<a href="/app/builder" className="rounded-xl border border-white/20 px-4 py-2 text-sm">Voltar ao editor atual</a></div></div>
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="flex min-w-0 min-h-[480px] flex-col rounded-2xl border border-white/15 bg-[#141d1a] p-3 sm:min-h-[580px] sm:p-4"><div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="w-full text-base font-semibold sm:w-auto sm:mr-auto">Chat com IA</h2><button type="button" onClick={newProject} disabled={busy} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300 disabled:opacity-40">+ Novo site</button><button type="button" onClick={undo} disabled={!history.length || busy} className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-40">↶ Desfazer</button><button type="button" onClick={redo} disabled={!redoHistory.length || busy} className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-40">↷ Refazer</button><button type="button" onClick={()=>setShowVersions(v=>!v)} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300">Histórico ({versions.length + cloudVersions.length})</button><button type="button" onClick={saveNamedVersion} disabled={!site.blocks.length || busy} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300 disabled:opacity-40">Salvar versão nomeada</button></div><p className="mb-2 text-xs text-white/60" role="status">{cloudStatus}</p>{storageError && <p role="alert" className="mb-3 rounded-lg border border-amber-400/50 p-2 text-xs text-amber-200">{storageError}</p>}{showVersions && <div className="mb-3 max-h-64 overflow-y-auto rounded-xl border border-white/20 p-3"><p className="mb-2 text-xs text-white/70">Versões locais e na nuvem. Salve uma versão nomeada antes de aprovar alterações.</p>{(versions.length + cloudVersions.length)===0 ? <p className="text-xs text-white/60">Nenhuma versão anterior ainda.</p> : [...cloudVersions, ...[...versions].reverse()].map(version=><div key={version.id} className="mb-2 flex items-center justify-between gap-2 border-b border-white/10 pb-2"><div className="min-w-0"><p className="text-xs">{version.label}</p><p className="text-[11px] text-white/60">{new Date(version.at).toLocaleString("pt-BR")}</p></div><button type="button" disabled={busy} onClick={()=>restoreVersion(version)} className="rounded-md border border-lime-300/50 px-2 py-1 text-xs text-lime-300 disabled:opacity-40">Restaurar</button></div>)}</div>}<div aria-live="polite" className="mb-4 flex-1 space-y-3 overflow-y-auto">{messages.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-7 bg-lime-300 text-black" : "mr-7 bg-white/10"}`}>{m.text}</div>)}</div><div className="mb-3 rounded-xl border border-white/20 bg-white/5 p-3"><button type="button" aria-expanded={nicheMenuOpen} onClick={()=>setNicheMenuOpen(open=>!open)} className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-white"><span>▦ Escolher nicho {selectedNiche ? "· "+selectedNiche : ""}</span><span aria-hidden="true">{nicheMenuOpen ? "▲" : "▼"}</span></button>{nicheMenuOpen&&<div className="mt-3 space-y-2"><input aria-label="Pesquisar nichos" value={nicheQuery} onChange={e=>setNicheQuery(e.target.value)} placeholder="Pesquisar profissão ou negócio..." className="w-full rounded-lg border border-white/20 bg-black/30 p-2 text-sm text-white outline-none focus:border-lime-300"/><select aria-label="Categoria do nicho" value={nicheGroup} onChange={e=>setNicheGroup(e.target.value)} className="w-full rounded-lg border border-white/20 bg-[#18251d] p-2 text-sm text-white"><option>Todos</option>{Object.keys(nicheGroups).map(group=><option key={group}>{group}</option>)}</select><div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">{nicheNames.filter(n=>(nicheGroup==="Todos"||nicheGroups[nicheGroup]?.includes(n))&&n.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").includes(nicheQuery.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,""))).map(n=><button type="button" key={n} onClick={()=>chooseNiche(n)} className="rounded-lg border border-white/10 p-2 text-left text-xs text-white/90 hover:border-lime-300 hover:bg-white/10">{n}</button>)}</div><p className="text-xs text-white/50">Selecionar apenas preenche o chat. Você pode editar o texto antes de enviar.</p></div>}</div><form onSubmit={e=>{e.preventDefault();void send();}} className="space-y-3"><textarea aria-label="Descreva a criação ou alteração" value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder="Crie um site para uma clínica odontológica... ou Centralize todos os textos e o botão..." rows={4} className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-white outline-none focus:border-lime-300"/><label className="block cursor-pointer rounded-xl border border-white/20 p-3 text-center text-sm">📎 Anexar imagem de referência<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>attachImage(e.target.files?.[0])}/></label>{reference && <p className="text-xs text-lime-300">Imagem anexada à conversa</p>}<button type="submit" disabled={busy} className="w-full rounded-xl bg-lime-300 p-3 font-bold text-black disabled:opacity-60">{busy ? "IA trabalhando..." : "Enviar e aplicar →"}</button></form>{generationError && <p role="alert" className="mt-3 rounded-lg border border-red-400 bg-red-950/60 p-3 text-sm text-red-100">Erro na geração: {generationError}</p>}<p className="mt-3 text-xs text-white/50">A IA recebe o site atual e suas instruções. Revise o resultado na prévia e salve uma versão antes de publicar.</p></section>
        <div className="min-w-0"><div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/20 bg-[#141d1a] p-4 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Modelo visual do site</p><p className="mt-1 text-xs text-white/60">Troque o design sem perder textos, imagens ou seções.</p></div><select aria-label="Escolher template visual" value={site.templateId||"institutional-complete"} onChange={e=>{const templateId=e.target.value as "institutional-complete"|"minimalist-sophisticated"|"modern-impactful";recordVersion(site,"Antes de trocar o template");setSite(prev=>({...prev,templateId}));}} className="w-full rounded-lg border border-white/25 bg-[#1b2b23] px-3 py-3 text-sm text-white sm:w-auto"><option value="institutional-complete">01 — Institucional Completo</option><option value="minimalist-sophisticated">02 — Minimalista Sofisticado</option><option value="modern-impactful">03 — Moderno e Impactante</option></select></div>{siteCategory==="restaurant"&&<section className="mb-5 rounded-2xl border border-white/20 bg-[#141d1a] p-5 text-white"><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Restaurante · Cadastro de produtos</p><h2 className="mt-2 text-2xl font-bold">Cadastre seu cardápio</h2><p className="mt-2 text-sm text-white/60">Informe apenas o item e o valor. O template visual será definido separadamente.</p><div className="mt-5 grid grid-cols-[minmax(0,1fr)_110px_36px] gap-2 text-xs font-semibold text-white/70"><span>Item</span><span>Valor (R$)</span><span/></div><div className="mt-2 space-y-2">{(site.restaurant?.menu||[]).map((item,index)=><div key={item.id} className="grid grid-cols-[minmax(0,1fr)_110px_36px] gap-2"><input aria-label={`Item ${index+1}`} value={item.name} placeholder="Ex.: Pizza Calabresa" onChange={e=>setSite(prev=>({...prev,restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:(prev.restaurant?.menu||[]).map(x=>x.id===item.id?{...x,name:e.target.value}:x)}}))} className="min-w-0 rounded-lg border border-white/20 bg-black/30 p-3 text-sm"/><input aria-label={`Preço do item ${index+1}`} inputMode="decimal" value={Number.isFinite(item.price)?String(item.price).replace(".",","):""} onChange={e=>{const value=e.target.value.replace(",",".");if(value&&!/^\\d*(?:\\.\\d{0,2})?$/.test(value))return;setSite(prev=>({...prev,restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:(prev.restaurant?.menu||[]).map(x=>x.id===item.id?{...x,price:value===""?0:Number(value)}:x)}}));}} className="min-w-0 rounded-lg border border-white/20 bg-black/30 p-3 text-sm"/><button type="button" aria-label={`Remover ${item.name||"item"}`} onClick={()=>setSite(prev=>({...prev,restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:(prev.restaurant?.menu||[]).filter(x=>x.id!==item.id)}}))} className="rounded-lg border border-white/20 text-red-300">×</button></div>)}</div><button type="button" onClick={()=>setSite(prev=>({...prev,kind:"restaurant",restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:[...(prev.restaurant?.menu||[]),{id:crypto.randomUUID(),name:"",description:"",category:"Cardápio",price:0}]}}))} className="mt-3 w-full rounded-xl border border-dashed border-lime-300/60 px-4 py-3 text-sm font-semibold text-lime-300 hover:bg-lime-300/10">+ Adicionar outro item</button><details className="mt-5 rounded-xl border border-white/15 p-4"><summary className="cursor-pointer text-sm font-semibold">Colar vários itens de uma vez</summary><p className="mt-2 text-xs text-white/60">Uma linha por produto: Pizza Calabresa - 49,90</p><textarea id="restaurant-bulk-menu" rows={5} placeholder={"Pizza Calabresa - 49,90\\nPizza Portuguesa - 54,90\\nRefrigerante 2L - 12,00"} className="mt-3 w-full rounded-lg border border-white/20 bg-black/30 p-3 text-sm"/><button type="button" onClick={()=>{const textarea=document.getElementById("restaurant-bulk-menu") as HTMLTextAreaElement|null;const lines=(textarea?.value||"").split(/\\r?\\n/);const entries=lines.map(line=>line.match(/^\\s*(.+?)\\s*[-–—;:]\\s*(?:R\\$\\s*)?(\\d+(?:[.,]\\d{1,2})?)\\s*$/)).filter((match):match is RegExpMatchArray=>Boolean(match)).map(match=>({id:crypto.randomUUID(),name:match[1].trim(),description:"",category:"Cardápio",price:Number(match[2].replace(",","."))})).filter(item=>item.name&&Number.isFinite(item.price)&&item.price>0);if(!entries.length){setGenerationError("Nenhum item válido encontrado. Use: Nome do item - 49,90");return;}setSite(prev=>({...prev,kind:"restaurant",restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:[...(prev.restaurant?.menu||[]),...entries]}}));if(textarea)textarea.value="";setGenerationError("");}} className="mt-2 rounded-lg bg-lime-300 px-4 py-2 text-sm font-bold text-black">Importar itens válidos</button></details><p className="mt-4 text-xs text-white/50">{(site.restaurant?.menu||[]).length} itens cadastrados. Dados e apresentação visual permanecem independentes.</p></section>}<BuilderV2Site site={site} templateId={site.templateId||"institutional-complete"} selectedNiche={selectedNiche||site.niche||""} />{(site.publishedUrl||publishError||publishNotice)&&<div className="mt-3 rounded-xl border border-white/20 bg-[#141d1a] p-4 text-sm text-white">{publishError&&<p role="alert" className="text-red-300">{publishError}</p>}{publishNotice&&<p role="status" className="text-lime-300">{publishNotice}</p>}{site.publishedUrl&&<div className="mt-2 flex flex-wrap items-center gap-2"><a href={site.publishedUrl} target="_blank" rel="noopener noreferrer" className="break-all text-lime-300 underline">Ver site publicado ↗</a><button type="button" onClick={()=>navigator.clipboard.writeText(site.publishedUrl||"")} className="rounded-lg border border-white/25 px-3 py-1 text-xs">Copiar link</button></div>}</div>}</div>
      </div>
    </div>
  </main>;
}
