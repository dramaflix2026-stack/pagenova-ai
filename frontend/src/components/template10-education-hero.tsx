"use client";
const imageFallback=(event:import("react").SyntheticEvent<HTMLImageElement>)=>{const el=event.currentTarget;if(el.dataset.fallback)return;el.dataset.fallback="true";el.src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1100&q=80";};

import {template10Photo} from "@/components/template10-education-sections";
import {useState} from "react";
import {Template10EducationSections} from "@/components/template10-education-sections";
import type {UniversalSite} from "@/lib/builder-v2-universal-operations";
import {Template10EducationExperience} from "@/components/template10-education-experience";
import {Template10EducationClosing} from "@/components/template10-education-closing";
import {Template10EducationFinal} from "@/components/template10-education-final";
type Props={brand:string;niche:string;site?:UniversalSite;headline?:string;description?:string;image?:string;testimonials?:{name:string;quote:string;role?:string;photo?:string}[];publishedMode?:boolean;contact?:{email?:string;phone?:string;address?:string;hours?:string}};
const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const profiles:Record<string,[string,string,string]>={
"escolas particulares":["Um futuro de possibilidades começa aqui.","Aprendizagem, descoberta e desenvolvimento em cada etapa.","photo-1509062522246-3755977927d7"],
"escolas de idiomas":["Novas línguas. Novos horizontes.","Aprender um idioma abre portas para novas conexões.","photo-1523240795612-9a054b0db644"],
"cursos profissionalizantes":["Conhecimento que abre caminhos.","Formação prática para desenvolver competências.","photo-1523580494863-6f3031224c94"],
"escolas tecnicas":["Seu talento encontra novas possibilidades.","Conhecimento técnico para o próximo passo.","photo-1581091226825-a6a2a5aee158"],
"escolas de musica":["Toda grande história começa com uma nota.","Descubra ritmos e desenvolva habilidades.","photo-1511379938547-c1f69419868d"],
"escolas de danca":["Descubra o movimento que inspira você.","Expressão e criatividade em cada movimento.","photo-1508700115892-45ecd05ae2ad"],
"escolas de artes":["Crie sem limites. Aprenda com propósito.","Ideias e novas formas de expressão artística.","photo-1513364776144-60967b0f800f"],
"cursos preparatorios":["Prepare-se para o que vem pela frente.","Aprendizado e foco nos seus próximos desafios.","photo-1434030216411-0b793f4b4173"],
"reforco escolar":["Cada conquista começa com confiança.","Apoio ao desenvolvimento de cada estudante.","photo-1509062522246-3755977927d7"],
"escolas de programacao":["Aprenda a criar o amanhã.","Lógica, tecnologia e criatividade na formação.","photo-1516321318423-f06f85e504b3"],
"escolas de gastronomia":["Transforme paixão em conhecimento.","Técnica e criatividade no universo gastronômico.","photo-1556911220-bff31c812dba"],
"centros de treinamento corporativo":["Pessoas preparadas transformam negócios.","Desenvolvimento de competências para equipes.","photo-1552664730-d307ca884978"]
};
export function Template10EducationHero({brand,niche,site,headline,description,image,testimonials=[],publishedMode=false,contact}:Props){
 const [open,setOpen]=useState(false);const d=profiles[normalize(niche)]||profiles["cursos profissionalizantes"];
 // Only the approved TP10 Model 1 language-school first fold changes.
 const languageSchool=normalize(niche)==="escolas de idiomas";
 const photo=image&&/^https?:\/\//i.test(image)?image:"https://images.unsplash.com/"+template10Photo(niche,0)+"?auto=format&fit=crop&w=1600&q=85";
 return <div className={languageSchool?"pn-t10 pn-t10-language":"pn-t10"}><style>{'.pn-t10{background:#f6f3ed;color:#212b29;font-family:Arial,sans-serif;overflow-x:clip}.pn-t10 *{box-sizing:border-box}.pn-t10-head{background:white;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:25px clamp(22px,5vw,85px);position:relative}.pn-t10-brand{font-size:clamp(19px,2vw,29px);font-weight:750;letter-spacing:-.04em;text-decoration:none;color:#172b29;max-width:45%;overflow-wrap:anywhere}.pn-t10-nav{display:flex;gap:25px;align-items:center}.pn-t10-nav a{font-size:11px;text-decoration:none;text-transform:uppercase;letter-spacing:.1em;color:#24352f;font-weight:700}.pn-t10-cta{display:inline-block;background:#183e37!important;color:white!important;padding:16px 22px;text-decoration:none;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.pn-t10-toggle{display:none;border:1px solid #bec7c2;background:white;padding:11px}.pn-t10-hero{display:grid;grid-template-columns:1fr 1fr;min-height:650px;max-width:1700px;margin:auto}.pn-t10-copy{display:flex;flex-direction:column;align-items:start;justify-content:center;padding:clamp(65px,8vw,125px) clamp(24px,6vw,95px)}.pn-t10-kicker{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#a27656;font-weight:700}.pn-t10 h1{font:400 clamp(48px,5.8vw,92px)/1.05 Georgia,serif;letter-spacing:-.055em;margin:28px 0;overflow-wrap:break-word}.pn-t10-desc{font-size:clamp(16px,1.5vw,19px);line-height:1.8;color:#61716a;margin:0 0 34px}.pn-t10-photo{position:relative;min-height:560px}.pn-t10-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.pn-t10-caption{position:absolute;bottom:26px;left:26px;background:#fffdf5e8;padding:15px;font-size:11px;letter-spacing:.1em;text-transform:uppercase}.pn-t10-strip{display:flex;justify-content:space-between;gap:15px;background:#e8e6dc;padding:24px clamp(24px,6vw,95px);font-size:11px;letter-spacing:.15em;text-transform:uppercase}@media(max-width:950px){.pn-t10-nav{display:none;position:absolute;top:100%;left:0;right:0;background:white;padding:25px;z-index:4;flex-direction:column;align-items:start}.pn-t10-nav[data-open=true]{display:flex}.pn-t10-toggle{display:block}.pn-t10-hero{grid-template-columns:1fr}.pn-t10-copy{padding:75px 24px}.pn-t10-photo{min-height:400px}}@media(max-width:480px){.pn-t10-copy{padding:48px 22px 35px}.pn-t10 h1{margin:18px 0}.pn-t10-desc{margin-bottom:22px}.pn-t10-head{padding:18px 20px}.pn-t10-photo{min-height:320px}.pn-t10-strip{flex-direction:column}.pn-t10 h1{font-size:clamp(44px,12vw,62px)}}'}</style>
 {languageSchool&&<style>{`
/* Approved reference 1: language-school TP10 M1 first fold only.
   All other TP10 niches, downstream sections, models 2/3 and edit logic
   retain their existing renderers and styling. */
.pn-t10-language{--t10-navy:#071c2b;--t10-navy-2:#0b2636;--t10-lime:#b9ee5b;--t10-white:#f8fbff}
.pn-t10-language .pn-t10-head{background:var(--t10-navy);padding:18px clamp(22px,5.4vw,85px);border-bottom:1px solid #ffffff1b;gap:32px;z-index:10}
.pn-t10-language .pn-t10-brand{max-width:none;display:inline-flex;gap:11px;align-items:center;color:#f8fbff!important;font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:clamp(18px,1.65vw,25px);letter-spacing:-.035em;overflow-wrap:normal}
.pn-t10-language .pn-t10-mark{width:30px;height:30px;display:inline-grid;place-items:center;border-radius:50%;font-size:17px;color:#08222f;background:var(--t10-lime);flex-shrink:0}
.pn-t10-language .pn-t10-nav{display:flex;align-items:center;gap:clamp(18px,2.2vw,36px)}
.pn-t10-language .pn-t10-nav a:not(.pn-t10-cta){font:600 13px/1.35 Arial,Helvetica,sans-serif;letter-spacing:0;text-transform:none;color:#dbe7ed!important;transition:color .2s}
.pn-t10-language .pn-t10-nav a:not(.pn-t10-cta):hover{color:var(--t10-lime)!important}
.pn-t10-language .pn-t10-cta{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:13px 22px;border-radius:8px;background:var(--t10-lime)!important;border:1px solid var(--t10-lime);color:#102524!important;font:700 13px/1.2 Arial,Helvetica,sans-serif;text-transform:none;letter-spacing:0;text-decoration:none;white-space:normal;text-align:center;transition:transform .2s ease,box-shadow .2s ease}
.pn-t10-language .pn-t10-cta:hover{transform:translateY(-2px);box-shadow:0 6px 22px #b9ee5b30}
.pn-t10-language .pn-t10-hero{max-width:none;min-height:0;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(30px,4.1vw,70px);align-items:center;padding:clamp(30px,4.5vw,76px) clamp(22px,5.4vw,85px) clamp(38px,5vw,80px);background:var(--t10-navy)}
.pn-t10-language .pn-t10-copy{padding:0;max-width:580px;min-width:0;justify-content:center}
.pn-t10-language .pn-t10-kicker{display:inline-flex;align-items:center;gap:9px;font-size:11px;letter-spacing:.075em;text-transform:uppercase;font-weight:700;color:#c4e5d7!important}
.pn-t10-language .pn-t10-kicker:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--t10-lime)}
.pn-t10-language .pn-t10-hero h1{font-family:Arial,Helvetica,sans-serif!important;font-size:clamp(33px,3.5vw,55px)!important;font-weight:800!important;line-height:1.09!important;letter-spacing:-.047em!important;margin:22px 0 20px;max-width:17ch;text-wrap:balance;overflow-wrap:normal;word-break:normal;color:var(--t10-white)!important;-webkit-text-fill-color:var(--t10-white)!important;text-shadow:none!important}
.pn-t10-language .pn-t10-desc{color:#c0d1da!important;-webkit-text-fill-color:#c0d1da!important;font-size:clamp(15px,1.15vw,17px);line-height:1.6;max-width:49ch;margin:0 0 26px;text-shadow:none!important}
.pn-t10-language .pn-t10-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.pn-t10-language .pn-t10-secondary{background:transparent!important;border:1px solid #78909e!important;color:#eef7f9!important;-webkit-text-fill-color:#eef7f9!important}
.pn-t10-language .pn-t10-secondary:hover{background:#ffffff16!important;box-shadow:none}
.pn-t10-language .pn-t10-photo{height:auto;min-height:0;aspect-ratio:1.22;overflow:hidden;border-radius:20px;background:#183a43;box-shadow:0 24px 50px #00000030}
.pn-t10-language .pn-t10-photo img{display:block;object-fit:cover;object-position:center;filter:saturate(.95)}
.pn-t10-language .pn-t10-caption{left:16px;bottom:16px;background:#09272ee8;color:#e4f2f6!important;border:1px solid #ffffff30;border-radius:20px;padding:10px 15px;font:600 11px/1.2 Arial,Helvetica,sans-serif;letter-spacing:.015em;text-transform:none}
.pn-t10-language .pn-t10-toggle{background:#102c3b;color:#fff;border:1px solid #5a7881;border-radius:9px;padding:10px 12px;min-height:44px;font:700 13px Arial,Helvetica,sans-serif}
@media(max-width:1050px){
 .pn-t10-language .pn-t10-head{gap:16px}
 .pn-t10-language .pn-t10-nav{gap:15px}
 .pn-t10-language .pn-t10-hero{gap:27px}
}
@media(max-width:950px){
 .pn-t10-language .pn-t10-nav{display:none;position:absolute;left:0;right:0;top:100%;z-index:15;background:var(--t10-navy-2);padding:22px 24px;flex-direction:column;align-items:stretch;box-shadow:0 18px 30px #0004}
 .pn-t10-language .pn-t10-nav[data-open=true]{display:flex}
 .pn-t10-language .pn-t10-nav a:not(.pn-t10-cta){padding:9px 0;font-size:15px}
 .pn-t10-language .pn-t10-toggle{display:block}
 .pn-t10-language .pn-t10-hero{grid-template-columns:minmax(0,1fr);padding:38px 24px 50px}
 .pn-t10-language .pn-t10-copy{max-width:650px}
 .pn-t10-language .pn-t10-hero h1{max-width:20ch;font-size:clamp(33px,5vw,49px)!important}
 .pn-t10-language .pn-t10-photo{aspect-ratio:1.52}
}
@media(max-width:480px){
 .pn-t10-language .pn-t10-head{padding:15px 18px}
 .pn-t10-language .pn-t10-brand{font-size:19px}
 .pn-t10-language .pn-t10-hero{padding:32px 18px 38px;gap:27px}
 .pn-t10-language .pn-t10-hero h1{font-size:clamp(30px,8.4vw,39px)!important;line-height:1.12!important;margin:17px 0}
 .pn-t10-language .pn-t10-kicker{font-size:10px}
 .pn-t10-language .pn-t10-desc{font-size:15px;line-height:1.55;margin-bottom:20px}
 .pn-t10-language .pn-t10-actions{gap:9px}
 .pn-t10-language .pn-t10-cta{padding:13px 14px;font-size:12px}
 .pn-t10-language .pn-t10-photo{aspect-ratio:1.14;border-radius:14px}
 .pn-t10-language .pn-t10-caption{font-size:10px;left:11px;bottom:11px}
}
@media(prefers-reduced-motion:reduce){.pn-t10-language .pn-t10-cta{transition:none!important;transform:none!important}}
`}</style>}
 {languageSchool?
 <>
 <header className="pn-t10-head"><a className="pn-t10-brand" href="#tp10-inicio"><span className="pn-t10-mark" aria-hidden="true">✦</span><span>{brand}</span></a><button className="pn-t10-toggle" type="button" aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open} aria-controls="pn-t10-language-nav" onClick={()=>setOpen(!open)}>{open?"Fechar ×":"Menu ☰"}</button><nav className="pn-t10-nav" id="pn-t10-language-nav" aria-label="Navegação principal" data-open={open}><a href="#tp10-inicio" onClick={()=>setOpen(false)}>Início</a><a href="#tp10-cursos" onClick={()=>setOpen(false)}>Cursos</a><a href="#tp10-sobre" onClick={()=>setOpen(false)}>Sobre nós</a><a href="#tp10-diferenciais" onClick={()=>setOpen(false)}>Diferenciais</a><a className="pn-t10-cta" href="#tp10-matriculas" onClick={()=>setOpen(false)}>Conhecer matrículas ↗</a></nav></header>
 <section className="pn-t10-hero" id="tp10-inicio"><div className="pn-t10-copy"><span className="pn-t10-kicker">Escolas de idiomas · Aprendizado na prática</span><h1>{headline?.trim()||d[0]}</h1><p className="pn-t10-desc">{description?.trim()||d[1]}</p><div className="pn-t10-actions"><a className="pn-t10-cta" href="#tp10-matriculas">Comece a aprender ↗</a><a className="pn-t10-cta pn-t10-secondary" href="#tp10-cursos">Conhecer cursos</a></div></div><div className="pn-t10-photo"><img onError={imageFallback} src={photo} alt={"Fotografia ilustrativa de "+niche}/><span className="pn-t10-caption">Inglês para o mundo real</span></div></section>
 </>
 :
 <>
 <header className="pn-t10-head"><a className="pn-t10-brand" href="#tp10-inicio">{brand}</a><button className="pn-t10-toggle" type="button" aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?"Fechar ×":"Menu ☰"}</button><nav className="pn-t10-nav" data-open={open}><a href="#tp10-inicio" onClick={()=>setOpen(false)}>Início</a><a href="#tp10-cursos" onClick={()=>setOpen(false)}>Formações</a><a href="#tp10-sobre" onClick={()=>setOpen(false)}>Sobre</a><a href="#tp10-diferenciais" onClick={()=>setOpen(false)}>Diferenciais</a><a className="pn-t10-cta" href="#tp10-contato" onClick={()=>setOpen(false)}>Fale conosco ↗</a></nav></header>
 <section className="pn-t10-hero" id="tp10-inicio"><div className="pn-t10-copy"><span className="pn-t10-kicker">{niche} / educação e formação</span><h1>{headline?.trim()||d[0]}</h1><p className="pn-t10-desc">{description?.trim()||d[1]}</p><a className="pn-t10-cta" href="#tp10-cursos">Conheça nossas formações ↗</a></div><div className="pn-t10-photo"><img onError={imageFallback} src={photo} alt={"Fotografia ilustrativa de "+niche}/><span className="pn-t10-caption">Aprendizagem e possibilidades / 01</span></div></section>
 </>
 }
 <div className="pn-t10-strip"><span>Educação com identidade</span><span>Aprendizado · Desenvolvimento · Possibilidades</span></div>
 <Template10EducationSections niche={niche} brand={brand} site={site}/>
 <Template10EducationExperience niche={niche} brand={brand} testimonials={testimonials} publishedMode={publishedMode}/>
 <Template10EducationClosing niche={niche} brand={brand} contact={contact}/>
 <Template10EducationFinal niche={niche} brand={brand} contact={contact}/>
 </div>;
}