"use client";
import {useState} from "react";
import type {CSSProperties} from "react";
type Props={brand:string;niche:string;summary?:string;email?:string;whatsapp?:string};
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function resolve(niche:string){
 const n=normalize(niche);
 if(/marketing|publicidade|agencia|branding|social media|trafego/.test(n))return {label:"Marketing & IA",intro:"Estratégia criativa, dados e automação conectados para marcas que querem evoluir.",services:[["Estratégia & Branding","Posicionamento, identidade e comunicação com propósito.","✦"],["Marketing de Performance","Campanhas orientadas por dados e decisões inteligentes.","↗"],["Conteúdo & Social","Experiências criativas para construir presença digital.","◈"],["Automação com IA","Fluxos e processos inteligentes para ampliar possibilidades.","⌘"]],about:"Criatividade humana. Inteligência ampliada.",description:"Unimos visão estratégica, comunicação e novas tecnologias para transformar desafios de marketing em experiências relevantes."};
 if(/software|desenvolvimento|sistemas|aplicativos|tecnologia|ti\b/.test(n))return {label:"Tecnologia & Produto",intro:"Produtos digitais, engenharia de software e inteligência aplicada ao negócio.",services:[["Produtos Digitais","Experiências digitais projetadas para necessidades reais.","◈"],["Desenvolvimento","Sistemas e aplicações com foco em evolução contínua.","⌘"],["Integrações","Conexões entre ferramentas, dados e processos.","↗"],["Inteligência Artificial","Recursos inteligentes para apoiar operações e decisões.","✦"]],about:"Tecnologia com visão de futuro.",description:"Conectamos estratégia, design e engenharia para construir experiências digitais que fazem sentido para cada operação."};
 if(/automac|inteligencia artificial|ia\b|chatbot|agentes/.test(n))return {label:"Automação & IA",intro:"Inteligência artificial aplicada à rotina, à comunicação e aos processos.",services:[["Agentes Inteligentes","Experiências assistidas por IA adaptadas ao contexto.","✦"],["Fluxos Automatizados","Processos conectados com menos tarefas repetitivas.","⌘"],["Integrações","Sistemas e informações trabalhando em conjunto.","◈"],["Análise Inteligente","Dados organizados para apoiar melhores decisões.","↗"]],about:"Inteligência que aproxima possibilidades.",description:"Exploramos automação e IA com visão prática, priorizando experiências claras, processos conectados e evolução responsável."};
 return {label:"Negócios Digitais",intro:"Estratégia, tecnologia e criatividade para novas experiências digitais.",services:[["Estratégia Digital","Planejamento para posicionar soluções e oportunidades.","✦"],["Experiências Digitais","Interfaces e jornadas pensadas para pessoas.","◈"],["Automação","Processos conectados para operações mais fluidas.","⌘"],["Inteligência de Dados","Informações que apoiam decisões e evolução.","↗"]],about:"Ideias conectadas. Futuro em construção.",description:"Combinamos estratégia, criação e tecnologia para desenhar soluções digitais relevantes para cada negócio."};
}
// Distinct illustrative photographs by TP5 family. Never presented as actual client work.
const visualSets={
 marketing:{services:["photo-1460925895917-afdab827c52f","photo-1552664730-d307ca884978","photo-1611162616475-46b635cb6868","photo-1533750349088-cd871a92f312"],gallery:["photo-1432888622747-4eb9a8efeb07","photo-1553877522-43269d4ea984","photo-1542744173-8e7e53415bb0","photo-1556761175-b413da4baf72"]},
 technology:{services:["photo-1498050108023-c5249f4df085","photo-1515879218367-8466d910aaa4","photo-1558494949-ef010cbdcc31","photo-1516321318423-f06f85e504b3"],gallery:["photo-1484417894907-623942c8ee29","photo-1531482615713-2afd69097998","photo-1522071820081-009f0129c71c","photo-1521737711867-e3b97375f902"]},
 ai:{services:["photo-1677442136019-21780ecad995","photo-1635070041078-e363dbe005cb","photo-1518770660439-4636190af475","photo-1551288049-bebda4e38f71"],gallery:["photo-1451187580459-43490279c0fa","photo-1485827404703-89b55fcc595e","photo-1516321318423-f06f85e504b3","photo-1504384308090-c894fdcc538d"]},
 digital:{services:["photo-1460925895917-afdab827c52f","photo-1498050108023-c5249f4df085","photo-1677442136019-21780ecad995","photo-1551288049-bebda4e38f71"],gallery:["photo-1552664730-d307ca884978","photo-1516321318423-f06f85e504b3","photo-1451187580459-43490279c0fa","photo-1542744173-8e7e53415bb0"]}
} as const;
function getVisualSet(niche:string){const n=normalize(niche);return /marketing|publicidade|agencia|branding|social media|trafego/.test(n)?visualSets.marketing:/software|desenvolvimento|sistemas|aplicativos|tecnologia|ti\\b/.test(n)?visualSets.technology:/automac|inteligencia artificial|ia\\b|chatbot|agentes/.test(n)?visualSets.ai:visualSets.digital;}
function photoUrl(id:string){return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1100&q=82`;}
export function Template5AIFuturistSections({brand,niche,summary,email,whatsapp}:Props){
 const d=resolve(niche);
 const visuals=getVisualSet(niche);
 const [expanded,setExpanded]=useState<number|null>(0);
 const [contactStatus,setContactStatus]=useState("");
 const faqs=[
 ["Como funciona o primeiro contato?", "Começamos entendendo seus objetivos e o contexto do projeto. Depois alinhamos os próximos passos e o formato de atendimento."],
 ["As soluções são personalizadas?", `Sim. A proposta é considerar as particularidades de cada projeto na área de ${d.label.toLowerCase()}.`],
 ["Como é definido o prazo?", "O cronograma depende do escopo, da complexidade e das etapas combinadas. Os prazos são alinhados antes da execução."],
 ["É possível acompanhar a evolução?", "Sim. O processo prevê alinhamentos e pontos de validação para acompanhar as entregas."],
 ["Como solicitar uma proposta?", "Envie uma mensagem pelo canal de contato disponibilizado nesta página para iniciar a conversa."]
 ];
 const digits=(whatsapp||"").replace(/\D/g,"");
 const validEmail=Boolean(email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
 const validWhatsapp=digits.length>=10&&digits.length<=15;
 return <div className="pn-t5-sections"><style>{`
 .pn-t5-sections{background:#0a0815;color:#f7f3ff;font-family:Inter,Poppins,Arial,sans-serif;overflow:hidden}.pn-t5-sections *{box-sizing:border-box}
 .pn-t5-wrap{max-width:1320px;margin:auto;padding:clamp(85px,9vw,145px) clamp(20px,5vw,76px)}
 .pn-t5-kicker{display:flex;align-items:center;gap:12px;color:#b990ff;font-size:11px;letter-spacing:.2em;font-weight:750;text-transform:uppercase}.pn-t5-kicker:before{content:"";width:22px;height:1px;background:#b990ff}
 .pn-t5-sections h2{font-size:clamp(37px,5.2vw,72px);line-height:1.06;letter-spacing:-.065em;font-weight:750;max-width:900px;margin:20px 0 20px;text-wrap:balance}
 .pn-t5-lead{font-size:clamp(15px,1.5vw,19px);line-height:1.75;color:#b5aec7;max-width:660px}
 .pn-t5-bento{display:grid;grid-template-columns:1.1fr .9fr .9fr;grid-template-rows:minmax(235px,auto) minmax(235px,auto);gap:16px;margin-top:48px}
 .pn-t5-tile{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;min-width:0;padding:clamp(25px,3vw,39px);border:1px solid #ffffff18;border-radius:23px;background:linear-gradient(145deg,#201434,#110e20);transition:transform .25s,border-color .25s}.pn-t5-tile:hover{transform:translateY(-4px);border-color:#a76fff88}
 .pn-t5-tile:first-child{grid-row:span 2;background:radial-gradient(circle at 78% 29%,#a568ff50,transparent 43%),linear-gradient(155deg,#39205c,#151024)}
 .pn-t5-tile:nth-child(2){grid-column:span 2;background:radial-gradient(circle at 90% 20%,#7545d855,transparent 45%),#1b1230}
 .pn-t5-tile-icon{width:54px;height:54px;display:grid;place-items:center;border:1px solid #c9a3ff5c;border-radius:15px;background:#a56bff1a;color:#d5b6ff;font-size:27px}
 .pn-t5-tile h3{font-size:clamp(23px,2.5vw,33px);line-height:1.15;letter-spacing:-.045em;margin:20px 0 10px}.pn-t5-tile p{font-size:14px;line-height:1.7;color:#c1b8d3;max-width:340px;margin:0}.pn-t5-tile-index{position:absolute;top:28px;right:30px;color:#ac98c2;font-size:11px;letter-spacing:.14em}
 .pn-t5-tile-art{position:absolute;right:-45px;top:85px;width:220px;aspect-ratio:1;border-radius:40%;border:35px solid #ba8cff66;box-shadow:inset 0 0 45px #a16bff88,0 0 55px #aa5bff55;transform:rotate(-35deg);opacity:.72;pointer-events:none}.pn-t5-tile:first-child>div:last-child{position:relative;z-index:1}
 .pn-t5-about{position:relative;background:linear-gradient(135deg,#100b21,#080712 68%);border-top:1px solid #ffffff10}
 .pn-t5-about-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(36px,6vw,90px);align-items:center}
 .pn-t5-about-copy h2{font-size:clamp(40px,5.3vw,76px)}.pn-t5-about-copy p{font-size:clamp(15px,1.4vw,18px);line-height:1.8;color:#bdb5cf;max-width:570px}.pn-t5-about-line{width:85px;height:3px;background:linear-gradient(90deg,#b278ff,#e0b3ff);margin:30px 0}
 .pn-t5-about-art{background:linear-gradient(180deg,#09071318,#09071355),url("https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1100&q=85") center/cover no-repeat;border-radius:25px;border:1px solid #9e6bd34d;overflow:hidden}
 .pn-t5-about-art{min-height:480px;position:relative;display:grid;place-items:center;isolation:isolate}
 .pn-t5-about-art:before{content:"";position:absolute;width:78%;aspect-ratio:1;background:radial-gradient(circle,#7433d588,transparent 67%);filter:blur(28px);z-index:-1}
 .pn-t5-sculpture{opacity:.25;mix-blend-mode:screen;width:min(72%,360px);aspect-ratio:1;border-radius:45% 55% 35% 65%/60% 35% 65% 40%;background:conic-gradient(from 45deg,#271048,#c894ff,#4c1e9b,#efc7ff,#4e2297,#b676f8,#271048);box-shadow:inset -30px -20px 55px #150a35,inset 22px 20px 38px #fff6,0 0 70px #9c52ef5e;transform:rotate(-25deg);animation:pn-t5-about-float 9s ease-in-out infinite}
 .pn-t5-sculpture:after{content:"";display:block;position:absolute;inset:25%;border:25px solid #180b39a8;border-top-color:#f0d3ff;border-radius:50% 40% 60% 40%;box-shadow:0 0 30px #f5bfff66}
 .pn-t5-art-caption{padding-left:20px;padding-right:20px;background:#09071399;position:absolute;bottom:28px;left:0;right:0;display:flex;justify-content:space-between;gap:14px;color:#c2aedf;font-size:11px;letter-spacing:.14em;text-transform:uppercase;border-top:1px solid #ffffff2c;padding-top:17px}

 .pn-t5-diff{background:radial-gradient(ellipse at 70% 0%,#51228535,transparent 48%),#080712;border-top:1px solid #ffffff12}
 .pn-t5-diff-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:48px}
 .pn-t5-diff-card{position:relative;isolation:isolate;min-height:355px;display:flex;flex-direction:column;justify-content:space-between;padding:27px 24px;border:1px solid #ad7af23d;border-radius:22px;background:linear-gradient(155deg,#1a132b,#0d0b19 78%);overflow:hidden;transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}
 .pn-t5-diff-card:hover{transform:translateY(-7px);border-color:#bb8affaa;box-shadow:0 18px 52px #05030d,0 0 40px #8745d82a}
 .pn-t5-diff-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 39%,#8440e83c,transparent 52%);z-index:-1;pointer-events:none}
 .pn-t5-diff-num{font-size:11px;letter-spacing:.17em;color:#c2a7eb}
 .pn-t5-diff-art{height:158px;display:grid;place-items:center;perspective:450px}
 .pn-t5-diff-object{width:102px;height:102px;display:grid;place-items:center;position:relative;border-radius:25px;background:linear-gradient(135deg,#d9b9ff 0%,#9251ee 30%,#51229c 65%,#1b0d40 100%);box-shadow:inset 7px 7px 15px #f2d5ff88,inset -12px -14px 24px #1d0649cc,15px 19px 25px #0009,0 0 38px #8c4beb7a;transform:rotate(-16deg) rotateY(-21deg);animation:pn-t5-object-float 5s ease-in-out infinite}
 .pn-t5-diff-card:nth-child(2) .pn-t5-diff-object{border-radius:35% 65% 48% 52%;transform:rotate(24deg) rotateY(24deg);animation-delay:-1s}
 .pn-t5-diff-card:nth-child(3) .pn-t5-diff-object{border-radius:19px;transform:rotate(18deg) rotateX(18deg);animation-delay:-2s}
 .pn-t5-diff-card:nth-child(4) .pn-t5-diff-object{border-radius:50%;transform:rotate(-14deg) rotateY(-24deg);animation-delay:-3s}
 .pn-t5-diff-glyph{font-size:53px;color:#f6e9ff;text-shadow:0 3px 13px #321065;font-weight:600}
 .pn-t5-diff-card h3{font-size:clamp(21px,2vw,27px);letter-spacing:-.045em;line-height:1.18;margin:0 0 10px;color:#faf6ff}.pn-t5-diff-card p{font-size:14px;line-height:1.65;color:#cfc4de;margin:0}
 @keyframes pn-t5-object-float{0%,100%{translate:0 0}50%{translate:0 -9px}}
 .pn-t5-process{background:radial-gradient(ellipse at 52% 60%,#401d7335,transparent 65%),#0b0918;border-top:1px solid #ffffff10}
 .pn-t5-process-layout{display:block}.pn-t5-process-intro{max-width:850px}
 .pn-t5-process-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;margin-top:55px;perspective:1100px}
 .pn-t5-process-step{position:relative;isolation:isolate;min-height:370px;padding:32px 28px;border:1px solid #b38bff47;border-radius:24px;background:linear-gradient(155deg,#201337,#0e0b1d 75%);box-shadow:0 22px 65px #0007,inset 0 1px #f3ddff20;overflow:hidden;transition:transform .3s ease,border-color .3s ease}
 .pn-t5-process-step:nth-child(1){transform:translateY(20px) rotateY(7deg)}.pn-t5-process-step:nth-child(2){transform:translateY(-8px) scale(1.035);border-color:#bd8dff9c;z-index:2;background:radial-gradient(circle at 50% 34%,#6d39c455,transparent 55%),linear-gradient(145deg,#271640,#0d0a1c)}.pn-t5-process-step:nth-child(3){transform:translateY(20px) rotateY(-7deg)}
 .pn-t5-process-step:hover{transform:translateY(-14px) scale(1.02);border-color:#d4b5ff}
 .pn-t5-process-step:before{content:"";position:absolute;inset:auto -35px -120px;width:260px;height:260px;border:38px solid #a76bf426;border-radius:42%;transform:rotate(35deg);pointer-events:none;z-index:-1}
 .pn-t5-process-step>span{font-size:11px;letter-spacing:.2em;color:#d0aeff}.pn-t5-process-art{height:155px;display:grid;place-items:center;font-size:90px;font-weight:800;letter-spacing:-.1em;color:#b57aff;text-shadow:0 0 42px #8c4ff3,4px 8px #2a124f}
 .pn-t5-process-step h3{font-size:clamp(23px,2.4vw,32px);line-height:1.14;letter-spacing:-.05em;margin:12px 0}.pn-t5-process-step p{color:#cfc3e0;font-size:14px;line-height:1.7;margin:0}
 @media(max-width:1000px){.pn-t5-diff-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pn-t5-process-list{gap:14px}.pn-t5-process-step{padding:25px 20px}}
 @media(max-width:700px){.pn-t5-process-list{grid-template-columns:1fr;gap:16px;margin-top:30px}.pn-t5-process-step,.pn-t5-process-step:nth-child(1),.pn-t5-process-step:nth-child(2),.pn-t5-process-step:nth-child(3){min-height:280px;transform:none}.pn-t5-process-art{height:100px;font-size:65px}}
 @media(max-width:580px){.pn-t5-diff-grid{grid-template-columns:1fr;gap:14px;margin-top:30px}.pn-t5-diff-card{min-height:275px}.pn-t5-diff-art{height:120px}.pn-t5-diff-object{width:85px;height:85px}.pn-t5-diff-glyph{font-size:44px}}
 @media(prefers-reduced-motion:reduce){.pn-t5-diff-object{animation:none}.pn-t5-diff-card,.pn-t5-process-step{transition:none}}

 .pn-t5-voices{position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 52% 52%,#4d218057,transparent 52%),#080711;border-top:1px solid #ffffff12}
 .pn-t5-voices:before{content:"";position:absolute;width:520px;height:520px;border:1px solid #b886ff2b;border-radius:50%;right:-170px;top:0;box-shadow:0 0 0 70px #9a54eb08,0 0 0 145px #9a54eb07;pointer-events:none}
 .pn-t5-voices-shell{position:relative;max-width:1050px;padding:35px 0 20px}
 .pn-t5-voices-manifesto{font-size:clamp(40px,7.1vw,105px);font-weight:760;line-height:1.03;letter-spacing:-.075em;color:#f7f1ff;margin:40px 0 34px;text-wrap:balance}
 .pn-t5-voices-manifesto em{font-style:normal;color:#c496ff;text-shadow:0 0 55px #9244ed69}
 .pn-t5-voices-credit{font-size:13px;line-height:1.8;color:#c9b8df;max-width:660px}
 .pn-t5-voices-rule{height:1px;max-width:750px;background:linear-gradient(90deg,#c18aff99,#b17aff10);margin:45px 0 25px}
 .pn-t5-voices-bottom{display:flex;align-items:center;gap:20px;justify-content:space-between;color:#b39bcf;font-size:11px;letter-spacing:.17em;text-transform:uppercase}
 .pn-t5-gallery{background:linear-gradient(155deg,#0d0a1c,#080712);border-top:1px solid #ffffff14}
 .pn-t5-gallery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:19px;margin-top:48px}
 .pn-t5-gallery-item{position:relative;isolation:isolate;overflow:hidden;min-height:400px;border:1px solid #aa80e94a;border-radius:23px;background:#1c1430;display:flex;flex-direction:column;justify-content:space-between;padding:28px;transition:transform .3s ease,border-color .3s ease}
 .pn-t5-gallery-item:hover{transform:translateY(-6px);border-color:#c69dffb0}
 .pn-t5-gallery-item:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,#0c071733 10%,#09071350 40%,#090713f5 100%),var(--pn-t5-gallery-image) center/cover no-repeat;filter:saturate(.7)}
 .pn-t5-gallery-item:after{content:"";position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at 75% 15%,#8e3af03d,transparent 55%)}
 .pn-t5-gallery-item:nth-child(1){min-height:490px}.pn-t5-gallery-item:nth-child(2){margin-top:48px}.pn-t5-gallery-item:nth-child(3){margin-top:-48px}.pn-t5-gallery-item:nth-child(4){min-height:490px}
 .pn-t5-gallery-tag{align-self:flex-start;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#e5d3ff;border:1px solid #dfc3ff65;border-radius:100px;padding:10px 14px;background:#140b2799}
 .pn-t5-gallery-item h3{font-size:clamp(26px,3vw,39px);line-height:1.13;letter-spacing:-.05em;margin:0 0 12px;color:#fff}.pn-t5-gallery-item p{font-size:14px;line-height:1.7;color:#ded4e9;margin:0;max-width:440px}
 .pn-t5-gallery-note{font-size:12px;line-height:1.7;color:#ad9ac7;margin-top:25px}
 @media(max-width:700px){.pn-t5-gallery-grid{grid-template-columns:1fr;gap:15px;margin-top:30px}.pn-t5-gallery-item,.pn-t5-gallery-item:nth-child(1),.pn-t5-gallery-item:nth-child(4){min-height:330px}.pn-t5-gallery-item:nth-child(2),.pn-t5-gallery-item:nth-child(3){margin-top:0}.pn-t5-voices-manifesto{margin:30px 0}}
 @media(prefers-reduced-motion:reduce){.pn-t5-gallery-item{transition:none}}
 .pn-t5-faq{background:linear-gradient(150deg,#0c0918,#120b21);border-top:1px solid #ffffff14}
 .pn-t5-faq-layout{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:clamp(36px,6vw,90px);align-items:start}
 .pn-t5-faq-list{border-top:1px solid #bd93ff55}
 .pn-t5-faq-item{border-bottom:1px solid #c5a2ff3b}
 .pn-t5-faq-trigger{display:flex;align-items:center;justify-content:space-between;gap:20px;width:100%;padding:29px 0;border:0;background:transparent;color:#f7f1ff;text-align:left;font:600 clamp(17px,1.7vw,22px)/1.4 Inter,Poppins,Arial,sans-serif;cursor:pointer;transition:color .2s}
 .pn-t5-faq-trigger:hover,.pn-t5-faq-trigger[aria-expanded="true"]{color:#d4b1ff}
 .pn-t5-faq-trigger span:last-child{flex:none;display:grid;place-items:center;width:37px;height:37px;border:1px solid #a774ff77;border-radius:50%;color:#d2a8ff;font-size:23px;transition:transform .25s,background .25s}
 .pn-t5-faq-trigger[aria-expanded="true"] span:last-child{transform:rotate(45deg);background:#8d4de22e}
 .pn-t5-faq-trigger:focus-visible{outline:2px solid #caa4ff;outline-offset:4px}
 .pn-t5-faq-answer{margin:0 48px 27px 0;max-width:580px;color:#cfc4dd;font-size:15px;line-height:1.8}
 .pn-t5-contact{position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 50% 0%,#59269b58,transparent 52%),#090714;border-top:1px solid #ffffff15}
 .pn-t5-contact-layout{display:flex;flex-direction:column;align-items:stretch;gap:44px}
 .pn-t5-contact-hero{position:relative;isolation:isolate;min-height:430px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 15px}
 .pn-t5-contact-hero:before{content:"";position:absolute;z-index:-1;width:min(72vw,520px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d6a7ff,#8e4de4 24%,#4e1b96 46%,#1c0c38 70%);box-shadow:inset -38px -36px 60px #08041b,inset 20px 20px 35px #f2ceff4f,0 0 110px #a05afc70;opacity:.36;filter:blur(1px);pointer-events:none}
 .pn-t5-contact-hero h2{max-width:1050px;font-size:clamp(48px,7vw,104px);margin:25px auto;line-height:1.02}
 .pn-t5-contact-hero .pn-t5-lead{margin:0 auto;max-width:700px;color:#e0d3f2}
 .pn-t5-contact-jump{display:inline-flex;align-items:center;justify-content:center;gap:14px;margin-top:32px;padding:17px 30px;border-radius:100px;background:#d6b2ff;color:#170a2c;text-decoration:none;font-weight:750;box-shadow:0 12px 40px #5c2a9b55}
 .pn-t5-contact-jump:hover{background:#f0ddff}
 .pn-t5-contact-panel{width:min(100%,780px);margin:0 auto;padding:clamp(25px,4vw,50px);border-radius:25px;border:1px solid #b68cf165;background:linear-gradient(145deg,#1d1132e8,#0c0a1af5);box-shadow:0 28px 90px #0009,inset 0 1px #ffffff22}
 .pn-t5-contact-panel h3{font-size:clamp(23px,2.7vw,34px);letter-spacing:-.04em;margin:0 0 9px}
 .pn-t5-contact-panel-intro{color:#c8b9d9;font-size:14px;line-height:1.7;margin:0 0 30px}
 .pn-t5-contact-panel label{display:block;color:#e0d1f0;font-size:13px;margin-bottom:9px}
 .pn-t5-contact-panel input,.pn-t5-contact-panel textarea{width:100%;background:#0e0b1bc9;border:1px solid #b38bff4b;border-radius:12px;color:#fff;font:inherit;font-size:15px;padding:15px;margin-bottom:19px;outline:none}
 .pn-t5-contact-panel input:focus,.pn-t5-contact-panel textarea:focus{border-color:#caa4ff;box-shadow:0 0 0 3px #9b62e52b}
 .pn-t5-contact-panel textarea{resize:vertical;min-height:125px}
 .pn-t5-contact-panel button{width:100%;padding:17px 22px;background:#bd8aff;color:#100a1c;font-weight:750;border:0;border-radius:12px;cursor:pointer}
 .pn-t5-contact-panel button:disabled{opacity:.5;cursor:not-allowed}
 .pn-t5-contact-hint{color:#c6b8d8;font-size:13px;line-height:1.7;margin-top:15px}
 @media(max-width:850px){.pn-t5-faq-layout{grid-template-columns:1fr}.pn-t5-contact-hero{min-height:350px}}
 @media(max-width:580px){.pn-t5-contact-hero{min-height:310px;padding:25px 0}.pn-t5-contact-layout{gap:28px}.pn-t5-contact-hero:before{width:85vw}.pn-t5-faq-trigger{padding:23px 0}}

 .pn-t5-end{position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 52% 6%,#4d1d8959,transparent 53%),#070510;border-top:1px solid #ffffff17;padding:clamp(70px,9vw,135px) clamp(20px,5vw,76px) 28px}
 .pn-t5-end:before{content:"";position:absolute;z-index:-1;width:min(86vw,1050px);height:min(55vw,600px);left:50%;top:-260px;transform:translateX(-50%);border-radius:50%;border:1px solid #a970ff3d;box-shadow:0 0 0 60px #ad73ff08,0 0 0 145px #ad73ff08,0 0 130px #7b34c84d;pointer-events:none}
 .pn-t5-end-inner{max-width:1190px;margin:0 auto}
 .pn-t5-end-hero{text-align:center;position:relative;padding:15px 0 clamp(65px,9vw,130px);border-bottom:1px solid #ffffff25}
 .pn-t5-end-hero .pn-t5-kicker{justify-content:center}
 .pn-t5-end-hero h2{max-width:1030px;margin:28px auto 20px;font-size:clamp(42px,7.6vw,112px);font-weight:760;letter-spacing:-.075em;line-height:1.02;text-wrap:balance}
 .pn-t5-end-hero h2 em{font-style:normal;color:#c395ff;text-shadow:0 0 65px #934de866}
 .pn-t5-end-hero p{font-size:clamp(15px,1.5vw,19px);line-height:1.7;color:#d5c5eb;max-width:650px;margin:0 auto}
 .pn-t5-end-button{display:inline-flex;align-items:center;gap:18px;margin-top:32px;padding:17px 29px;border-radius:100px;background:#d8b7ff;color:#180b2e;text-decoration:none;font-size:14px;font-weight:750;transition:transform .2s,background .2s}
 .pn-t5-end-button:hover{transform:translateY(-3px);background:#fff}
 .pn-t5-end-wordmark{display:block;max-width:100%;font-size:clamp(52px,12vw,175px);font-weight:850;letter-spacing:-.09em;line-height:1.12;overflow-wrap:anywhere;text-align:center;margin:55px 0 25px;background:linear-gradient(180deg,#f8efff 10%,#b78aff 55%,#4b286c 100%);color:transparent;-webkit-background-clip:text;background-clip:text;text-shadow:none}
 .pn-t5-end-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,.75fr) minmax(0,.75fr);gap:clamp(24px,5vw,65px);padding:35px 0 52px}
 .pn-t5-end-brand{font-size:clamp(19px,2.2vw,27px);font-weight:800;letter-spacing:-.05em;overflow-wrap:anywhere;color:#f7f1ff}
 .pn-t5-end-small{font-size:13px;line-height:1.8;color:#b6a7c8;max-width:360px;margin-top:14px}
 .pn-t5-end-title{font-size:11px;font-weight:750;letter-spacing:.17em;text-transform:uppercase;color:#c69df9;margin-bottom:20px}
 .pn-t5-end-links{display:flex;flex-direction:column;align-items:flex-start;gap:13px}
 .pn-t5-end-links a{color:#e0d5ec;font-size:14px;text-decoration:none;overflow-wrap:anywhere}
 .pn-t5-end-links a:hover,.pn-t5-end-links a:focus-visible{text-decoration:underline;color:#fff}
 .pn-t5-end-bottom{border-top:1px solid #ffffff25;padding-top:23px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;color:#a99ab9;font-size:12px}
 @media(max-width:720px){.pn-t5-end-grid{grid-template-columns:1fr 1fr;gap:28px;padding:35px 0}.pn-t5-end-grid>div:first-child{grid-column:span 2}.pn-t5-end-wordmark{margin-top:40px}}
 @media(max-width:410px){.pn-t5-end-grid{grid-template-columns:1fr}.pn-t5-end-grid>div:first-child{grid-column:auto}.pn-t5-end-hero h2{font-size:clamp(39px,11vw,56px)}}
 @keyframes pn-t5-about-float{50%{transform:translateY(-13px) rotate(-19deg)}}
 @media(max-width:950px){.pn-t5-bento{grid-template-columns:1fr 1fr;grid-template-rows:auto}.pn-t5-tile:first-child{grid-row:auto;min-height:320px}.pn-t5-tile:nth-child(2){grid-column:auto}.pn-t5-tile{min-height:245px}.pn-t5-about-grid{grid-template-columns:1fr}.pn-t5-about-art{min-height:380px}}
 @media(max-width:580px){.pn-t5-bento{grid-template-columns:1fr;gap:12px;margin-top:32px}.pn-t5-tile{min-height:215px;border-radius:18px}.pn-t5-tile:first-child{min-height:280px}.pn-t5-about-art{min-height:310px}.pn-t5-art-caption{font-size:9px}.pn-t5-sculpture{max-width:235px}}

 /* TP5-specific contrast and editorial layout. Do not allow Builder theme
    selectors or inherited green accents to override the approved palette. */
 .pn-t5-sections .pn-t5-tile h3,.pn-t5-sections .pn-t5-diff-card h3,
 .pn-t5-sections .pn-t5-gallery-item h3,.pn-t5-sections .pn-t5-process-step h3,
 .pn-t5-sections .pn-t5-end-brand{color:#f8f4ff!important}
 .pn-t5-sections .pn-t5-tile p,.pn-t5-sections .pn-t5-diff-card p,
 .pn-t5-sections .pn-t5-gallery-item p,.pn-t5-sections .pn-t5-process-step p{color:#d3c9e5!important}
 .pn-t5-sections .pn-t5-diff-num,.pn-t5-sections .pn-t5-gallery-tag{color:#d6b6ff!important}
 .pn-t5-sections .pn-t5-diff-card{background:linear-gradient(145deg,#2c1b48,#130e25 82%)!important}
 .pn-t5-sections .pn-t5-diff-card:nth-child(2),.pn-t5-sections .pn-t5-diff-card:nth-child(5){background:linear-gradient(145deg,#41275f,#1b1232 85%)!important}
 .pn-t5-sections .pn-t5-diff-card h3,.pn-t5-sections .pn-t5-diff-card p{position:relative;z-index:1}
 .pn-t5-sections .pn-t5-end-button{color:#180b2e!important;background:#e8d4ff!important}
 .pn-t5-sections .pn-t5-contact-panel button{color:#170a2b!important}
 @media(max-width:580px){
  .pn-t5-sections h2{font-size:clamp(32px,8.1vw,42px);line-height:1.12;letter-spacing:-.045em}
  .pn-t5-sections .pn-t5-voices-quote{font-size:clamp(28px,7.1vw,39px);line-height:1.23;letter-spacing:-.04em}
  .pn-t5-sections .pn-t5-about-copy h2,.pn-t5-sections .pn-t5-end-cta h2{font-size:clamp(32px,8.1vw,42px)}
  .pn-t5-sections .pn-t5-diff-card{min-height:200px}
  .pn-t5-sections .pn-t5-wrap{padding-top:76px;padding-bottom:76px}
 }

 /* TP5 visual composition: photographic service cards and compact mobile rhythm */
 .pn-t5-sections .pn-t5-tile{min-height:270px;justify-content:flex-end;gap:18px;background-size:cover!important;background-position:center!important}
 .pn-t5-sections .pn-t5-tile:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#0d071c20 0%,#110b24aa 42%,#10091df5 100%);z-index:0}
 .pn-t5-sections .pn-t5-tile>*{position:relative;z-index:1}
 .pn-t5-sections .pn-t5-tile{background-image:var(--pn-t5-service-image)!important}
 .pn-t5-sections .pn-t5-tile-art{display:none}
 .pn-t5-sections .pn-t5-tile-icon{width:43px;height:43px;font-size:23px;background:#211336b5;backdrop-filter:blur(9px)}
 .pn-t5-sections .pn-t5-tile-index{top:24px;right:25px}
 .pn-t5-sections .pn-t5-diff-card{min-height:220px}
 .pn-t5-sections .pn-t5-gallery-note{display:none}
 @media(max-width:580px){
  .pn-t5-sections .pn-t5-tile,.pn-t5-sections .pn-t5-tile:first-child{min-height:255px;padding:24px}
  .pn-t5-sections .pn-t5-tile h3{font-size:25px}
  .pn-t5-sections .pn-t5-diff-card{min-height:185px;padding:23px}
  .pn-t5-sections .pn-t5-diff-glyph{font-size:26px}
  .pn-t5-sections .pn-t5-diff-card h3{font-size:22px}
  .pn-t5-sections .pn-t5-voices-quote{font-size:clamp(25px,6.5vw,33px)}
  .pn-t5-sections .pn-t5-gallery-item,.pn-t5-sections .pn-t5-gallery-item:nth-child(1){min-height:270px}
 }
 /* TP5 final mobile polish: tighter rhythm, readable secondary copy, compact cinematic signature. */
 @media(max-width:700px){
  .pn-t5-sections .pn-t5-wrap{padding-top:60px;padding-bottom:60px}
  .pn-t5-sections .pn-t5-lead{font-size:15px;line-height:1.65}
  .pn-t5-sections .pn-t5-about-copy p{font-size:15px;line-height:1.7}
  .pn-t5-sections .pn-t5-gallery-grid{gap:13px;margin-top:28px}
  .pn-t5-sections .pn-t5-gallery-item,.pn-t5-sections .pn-t5-gallery-item:nth-child(1),.pn-t5-sections .pn-t5-gallery-item:nth-child(4){min-height:245px}
  .pn-t5-sections .pn-t5-gallery-item h3{font-size:25px}
  .pn-t5-sections .pn-t5-gallery-item p{font-size:13px;line-height:1.55}
  .pn-t5-sections .pn-t5-end{padding:62px 22px 24px}
  .pn-t5-sections .pn-t5-end-hero{padding:0 0 42px}
  .pn-t5-sections .pn-t5-end-wordmark{font-size:clamp(38px,8.2vw,76px);line-height:1.08;letter-spacing:-.065em;margin:28px 0 12px}
  .pn-t5-sections .pn-t5-end-grid{gap:20px;padding:22px 0 30px}
  .pn-t5-sections .pn-t5-end-links{gap:10px}
  .pn-t5-sections .pn-t5-end:before{top:-320px}
 }
 @media(max-width:410px){
  .pn-t5-sections .pn-t5-end-grid{grid-template-columns:1fr 1fr}
  .pn-t5-sections .pn-t5-end-grid>div:first-child{grid-column:span 2}
 }
 @media(prefers-reduced-motion:reduce){.pn-t5-sculpture{animation:none}.pn-t5-tile{transition:none}}
 `}</style>
 <section id="solucoes" aria-label="Nossas soluções"><div className="pn-t5-wrap"><span className="pn-t5-kicker">01 / Soluções inteligentes</span><h2>Possibilidades que vão além do convencional.</h2><p className="pn-t5-lead">{d.intro}</p><div className="pn-t5-bento">{d.services.map(([name,desc,symbol],i)=><article className="pn-t5-tile" key={name} style={{"--pn-t5-service-image":`url("${photoUrl(visuals.services[i])}")`} as CSSProperties}><span className="pn-t5-tile-index">0{i+1} / 04</span>{i===0?<div className="pn-t5-tile-art" aria-hidden="true"/>:null}<span className="pn-t5-tile-icon" aria-hidden="true">{symbol}</span><div><h3>{name}</h3><p>{desc}</p></div></article>)}</div></div></section>
 <section id="sobre" className="pn-t5-about" aria-label="Sobre a empresa"><div className="pn-t5-wrap pn-t5-about-grid"><div className="pn-t5-about-copy"><span className="pn-t5-kicker">02 / Sobre a marca</span><h2>{d.about}</h2><div className="pn-t5-about-line"/><p>{summary?.trim()&&summary.trim().length<450?summary:d.description}</p><p>Da estratégia à execução, conectamos ideias, pessoas e tecnologia com foco no que importa para cada projeto.</p></div><div className="pn-t5-about-art" aria-label="Escultura digital abstrata em violeta"><div className="pn-t5-sculpture"/><div className="pn-t5-art-caption"><span>{d.label}</span><span>Human + intelligence</span></div></div></div></section>

 <section id="diferenciais" className="pn-t5-diff" aria-label="Nossos diferenciais"><div className="pn-t5-wrap"><span className="pn-t5-kicker">03 / O que nos diferencia</span><h2>Uma nova perspectiva para cada desafio.</h2><p className="pn-t5-lead">O que torna a experiência da {brand} especial em {d.label.toLowerCase()}.</p><div className="pn-t5-diff-grid">{[
 ["Estratégia conectada",`Decisões orientadas pelos objetivos reais de cada projeto em ${d.label.toLowerCase()}.`,"◇"],
 ["Integração inteligente","Tecnologias e processos que trabalham juntos, com menos fricção.","✣"],
 ["Soluções sob medida","Cada entrega considera as necessidades e a identidade de cada negócio.","▣"],
 ["Evolução contínua","Uma visão de longo prazo, com espaço para aprender e aprimorar.","✦"]
 ].map(([name,desc,glyph],i)=><article className="pn-t5-diff-card" key={name}><span className="pn-t5-diff-num">DIFERENCIAL 0{i+1}</span><div className="pn-t5-diff-art" aria-hidden="true"><div className="pn-t5-diff-object"><span className="pn-t5-diff-glyph">{glyph}</span></div></div><div><h3>{name}</h3><p>{desc}</p></div></article>)}</div></div></section>
 <section id="como-funciona" className="pn-t5-process" aria-label="Como trabalhamos"><div className="pn-t5-wrap pn-t5-process-layout"><div className="pn-t5-process-intro"><span className="pn-t5-kicker">04 / Nossa jornada</span><h2>Da primeira conversa à próxima conquista.</h2><p className="pn-t5-lead">Três etapas claras, com tecnologia, colaboração e atenção ao contexto de cada projeto.</p></div><div className="pn-t5-process-list">{[
 ["Imersão & diagnóstico",`Entendemos os objetivos, o público e os desafios de ${d.label.toLowerCase()}.`],
 ["Estratégia & criação","Desenhamos a solução, definimos as prioridades e construímos a experiência."],
 ["Entrega & evolução","Validamos as entregas e identificamos oportunidades de melhoria contínua."]
 ].map(([name,desc],i)=><article className="pn-t5-process-step" key={name}><span>ETAPA 0{i+1} / 03</span><div className="pn-t5-process-art" aria-hidden="true">0{i+1}</div><h3>{name}</h3><p>{desc}</p></article>)}</div></div></section>

 <section id="depoimentos" className="pn-t5-voices" aria-label="Nossa filosofia"><div className="pn-t5-wrap"><span className="pn-t5-kicker">05 / Nossa filosofia</span><div className="pn-t5-voices-shell"><h2 className="pn-t5-voices-manifesto">O futuro não se espera.<br/><em>Ele se constrói.</em></h2><p className="pn-t5-voices-credit">Na {brand}, acreditamos em ideias que conectam pessoas, estratégia e tecnologia. Em {d.label.toLowerCase()}, nossa visão é transformar complexidade em possibilidades reais, com clareza e responsabilidade.</p><div className="pn-t5-voices-rule"/><div className="pn-t5-voices-bottom"><span>Manifesto da marca</span><span>{d.label} · {brand}</span></div></div></div></section>
 <section id="portfolio" className="pn-t5-gallery" aria-label="Áreas de atuação e soluções conceituais"><div className="pn-t5-wrap"><span className="pn-t5-kicker">06 / Possibilidades em destaque</span><h2>Ideias em diferentes dimensões.</h2><p className="pn-t5-lead">Quatro frentes de atuação em {d.label.toLowerCase()}, apresentadas visualmente para explorar possibilidades — sem atribuir projetos ou resultados fictícios à {brand}.</p><div className="pn-t5-gallery-grid">{d.services.slice(0,4).map(([name,desc],i)=><article className="pn-t5-gallery-item" key={name} style={{"--pn-t5-gallery-image":`url("${photoUrl(visuals.gallery[i])}")`} as CSSProperties}><span className="pn-t5-gallery-tag">Área de atuação 0{i+1}</span><div><h3>{name}</h3><p>{desc}</p></div></article>)}</div><p className="pn-t5-gallery-note">Imagens ilustrativas e apresentação conceitual. Não representam trabalhos executados, clientes ou resultados comprovados.</p></div></section>

 <section id="perguntas-frequentes" className="pn-t5-faq" aria-label="Perguntas frequentes"><div className="pn-t5-wrap pn-t5-faq-layout"><div><span className="pn-t5-kicker">07 / Perguntas frequentes</span><h2>Respostas claras. Novas possibilidades.</h2><p className="pn-t5-lead">Tudo o que você precisa saber para iniciar uma conversa com a {brand}.</p></div><div className="pn-t5-faq-list">{faqs.map(([question,answer],i)=><div className="pn-t5-faq-item" key={question}><h3 style={{margin:0}}><button className="pn-t5-faq-trigger" type="button" aria-expanded={expanded===i} aria-controls={`pn-t5-faq-answer-${i}`} onClick={()=>setExpanded(expanded===i?null:i)}><span>{question}</span><span aria-hidden="true">{expanded===i?"−":"+"}</span></button></h3><p id={`pn-t5-faq-answer-${i}`} className="pn-t5-faq-answer" hidden={expanded!==i}>{answer}</p></div>)}</div></div></section>
 <section id="contato" className="pn-t5-contact" aria-label="Entre em contato"><div className="pn-t5-wrap pn-t5-contact-layout"><div className="pn-t5-contact-hero"><span className="pn-t5-kicker">08 / Vamos criar o próximo capítulo</span><h2>O futuro começa com uma conversa.</h2><p className="pn-t5-lead">Sua próxima ideia merece ganhar forma. Descubra novas possibilidades em {d.label.toLowerCase()} com a {brand}.</p><a className="pn-t5-contact-jump" href="#pn-t5-contact-form">Conte sua ideia <span aria-hidden="true">↗</span></a></div><div className="pn-t5-contact-panel" id="pn-t5-contact-form"><h3>Vamos conversar sobre seu projeto.</h3><p className="pn-t5-contact-panel-intro">Preencha seus dados. Sua mensagem será preparada no canal de contato configurado pela empresa.</p><form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const name=String(data.get("name")||"").trim();const sender=String(data.get("sender")||"").trim();const message=String(data.get("message")||"").trim();if(!name||!sender||!message)return;const body=`Olá, sou ${name}. Meu contato: ${sender}.\n\n${message}`;if(validWhatsapp){window.open(`https://wa.me/${digits}?text=${encodeURIComponent(body)}`,"_blank","noopener,noreferrer");setContactStatus("O WhatsApp foi aberto com sua mensagem. Confirme o envio no aplicativo.");}else if(validEmail){window.location.href=`mailto:${email}?subject=${encodeURIComponent("Contato pelo site — "+brand)}&body=${encodeURIComponent(body)}`;setContactStatus("Seu aplicativo de e-mail foi aberto. Confirme o envio por lá.");}}}><label htmlFor="pn-t5-contact-name">Seu nome</label><input id="pn-t5-contact-name" name="name" autoComplete="name" required placeholder="Como podemos chamar você?"/><label htmlFor="pn-t5-contact-sender">E-mail ou telefone</label><input id="pn-t5-contact-sender" name="sender" required placeholder="Seu melhor contato"/><label htmlFor="pn-t5-contact-message">Conte sobre seu projeto</label><textarea id="pn-t5-contact-message" name="message" required placeholder="O que você gostaria de construir?"/><button type="submit" disabled={!validWhatsapp&&!validEmail}>Iniciar conversa ↗</button><p className="pn-t5-contact-hint" role="status">{contactStatus||(!validWhatsapp&&!validEmail?"Configure o WhatsApp ou e-mail da empresa para habilitar o envio.":"A mensagem será preparada no seu WhatsApp ou aplicativo de e-mail. O envio depende da sua confirmação.")}</p></form></div></div></section>

 <footer className="pn-t5-end" aria-label="Rodapé da empresa"><div className="pn-t5-end-inner"><div className="pn-t5-end-hero"><span className="pn-t5-kicker">09 / O próximo capítulo</span><h2>Vamos construir <em>algo extraordinário.</em></h2><p>Novas possibilidades em {d.label.toLowerCase()} começam com uma boa conversa. Sua próxima ideia pode começar aqui.</p><a className="pn-t5-end-button" href="#pn-t5-contact-form">Iniciar um projeto <span aria-hidden="true">↗</span></a></div><div className="pn-t5-end-wordmark" aria-label={brand}>{brand}</div><div className="pn-t5-end-grid"><div><div className="pn-t5-end-brand">{brand}</div><p className="pn-t5-end-small">{d.description}</p></div><div><div className="pn-t5-end-title">Explore</div><nav className="pn-t5-end-links" aria-label="Navegação do rodapé"><a href="#solucoes">Soluções</a><a href="#sobre">Sobre nós</a><a href="#diferenciais">Diferenciais</a><a href="#como-funciona">Como trabalhamos</a><a href="#portfolio">Áreas de atuação</a><a href="#perguntas-frequentes">Perguntas frequentes</a></nav></div><div><div className="pn-t5-end-title">Contato</div><div className="pn-t5-end-links"><a href="#pn-t5-contact-form">Fale conosco</a>{validEmail?<a href={`mailto:${email}`}>{email}</a>:null}{validWhatsapp?<a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>:null}</div></div></div><div className="pn-t5-end-bottom"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><span>{d.label} · Criado para evoluir</span></div></div></footer>
 </div>;
}
