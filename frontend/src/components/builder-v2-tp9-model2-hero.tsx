"use client";
import {useState} from "react";
type Props={brand:string;niche:string;headline?:string;description?:string;image?:string;contactHref?:string};
const data:Record<string,[string,string,string]>={
"oficinas mecanicas":["MECÂNICA COM PRECISÃO.","Cuidado técnico para cada etapa da sua jornada.","photo-1486262715619-67b85e0b08d3"],
"auto centers":["PERFORMANCE EM CADA DETALHE.","Soluções automotivas para seguir com confiança.","photo-1486262715619-67b85e0b08d3"],
"estetica automotiva":["DETALHAMENTO SEM LIMITES.","O acabamento que valoriza cada linha do seu veículo.","photo-1492144534655-ae79c964c9d7"],
"detalhamento automotivo":["DETALHAMENTO SEM LIMITES.","Precisão, brilho e cuidado em cada detalhe.","photo-1492144534655-ae79c964c9d7"],
"funilaria e pintura":["ACABAMENTO DE ALTO PADRÃO.","Restauração e pintura com atenção a cada detalhe.","photo-1486262715619-67b85e0b08d3"],
"lava-rapidos":["BRILHO EM CADA DETALHE.","Cuidado e apresentação para o seu veículo.","photo-1600585154340-be6161a56a0c"],
"autoeletricas":["TECNOLOGIA EM MOVIMENTO.","Soluções elétricas para sua mobilidade.","photo-1486262715619-67b85e0b08d3"],
"lojas de pneus":["PRONTO PARA A ESTRADA.","Encontre opções de pneus para seguir em frente.","photo-1503376780353-7e6692767b70"],
"centros de alinhamento":["PRECISÃO NA DIREÇÃO.","Ajustes e cuidado para sua próxima jornada.","photo-1486262715619-67b85e0b08d3"],
"oficinas de motos":["PAIXÃO EM DUAS RODAS.","Serviços especializados para sua motocicleta.","photo-1558981806-ec527fa84c39"],
"concessionarias de veiculos":["SEU PRÓXIMO CAPÍTULO COMEÇA AQUI.","Conheça veículos e possibilidades para sua jornada.","photo-1503376780353-7e6692767b70"],
"locadoras de veiculos":["LIBERDADE PARA IR ALÉM.","Encontre o veículo certo para cada destino.","photo-1503376780353-7e6692767b70"]
};
const norm=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export function BuilderV2TP9Model2Hero({brand,niche,headline,description,image,contactHref}:Props){
 const [menu,setMenu]=useState(false);
 const effectiveNiche=/detailing|detail|est[eé]tica/i.test(brand)&&norm(niche)==="auto centers"?"Estética automotiva":niche;
 const d=data[norm(effectiveNiche)]||data["auto centers"];
 const src=image&&/^https:\/\//.test(image)?image:"https://www.meritpartners.com/images/vehicles/media/mediapage_09.jpg";
 const isDetailing=/estetica automotiva|detalhamento automotivo/.test(norm(effectiveNiche));
 const heroTitle=isDetailing?"DETAILING DONE RIGHT.":d[0];
 return <div className="tp9m2" data-tp9-model="02"><style>{`
 .tp9m2{background:#070808;color:#f9f7f2;font-family:Arial,Helvetica,sans-serif;isolation:isolate;overflow:hidden}.tp9m2 *{box-sizing:border-box}.tp9m2 a{text-decoration:none;color:inherit}
 .tp9m2-nav{position:relative;z-index:4;min-height:82px;display:flex;justify-content:space-between;align-items:center;gap:24px;padding:14px clamp(20px,5vw,90px);border-bottom:1px solid #ffffff29;background:#070808}
 .tp9m2-brand{font-weight:900;letter-spacing:.11em;font-size:clamp(18px,2vw,27px);text-transform:uppercase}.tp9m2-brand span{color:#c6a36a}
 .tp9m2-links{display:flex;gap:30px;align-items:center;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
 .tp9m2-btn{display:inline-flex;align-items:center;justify-content:center;gap:15px;background:#bc955c;color:#0c0c0c!important;border:1px solid #bc955c;padding:16px 25px;font-weight:800;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
 .tp9m2-btn-ghost{background:transparent;color:white!important;border-color:#ffffff70}
 .tp9m2-menu{display:none;background:transparent;border:1px solid #ffffff80;color:white;padding:10px 14px}
 .tp9m2-hero{min-height:760px;height:calc(100svh - 82px);max-height:1040px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;padding:clamp(40px,6vh,85px) 5% 0;isolation:isolate}
 .tp9m2-heroimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 58%;z-index:-2;filter:brightness(.75) contrast(1.18) saturate(.85)}
 .tp9m2-hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#050505cf 0%,#05050590 32%,transparent 59%,#05050565 100%);z-index:-1}
 .tp9m2-kicker{font-size:11px;letter-spacing:.32em;color:#d5b47f;font-weight:700;text-transform:uppercase;margin:0 0 20px}
 .tp9m2-hero h1{font-size:clamp(3rem,6.4vw,7rem);font-weight:950;line-height:.94;letter-spacing:.015em;max-width:1050px;overflow-wrap:anywhere;text-transform:uppercase;margin:0;text-wrap:balance}
 .tp9m2-hero h1 em{font-style:normal;color:#c6a36a}.tp9m2-hero p{font-size:clamp(14px,1.3vw,18px);max-width:600px;line-height:1.6;color:#e2e0da;margin:23px auto}
 .tp9m2-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}.tp9m2-bottom{position:absolute;bottom:0;left:0;right:0;display:grid;grid-template-columns:repeat(4,1fr);background:#070808de;border-top:1px solid #ffffff36}
 .tp9m2-bottom>div{padding:26px 24px;border-right:1px solid #ffffff2b;display:flex;gap:14px;align-items:center;justify-content:center;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:700}.tp9m2-bottom b{color:#c6a36a;font-size:20px}
 .tp9m2-garage{pointer-events:none;position:absolute;inset:0;z-index:-1;background:linear-gradient(115deg,transparent 0 12%,#e7e5d5cc 12.15%,transparent 12.35% 87%,#e7e5d5cc 87.2%,transparent 87.4%) top 13% center/100% 3px no-repeat;opacity:.7}
 .tp9m2-side{position:absolute;right:2.2%;top:24%;display:flex;flex-direction:column;gap:25px;text-align:left;color:#ddd;z-index:1}.tp9m2-side span{display:block;font-size:9px;letter-spacing:.14em;color:#bfa277}.tp9m2-side strong{display:block;font-size:13px;font-weight:700}.tp9m2-side>div{border-left:1px solid #bfa277;padding-left:12px}
 .tp9m2-social{position:absolute;left:2.2%;top:36%;writing-mode:vertical-rl;transform:rotate(180deg);font-size:10px;letter-spacing:.22em;color:#c9ae80}
 .tp9m2-hero .tp9m2-detail{font-size:clamp(11px,1vw,14px);color:#d6d0c5;letter-spacing:.03em}
 .tp9m2-hero .tp9m2-kicker{margin-bottom:16px}
 .tp9m2-hero .tp9m2-actions{margin-top:4px}
 .tp9m2-hero .tp9m2-actions .tp9m2-btn{border-radius:30px}
 .tp9m2-hero .tp9m2-bottom{backdrop-filter:blur(12px)}
 @media(min-width:801px){.tp9m2-hero{padding-top:clamp(35px,6vh,85px)}.tp9m2-heroimg{object-position:center 58%}}
 @media(max-width:800px){.tp9m2-nav{min-height:72px}.tp9m2-links{display:none}.tp9m2-menu{display:block}.tp9m2-links.is-open{display:flex;position:absolute;top:100%;left:0;right:0;background:#101111;padding:25px;flex-direction:column;align-items:stretch}.tp9m2-nav>.tp9m2-btn{display:none}.tp9m2-hero{height:auto;min-height:760px;padding:75px 18px 190px}.tp9m2-hero h1{font-size:clamp(2.4rem,9vw,4.5rem);max-width:100%;line-height:1.02}.tp9m2-hero p{max-width:100%;overflow-wrap:anywhere}.tp9m2-kicker{font-size:9px;letter-spacing:.15em}.tp9m2-heroimg{object-position:center 60%}.tp9m2-side,.tp9m2-social{display:none}.tp9m2-actions .tp9m2-btn{padding:13px 17px;font-size:10px}.tp9m2-bottom{grid-template-columns:1fr 1fr}.tp9m2-bottom>div{padding:17px 8px;font-size:9px}}
 `}</style>
 <header className="tp9m2-nav"><a href="#tp9m2-home" className="tp9m2-brand">{brand}<span>.</span></a><nav className={"tp9m2-links"+(menu?" is-open":"")} aria-label="Menu principal"><a href="#tp9m2-home">Início</a><a href="#tp9-servicos">Serviços</a><a href="#tp9-sobre">Sobre nós</a><a href="#tp9-contato">Contato</a></nav>{contactHref&&<a className="tp9m2-btn" href={contactHref}>Solicitar orçamento ↗</a>}<button type="button" className="tp9m2-menu" aria-label="Abrir menu" aria-expanded={menu} onClick={()=>setMenu(!menu)}>☰</button></header>
 <section id="tp9m2-home" className="tp9m2-hero"><img className="tp9m2-heroimg" src={src} alt={"Veículo premium em destaque para "+effectiveNiche}/><div className="tp9m2-garage" aria-hidden="true"/><div className="tp9m2-social" aria-hidden="true">PREMIUM DETAILING</div><div className="tp9m2-side" aria-hidden="true"><div><span>01 /</span><strong>PRECISÃO</strong></div><div><span>02 /</span><strong>PROTEÇÃO</strong></div><div><span>03 /</span><strong>ACABAMENTO</strong></div></div><p className="tp9m2-kicker">PREMIUM CAR CARE · IMPECCABLE RESULTS</p><h1>{isDetailing?<>DETAILING<br/><em>DONE RIGHT.</em></>:<>{heroTitle.split(" ").slice(0,-2).join(" ")}<br/><em>{heroTitle.split(" ").slice(-2).join(" ")}</em></>}</h1><p className="tp9m2-detail">{isDetailing?"Estética automotiva, polimento técnico e proteção de pintura com atenção a cada detalhe.":d[1]}</p><div className="tp9m2-actions"><a className="tp9m2-btn" href="#tp9-servicos">Ver serviços →</a>{contactHref&&<a className="tp9m2-btn tp9m2-btn-ghost" href={contactHref}>Agendar atendimento ↗</a>}</div><div className="tp9m2-bottom"><div><b>♧</b> Cuidado exterior</div><div><b>◇</b> Higienização interna</div><div><b>⬡</b> Proteção de pintura</div><div><b>◉</b> Rodas e acabamento</div></div></section></div>
}
