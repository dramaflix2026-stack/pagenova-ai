"use client";
import {useState} from "react";
import "./builder-v2-tp6-model2.css";
type Props={brand:string;niche:string;headline?:string;description?:string;image?:string;ctaHref?:string;photos:string[]};
const copy:Record<string,{tag:string;title:string;description:string;cta:string}>={
"Loja de roupas":{tag:"NOVA COLEÇÃO",title:"Vista o que faz você único.",description:"Peças que acompanham sua personalidade, do essencial ao extraordinário.",cta:"Explorar coleção"},
"Loja de calçados":{tag:"PASSO A PASSO",title:"Seu estilo começa por aqui.",description:"Design e conforto para acompanhar cada movimento.",cta:"Ver calçados"},
"Joalheria e semijoias":{tag:"DETALHES QUE MARCAM",title:"O extraordinário mora nos detalhes.",description:"Peças para celebrar momentos e expressar sua essência.",cta:"Descobrir peças"},
"Ótica":{tag:"NOVO OLHAR",title:"Veja o mundo com outro estilo.",description:"Design, personalidade e conforto em cada escolha.",cta:"Explorar modelos"},
"Perfumaria e cosméticos":{tag:"SEU RITUAL",title:"Beleza que acompanha você.",description:"Descubra fragrâncias e cuidados que fazem parte da sua história.",cta:"Conhecer produtos"},
"Pet shop":{tag:"PARA QUEM É FAMÍLIA",title:"Mais carinho em cada detalhe.",description:"Tudo para o bem-estar de quem está sempre ao seu lado.",cta:"Ver produtos"},
"Loja de eletrônicos":{tag:"TECNOLOGIA PARA VIVER",title:"O futuro faz parte da sua rotina.",description:"Tecnologia funcional com design que surpreende.",cta:"Explorar tecnologia"},
"Loja de celulares e acessórios":{tag:"CONECTE SEU ESTILO",title:"Tudo se conecta ao seu jeito.",description:"Acessórios e tecnologia para acompanhar seu dia.",cta:"Ver novidades"},
"Loja de móveis e decoração":{tag:"ESPAÇOS COM IDENTIDADE",title:"Seu espaço. Sua assinatura.",description:"Design e conforto para transformar ambientes.",cta:"Explorar ambientes"},
"Floricultura":{tag:"FLORES E AFETOS",title:"A beleza de cada momento.",description:"Composições florais para celebrar e surpreender.",cta:"Ver arranjos"},
"Papelaria":{tag:"IDEIAS GANHAM FORMA",title:"Crie todos os dias.",description:"Inspiração e organização para acompanhar seus projetos.",cta:"Explorar produtos"},
"Loja de brinquedos":{tag:"IMAGINAÇÃO SEM LIMITES",title:"Um mundo inteiro para brincar.",description:"Descobertas, histórias e diversão em cada detalhe.",cta:"Ver brinquedos"},
"Loja de artigos esportivos":{tag:"MOVIMENTO É TUDO",title:"Viva seu próximo desafio.",description:"Equipamentos e estilo para ir mais longe.",cta:"Explorar produtos"},
"Loja de presentes e personalizados":{tag:"GESTOS QUE FICAM",title:"Presentes com significado.",description:"Escolhas especiais para pessoas inesquecíveis.",cta:"Ver presentes"},
"E-commerce multimarcas":{tag:"CURADORIA ESPECIAL",title:"Descubra seu próximo favorito.",description:"Uma seleção de produtos para diferentes momentos e estilos.",cta:"Explorar seleção"}
};
export function BuilderV2TP6Model2Hero({brand,niche,headline,description,image,ctaHref,photos}:Props){
 const [open,setOpen]=useState(false);
 const c=copy[niche]||copy["E-commerce multimarcas"];
 const primary=image||photos[0];
 const secondary=photos.find(p=>p!==primary)||primary;
 return <div className="tp6m2">
 <header className="tp6m2-header"><a className="tp6m2-brand" href="#inicio">{brand}</a><nav className={open?"open":""} aria-label="Navegação da loja"><a href="#inicio" onClick={()=>setOpen(false)}>Início</a><a href="#produtos" onClick={()=>setOpen(false)}>Coleção</a><a href="#sobre" onClick={()=>setOpen(false)}>Nossa história</a><a href="#contato" onClick={()=>setOpen(false)}>Contato</a></nav><a className="tp6m2-header-cta" href={ctaHref||"#produtos"}>Explorar <span aria-hidden="true">↗</span></a><button type="button" className="tp6m2-menu" onClick={()=>setOpen(!open)} aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open}>{open?"✕":"☰"}</button></header>
 <section id="inicio" className="tp6m2-hero"><div className="tp6m2-copy"><span className="tp6m2-kicker"><span className="tp6m2-dot"/> {c.tag} <span className="tp6m2-line"/></span><h1>{headline||c.title}</h1><p>{description||c.description}</p><a className="tp6m2-action" href={ctaHref||"#produtos"}>{c.cta}<span aria-hidden="true">↗</span></a><div className="tp6m2-footnote"><span>01 / 02</span><span>CURADORIA & ESTILO</span></div></div><div className="tp6m2-visual">{primary?<img className="tp6m2-main-image" src={primary} alt={"Fotografia principal de "+niche}/>:<div className="tp6m2-placeholder" aria-label="Imagem de campanha pendente"/>}<div className="tp6m2-visual-tag">ESSENCIAIS<br/>DA ESTAÇÃO <span>↗</span></div>{secondary&&<div className="tp6m2-secondary"><img src={secondary} alt={"Detalhe da coleção de "+niche}/></div>}<div className="tp6m2-vertical">DESIGN • CURADORIA • EXPERIÊNCIA</div></div></section>
 </div>;
}
