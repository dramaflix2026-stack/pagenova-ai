"use client";
import { useEffect,useState } from "react";
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

const roles=["Capa principal","Serviços","Ambiente","Equipe ou atividade","Detalhes","Institucional"];
type Photo={src:string;role:string;device:"desktop"|"mobile";approved:boolean};
type Catalog=Record<string,Photo[]>;
const key="pagenova-admin-photo-bank-drafts-v1";
export default function PhotoBankClient(){
 const [search,setSearch]=useState("");
 const [niche,setNiche]=useState("Barbearia");
 const [catalog,setCatalog]=useState<Catalog>({});
 const [running,setRunning]=useState(false);
 const [progress,setProgress]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{try{setCatalog(JSON.parse(localStorage.getItem(key)||"{}"))}catch{}},[]);
 function save(next:Catalog){setCatalog(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{}}
 const current=catalog[niche]||[];
 async function generate(){
  if(running)return;
  setRunning(true);setError("");
  let images=[...current];
  try{
   for(const device of ["desktop","mobile"] as const){
    for(let i=0;i<6;i++){
     if(images.some(p=>p.device===device&&p.role===roles[i]))continue;
     setProgress("Gerando "+device+" — "+(i+1)+"/6");
     const desc="Nicho: "+niche+". Papel visual: "+roles[i]+". "+
      (device==="mobile"?"Versão vertical da mesma direção de arte para celular.":"Versão horizontal para desktop.")+
      " Fotografia editorial natural e convincente, luz real, imperfeições discretas, materiais autênticos, cenário profissional coerente com a atividade. Evitar aparência de IA, pele plástica, mãos artificiais, poses publicitárias genéricas, letreiros e pessoas fictícias apresentadas como equipe real.";
     const response=await fetch("/api/builder-v2/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({siteTitle:niche,section:roles[i],description:desc,orientation:device==="mobile"?"portrait":"landscape"})});
     const data=await response.json();
     if(!response.ok||typeof data.src!=="string")throw Error(data.error||"Falha ao gerar imagem");
     images=[...images,{src:data.src,role:roles[i],device,approved:false}];
     save({...catalog,[niche]:images});
    }
   }
   setProgress("Pacote gerado. Revise as 12 imagens antes de aprovar.");
  }catch(e){setError(e instanceof Error?e.message:"Falha inesperada");setProgress("Geração interrompida. Você pode retomar as imagens restantes.");}
  finally{setRunning(false)}
 }
 async function copyPhoto(photo:Photo){const label=niche+" - "+(photo.device==="desktop"?"Desktop":"Mobile")+" - "+photo.role;const value=photo.src+" >> "+label;try{await navigator.clipboard.writeText(value);setProgress("Copiado: "+label)}catch{setError("Não foi possível copiar. Verifique a permissão da área de transferência.")}}
 function approve(src:string){save({...catalog,[niche]:current.map(p=>p.src===src?{...p,approved:!p.approved}:p)})}
 function remove(src:string){save({...catalog,[niche]:current.filter(p=>p.src!==src)})}
 const filtered=Object.entries(nicheGroups).map(([group,items])=>[group,items.filter(n=>n.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))] as const).filter(([,items])=>items.length);
 return <main className="min-h-screen bg-[#0b1010] text-white p-4 md:p-10">
 <div className="mx-auto max-w-6xl space-y-6">
  <header className="space-y-2"><div className="text-sm text-lime-300">PageNova AI • administração</div><h1 className="text-3xl font-semibold">Banco de imagens por nicho</h1><p className="text-sm text-zinc-400">12 imagens por nicho: 6 desktop + 6 mobile. O template universal permanece intacto.</p></header>
  <div className="rounded-xl border border-amber-600/40 bg-amber-950/30 p-4 text-sm text-amber-100">Área de preparação e revisão. Os pacotes são rascunhos locais deste navegador, ainda não são publicados para clientes. A geração consome créditos da OpenAI e cada imagem precisa de aprovação.</div>
  <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
   <aside className="rounded-xl border border-zinc-700 p-4 space-y-4"><input aria-label="Pesquisar nicho" placeholder="Pesquisar nicho..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full rounded-lg bg-zinc-900 border border-zinc-700 p-3 text-sm"/><div className="max-h-[540px] overflow-auto space-y-4">{filtered.map(([group,items])=><section key={group}><h2 className="text-xs font-semibold uppercase text-zinc-400 mb-2">{group}</h2><div className="space-y-1">{items.map(item=><button key={item} onClick={()=>{setNiche(item);setError("");setProgress("")}} className={"w-full text-left text-sm rounded-lg px-3 py-2 "+(niche===item?"bg-lime-400 text-black":"hover:bg-zinc-800")}>{item} <span className="opacity-60">({catalog[item]?.length||0}/12)</span></button>)}</div></section>)}</div></aside>
   <section className="space-y-4 min-w-0">
    <div className="rounded-xl border border-zinc-700 p-4 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">{niche}</h2><p className="text-sm text-zinc-400">{current.length}/12 imagens • {current.filter(p=>p.approved).length} aprovadas</p></div><button disabled={running||current.length===12} onClick={generate} className="rounded-lg bg-lime-400 px-5 py-3 font-semibold text-black disabled:opacity-40">{running?"Gerando...":current.length?"Completar pacote":"Gerar pacote de 12 imagens"}</button></div>
    {progress&&<p role="status" className="text-sm text-lime-300">{progress}</p>}{error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
    {(["desktop","mobile"] as const).map(device=><section key={device} className="space-y-3"><h3 className="font-semibold text-lg">{device==="desktop"?"Desktop (6)":"Mobile (6)"}</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-3">{roles.map(role=>{const photo=current.find(p=>p.device===device&&p.role===role);return <div key={role} className="rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900"><div className={device==="desktop"?"aspect-[3/2]":"aspect-[2/3] max-h-64"}>{photo?<img src={photo.src} alt={niche+" — "+role} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">Aguardando imagem</div>}</div><div className="p-3 space-y-2"><p className="text-xs">{role}</p>{photo&&<div className="flex flex-wrap gap-2"><button onClick={()=>copyPhoto(photo)} className="text-xs rounded px-2 py-1 bg-lime-400 text-black font-semibold">Copiar URL</button><button onClick={()=>approve(photo.src)} className={"text-xs rounded px-2 py-1 "+(photo.approved?"bg-lime-400 text-black":"bg-zinc-700")}>{photo.approved?"Aprovada ✓":"Aprovar"}</button><button onClick={()=>remove(photo.src)} disabled={running} className="text-xs rounded px-2 py-1 bg-zinc-800 text-red-200">Refazer</button></div>}</div></div>})}</div></section>)}
    <p className="text-xs text-zinc-400">O botão “Refazer” remove a imagem do rascunho. Use “Completar pacote” para gerar somente as posições faltantes. A aprovação ainda não disponibiliza as imagens no Builder V2.</p>
   </section>
  </div>
 </div>
 </main>;
}
