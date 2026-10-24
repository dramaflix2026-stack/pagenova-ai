"use client";

import { useEffect, useState } from "react";
import { applySiteMotionInstruction, hasMotionIntent, type SiteMotion } from "@/lib/site-builder-animation";
import { BuilderV2Site } from "@/components/builder-v2-site";
import { BuilderV2PreviewFrame, type BuilderPreviewDevice } from "@/components/builder-v2-preview-frame";
import "./motion.css";
import nichePhotoCatalog from "@/lib/niche-photo-catalog.json";
const nichePhotoBase="https://kgbgwbodosglmonvrhyi.supabase.co/storage/v1/object/public/site-images/3a405182-e509-4c1b-ab4b-d16a21049f18/builder-v2/";

type Block = { id: string; type: "heading" | "paragraph" | "button" | "image"; text: string; color: string; align: "left" | "center" | "right"; src?: string; mobileSrc?: string; section?: string; fontSize?: number; radius?: number; spacing?: number; href?: string; layout?: "hero" | "grid" | "split" | "banner" | "faq" | "gallery" | "standard"; background?: string; columns?: number };
type MenuItem = {id:string;name:string;description:string;price:number;category:string;image?:string};
type RestaurantData = {whatsapp:string;menu:MenuItem[]};
type Site = { kind?:SiteCategory; restaurant?:RestaurantData; templateId?: "institutional-complete" | "minimalist-sophisticated" | "modern-impactful" | "image-text-alternating"; title: string; background: string; blocks: Block[]; id?: string; niche?: string; publishedUrl?: string; heroPresentation?: "immersive" | "split"; processImageCard?: boolean; processImageCardTitle?: string; processImageCardDescription?: string; motion?: SiteMotion; footer?: { cnpj?: string; address?: string; email?: string; instagram?: string; facebook?: string; youtube?: string; whatsapp?: string; showMenu?: boolean } };
type SiteCategory = "institutional" | "restaurant" | "real-estate" | "catalog";
const restaurantSegments = [
  {id:"pizzaria",name:"Pizzaria",description:"Pizzas, bordas, tamanhos e combos"},
  {id:"hamburgueria",name:"Hamburgueria",description:"Hambúrgueres, adicionais e acompanhamentos"},
  {id:"restaurante",name:"Restaurante",description:"Pratos, entradas, bebidas e sobremesas"},
  {id:"cafeteria",name:"Cafeteria e Padaria",description:"Cafés, salgados, doces e lanches"},
  {id:"acai",name:"Açaí e Sorveteria",description:"Açaí, sorvetes, tamanhos e complementos"},
  {id:"marmitaria",name:"Marmitaria",description:"Marmitas, pratos do dia e delivery"},
  {id:"outros",name:"Outro tipo de delivery",description:"Personalize seu cardápio pelo chat"}
] as const;
const siteCategories: {id:SiteCategory;title:string;description:string;features:string;ready:boolean;symbol:string}[] = [
  {id:"institutional",title:"Site Institucional",description:"Empresas, clínicas, advocacia e serviços.",features:"Serviços, equipe, galeria, depoimentos e contato",ready:true,symbol:"▦"},
  {id:"restaurant",title:"Restaurante e Delivery",description:"Pizzarias, restaurantes, cafés e lanchonetes.",features:"Cardápio, categorias, preços e pedidos por WhatsApp",ready:true,symbol:"◈"},
  {id:"real-estate",title:"Imobiliária",description:"Imóveis para compra, venda ou locação.",features:"Imóveis, filtros, detalhes e contato",ready:true,symbol:"⌂"},
  {id:"catalog",title:"Catálogo de Produtos",description:"Veículos, equipamentos e portfólios comerciais.",features:"Itens, filtros, fichas e orçamentos",ready:false,symbol:"▤"},
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
function RealEstateTemplate({properties,whatsapp}:{properties:{id:string;title:string;location:string;price:number;type:string;image:string}[];whatsapp:string}) {
 const [filter,setFilter]=useState("Todos");
 const visible=filter==="Todos"?properties:properties.filter(p=>p.type===filter);
 const number=whatsapp.replace(/\\D/g,"");
 return <section className="pn-real-estate-preview overflow-hidden rounded-[26px] bg-[#f5f5f0] text-[#1c302c]">
  <header className="flex items-center justify-between bg-[#153a34] px-6 py-5 text-white sm:px-10"><strong className="text-xl font-black tracking-tight">HORIZONTE<span className="text-[#d5b87a]">.</span> IMÓVEIS</strong><a href="#imoveis-v2" className="text-sm font-bold">Explorar imóveis ↓</a></header>
  <div className="grid gap-8 bg-[#153a34] px-6 py-14 text-white sm:px-10 lg:grid-cols-2 lg:items-center lg:py-20"><div><p className="text-xs font-bold uppercase tracking-[.24em] text-[#d5b87a]">Seu próximo capítulo começa aqui</p><h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">O lugar certo para viver novas histórias.</h2><p className="mt-5 max-w-lg text-base text-white/75">Encontre imóveis para comprar ou alugar com praticidade e atendimento personalizado.</p><a href="#imoveis-v2" className="mt-8 inline-flex rounded-full bg-[#d5b87a] px-7 py-4 font-bold text-[#17312b]">Encontrar meu imóvel →</a></div><img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=85" alt="Fachada de residência contemporânea" className="h-72 w-full rounded-3xl object-cover sm:h-[430px]" loading="lazy"/></div>
  <div id="imoveis-v2" className="px-6 py-12 sm:px-10"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#668076]">Seleção especial</p><h3 className="mt-3 text-4xl font-black">Encontre seu imóvel</h3><div className="mt-6 flex flex-wrap gap-2">{["Todos","Venda","Aluguel"].map(t=><button key={t} type="button" onClick={()=>setFilter(t)} className={`rounded-full px-5 py-3 text-sm font-bold ${filter===t?"bg-[#153a34] text-white":"border border-[#cbd5cf] bg-white"}`}>{t}</button>)}</div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map(p=><article key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm"><img src={p.image||"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"} alt={p.title} className="h-52 w-full object-cover" loading="lazy"/><div className="p-5"><span className="rounded-full bg-[#e7eee9] px-3 py-1 text-xs font-bold">{p.type}</span><h4 className="mt-4 text-xl font-black">{p.title}</h4><p className="mt-2 text-sm text-[#62746a]">{p.location}</p><p className="mt-4 text-2xl font-black">{p.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}{p.type==="Aluguel"&&<span className="text-sm font-normal">/mês</span>}</p>{number&&<a href={`https://wa.me/${number}?text=${encodeURIComponent("Olá! Tenho interesse no imóvel: "+p.title)}`} target="_blank" rel="noopener noreferrer" className="mt-5 block rounded-xl bg-[#153a34] px-4 py-3 text-center text-sm font-bold text-white">Tenho interesse ↗</a>}</div></article>)}</div>{visible.length===0&&<p className="mt-8 rounded-2xl bg-white p-8 text-center">Nenhum imóvel nesta categoria. Cadastre um imóvel no painel.</p>}</div><footer className="bg-[#153a34] px-6 py-12 text-center text-white"><h3 className="text-3xl font-black">Vamos encontrar seu próximo endereço?</h3><p className="mt-3 text-white/70">Fale com nossa equipe e descubra as melhores oportunidades.</p>{number&&<a href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-full bg-[#d5b87a] px-7 py-3 font-bold text-[#153a34]">Conversar no WhatsApp ↗</a>}</footer>
 </section>;
}
function RestaurantSegmentTemplate({site,segment}:{site:Site;segment:string}) {
  const [activeCategory,setActiveCategory]=useState("Todos");
  const normalized=segment.toLocaleLowerCase("pt-BR");
  const config=/hamburg/.test(normalized)?{name:"Hamburgueria",eyebrow:"BURGERS & SABOR",headline:"O hambúrguer que transforma sua fome em vontade de repetir.",description:"Hambúrgueres suculentos, ingredientes frescos e combinações irresistíveis.",photo:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=85",badge:"🍔 Feito na chapa",accent:"#e9b64c",dark:"#19251e"}:/cafeteria|padaria/.test(normalized)?{name:"Cafeteria e Padaria",eyebrow:"CAFÉ & AFETO",headline:"Um momento especial a cada xícara.",description:"Cafés, pães e delícias preparadas para tornar seu dia melhor.",photo:"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1400&q=85",badge:"☕ Pausa deliciosa",accent:"#b88762",dark:"#31241f"}:/aça|a[cç]ai|sorvet/.test(normalized)?{name:"Açaí e Sorveteria",eyebrow:"FRESCOR & SABOR",headline:"Seu momento favorito tem mais sabor.",description:"Açaís, sorvetes e combinações para refrescar o seu dia.",photo:"https://images.unsplash.com/photo-1493857671505-72967e2e2760?auto=format&fit=crop&w=1400&q=85",badge:"🍧 Escolha seu favorito",accent:"#d8a2dc",dark:"#31203b"}:/marmit/.test(normalized)?{name:"Marmitaria",eyebrow:"COMIDA DE VERDADE",headline:"O sabor de casa, onde você estiver.",description:"Refeições frescas, caprichadas e prontas para o seu dia.",photo:"https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85",badge:"🍱 Feito com carinho",accent:"#d4ac64",dark:"#26342a"}:/restaurante/.test(normalized)?{name:"Restaurante",eyebrow:"COZINHA & EXPERIÊNCIA",headline:"Sabores que merecem ser compartilhados.",description:"Pratos especiais, ingredientes selecionados e uma experiência à mesa.",photo:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",badge:"🍽️ Uma experiência completa",accent:"#d9b77d",dark:"#24312b"}:{name:segment||"Delivery",eyebrow:"SABOR & PRATICIDADE",headline:"O melhor do seu cardápio, a um clique.",description:"Descubra nossos produtos e faça seu pedido com facilidade.",photo:"https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1400&q=85",badge:"✦ Feito para você",accent:"#c8e69d",dark:"#26332b"};
  const menu=site.restaurant?.menu||[];
  const menuGroup=(item:MenuItem)=>{const category=(item.category||"").trim();if(category&&category.toLocaleLowerCase("pt-BR")!=="cardápio")return category;return /chocolate|brigadeiro|romeu|julieta|banana|doce|nutella|morango|prestígio|beijinho/i.test(item.name)?"Pizzas doces":"Pizzas salgadas";};
  const categories=Array.from(new Set(menu.map(menuGroup)));
  const filtered=activeCategory==="Todos"?menu:menu.filter(item=>menuGroup(item)===activeCategory);
  const whatsapp=(site.restaurant?.whatsapp||"").replace(/\\D/g,"");
  return <section className="overflow-hidden rounded-[26px] bg-[#f9f7f1] text-[#222a24]" aria-label={`Prévia de ${config.name}`}>
    <header className="flex items-center justify-between gap-4 px-6 py-5 text-white sm:px-10" style={{background:config.dark}}><strong className="text-lg font-black uppercase tracking-wider">{config.eyebrow}</strong><a href="#cardapio-segmento-v2" className="rounded-full border border-white/40 px-4 py-2 text-xs font-bold">Ver cardápio ↓</a></header>
    <div className="grid items-center gap-8 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:gap-14 lg:py-20" style={{background:config.dark,color:"#fff"}}><div><p className="text-xs font-black uppercase tracking-[.24em]" style={{color:config.accent}}>{config.name} · Delivery</p><h2 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">{config.headline}</h2><p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">{config.description}</p><a href="#cardapio-segmento-v2" className="mt-8 inline-flex rounded-full px-7 py-4 text-sm font-black text-[#172018]" style={{background:config.accent}}>Explorar cardápio →</a></div><img src={config.photo} alt={config.name} className="h-64 w-full rounded-3xl object-cover sm:h-96" loading="lazy"/></div>
    <div className="px-6 py-5 text-center text-sm font-bold" style={{background:config.accent}}>{config.badge} · Ingredientes selecionados · Peça pelo WhatsApp</div>
    <div id="cardapio-segmento-v2" className="px-6 py-12 sm:px-10"><p className="text-xs font-black uppercase tracking-[.2em]">Escolha seu favorito</p><h3 className="mt-3 text-4xl font-black">Nosso cardápio</h3><p className="mt-3 text-sm text-[#667067]">Os itens e preços vêm do cadastro de produtos deste projeto.</p><div className="mt-6 flex flex-wrap gap-2">{["Todos",...categories].map(category=><button type="button" key={category} onClick={()=>setActiveCategory(category)} className={`rounded-full px-4 py-2 text-sm font-bold ${activeCategory===category?"bg-[#26382e] text-white":"border border-[#cdd4ca] bg-white"}`}>{category}</button>)}</div>{filtered.length===0?<div className="mt-8 rounded-2xl border border-dashed border-[#cdd4ca] bg-white p-8 text-center"><h4 className="text-xl font-bold">Seu cardápio começa aqui</h4><p className="mt-2 text-sm text-[#667067]">Cadastre seus produtos acima para vê-los automaticamente neste site.</p></div>:<div className="mt-8 grid gap-4 sm:grid-cols-2">{filtered.map(item=><article key={item.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-sm"><span className="text-xs font-bold uppercase text-[#66806c]">{item.category||"Cardápio"}</span><h4 className="mt-3 text-xl font-black">{item.name}</h4>{item.description&&<p className="mt-2 text-sm text-[#667067]">{item.description}</p>}<div className="mt-auto flex items-center justify-between gap-3 pt-5"><strong className="text-xl">{item.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong>{whatsapp&&item.name&&item.price>0&&<a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de pedir "+item.name+".")}`} className="rounded-full bg-[#26382e] px-4 py-3 text-xs font-bold text-white">Pedir agora ↗</a>}</div></article>)}</div>}</div>
    <footer className="px-6 py-10 text-center text-white" style={{background:config.dark}}><h3 className="text-3xl font-black">Bateu a fome?</h3><p className="mt-3 text-white/75">{whatsapp?"Escolha seu favorito e faça o pedido pelo WhatsApp.":"Cadastre seu WhatsApp para habilitar os pedidos."}</p>{whatsapp&&<a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-full px-6 py-3 font-bold text-[#172018]" style={{background:config.accent}}>Pedir pelo WhatsApp ↗</a>}</footer>
  </section>;
}
const pizzaIngredients:Record<string,string>={
 "mussarela":"Molho de tomate, mussarela, tomate e orégano.",
 "calabresa":"Molho de tomate, mussarela, calabresa fatiada, cebola e orégano.",
 "portuguesa":"Molho de tomate, mussarela, presunto, ovos, cebola, ervilha, azeitonas e orégano.",
 "frango com catupiry":"Molho de tomate, mussarela, frango desfiado, requeijão tipo Catupiry e orégano.",
 "quatro queijos":"Molho de tomate, mussarela, provolone, parmesão e gorgonzola.",
 "marguerita":"Molho de tomate, mussarela, tomate, manjericão e orégano.",
 "pepperoni":"Molho de tomate, mussarela, pepperoni e orégano.",
 "bacon":"Molho de tomate, mussarela, bacon crocante e orégano.",
 "napolitana":"Molho de tomate, mussarela, tomate, parmesão e orégano.",
 "moda da casa":"Molho de tomate, mussarela, presunto, calabresa, bacon, cebola e orégano.",
 "chocolate":"Chocolate ao leite e granulado.",
 "brigadeiro":"Chocolate, brigadeiro cremoso e granulado.",
 "romeu e julieta":"Mussarela e goiabada.",
 "banana com canela":"Banana, açúcar e canela."
};
function pizzaDescription(name:string){const key=name.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();return pizzaIngredients[key]||"";}
function PizzeriaTemplate({site,segment}:{site:Site;segment:string}) {
  const [activeCategory,setActiveCategory]=useState("Todos");
  const menu=site.restaurant?.menu||[];
  const categories=Array.from(new Set(menu.map(item=>item.category||"Cardápio")));
  const filtered=activeCategory==="Todos"?menu:menu.filter(item=>(item.category||"Cardápio")===activeCategory);
  const whatsapp=(site.restaurant?.whatsapp||"").replace(/\\D/g,"");
  const orderLink=(name:string,price:number)=>`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de pedir "+name+" ("+price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+").")}`;
  return <section className="overflow-hidden rounded-[26px] border border-[#f2d6ad]/20 bg-[#fff8ed] text-[#2a2019] shadow-2xl" aria-label="Prévia do template 01 de pizzaria">
    <header className="flex flex-wrap items-center justify-between gap-3 bg-[#231910] px-5 py-5 text-[#fff8e9] sm:px-9"><div><span className="text-xs font-black tracking-[.25em] text-[#f0a84a]">FORNO & SABOR</span><p className="mt-1 text-lg font-black">PIZZARIA <span className="text-[#f4a83b]">ARTESANAL</span></p></div><a href="#cardapio-pizzaria-v2" className="rounded-full border border-[#f4a83b]/60 px-5 py-2 text-xs font-bold text-[#ffd69d]">Ver cardápio ↓</a></header>
    <div className="relative overflow-hidden bg-[#251810] px-6 py-14 text-[#fff9ed] sm:px-12 sm:py-20"><div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#bd5b1d]/25 blur-3xl"/><div className="relative z-10 max-w-2xl"><p className="mb-5 text-xs font-black uppercase tracking-[.28em] text-[#f8b557]">Receitas artesanais · Sabor de verdade</p><h2 className="text-5xl font-black leading-[1.04] tracking-tight sm:text-7xl">O sabor que <span className="text-[#f4a83b]">reúne</span> todo mundo.</h2><p className="mt-6 max-w-lg text-base leading-relaxed text-[#e4cdb6]">Massa dourada, ingredientes selecionados e aquele momento especial em cada fatia.</p><a href="#cardapio-pizzaria-v2" className="mt-8 inline-flex rounded-full bg-[#f4a83b] px-7 py-4 text-sm font-black text-[#28180c]">Explorar nosso cardápio →</a></div><div className="relative mt-10 overflow-hidden rounded-3xl border border-[#eeb16c]/30 bg-[#6c3219] sm:mt-12"><img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=85" alt="Pizza artesanal com queijo e ingredientes frescos" className="h-56 w-full object-cover sm:h-96" loading="lazy"/><span className="absolute bottom-4 left-4 rounded-full bg-[#231910]/85 px-4 py-2 text-xs font-bold text-white">Feita para compartilhar</span></div></div>
    <div className="grid grid-cols-3 gap-2 bg-[#f4a83b] px-4 py-5 text-center text-[11px] font-black uppercase tracking-wide text-[#35200e] sm:text-sm"><span>🍕 Sabor artesanal</span><span>✦ Ingredientes especiais</span><span>♥ Feito com carinho</span></div>
    <div id="cardapio-pizzaria-v2" className="px-5 py-12 sm:px-10 sm:py-16"><p className="text-xs font-black uppercase tracking-[.25em] text-[#ad5726]">Escolha seu favorito</p><h3 className="mt-3 text-4xl font-black sm:text-5xl">Nosso cardápio<span className="text-[#c9682b]">.</span></h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#766354]">Confira os sabores e faça seu pedido. Os itens e preços vêm diretamente do cadastro de produtos.</p><div className="mt-7 flex flex-wrap gap-2">{["Todos",...categories].map(category=><button type="button" key={category} onClick={()=>setActiveCategory(category)} className={"rounded-full px-4 py-2 text-sm font-bold "+(activeCategory===category?"bg-[#2b1c12] text-white":"border border-[#dbc7ae] bg-white text-[#644932]")}>{category}</button>)}</div>{filtered.length===0?<div className="mt-8 rounded-2xl border border-dashed border-[#d3bca0] bg-white/60 p-8 text-center"><p className="text-xl font-bold">Seu cardápio começa aqui</p><p className="mt-2 text-sm text-[#806c5a]">Adicione produtos na seção de cadastro acima. Eles aparecerão automaticamente neste template.</p></div>:<div className="mt-8 grid gap-4 sm:grid-cols-2">{filtered.map(item=><article key={item.id} className="flex flex-col rounded-2xl border border-[#eadbc6] bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-[#bc6b34]">{item.category||"Cardápio"}</p><h4 className="mt-3 text-xl font-black">{item.name||"Novo item"}</h4>{(item.description||pizzaDescription(item.name))&&<p className="mt-2 text-sm leading-relaxed text-[#756557]">{item.description||pizzaDescription(item.name)}</p>}<div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5"><strong className="text-2xl text-[#a64c1d]">{item.price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</strong>{whatsapp&&item.name&&item.price>0&&<a target="_blank" rel="noopener noreferrer" href={orderLink(item.name,item.price)} className="rounded-full bg-[#2d5d3b] px-4 py-3 text-xs font-black text-white">Pedir agora ↗</a>}</div></article>)}</div>}</div>
    <footer className="bg-[#231910] px-6 py-10 text-center text-[#fff8e9]"><p className="text-xs font-black tracking-[.25em] text-[#f0a84a]">UMA EXPERIÊNCIA EM CADA FATIA</p><h3 className="mt-3 text-3xl font-black">Bateu a fome?</h3><p className="mt-2 text-sm text-[#d9c1a7]">{whatsapp?"Escolha seu sabor e faça seu pedido pelo WhatsApp.":"Cadastre um WhatsApp para habilitar os botões de pedido."}</p>{whatsapp&&<a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Gostaria de fazer um pedido.")}`} className="mt-6 inline-flex rounded-full bg-[#f4a83b] px-7 py-3 text-sm font-black text-[#28180c]">Pedir pelo WhatsApp ↗</a>}<p className="mt-7 text-xs text-[#b99c80]">Template 01 · {segment||"Pizzaria"} · Prévia experimental</p></footer>
  </section>;
}
export default function BuilderV2() {
  const [site, setSite] = useState<Site>(initial);
  const [siteCategory,setSiteCategory] = useState<SiteCategory>("institutional");
  const [categoryScreen,setCategoryScreen] = useState(true);
  const [segmentScreen,setSegmentScreen] = useState(false);
  const [restaurantSegment,setRestaurantSegment] = useState("");
  const [realEstateWhatsapp,setRealEstateWhatsapp]=useState("");
  const [properties,setProperties]=useState([{id:"imovel-1",title:"Casa contemporânea",location:"Bairro residencial · São Paulo",price:850000,type:"Venda",image:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"},{id:"imovel-2",title:"Apartamento com varanda",location:"Região central · São Paulo",price:3500,type:"Aluguel",image:"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80"},{id:"imovel-3",title:"Residência com jardim",location:"Condomínio residencial · São Paulo",price:1250000,type:"Venda",image:"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80"}]);

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
  const [previewDevice,setPreviewDevice]=useState<BuilderPreviewDevice>("mobile");
  const [previewExpanded,setPreviewExpanded]=useState(false);
  useEffect(()=>{setPreviewDevice(window.innerWidth>=1024?"desktop":"mobile");},[]);
  useEffect(()=>{if(!previewExpanded)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setPreviewExpanded(false);};document.addEventListener("keydown",onKey);return()=>document.removeEventListener("keydown",onKey);},[previewExpanded]);
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

  useEffect(() => { try { const saved = localStorage.getItem(storageKey); if (saved) { const parsed=JSON.parse(saved) as Site; setSite(parsed); if(parsed.kind) setSiteCategory(parsed.kind); if(parsed.kind==="restaurant" && parsed.niche) setRestaurantSegment(parsed.niche); if(parsed.blocks?.length||parsed.restaurant?.menu?.length) setCategoryScreen(false); } const savedVersions = localStorage.getItem(storageKey + ":versions"); if (savedVersions) { const parsed: unknown = JSON.parse(savedVersions); if (Array.isArray(parsed)) setVersions(parsed.filter((item): item is SavedVersion => !!item && typeof item === "object" && typeof item.id === "string" && !!item.site && Array.isArray(item.site.blocks)).slice(-25)); } } catch {} setLoaded(true); }, []);
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
  function parseMenuLines(message:string) {
    const parsed:{name:string;price:number}[]=[];
    for(const row of message.split(/\r?\n/)){
      const match=row.trim().replace(/^[•*\s]+/,"").match(/^(.{2,100}?)\s*[-–—:]\s*R?\$\s*(\d{1,5}(?:[.,]\d{1,2})?)\s*$/i);
      if(!match)continue;
      const price=Number(match[2].replace(",","."));
      if(Number.isFinite(price)&&price>0)parsed.push({name:match[1].trim(),price});
    }
    return parsed;
  }
  async function send() {
    const prompt = instruction.trim(); if (!prompt || busy) return;
    setBusy(true);
    setGenerationError("");
    setMessages(prev => [...prev, { role: "user", text: prompt }]);
    const photoCardOff=/(?:3|tr[eê]s)\s+cards?\b.{0,55}(?:processo|etapas|passos|atendimento)|(?:processo|etapas|passos|atendimento).{0,55}(?:3|tr[eê]s)\s+cards?\b|(?:remov|tir|exclu|ocult|sem)\w*.{0,35}(?:quarto|4[oº]?|foto do quarto|imagem do quarto)\s*card/i.test(prompt);
    const photoCardOn=/(?:4|quatro)\s+cards?\b.{0,55}(?:processo|etapas|passos|atendimento)|(?:processo|etapas|passos|atendimento).{0,55}(?:4|quatro)\s+cards?\b|(?:mostr|inclu|adicione|coloque|restaur|reativ)\w*.{0,40}(?:foto|imagem).{0,30}(?:quarto|4[oº]?)\s*card/i.test(prompt);
    const processCardOverride=photoCardOff?false:photoCardOn?true:undefined;
    const onlyProcessCardChange=processCardOverride!==undefined&&!/(?:crie|gere|novo site|modifiqu|altere|troque).{0,70}(?:texto|titulo|cor|imagem de fundo|formato da capa|design geral|se[cç][aã]o)/i.test(prompt);
    if(onlyProcessCardChange&&site.blocks.length){
      recordVersion(site,"Antes de alterar quantidade de cards da seção de etapas");setHistory(prev=>[...prev.slice(-19),site]);setRedoHistory([]);
      setSite(prev=>({...prev,processImageCard:processCardOverride}));
      setMessages(prev=>[...prev,{role:"assistant",text:processCardOverride?"Quarto card com a fotografia da capa ativado na seção de etapas.":"Card fotográfico removido da seção de etapas. Os três cards de texto foram preservados."}]);
      setInstruction("");setBusy(false);return;
    }
    const immersiveRequest=/(?:imagem|foto|fotografia).{0,60}(?:fundo|background)|(?:fundo|background).{0,60}(?:imagem|foto|fotografia)|capa imersiva|hero imersiv[oa]/i.test(prompt);
    const splitRequest=/(?:capa|layout|hero).{0,35}(?:dividid[oa]|split)|(?:texto|imagem).{0,40}(?:lado a lado|ao lado)/i.test(prompt);
    if(immersiveRequest||splitRequest){
      recordVersion(site,"Antes de alterar apresentação da capa");
      setHistory(prev=>[...prev.slice(-19),site]);setRedoHistory([]);
      setSite(prev=>({...prev,heroPresentation:immersiveRequest?"immersive":"split"}));
      setMessages(prev=>[...prev,{role:"assistant",text:immersiveRequest?"Capa imersiva aplicada no desktop: foto ao fundo, sobreposição escura e conteúdo à frente. A versão mobile foi preservada.":"Capa dividida restaurada. Conteúdo, imagens e versão mobile preservados."}]);
      setInstruction("");setBusy(false);return;
    }
    if(siteCategory==="restaurant") {
      const entries=parseMenuLines(prompt);
      if(entries.length){
        recordVersion(site,"Antes de importar cardápio pelo chat");setHistory(prev=>[...prev.slice(-19),site]);setRedoHistory([]);
        setSite(prev=>{
          const menu=[...(prev.restaurant?.menu||[])];
          for(const entry of entries){
            const index=menu.findIndex(item=>item.name.trim().toLocaleLowerCase("pt-BR")===entry.name.toLocaleLowerCase("pt-BR"));
            const item={id:index>=0?menu[index].id:crypto.randomUUID(),name:entry.name,description:index>=0?menu[index].description:"",price:entry.price,category:index>=0?menu[index].category:"Cardápio"};
            if(index>=0)menu[index]=item;else menu.push(item);
          }
          return {...prev,kind:"restaurant",restaurant:{...prev.restaurant,whatsapp:prev.restaurant?.whatsapp||"",menu}};
        });
        setMessages(prev=>[...prev,{role:"assistant",text:`${entries.length} produtos importados para o cardápio. A prévia foi atualizada.`}]);
        setInstruction("");setBusy(false);return;
      }
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
      const requested=/minimalista|(?:template|modelo)\\s*2|(?:template|modelo)[\\s\\S]{0,25}\\b2\\b/i.test(prompt)?"minimalist-sophisticated":/impactante|moderno|(?:template|modelo)\s*3|(?:template|modelo)[\s\S]{0,25}\b3\b/i.test(prompt)?"modern-impactful":/lado a lado|alternad|template 4|modelo 4/i.test(prompt)?"image-text-alternating":"institutional-complete";
      recordVersion(site,"Antes de trocar o template");setRedoHistory([]);setHistory(prev=>[...prev.slice(-19),site]);
      setSite(prev=>({...prev,templateId:requested}));setMessages(prev=>[...prev,{role:"assistant",text:requested==="minimalist-sophisticated"?"Template alterado para Minimalista Sofisticado. Todo o conteúdo foi preservado.":requested==="modern-impactful"?"Template alterado para Moderno e Impactante. Todo o conteúdo foi preservado.":requested==="image-text-alternating"?"Template alterado para Imagens e Textos Lado a Lado. Todo o conteúdo foi preservado.":"Template alterado para Institucional Completo. Todo o conteúdo foi preservado."}]);setInstruction("");setBusy(false);return;
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
      incoming.heroPresentation=site.heroPresentation;
      incoming.processImageCard=processCardOverride??site.processImageCard;
      incoming.processImageCardTitle=site.processImageCardTitle;
      incoming.processImageCardDescription=site.processImageCardDescription;
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
  if(segmentScreen) return <main className="pn-builder-shell pn-builder-selection min-h-screen bg-[#0b1110] px-4 py-10 text-white"><div className="pn-segment-content mx-auto max-w-5xl"><button type="button" onClick={()=>{setSegmentScreen(false);setCategoryScreen(true);}} className="mb-8 rounded-lg border border-white/20 px-4 py-2 text-sm">← Voltar aos tipos de site</button><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Restaurante e Delivery</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">Qual é o seu tipo de negócio?</h1><p className="mt-3 text-sm text-white/60">Escolha o segmento para preparar o cadastro de produtos. Os templates visuais serão selecionados em outra etapa.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{restaurantSegments.map(segment=><button key={segment.id} type="button" onClick={()=>{setRestaurantSegment(segment.name);setSelectedNiche(segment.name);setSiteCategory("restaurant");setSite(prev=>({...prev,kind:"restaurant",niche:segment.name,restaurant:prev.kind==="restaurant"&&prev.niche===segment.name?(prev.restaurant||{whatsapp:"",menu:[]}):{whatsapp:"",menu:[]},blocks:prev.kind==="restaurant"&&prev.niche===segment.name?prev.blocks:[],templateId:prev.kind==="restaurant"&&prev.niche===segment.name?prev.templateId:undefined}));setSegmentScreen(false);setCategoryScreen(false);}} className="rounded-2xl border border-white/20 bg-white/[.04] p-6 text-left hover:border-lime-300 hover:bg-lime-300/10"><h2 className="text-xl font-bold">{segment.name}</h2><p className="mt-3 text-sm text-white/60">{segment.description}</p><span className="mt-6 inline-block text-sm font-semibold text-lime-300">Selecionar →</span></button>)}</div></div></main>;
  if(categoryScreen) return <main className="pn-builder-shell pn-builder-selection min-h-screen bg-[#0b1110] px-4 py-8 text-white sm:py-12"><div className="mx-auto max-w-6xl">
    <div className="pn-selection-heading mb-10"><p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-lime-300">PageNova AI · Builder V2 · Ambiente experimental</p><h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">Que tipo de site vamos criar?</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">Escolha a finalidade do seu projeto. O chat com IA e o editor serão os mesmos; cada categoria terá os recursos próprios do seu negócio.</p></div>
    <div className="mb-6 flex flex-wrap items-center gap-3"><input aria-label="Buscar tipo de site" value={categoryQuery} onChange={e=>setCategoryQuery(e.target.value)} placeholder="Buscar por tipo ou nicho (ex.: pizzaria, advocacia)..." className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm outline-none focus:border-lime-300"/>{site.blocks.length>0&&<button type="button" onClick={()=>setCategoryScreen(false)} className="rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold hover:bg-white/10">Continuar projeto atual →</button>}</div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{siteCategories.filter(item=>{const q=categoryQuery.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"");const aliases:Record<SiteCategory,string>={institutional:"advocacia advogado clinica medico escritorio empresa",restaurant:"pizzaria pizza hamburgueria delivery comida cafe","real-estate":"imoveis imobiliaria casas apartamentos",catalog:"veiculos carros equipamentos"};return (item.title+" "+item.description+" "+item.features+" "+aliases[item.id]).toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").includes(q);}).map(item=><article key={item.id} className={"flex min-h-[245px] flex-col rounded-2xl border p-6 transition-colors "+(item.ready?"border-lime-300/45 bg-[#17241d]":"border-white/15 bg-white/[.035]")}><div className="mb-5 flex items-center justify-between"><span aria-hidden="true" className="text-3xl text-lime-300">{item.symbol}</span><span className={"rounded-full px-3 py-1 text-[11px] font-semibold "+(item.ready?"bg-lime-300 text-black":"bg-white/10 text-white/65")}>{item.ready?"Disponível":"Em preparação"}</span></div><h2 className="text-xl font-bold">{item.title}</h2><p className="mt-2 text-sm text-white/70">{item.description}</p><p className="mt-3 text-xs leading-relaxed text-white/45">{item.features}</p><div className="mt-auto pt-6"><button type="button" disabled={!item.ready} onClick={()=>{if(item.id==="restaurant"){setCategoryScreen(false);setSegmentScreen(true);return;}setSiteCategory(item.id);setSite(prev=>({...prev,kind:item.id}));setCategoryScreen(false);}} className="w-full rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45">{item.ready?(item.id==="restaurant"?"Criar restaurante →":item.id==="real-estate"?"Criar imobiliária →":"Criar site institucional →"):"Módulo em desenvolvimento"}</button></div></article>)}</div>
    <p className="mt-8 text-xs text-white/45">Os módulos especializados serão liberados progressivamente. Não geraremos uma loja ou um cardápio usando um template institucional disfarçado.</p>
  </div></main>;
  return <main className="pn-builder-shell pn-builder-editor min-h-screen min-w-0 overflow-x-hidden bg-[#0b1110] px-3 py-5 text-white sm:px-4 sm:py-8">
    <div className="mx-auto w-full min-w-0 max-w-6xl"><div className="pn-editor-category mb-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-white/55">Categoria: {siteCategories.find(item=>item.id===siteCategory)?.title||"Site Institucional"} {siteCategory==="restaurant"&&restaurantSegment?`· ${restaurantSegment}`:""}</span><button type="button" onClick={()=>{if(siteCategory==="restaurant")setSegmentScreen(true);else setCategoryScreen(true);}} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10">← Tipos de site</button></div>
      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(350px,440px)_minmax(0,1fr)] xl:gap-6">
        <section className="pn-editor-chat flex min-w-0 flex-col rounded-2xl border border-lime-300/20 bg-[#141d1a] p-4 shadow-[0_14px_45px_rgba(0,0,0,.13)] sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-left text-lg font-bold">Chat com IA</h2><p className="mt-1 text-left text-xs text-white/55">Crie um site ou peça mudanças à IA.</p></div><button type="button" onClick={newProject} disabled={busy||publishing} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs font-semibold text-lime-300 disabled:opacity-40">+ Novo site</button></div>
<details className="pn-editor-tools mb-4 rounded-xl border border-white/15 bg-black/20 p-3">
  <summary className="flex cursor-pointer list-none items-center justify-between text-left text-xs font-semibold text-white/75">Histórico e versões <span className="text-lime-300">⌄ {versions.length+cloudVersions.length}</span></summary>
  <div className="pn-editor-chat-actions mt-3 flex flex-wrap items-center gap-2">
    <button type="button" onClick={undo} disabled={!history.length||busy} className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-40">↶ Desfazer</button>
    <button type="button" onClick={redo} disabled={!redoHistory.length||busy} className="rounded-lg border border-white/20 px-3 py-2 text-xs disabled:opacity-40">↷ Refazer</button>
    <button type="button" onClick={()=>setShowVersions(v=>!v)} aria-expanded={showVersions} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300">Ver histórico ({versions.length+cloudVersions.length})</button>
    <button type="button" onClick={saveNamedVersion} disabled={!site.blocks.length||busy} className="rounded-lg border border-lime-300/50 px-3 py-2 text-xs text-lime-300 disabled:opacity-40">Salvar versão nomeada</button>
  </div>
</details><p className="mb-2 text-xs text-white/60" role="status">{cloudStatus}</p>{storageError && <p role="alert" className="mb-3 rounded-lg border border-amber-400/50 p-2 text-xs text-amber-200">{storageError}</p>}{showVersions && <div className="mb-3 max-h-64 overflow-y-auto rounded-xl border border-white/20 p-3"><p className="mb-2 text-xs text-white/70">Versões locais e na nuvem. Salve uma versão nomeada antes de aprovar alterações.</p>{(versions.length + cloudVersions.length)===0 ? <p className="text-xs text-white/60">Nenhuma versão anterior ainda.</p> : [...cloudVersions, ...[...versions].reverse()].map(version=><div key={version.id} className="mb-2 flex items-center justify-between gap-2 border-b border-white/10 pb-2"><div className="min-w-0"><p className="text-xs">{version.label}</p><p className="text-[11px] text-white/60">{new Date(version.at).toLocaleString("pt-BR")}</p></div><button type="button" disabled={busy} onClick={()=>restoreVersion(version)} className="rounded-md border border-lime-300/50 px-2 py-1 text-xs text-lime-300 disabled:opacity-40">Restaurar</button></div>)}</div>}<div aria-live="polite" className="mb-4 flex-1 space-y-3 overflow-y-auto">{messages.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm ${m.role === "user" ? "ml-7 bg-lime-300 text-black" : "mr-7 bg-white/10"}`}>{m.text}</div>)}</div><div className="mb-3 rounded-xl border border-white/20 bg-white/5 p-3"><button type="button" aria-expanded={nicheMenuOpen} onClick={()=>setNicheMenuOpen(open=>!open)} className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-white"><span>▦ Escolher nicho {selectedNiche ? "· "+selectedNiche : ""}</span><span aria-hidden="true">{nicheMenuOpen ? "▲" : "▼"}</span></button>{nicheMenuOpen&&<div className="mt-3 space-y-2"><input aria-label="Pesquisar nichos" value={nicheQuery} onChange={e=>setNicheQuery(e.target.value)} placeholder="Pesquisar profissão ou negócio..." className="w-full rounded-lg border border-white/20 bg-black/30 p-2 text-sm text-white outline-none focus:border-lime-300"/><select aria-label="Categoria do nicho" value={nicheGroup} onChange={e=>setNicheGroup(e.target.value)} className="w-full rounded-lg border border-white/20 bg-[#18251d] p-2 text-sm text-white"><option>Todos</option>{Object.keys(nicheGroups).map(group=><option key={group}>{group}</option>)}</select><div className="grid max-h-56 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">{nicheNames.filter(n=>(nicheGroup==="Todos"||nicheGroups[nicheGroup]?.includes(n))&&n.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").includes(nicheQuery.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\\u0300-\\u036f]/g,""))).map(n=><button type="button" key={n} onClick={()=>chooseNiche(n)} className="rounded-lg border border-white/10 p-2 text-left text-xs text-white/90 hover:border-lime-300 hover:bg-white/10">{n}</button>)}</div><p className="text-xs text-white/50">Selecionar apenas preenche o chat. Você pode editar o texto antes de enviar.</p></div>}</div><form onSubmit={e=>{e.preventDefault();void send();}} className="space-y-3"><textarea aria-label="Descreva a criação ou alteração" value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder="Crie um site para uma clínica odontológica... ou Centralize todos os textos e o botão..." rows={5} className="min-h-[145px] w-full resize-y rounded-xl border border-white/20 bg-black/30 p-3 text-left text-sm leading-relaxed text-white outline-none focus:border-lime-300"/><label className="block cursor-pointer rounded-xl border border-white/20 p-3 text-left text-sm">📎 Anexar imagem de referência<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>attachImage(e.target.files?.[0])}/></label>{reference && <p className="text-xs text-lime-300">Imagem anexada à conversa</p>}<button type="submit" disabled={busy} className="w-full rounded-xl bg-lime-300 p-3 font-bold text-black disabled:opacity-60">{busy ? "IA trabalhando..." : "Enviar e aplicar →"}</button></form>{generationError && <p role="alert" className="mt-3 rounded-lg border border-red-400 bg-red-950/60 p-3 text-sm text-red-100">Erro na geração: {generationError}</p>}<p className="mt-3 text-left text-[11px] leading-relaxed text-white/50">O chat IA prevalece sobre o modelo. Confira a prévia antes de publicar.</p></section>
        <div className="min-w-0">{siteCategory==="institutional"&&<details className="mb-4 rounded-xl border border-white/20 bg-[#141d1a] p-4 text-white"><summary className="cursor-pointer text-left text-sm font-semibold">Modelo visual do site <span className="text-xs font-normal text-white/50">(alterar)</span></summary><p className="mt-2 text-left text-xs text-white/60">Troque o modelo sem perder textos ou imagens. O chat com IA tem prioridade.</p><select aria-label="Escolher template visual" value={site.templateId||"institutional-complete"} onChange={e=>{const templateId=e.target.value as "institutional-complete"|"minimalist-sophisticated"|"modern-impactful"|"image-text-alternating";recordVersion(site,"Antes de trocar o template");setSite(prev=>({...prev,templateId}));}} className="mt-3 w-full rounded-lg border border-white/25 bg-[#1b2b23] px-3 py-3 text-sm text-white"><option value="institutional-complete">01 — Institucional Completo</option><option value="minimalist-sophisticated">02 — Minimalista Sofisticado</option><option value="modern-impactful">03 — Moderno e Impactante</option><option value="image-text-alternating">04 — Imagens e Textos Lado a Lado</option></select></details>}{siteCategory==="restaurant"&&<details className="mb-5 rounded-2xl border border-white/20 bg-[#141d1a] p-5 text-white"><summary className="cursor-pointer list-none text-sm font-bold text-lime-300">▸ Gerenciar cardápio · {(site.restaurant?.menu||[]).length} produtos <span className="ml-2 text-xs font-normal text-white/60">(toque para expandir)</span></summary><div className="mt-5"><p className="text-xs font-bold uppercase tracking-widest text-lime-300">Restaurante · Cadastro de produtos</p><h2 className="mt-2 text-2xl font-bold">Cadastre seu cardápio</h2><p className="mt-2 text-sm text-white/60">Informe apenas o item e o valor. O template visual será definido separadamente.</p><div className="mt-5 grid grid-cols-[minmax(0,1fr)_110px_36px] gap-2 text-xs font-semibold text-white/70"><span>Item</span><span>Valor (R$)</span><span/></div><div className="mt-2 space-y-2">{(site.restaurant?.menu||[]).map((item,index)=><div key={item.id} className="grid grid-cols-[minmax(0,1fr)_110px_36px] gap-2"><input aria-label={`Item ${index+1}`} value={item.name} placeholder="Ex.: Pizza Calabresa" onChange={e=>setSite(prev=>({...prev,restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:(prev.restaurant?.menu||[]).map(x=>x.id===item.id?{...x,name:e.target.value}:x)}}))} className="min-w-0 rounded-lg border border-white/20 bg-black/30 p-3 text-sm"/><input aria-label={`Preço do item ${index+1}`} inputMode="decimal" value={Number.isFinite(item.price)?String(item.price).replace(".",","):""} onChange={e=>{const value=e.target.value.replace(",",".");if(value&&!/^\\d*(?:\\.\\d{0,2})?$/.test(value))return;setSite(prev=>({...prev,restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:(prev.restaurant?.menu||[]).map(x=>x.id===item.id?{...x,price:value===""?0:Number(value)}:x)}}));}} className="min-w-0 rounded-lg border border-white/20 bg-black/30 p-3 text-sm"/><button type="button" aria-label={`Remover ${item.name||"item"}`} onClick={()=>setSite(prev=>({...prev,restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:(prev.restaurant?.menu||[]).filter(x=>x.id!==item.id)}}))} className="rounded-lg border border-white/20 text-red-300">×</button></div>)}</div><button type="button" onClick={()=>setSite(prev=>({...prev,kind:"restaurant",restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:[...(prev.restaurant?.menu||[]),{id:crypto.randomUUID(),name:"",description:"",category:"Cardápio",price:0}]}}))} className="mt-3 w-full rounded-xl border border-dashed border-lime-300/60 px-4 py-3 text-sm font-semibold text-lime-300 hover:bg-lime-300/10">+ Adicionar outro item</button><details className="mt-5 rounded-xl border border-white/15 p-4"><summary className="cursor-pointer text-sm font-semibold">Colar vários itens de uma vez</summary><p className="mt-2 text-xs text-white/60">Uma linha por produto: Pizza Calabresa - 49,90</p><textarea id="restaurant-bulk-menu" rows={5} placeholder={"Pizza Calabresa - 49,90\\nPizza Portuguesa - 54,90\\nRefrigerante 2L - 12,00"} className="mt-3 w-full rounded-lg border border-white/20 bg-black/30 p-3 text-sm"/><button type="button" onClick={()=>{const textarea=document.getElementById("restaurant-bulk-menu") as HTMLTextAreaElement|null;const lines=(textarea?.value||"").split(/\\r?\\n/);const entries=lines.map(line=>line.match(/^\\s*(.+?)\\s*[-–—;:]\\s*(?:R\\$\\s*)?(\\d+(?:[.,]\\d{1,2})?)\\s*$/)).filter((match):match is RegExpMatchArray=>Boolean(match)).map(match=>({id:crypto.randomUUID(),name:match[1].trim(),description:"",category:"Cardápio",price:Number(match[2].replace(",","."))})).filter(item=>item.name&&Number.isFinite(item.price)&&item.price>0);if(!entries.length){setGenerationError("Nenhum item válido encontrado. Use: Nome do item - 49,90");return;}setSite(prev=>({...prev,kind:"restaurant",restaurant:{whatsapp:prev.restaurant?.whatsapp||"",menu:[...(prev.restaurant?.menu||[]),...entries]}}));if(textarea)textarea.value="";setGenerationError("");}} className="mt-2 rounded-lg bg-lime-300 px-4 py-2 text-sm font-bold text-black">Importar itens válidos</button></details><p className="mt-4 text-xs text-white/50">{(site.restaurant?.menu||[]).length} itens cadastrados. Dados e apresentação visual permanecem independentes.</p></div></details>}{siteCategory==="real-estate"&&<details className="mb-5 rounded-2xl border border-white/20 bg-[#141d1a] p-5 text-white"><summary className="cursor-pointer font-bold text-lime-300">▸ Gerenciar imóveis · {properties.length} cadastrados</summary><div className="mt-5 space-y-4"><label className="block text-sm">WhatsApp da imobiliária<input value={realEstateWhatsapp} onChange={e=>setRealEstateWhatsapp(e.target.value)} placeholder="5511999999999" className="mt-2 w-full rounded-lg border border-white/20 bg-black/30 p-3"/></label>{properties.map((p,i)=><div key={p.id} className="grid gap-2 rounded-xl border border-white/15 p-3 sm:grid-cols-2">{(["title","location","price","image"] as const).map(field=><label key={field} className="text-xs text-white/65">{field}<input aria-label={field} value={String(p[field])} onChange={e=>{const value=e.target.value;setProperties(prev=>prev.map(x=>x.id===p.id?{...x,[field]:field==="price"?Number(value)||0:value}:x));}} className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-3 text-sm text-white"/></label>)}<select value={p.type} onChange={e=>setProperties(prev=>prev.map(x=>x.id===p.id?{...x,type:e.target.value}:x))} className="rounded-lg bg-[#26332e] p-3"><option>Venda</option><option>Aluguel</option></select><button type="button" onClick={()=>setProperties(prev=>prev.filter(x=>x.id!==p.id))} className="rounded-lg border border-red-300/30 p-3 text-red-300">Remover imóvel</button></div>)}<button type="button" onClick={()=>setProperties(prev=>[...prev,{id:crypto.randomUUID(),title:"Novo imóvel",location:"Informe a localização",price:0,type:"Venda",image:""}])} className="w-full rounded-xl border border-dashed border-lime-300/50 p-3 font-bold text-lime-300">+ Adicionar imóvel</button></div></details>}<div className={previewExpanded?"fixed inset-0 z-[200] overflow-y-auto bg-[#0b1110] p-3 text-white sm:p-6":"mb-4 min-w-0 rounded-xl border border-white/20 bg-[#141d1a] p-3 text-white sm:p-4"}>
<div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-left text-base font-bold">Prévia do seu site</h2><p className="mt-1 text-left text-xs text-white/55">Visualização em tempo real</p></div><div className="flex flex-wrap items-center gap-2">
<div role="group" aria-label="Visualizar desktop ou mobile" className="flex items-center rounded-lg border border-white/20 bg-black/20 p-1"><button type="button" aria-pressed={previewDevice==="desktop"} onClick={()=>setPreviewDevice("desktop")} className={previewDevice==="desktop"?"rounded-md bg-lime-300 px-3 py-2 text-xs font-bold text-black":"rounded-md px-3 py-2 text-xs text-white/70"}>▣ Desktop</button><button type="button" aria-pressed={previewDevice==="mobile"} onClick={()=>setPreviewDevice("mobile")} className={previewDevice==="mobile"?"rounded-md bg-lime-300 px-3 py-2 text-xs font-bold text-black":"rounded-md px-3 py-2 text-xs text-white/70"}>▯ Mobile</button></div>
<button type="button" onClick={()=>setPreviewExpanded(v=>!v)} className="rounded-lg border border-white/25 px-3 py-2 text-xs">{previewExpanded?"✕ Fechar":"⛶ Ampliar"}</button>
</div></div>
<BuilderV2PreviewFrame device={previewDevice}>{siteCategory==="real-estate"?<RealEstateTemplate properties={properties} whatsapp={realEstateWhatsapp}/>:siteCategory==="restaurant"?/pizzaria/i.test(restaurantSegment||site.niche||"")?<PizzeriaTemplate site={site} segment={restaurantSegment}/>:<RestaurantSegmentTemplate key={restaurantSegment||site.niche} site={site} segment={restaurantSegment||site.niche||"Delivery"}/>:<BuilderV2Site site={site} templateId={site.templateId||"institutional-complete"} selectedNiche={selectedNiche||site.niche||""} />}</BuilderV2PreviewFrame>
<p className="mt-3 text-left text-[11px] text-white/45">Role dentro da prévia para visualizar todo o site.</p>
</div><section aria-label="Publicação e links" className="pn-editor-publish-panel mt-4 rounded-xl border border-white/15 bg-[#141d1a] p-4 text-white">
<div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-left text-sm font-bold">Publicação</h2><span className="text-xs text-white/55">{site.publishedUrl?"Site publicado":"Rascunho"}</span></div>
<div className="flex flex-wrap items-center gap-2">
<button type="button" onClick={()=>void publishSite()} disabled={publishing||busy||site.blocks.length<4} className="min-h-11 rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40">{publishing?"Publicando...":site.publishedUrl?"Publicar alterações":"Publicar site"}</button>
{site.publishedUrl&&<a href={site.publishedUrl} target="_blank" rel="noopener noreferrer" className="min-h-11 rounded-xl border border-lime-300/60 px-4 py-3 text-sm font-semibold text-lime-300">Ver site ↗</a>}
{site.publishedUrl&&<button type="button" onClick={()=>void navigator.clipboard.writeText(site.publishedUrl||"")} className="min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80">Copiar URL</button>}
<a href="/app/builder" className="min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm text-white/65">Editor anterior ↗</a>
</div></section>{(site.publishedUrl||publishError||publishNotice)&&<div className="mt-3 rounded-xl border border-white/20 bg-[#141d1a] p-4 text-sm text-white">{publishError&&<p role="alert" className="text-red-300">{publishError}</p>}{publishNotice&&<p role="status" className="text-lime-300">{publishNotice}</p>}{site.publishedUrl&&<div className="mt-2 flex flex-wrap items-center gap-2"><a href={site.publishedUrl} target="_blank" rel="noopener noreferrer" className="break-all text-lime-300 underline">Ver site publicado ↗</a><button type="button" onClick={()=>navigator.clipboard.writeText(site.publishedUrl||"")} className="rounded-lg border border-white/25 px-3 py-1 text-xs">Copiar link</button></div>}</div>}</div>
      </div>
    </div>
  </main>;
}
