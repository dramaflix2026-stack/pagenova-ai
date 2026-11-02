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
export function BuilderV2TP6Model2Sections({brand,niche,photos}:{brand:string;niche:string;photos:string[]}){
 const c=copy[niche]||copy["E-commerce multimarcas"];
 const aboutTitle=niche==="Pet shop"?"Cuidado em cada escolha.":niche==="Floricultura"?"Histórias que florescem.":niche==="Loja de eletrônicos"||niche==="Loja de celulares e acessórios"?"Tecnologia com propósito.":niche==="Loja de móveis e decoração"?"Ambientes com personalidade.":niche==="Loja de artigos esportivos"?"Movimento que inspira.":"Mais que produtos. Uma identidade.";
 const values=niche==="Pet shop"?[["01","Seleção cuidadosa","Produtos pensados para o conforto e o bem-estar dos pets."],["02","Praticidade","Uma experiência de compra simples e intuitiva."],["03","Variedade","Opções para diferentes rotinas e necessidades."],["04","Atenção aos detalhes","Informações claras para ajudar na escolha."]]:[["01","Curadoria","Uma seleção organizada para facilitar sua descoberta."],["02","Experiência","Navegação clara, responsiva e intuitiva."],["03","Personalidade","Produtos e coleções apresentados com identidade."],["04","Praticidade","Informações e caminhos de compra acessíveis."]];
 return <><section id="sobre" className="tp6m2-about"><div className="tp6m2-section-eyebrow"><span>02 / NOSSA ESSÊNCIA</span><span>CONHEÇA A MARCA</span></div><div className="tp6m2-about-grid"><div className="tp6m2-about-images">{photos[1]&&<img src={photos[1]} alt={"Universo visual de "+niche} loading="lazy"/>}{photos[2]&&<img src={photos[2]} alt={"Detalhes da seleção de "+niche} loading="lazy"/>}<span className="tp6m2-about-stamp">ESTILO<br/>EM CADA<br/>DETALHE ↗</span></div><div className="tp6m2-about-copy"><span className="tp6m2-kicker">A HISTÓRIA POR TRÁS</span><h2>{aboutTitle}</h2><p>Na {brand}, acreditamos que cada escolha pode refletir quem você é. Nossa proposta é aproximar você de uma seleção de {niche.toLocaleLowerCase("pt-BR")} com uma experiência que valoriza design, clareza e descoberta.</p><p>{c.description}</p><a href="#produtos" className="tp6m2-text-link">Explore nossa seleção <span aria-hidden="true">↗</span></a></div></div></section><section id="diferenciais" className="tp6m2-values"><div className="tp6m2-section-eyebrow"><span>03 / NOSSO JEITO</span><span>O QUE NOS MOVE</span></div><div className="tp6m2-values-head"><h2>Detalhes que fazem a diferença<span>.</span></h2><p>Uma experiência pensada para você explorar, descobrir e escolher com confiança.</p></div><div className="tp6m2-values-grid">{values.map(([num,title,desc])=><article key={num} className="tp6m2-value"><span className="tp6m2-value-num">{num} / 04</span><span className="tp6m2-value-symbol" aria-hidden="true">↗</span><h3>{title}</h3><p>{desc}</p></article>)}</div></section></>;
}
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

const retailCollections:Record<string,string[]>={
"Loja de roupas":["Essenciais","Novidades","Looks da estação","Acessórios"],
"Loja de calçados":["Casual","Clássicos","Esportivos","Novidades"],
"Joalheria e semijoias":["Colares","Anéis","Brincos","Peças especiais"],
"Ótica":["Armações","Óculos solares","Clássicos","Novidades"],
"Perfumaria e cosméticos":["Fragrâncias","Cuidados com a pele","Maquiagem","Essenciais"],
"Pet shop":["Acessórios","Brinquedos","Conforto","Cuidados"],
"Loja de eletrônicos":["Tecnologia","Áudio","Acessórios","Novidades"],
"Loja de celulares e acessórios":["Celulares","Capas","Carregadores","Acessórios"],
"Loja de móveis e decoração":["Sala de estar","Quarto","Decoração","Ambientes"],
"Floricultura":["Buquês","Arranjos","Plantas","Presentes"],
"Papelaria":["Cadernos","Escrita","Organização","Criatividade"],
"Loja de brinquedos":["Criatividade","Jogos","Primeira infância","Presentes"],
"Loja de artigos esportivos":["Treino","Corrida","Acessórios","Performance"],
"Loja de presentes e personalizados":["Presentes","Personalizados","Ocasiões","Favoritos"],
"E-commerce multimarcas":["Destaques","Novidades","Seleção especial","Favoritos"]
};
export function BuilderV2TP6Model2GalleryAndJourney({niche,photos,ctaHref}:{niche:string;photos:string[];ctaHref?:string}){
 const collections=retailCollections[niche]||retailCollections["E-commerce multimarcas"];
 const steps=[
  {number:"01",title:"Explore a seleção",description:"Navegue pelas coleções e encontre opções que combinam com o que você procura."},
  {number:"02",title:"Escolha seu favorito",description:"Confira os detalhes e as informações disponíveis antes de decidir."},
  {number:"03",title:"Entre em contato",description:"Use o canal de atendimento disponibilizado pela loja para consultar compra, pagamento e entrega."}
 ];
 return <><section id="produtos" className="tp6m2-gallery" aria-labelledby="tp6m2-gallery-title"><div className="tp6m2-section-eyebrow"><span>04 / NOSSA CURADORIA</span><span>DESCUBRA AS COLEÇÕES</span></div><div className="tp6m2-gallery-heading"><h2 id="tp6m2-gallery-title">Encontre o seu próximo favorito<span>.</span></h2><p>Uma seleção visual para conhecer os destaques de {niche.toLocaleLowerCase("pt-BR")}.</p></div><div className="tp6m2-mosaic">{collections.map((label,i)=><a className={"tp6m2-mosaic-card tp6m2-mosaic-card-"+i} href={ctaHref||"#contato"} key={label}>{photos.length>0?<img src={photos[i%photos.length]} alt={"Imagem ilustrativa da coleção "+label} loading="lazy"/>:<div className="tp6m2-mosaic-empty" aria-label="Fotografia da coleção não cadastrada"/>}<span className="tp6m2-mosaic-caption"><span>{String(i+1).padStart(2,"0")} / {label}</span><span aria-hidden="true">↗</span></span></a>)}</div></section><section id="como-comprar" className="tp6m2-journey" aria-labelledby="tp6m2-journey-title"><div className="tp6m2-section-eyebrow"><span>05 / SUA EXPERIÊNCIA</span><span>SIMPLES EM CADA ETAPA</span></div><div className="tp6m2-journey-intro"><h2 id="tp6m2-journey-title">Do primeiro olhar à sua escolha<span>.</span></h2><p>Três passos para descobrir produtos e falar com a loja, sem complicação.</p></div><div className="tp6m2-journey-list">{steps.map(step=><div className="tp6m2-journey-step" key={step.number}><span className="tp6m2-journey-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div><span className="tp6m2-journey-arrow" aria-hidden="true">↗</span></div>)}</div><a className="tp6m2-journey-cta" href={ctaHref||"#contato"}>Conheça a seleção <span aria-hidden="true">↗</span></a></section></>;
}
