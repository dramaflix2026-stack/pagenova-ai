"use client";
import {useState} from "react";
import "./builder-v2-tp6-model3.css";
type Props={brand:string;niche:string;headline?:string;description?:string;photos:string[];ctaHref?:string};
const tags:Record<string,string>={"Loja de roupas":"MODA & EXPRESSÃO","Loja de calçados":"CADA PASSO CONTA","Joalheria e semijoias":"JOIAS & IDENTIDADE","Ótica":"UM NOVO OLHAR","Perfumaria e cosméticos":"BELEZA & ATITUDE","Pet shop":"ESTILO PARA SEU PET","Loja de eletrônicos":"TECNOLOGIA EM FOCO","Loja de celulares e acessórios":"CONEXÕES & ESTILO","Loja de móveis e decoração":"DESIGN PARA VIVER","Floricultura":"FLORES & EXPRESSÃO","Papelaria":"IDEIAS EM MOVIMENTO","Loja de brinquedos":"IMAGINE MAIS","Loja de artigos esportivos":"MOVIMENTO & ENERGIA","Loja de presentes e personalizados":"PRESENTES COM SENTIDO","E-commerce multimarcas":"ESCOLHAS SEM LIMITES"};
const titles:Record<string,string>={"Loja de roupas":"Vista sua própria história.","Loja de calçados":"Seu próximo passo começa aqui.","Joalheria e semijoias":"Seu brilho. Suas regras.","Ótica":"Um olhar muda tudo.","Perfumaria e cosméticos":"Beleza sem fórmulas.","Pet shop":"Amor em cada detalhe.","Loja de eletrônicos":"O novo é agora.","Loja de celulares e acessórios":"Conecte o seu mundo.","Loja de móveis e decoração":"Habite seu estilo.","Floricultura":"Flores para sentir.","Papelaria":"Ideias fora da caixa.","Loja de brinquedos":"Brincar é descobrir.","Loja de artigos esportivos":"Vá além do comum.","Loja de presentes e personalizados":"Surpreenda de verdade.","E-commerce multimarcas":"Descubra o inesperado."};
export function BuilderV2TP6Model3Hero({brand,niche,headline,description,photos,ctaHref}:Props){
 const [open,setOpen]=useState(false);
 const main=photos[0];const detail=photos[1]||main;
 return <div className="tp6m3" data-tp6-model3="hero">
  <header className="tp6m3-header">
   <a href="#inicio" className="tp6m3-logo">{brand}</a>
   <nav className={open?"tp6m3-nav open":"tp6m3-nav"} aria-label="Navegação"><a href="#inicio" onClick={()=>setOpen(false)}>Início</a><a href="#produtos" onClick={()=>setOpen(false)}>Coleções</a><a href="#sobre" onClick={()=>setOpen(false)}>Sobre</a><a href="#contato" onClick={()=>setOpen(false)}>Contato</a></nav>
   <a className="tp6m3-header-action" href={ctaHref||"#produtos"}>EXPLORAR <span aria-hidden="true">↗</span></a>
   <button type="button" className="tp6m3-toggle" aria-expanded={open} aria-label={open?"Fechar menu":"Abrir menu"} onClick={()=>setOpen(!open)}>{open?"✕":"☰"}</button>
  </header>
  <section className="tp6m3-hero" id="inicio">
   <div className="tp6m3-hero-left">
    <div className="tp6m3-topline"><span>ESTÚDIO / SELEÇÃO</span><span>01 — 03</span></div>
    <div className="tp6m3-copy"><span className="tp6m3-eyebrow">{tags[niche]||tags["E-commerce multimarcas"]}</span><h1>{headline||titles[niche]||titles["E-commerce multimarcas"]}</h1><p>{description||"Uma seleção feita para descobrir novos favoritos e expressar o que torna cada escolha única."}</p><a className="tp6m3-cta" href={ctaHref||"#produtos"}><span>DESCUBRA A SELEÇÃO</span><span aria-hidden="true">↗</span></a></div>
    <div className="tp6m3-bottomline"><span>UMA NOVA PERSPECTIVA</span><span>↓ DESLIZE PARA EXPLORAR</span></div>
   </div>
   <div className="tp6m3-hero-right">{main?<img className="tp6m3-main-photo" src={main} alt={"Fotografia editorial de "+niche} fetchPriority="high"/>:<div className="tp6m3-empty"/>}<span className="tp6m3-image-index">01 / EDITORIAL</span><div className="tp6m3-photo-inset">{detail&&<img src={detail} alt={"Detalhe de "+niche}/>}</div><span className="tp6m3-vertical-label">CURADORIA INDEPENDENTE • ESTILO CONTEMPORÂNEO</span></div>
  </section>
 </div>
}
const editorialTopics:Record<string,string>={"Loja de roupas":"MODA QUE EXPRESSA","Loja de calçados":"CADA PASSO TEM HISTÓRIA","Joalheria e semijoias":"DETALHES QUE FALAM","Ótica":"NOVAS FORMAS DE VER","Perfumaria e cosméticos":"BELEZA EM MOVIMENTO","Pet shop":"CUIDADO COM PERSONALIDADE","Loja de eletrônicos":"TECNOLOGIA COM IDENTIDADE","Loja de celulares e acessórios":"CONEXÕES DO COTIDIANO","Loja de móveis e decoração":"ESPAÇOS QUE CONTAM","Floricultura":"FLORES E SIGNIFICADOS","Papelaria":"IDEIAS QUE GANHAM VIDA","Loja de brinquedos":"O MUNDO DA IMAGINAÇÃO","Loja de artigos esportivos":"MOVIMENTO QUE INSPIRA","Loja de presentes e personalizados":"GESTOS QUE PERMANECEM","E-commerce multimarcas":"UM UNIVERSO DE ESCOLHAS"};
const retailValues:Record<string,[string,string,string,string]>={
"Pet shop":["Bem-estar","Escolhas para diferentes necessidades dos pets.","Variedade","Categorias organizadas para explorar com facilidade."],
"Loja de eletrônicos":["Tecnologia","Uma seleção para descobrir soluções do cotidiano.","Clareza","Informações acessíveis para comparar alternativas."],
"Loja de celulares e acessórios":["Conexão","Opções para diferentes formas de se conectar.","Praticidade","Uma navegação simples por produtos e acessórios."],
"Floricultura":["Expressão","Composições para diferentes ocasiões e sentimentos.","Descoberta","Inspiração para encontrar o arranjo desejado."],
"Joalheria e semijoias":["Detalhes","Peças que complementam diferentes estilos.","Expressão","Escolhas que acompanham momentos e identidades."]
};
export function BuilderV2TP6Model3AboutAndValues({brand,niche,photos}:{brand:string;niche:string;photos:string[]}){
 const title=editorialTopics[niche]||editorialTopics["E-commerce multimarcas"];
 const [v1,d1,v2,d2]=retailValues[niche]||["Curadoria","Uma seleção apresentada com atenção à identidade visual.","Descoberta","Um jeito simples de explorar categorias e encontrar opções."];
 const values=[{n:"01",title:v1,desc:d1},{n:"02",title:v2,desc:d2},{n:"03",title:"Identidade",desc:"Uma experiência visual alinhada ao universo de "+niche.toLocaleLowerCase("pt-BR")+"."},{n:"04",title:"Experiência",desc:"Navegação responsiva e caminhos claros para conhecer a seleção."}];
 return <div className="tp6m3 tp6m3-sections">
  <section className="tp6m3-about" id="sobre" aria-labelledby="tp6m3-about-title">
   <div className="tp6m3-section-meta"><span>02 / SOBRE A MARCA</span><span>UM OLHAR EDITORIAL</span></div>
   <h2 id="tp6m3-about-title" className="tp6m3-about-heading">{title}<span className="tp6m3-period">.</span></h2>
   <div className="tp6m3-about-layout">
    <div className="tp6m3-about-photo-one">{photos[2]&&<img src={photos[2]} alt={"Fotografia editorial de "+niche} loading="lazy"/>}<span>01 — PERSPECTIVA</span></div>
    <div className="tp6m3-about-center"><span className="tp6m3-about-label">NOSSA VISÃO / {brand}</span><p>Na {brand}, o universo de {niche.toLocaleLowerCase("pt-BR")} ganha uma apresentação própria: visual, contemporânea e feita para explorar novas possibilidades.</p><p>Cada imagem e cada detalhe ajudam a contar a proposta da marca, sem perder a simplicidade de encontrar o que você procura.</p><a href="#produtos">EXPLORE A SELEÇÃO <span aria-hidden="true">↗</span></a></div>
    <div className="tp6m3-about-photo-two">{photos[3]&&<img src={photos[3]} alt={"Detalhes de "+niche} loading="lazy"/>}<span>02 — DETALHES</span></div>
   </div>
   <div className="tp6m3-about-watermark" aria-hidden="true">EDITORIAL / 03</div>
  </section>
  <section className="tp6m3-values" id="diferenciais" aria-labelledby="tp6m3-values-title">
   <div className="tp6m3-section-meta"><span>03 / NOSSOS DIFERENCIAIS</span><span>O QUE ORIENTA A EXPERIÊNCIA</span></div>
   <div className="tp6m3-values-heading"><h2 id="tp6m3-values-title">O QUE NOS<br/>MOVE<span>.</span></h2><p>Quatro princípios para apresentar produtos, facilitar descobertas e dar personalidade à experiência de navegação.</p></div>
   <div className="tp6m3-values-grid">{values.map(v=><article key={v.n} className="tp6m3-value"><span className="tp6m3-value-number">{v.n}</span><div><h3>{v.title}</h3><p>{v.desc}</p></div><span className="tp6m3-value-arrow" aria-hidden="true">↗</span></article>)}</div>
   <div className="tp6m3-values-bottom"><span>IDENTIDADE / CLAREZA / EXPERIÊNCIA</span><span>03 — 03</span></div>
  </section>
 </div>;
}
