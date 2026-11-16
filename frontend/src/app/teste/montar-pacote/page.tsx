"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag, ShieldCheck } from "lucide-react";
import "./montar-pacote.css";

type Product={id:string;name:string;group:string;price:number|null;url:string;includes?:string[]};
const products:Product[]=[
 {id:"studio",name:"PageNova Studio",group:"Planos",price:207,url:"https://pay.kiwify.com.br/ON277u4",includes:["site","landing","clone","quiz","ebook"]},
 {id:"crm",name:"PageNova CRM",group:"Planos",price:247,url:"https://pay.kiwify.com.br/2m1rDJy",includes:["search","leads","commercial"]},
 {id:"apps",name:"Apps e Sistemas",group:"Planos",price:397,url:"https://pay.kiwify.com.br/MdZcLn7"},
 {id:"completo",name:"PageNova Completa",group:"Planos",price:597,url:"https://pay.kiwify.com.br/grqYCk6",includes:["studio","crm","apps","site","landing","clone","quiz","ebook","form","search","leads","commercial"]},
 {id:"site",name:"Criar Sites com IA",group:"Studio",price:null,url:"https://pay.kiwify.com.br/LJu4sCp"},
 {id:"landing",name:"Criar Landing Page com IA",group:"Studio",price:null,url:"https://pay.kiwify.com.br/D1PCPD2"},
 {id:"clone",name:"Clonador de Páginas",group:"Studio",price:null,url:"https://pay.kiwify.com.br/X2B2QQF"},
 {id:"form",name:"Formulário Inteligente",group:"Studio",price:null,url:"https://pay.kiwify.com.br/34RNg6p"},
 {id:"quiz",name:"Quizzes Interativos",group:"Studio",price:null,url:"https://pay.kiwify.com.br/DCzajEq"},
 {id:"ebook",name:"Criar E-books com IA",group:"Studio",price:null,url:"https://pay.kiwify.com.br/jo1HpuT"},
 {id:"search",name:"Buscar Empresas",group:"CRM",price:null,url:"https://pay.kiwify.com.br/xxbBj0R"},
 {id:"leads",name:"Gestão de Leads",group:"CRM",price:null,url:"https://pay.kiwify.com.br/MULLtCp"},
 {id:"commercial",name:"Operação Comercial",group:"CRM",price:null,url:"https://pay.kiwify.com.br/LzpevGp"}
];
const money=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);
export default function MontarPacote(){
 const [selected,setSelected]=useState<string[]>([]);
 useEffect(()=>{const plan=new URLSearchParams(window.location.search).get("plan");if(plan&&products.some(p=>p.id===plan))setSelected([plan]);},[]);
 const included=useMemo(()=>new Set(selected.flatMap(id=>products.find(p=>p.id===id)?.includes||[])),[selected]);
 const chosen=products.filter(p=>selected.includes(p.id));
 const priced=chosen.filter(p=>p.price!==null);
 const subtotal=priced.reduce((sum,p)=>sum+(p.price||0),0);
 const hasUnknown=chosen.some(p=>p.price===null);
 function toggle(id:string){
  setSelected(current=>{
   if(current.includes(id))return current.filter(x=>x!==id);
   const next=[...current,id];
   if(id==="completo")return ["completo"];
   if(current.includes("completo"))return [id];
   if(id==="studio"||id==="crm"||id==="apps"){
    const parent=products.find(p=>p.id===id);
    return next.filter(x=>x===id||!parent?.includes?.includes(x));
   }
   return next;
  });
 }
 return <main className="mp-page">
  <header className="mp-header"><Link href="/teste" aria-label="Voltar à PageNova"><img src="/brand/pagenova-logo.png" alt="PageNova AI"/></Link><Link href="/teste#planos" className="mp-back"><ArrowLeft size={16}/> Voltar aos planos</Link></header>
  <div className="mp-wrap">
   <div className="mp-intro"><span>CONTRATE DO SEU JEITO</span><h1>Monte seu <em>pacote.</em></h1><p>Escolha um plano completo, ferramentas avulsas ou combine os dois. Você decide o que faz sentido para seu negócio.</p></div>
   <div className="mp-layout"><div className="mp-catalog">
    {["Planos","Studio","CRM"].map(group=><section key={group} className="mp-group"><div className="mp-group-title"><h2>{group==="Planos"?"Pacotes completos":group==="Studio"?"Ferramentas Studio":"Ferramentas CRM"}</h2><p>{group==="Planos"?"Escolha um pacote ou pule esta etapa.":"Adicione apenas as ferramentas que desejar."}</p></div><div className="mp-products">{products.filter(p=>p.group===group).map(p=>{
      const isIncluded=!selected.includes(p.id)&&included.has(p.id);
      const active=selected.includes(p.id);
      return <button key={p.id} type="button" disabled={isIncluded} className={"mp-product"+(active?" active":"")} onClick={()=>toggle(p.id)} aria-pressed={active}><span className="mp-check">{active?<Check size={17}/>:isIncluded?<Check size={15}/>:<Plus size={17}/>}</span><span className="mp-product-info"><strong>{p.name}</strong><small>{isIncluded?"Já incluído no seu pacote":p.price!==null?money(p.price)+"/mês":"Preço disponível no checkout"}</small></span>{active?<Minus size={17}/>:null}</button>;
    })}</div></section>)}
   </div>
   <aside className="mp-summary"><div className="mp-summary-inner"><div className="mp-summary-heading"><ShoppingBag size={21}/><h2>Seu pacote</h2></div>{chosen.length===0?<p className="mp-empty">Escolha um ou mais produtos para começar. Não é obrigatório contratar um plano.</p>:<div className="mp-selected">{chosen.map(p=><div key={p.id} className="mp-selected-row"><span>{p.name}</span><button type="button" onClick={()=>toggle(p.id)} aria-label={"Remover "+p.name}><Minus size={15}/></button></div>)}</div>}
    <div className="mp-total"><span>{hasUnknown?"Subtotal dos itens com preço informado":"Total dos itens selecionados"}</span><strong>{money(subtotal)}</strong>{hasUnknown&&<small>O valor final depende dos produtos avulsos escolhidos.</small>}</div>
    {chosen.length===1?<a className="mp-checkout" href={chosen[0].url} target="_blank" rel="noopener noreferrer">Ir para o checkout <ArrowRight size={17}/></a>:chosen.length>1?<div className="mp-multi"><p>Por enquanto, a Kiwify utiliza um checkout individual para cada produto. Você pode contratar os itens abaixo separadamente:</p>{chosen.map(p=><a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">{p.name}<ArrowRight size={15}/></a>)}</div>:<button className="mp-checkout" disabled>Selecione um produto</button>}
    <p className="mp-note"><ShieldCheck size={16}/> Você será direcionado ao checkout seguro da Kiwify. Nenhuma compra é feita nesta página.</p>
   </div></aside></div>
  </div>
 </main>;
}
