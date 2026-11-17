"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShoppingBag, ShieldCheck, Sparkles, LayoutTemplate, Users, Blocks, Crown, Globe2, PanelsTopLeft, Copy, FileText, ListChecks, BookOpen, Search, ContactRound, BriefcaseBusiness, Clock3, Gift, BadgePercent, Zap } from "lucide-react";
import "./montar-pacote.css";
import { PageNovaTrustSections, PageNovaFooter } from "../landing-revamp";

type Product={id:string;name:string;group:string;price:number|null;url:string;includes?:string[]};
const products:Product[]=[
 {id:"studio",name:"PageNova Studio",group:"Planos",price:207,url:"https://pay.kiwify.com.br/ON277u4",includes:["site","landing","clone","quiz","ebook"]},
 {id:"crm",name:"PageNova CRM",group:"Planos",price:247,url:"https://pay.kiwify.com.br/2m1rDJy",includes:["search","leads","commercial"]},
 {id:"apps",name:"Apps e Sistemas",group:"Planos",price:397,url:"https://pay.kiwify.com.br/MdZcLn7"},
 {id:"completo",name:"PageNova Completa",group:"Planos",price:597,url:"https://pay.kiwify.com.br/grqYCk6",includes:["studio","crm","apps","site","landing","clone","quiz","ebook","form","search","leads","commercial"]},
 {id:"site",name:"Criar Sites com IA",group:"Studio",price:79,url:"https://pay.kiwify.com.br/LJu4sCp"},
 {id:"landing",name:"Criar Landing Page com IA",group:"Studio",price:39,url:"https://pay.kiwify.com.br/D1PCPD2"},
 {id:"clone",name:"Clonador de Páginas",group:"Studio",price:49,url:"https://pay.kiwify.com.br/X2B2QQF"},
 {id:"form",name:"Formulário Inteligente",group:"Studio",price:29,url:"https://pay.kiwify.com.br/34RNg6p"},
 {id:"quiz",name:"Quizzes Interativos",group:"Studio",price:29,url:"https://pay.kiwify.com.br/DCzajEq"},
 {id:"ebook",name:"Criar E-books com IA",group:"Studio",price:39,url:"https://pay.kiwify.com.br/jo1HpuT"},
 {id:"search",name:"Buscar Empresas",group:"CRM",price:59,url:"https://pay.kiwify.com.br/xxbBj0R"},
 {id:"leads",name:"Gestão de Leads",group:"CRM",price:49,url:"https://pay.kiwify.com.br/MULLtCp"},
 {id:"commercial",name:"Operação Comercial",group:"CRM",price:49,url:"https://pay.kiwify.com.br/LzpevGpD"}
];
const icons:Record<string,typeof Sparkles>={studio:Sparkles,crm:Users,apps:Blocks,completo:Crown,site:Globe2,landing:PanelsTopLeft,clone:Copy,form:FileText,quiz:ListChecks,ebook:BookOpen,search:Search,leads:ContactRound,commercial:BriefcaseBusiness};
const campaignStart=Date.parse("2026-11-23T00:00:00-03:00");
const campaignEnd=Date.parse("2026-12-01T00:00:00-03:00");
const benefits:Record<string,string>={studio:"Seu estúdio digital com IA em um só lugar.",crm:"Organize contatos e oportunidades comerciais.",apps:"Soluções digitais para ampliar sua operação.",completo:"Reúna o ecossistema PageNova em um pacote.",site:"Crie sua presença digital com inteligência artificial.",landing:"Apresente ofertas em páginas de conversão.",clone:"Use uma página existente como ponto de partida.",form:"Colete informações com formulários personalizados.",quiz:"Crie experiências interativas para captar interesse.",ebook:"Produza materiais digitais com ajuda da IA.",search:"Encontre empresas para sua prospecção.",leads:"Centralize e acompanhe seus contatos.",commercial:"Organize etapas da sua operação comercial."};
const money=(n:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(n);
export default function MontarPacote({ official = false }: { official?: boolean } = {}){
 const [selected,setSelected]=useState<string[]>([]);
 const [now,setNow]=useState<number|null>(null);
 useEffect(()=>{setNow(Date.now());const interval=window.setInterval(()=>setNow(Date.now()),1000);return ()=>window.clearInterval(interval)},[]);
 useEffect(()=>{const plan=new URLSearchParams(window.location.search).get("plan");if(plan&&plan!=="apps"&&products.some(p=>p.id===plan))setSelected([plan]);},[]);
 const included=useMemo(()=>new Set(selected.flatMap(id=>products.find(p=>p.id===id)?.includes||[])),[selected]);
 const chosen=products.filter(p=>selected.includes(p.id));
 const priced=chosen.filter(p=>p.price!==null);
 const subtotal=priced.reduce((sum,p)=>sum+(p.price||0),0);
 const hasUnknown=chosen.some(p=>p.price===null);
 const rate=chosen.length>=3?.20:chosen.length===2?.15:chosen.length===1?.10:0;
 const estimatedSaving=Math.round(subtotal*rate*100)/100;
 const isCampaignUpcoming=now!==null&&now<campaignStart;
 const isCampaignLive=now!==null&&now>=campaignStart&&now<campaignEnd;
 const countdownTarget=isCampaignUpcoming?campaignStart:campaignEnd;
 const remaining=Math.max(0,Math.floor(((countdownTarget)-(now??countdownTarget))/1000));
 const countdown=[Math.floor(remaining/86400),Math.floor(remaining%86400/3600),Math.floor(remaining%3600/60),remaining%60];
 function toggle(id:string){
  if(id==="apps")return;
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
  <header className="mp-header"><Link href={official?"/":"/teste"} aria-label="Voltar à PageNova"><img src="/brand/pagenova-logo.png" alt="PageNova AI"/></Link><Link href={official?"/#planos":"/teste#planos"} className="mp-back"><ArrowLeft size={16}/> Voltar aos planos</Link></header>
  <div className="mp-wrap">
   <div className="mp-intro"><span><Sparkles size={14}/> CONTRATE DO SEU JEITO</span><h1>Seu negócio. <em>Suas escolhas.</em></h1><p>Monte um pacote sob medida: combine planos e ferramentas ou contrate somente o que precisa. Sem complicação.</p><div className="mp-intro-pills"><span><Check size={14}/> Escolha livre</span><span><Check size={14}/> Sem itens duplicados</span><span><ShieldCheck size={14}/> Checkout seguro</span></div></div>
   {now!==null&&now<campaignEnd&&<section className="mp-campaign" aria-label="Prévia da campanha Black Friday"><div className="mp-campaign-copy"><span className="mp-campaign-kicker"><Gift size={15}/> BLACK FRIDAY PAGENOVA AI</span><h2>Mais ferramentas. <em>Mais possibilidades.</em></h2><p>{isCampaignUpcoming?"Campanha prevista para 23 a 30 de novembro. Confira as condições antes de contratar.":"Período da campanha: 23 a 30 de novembro. Condições promocionais sujeitas à confirmação no checkout."}</p><div className="mp-discount-tiers"><span>1 item <strong>10% OFF*</strong></span><span>2 itens <strong>15% OFF*</strong></span><span>3+ itens <strong>20% OFF*</strong></span></div><small>*Proposta promocional em configuração. Descontos ainda não estão habilitados nos checkouts Kiwify.</small></div><div className="mp-campaign-timer"><span><Clock3 size={15}/> {isCampaignUpcoming?"INÍCIO PREVISTO EM":"PERÍODO TERMINA EM"}</span><div className="mp-clock" aria-label="Contagem regressiva">{countdown.map((v,i)=><div key={i}><strong>{String(v).padStart(2,"0")}</strong><small>{["DIAS","HORAS","MIN","SEG"][i]}</small></div>)}</div><small>Horário de Brasília · Contador com data fixa</small></div></section>}
   <div className="mp-layout"><div className="mp-catalog">
    {["Planos","Studio","CRM"].map(group=><section key={group} className="mp-group"><div className="mp-group-title"><h2>{group==="Planos"?"Pacotes completos":group==="Studio"?"Ferramentas Studio":"Ferramentas CRM"}</h2><p>{group==="Planos"?"Escolha um pacote ou pule esta etapa.":"Adicione apenas as ferramentas que desejar."}</p></div><div className="mp-products">{products.filter(p=>p.group===group).map(p=>{
      const isIncluded=!selected.includes(p.id)&&included.has(p.id);
      const active=selected.includes(p.id);
      return <button key={p.id} type="button" disabled={isIncluded||p.id==="apps"} className={"mp-product"+(active?" active":"")} onClick={()=>toggle(p.id)} aria-pressed={active}><span className="mp-check">{(()=>{const Icon=icons[p.id]||LayoutTemplate;return <Icon size={21} strokeWidth={1.8}/>})()}</span><span className="mp-product-info"><strong>{p.name}</strong><span className="mp-product-benefit">{benefits[p.id]}</span><small>{p.id==="apps"?"Em Breve":isIncluded?"Já incluído no seu pacote":p.price!==null?money(p.price)+"/mês":"Consulte condições no checkout"}</small></span><span className="mp-action">{active?<Check size={17}/>:isIncluded?<Check size={16}/>:<Plus size={17}/>}</span></button>;
    })}</div></section>)}
   </div>
   <aside className="mp-summary"><div className="mp-summary-inner"><div className="mp-summary-heading"><span className="mp-summary-icon"><ShoppingBag size={21}/></span><div><small>RESUMO DA CONTRATAÇÃO</small><h2>Seu pacote <span>{chosen.length}</span></h2></div></div>{chosen.length===0?<div className="mp-empty"><ShoppingBag size={29}/><p>Seu pacote começa aqui.</p><small>Selecione os produtos ao lado. Você não precisa escolher um plano completo.</small></div>:<div className="mp-selected">{chosen.map(p=><div key={p.id} className="mp-selected-row"><span>{p.name}</span><button type="button" onClick={()=>toggle(p.id)} aria-label={"Remover "+p.name}><Minus size={15}/></button></div>)}</div>}
    {chosen.length>0&&now!==null&&now<campaignEnd&&<div className="mp-promo-estimate"><div className="mp-promo-title"><BadgePercent size={17}/> Simulação Black Friday</div><div className="mp-promo-row"><span>Desconto proposto ({Math.round(rate*100)}%)</span><strong>− {money(estimatedSaving)}</strong></div><div className="mp-promo-row mp-promo-highlight"><span>Subtotal simulado*</span><strong>{money(subtotal-estimatedSaving)}</strong></div><small>*Não aplicado no pagamento. O checkout da Kiwify continua com seus preços próprios até a promoção ser configurada.</small></div>}
    <div className="mp-total"><span>{hasUnknown?"Subtotal dos itens com preço informado":"Total dos itens selecionados"}</span><strong>{money(subtotal)}</strong>{hasUnknown&&<small>Os valores são informativos; confira as condições no checkout.</small>}</div>
    {official?<div className="mp-multi"><p>Os novos produtos e pacotes estão em integração com o acesso automático. Para evitar uma cobrança sem liberação de recursos, o checkout desses itens fica indisponível no site oficial até a validação.</p><Link href="/cadastro?trial=1">Iniciar teste grátis de 5 dias <ArrowRight size={15}/></Link><Link href="/planos-atuais">Consultar assinaturas já disponíveis <ArrowRight size={15}/></Link></div>:chosen.length===1?<a className="mp-checkout" href={chosen[0].url} target="_blank" rel="noopener noreferrer">Ir para o checkout <ArrowRight size={17}/></a>:chosen.length>1?<div className="mp-multi"><p>Por enquanto, a Kiwify utiliza um checkout individual para cada produto. Você pode contratar os itens abaixo separadamente:</p>{chosen.map(p=><a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">{p.name}<ArrowRight size={15}/></a>)}</div>:<button className="mp-checkout" disabled>Selecione um produto</button>}
    <p className="mp-note"><ShieldCheck size={16}/>{official?"As novas contratações serão liberadas após a integração do acesso automático. O teste grátis e as assinaturas existentes continuam disponíveis.":"Você será direcionado ao checkout seguro da Kiwify. Nenhuma compra é feita nesta página."}</p>
   </div></aside></div>
  </div>
  <div className="mp-after-catalog"><PageNovaTrustSections/><PageNovaFooter onPackagePage homePath={official?"/":"/teste"}/></div>
 </main>;
}
