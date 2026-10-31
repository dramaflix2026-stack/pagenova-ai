"use client";
import {useState} from "react";
type Props={brand:string;niche:string;summary?:string};
const normalize=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function resolve(niche:string){
 const n=normalize(niche);
 if(/marketing|publicidade|agencia|branding|social media|trafego/.test(n))return {label:"Marketing & IA",intro:"Estratégia criativa, dados e automação conectados para marcas que querem evoluir.",services:[["Estratégia & Branding","Posicionamento, identidade e comunicação com propósito.","✦"],["Marketing de Performance","Campanhas orientadas por dados e decisões inteligentes.","↗"],["Conteúdo & Social","Experiências criativas para construir presença digital.","◈"],["Automação com IA","Fluxos e processos inteligentes para ampliar possibilidades.","⌘"]],about:"Criatividade humana. Inteligência ampliada.",description:"Unimos visão estratégica, comunicação e novas tecnologias para transformar desafios de marketing em experiências relevantes."};
 if(/software|desenvolvimento|sistemas|aplicativos|tecnologia|ti\b/.test(n))return {label:"Tecnologia & Produto",intro:"Produtos digitais, engenharia de software e inteligência aplicada ao negócio.",services:[["Produtos Digitais","Experiências digitais projetadas para necessidades reais.","◈"],["Desenvolvimento","Sistemas e aplicações com foco em evolução contínua.","⌘"],["Integrações","Conexões entre ferramentas, dados e processos.","↗"],["Inteligência Artificial","Recursos inteligentes para apoiar operações e decisões.","✦"]],about:"Tecnologia com visão de futuro.",description:"Conectamos estratégia, design e engenharia para construir experiências digitais que fazem sentido para cada operação."};
 if(/automac|inteligencia artificial|ia\b|chatbot|agentes/.test(n))return {label:"Automação & IA",intro:"Inteligência artificial aplicada à rotina, à comunicação e aos processos.",services:[["Agentes Inteligentes","Experiências assistidas por IA adaptadas ao contexto.","✦"],["Fluxos Automatizados","Processos conectados com menos tarefas repetitivas.","⌘"],["Integrações","Sistemas e informações trabalhando em conjunto.","◈"],["Análise Inteligente","Dados organizados para apoiar melhores decisões.","↗"]],about:"Inteligência que aproxima possibilidades.",description:"Exploramos automação e IA com visão prática, priorizando experiências claras, processos conectados e evolução responsável."};
 return {label:"Negócios Digitais",intro:"Estratégia, tecnologia e criatividade para novas experiências digitais.",services:[["Estratégia Digital","Planejamento para posicionar soluções e oportunidades.","✦"],["Experiências Digitais","Interfaces e jornadas pensadas para pessoas.","◈"],["Automação","Processos conectados para operações mais fluidas.","⌘"],["Inteligência de Dados","Informações que apoiam decisões e evolução.","↗"]],about:"Ideias conectadas. Futuro em construção.",description:"Combinamos estratégia, criação e tecnologia para desenhar soluções digitais relevantes para cada negócio."};
}
export function Template5AIFuturistSections({brand,niche,summary}:Props){
 const d=resolve(niche);
 const [active,setActive]=useState(0);
 const editorial=[
 {eyebrow:"Experiência pensada para pessoas",quote:"Uma parceria de verdade começa quando cada ideia é ouvida, compreendida e transformada em possibilidades.",caption:"Nosso compromisso com cada projeto"},
 {eyebrow:"Clareza em cada etapa",quote:"Boas soluções nascem de conversas transparentes, decisões conscientes e uma jornada que faz sentido.",caption:"Nossa forma de trabalhar"},
 {eyebrow:"Evolução como princípio",quote:"O melhor resultado não é um ponto final. É uma base sólida para continuar construindo o futuro.",caption:"Nossa visão de longo prazo"}
 ];
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
 .pn-t5-about-art{min-height:480px;position:relative;display:grid;place-items:center;isolation:isolate}
 .pn-t5-about-art:before{content:"";position:absolute;width:78%;aspect-ratio:1;background:radial-gradient(circle,#7433d588,transparent 67%);filter:blur(28px);z-index:-1}
 .pn-t5-sculpture{width:min(72%,360px);aspect-ratio:1;border-radius:45% 55% 35% 65%/60% 35% 65% 40%;background:conic-gradient(from 45deg,#271048,#c894ff,#4c1e9b,#efc7ff,#4e2297,#b676f8,#271048);box-shadow:inset -30px -20px 55px #150a35,inset 22px 20px 38px #fff6,0 0 70px #9c52ef5e;transform:rotate(-25deg);animation:pn-t5-about-float 9s ease-in-out infinite}
 .pn-t5-sculpture:after{content:"";display:block;position:absolute;inset:25%;border:25px solid #180b39a8;border-top-color:#f0d3ff;border-radius:50% 40% 60% 40%;box-shadow:0 0 30px #f5bfff66}
 .pn-t5-art-caption{position:absolute;bottom:28px;left:0;right:0;display:flex;justify-content:space-between;gap:14px;color:#c2aedf;font-size:11px;letter-spacing:.14em;text-transform:uppercase;border-top:1px solid #ffffff2c;padding-top:17px}

 .pn-t5-diff{background:radial-gradient(ellipse at 85% 15%,#4b207438,transparent 45%),#0b0918;border-top:1px solid #ffffff12}
 .pn-t5-diff-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:44px}
 .pn-t5-diff-card{position:relative;min-height:270px;display:flex;flex-direction:column;justify-content:space-between;padding:30px;border:1px solid #a975ff45;border-radius:22px;background:linear-gradient(155deg,#24163b,#120d24 75%);box-shadow:inset 0 1px #e5d1ff19,0 12px 42px #0003;overflow:hidden}
 .pn-t5-diff-card:before{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:radial-gradient(circle at 90% 0%,#a06cff27,transparent 55%)}
 .pn-t5-diff-card:nth-child(2),.pn-t5-diff-card:nth-child(5){background:linear-gradient(145deg,#32204f,#140e27)}
 .pn-t5-diff-num{font-size:12px;letter-spacing:.17em;color:#bd9ce9}.pn-t5-diff-glyph{font-size:35px;color:#c79cff;text-shadow:0 0 24px #a569ff}
 .pn-t5-diff-card h3{font-size:clamp(21px,2vw,28px);letter-spacing:-.04em;line-height:1.15;margin:14px 0 10px}.pn-t5-diff-card p{font-size:14px;line-height:1.7;color:#c7bdd7;margin:0}
 .pn-t5-process{background:linear-gradient(180deg,#0b0918,#100b20);border-top:1px solid #ffffff10}
 .pn-t5-process-layout{display:grid;grid-template-columns:.8fr 1.2fr;gap:clamp(35px,6vw,90px);align-items:start}
 .pn-t5-process-intro{position:sticky;top:38px}.pn-t5-process-list{position:relative;padding-left:38px;border-left:1px solid #8953d66b}
 .pn-t5-process-step{position:relative;padding:4px 0 65px}.pn-t5-process-step:last-child{padding-bottom:0}
 .pn-t5-process-step:before{content:"";position:absolute;left:-46px;top:11px;width:15px;height:15px;border-radius:50%;background:#d7b4ff;box-shadow:0 0 0 7px #7e45cb33,0 0 28px #ae69ff}
 .pn-t5-process-step>span{font-size:12px;letter-spacing:.2em;color:#b48be5}.pn-t5-process-step h3{font-size:clamp(27px,3vw,42px);line-height:1.12;letter-spacing:-.05em;margin:14px 0}.pn-t5-process-step p{max-width:510px;color:#c1b7d3;font-size:16px;line-height:1.75;margin:0}
 @media(max-width:950px){.pn-t5-diff-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pn-t5-process-layout{grid-template-columns:1fr}.pn-t5-process-intro{position:static}}
 @media(max-width:580px){.pn-t5-diff-grid{grid-template-columns:1fr;gap:12px;margin-top:30px}.pn-t5-diff-card{min-height:210px;padding:25px}.pn-t5-process-list{margin-left:8px}.pn-t5-process-step{padding-bottom:45px}}

 .pn-t5-voices{background:radial-gradient(ellipse at 12% 48%,#50237a3a,transparent 55%),#0c0918;border-top:1px solid #ffffff13}
 .pn-t5-voices-shell{display:grid;grid-template-columns:minmax(0,1fr) 175px;gap:32px;align-items:end}
 .pn-t5-voices-quote{font-size:clamp(31px,4.4vw,64px);line-height:1.17;letter-spacing:-.055em;font-weight:600;max-width:990px;margin:45px 0 30px;text-wrap:balance}
 .pn-t5-voices-quote:before{content:"“";display:block;color:#ae77ff;font-size:90px;line-height:.65;margin-bottom:15px}
 .pn-t5-voices-credit{color:#bfa9dc;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
 .pn-t5-voices-controls{display:flex;gap:12px;justify-content:flex-end;padding-bottom:8px}
 .pn-t5-voices-controls button{width:62px;height:62px;border-radius:50%;border:1px solid #b98aff66;background:#221434;color:#f6efff;font-size:24px;cursor:pointer;transition:background .2s}
 .pn-t5-voices-controls button:hover,.pn-t5-voices-controls button:focus-visible{background:#6736a4;outline:2px solid #c9a2ff;outline-offset:2px}
 .pn-t5-voices-counter{margin-top:35px;color:#a38ebd;font-size:12px;letter-spacing:.2em}
 .pn-t5-gallery{background:linear-gradient(160deg,#100b21,#090813);border-top:1px solid #ffffff12}
 .pn-t5-gallery-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:18px;margin-top:45px}
 .pn-t5-gallery-item{position:relative;isolation:isolate;overflow:hidden;min-height:310px;border:1px solid #ffffff23;border-radius:22px;background:radial-gradient(circle at 76% 28%,#9c65f24b,transparent 42%),linear-gradient(135deg,#26143d,#0d0b19);padding:30px;display:flex;flex-direction:column;justify-content:space-between}
 .pn-t5-gallery-item:nth-child(1){grid-row:span 2;min-height:650px}.pn-t5-gallery-item:nth-child(3){background:radial-gradient(circle at 70% 20%,#6939d080,transparent 50%),#130e24}
 .pn-t5-gallery-item:after{content:"";position:absolute;z-index:-1;width:250px;height:250px;border:38px solid #c99bff4d;border-radius:38% 62% 55% 45%;right:-70px;top:25%;transform:rotate(35deg);box-shadow:0 0 65px #a15aff3b}
 .pn-t5-gallery-item:nth-child(2):after{border-radius:50%;border-width:60px}.pn-t5-gallery-item:nth-child(3):after{border-radius:15%;transform:rotate(55deg)}
 .pn-t5-gallery-tag{align-self:flex-start;padding:9px 13px;border:1px solid #d2aaff66;border-radius:999px;background:#0b081b88;color:#e2d2ff;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
 .pn-t5-gallery-item h3{font-size:clamp(27px,3vw,43px);letter-spacing:-.055em;line-height:1.12;margin:0 0 10px}.pn-t5-gallery-item p{font-size:14px;line-height:1.7;color:#d2c5e5;max-width:340px;margin:0}
 .pn-t5-gallery-note{color:#a89cbd;font-size:12px;line-height:1.6;margin-top:20px}
 @media(max-width:850px){.pn-t5-voices-shell{grid-template-columns:1fr}.pn-t5-voices-controls{justify-content:flex-start}.pn-t5-gallery-item:nth-child(1){min-height:460px}}
 @media(max-width:580px){.pn-t5-gallery-grid{grid-template-columns:1fr;gap:13px;margin-top:30px}.pn-t5-gallery-item,.pn-t5-gallery-item:nth-child(1){grid-row:auto;min-height:320px;padding:25px}.pn-t5-voices-controls button{width:52px;height:52px}}
 @keyframes pn-t5-about-float{50%{transform:translateY(-13px) rotate(-19deg)}}
 @media(max-width:950px){.pn-t5-bento{grid-template-columns:1fr 1fr;grid-template-rows:auto}.pn-t5-tile:first-child{grid-row:auto;min-height:320px}.pn-t5-tile:nth-child(2){grid-column:auto}.pn-t5-tile{min-height:245px}.pn-t5-about-grid{grid-template-columns:1fr}.pn-t5-about-art{min-height:380px}}
 @media(max-width:580px){.pn-t5-bento{grid-template-columns:1fr;gap:12px;margin-top:32px}.pn-t5-tile{min-height:215px;border-radius:18px}.pn-t5-tile:first-child{min-height:280px}.pn-t5-about-art{min-height:310px}.pn-t5-art-caption{font-size:9px}.pn-t5-sculpture{max-width:235px}}
 @media(prefers-reduced-motion:reduce){.pn-t5-sculpture{animation:none}.pn-t5-tile{transition:none}}
 `}</style>
 <section id="solucoes" aria-label="Nossas soluções"><div className="pn-t5-wrap"><span className="pn-t5-kicker">01 / Soluções inteligentes</span><h2>Possibilidades que vão além do convencional.</h2><p className="pn-t5-lead">{d.intro}</p><div className="pn-t5-bento">{d.services.map(([name,desc,symbol],i)=><article className="pn-t5-tile" key={name}><span className="pn-t5-tile-index">0{i+1} / 04</span>{i===0?<div className="pn-t5-tile-art" aria-hidden="true"/>:null}<span className="pn-t5-tile-icon" aria-hidden="true">{symbol}</span><div><h3>{name}</h3><p>{desc}</p></div></article>)}</div></div></section>
 <section id="sobre" className="pn-t5-about" aria-label="Sobre a empresa"><div className="pn-t5-wrap pn-t5-about-grid"><div className="pn-t5-about-copy"><span className="pn-t5-kicker">02 / Sobre a marca</span><h2>{d.about}</h2><div className="pn-t5-about-line"/><p>{summary?.trim()&&summary.trim().length<450?summary:d.description}</p><p>Conheça a proposta da {brand} e descubra como novas ideias podem se transformar em experiências digitais relevantes.</p></div><div className="pn-t5-about-art" aria-label="Escultura digital abstrata em violeta"><div className="pn-t5-sculpture"/><div className="pn-t5-art-caption"><span>{d.label}</span><span>Human + intelligence</span></div></div></div></section>

 <section id="diferenciais" className="pn-t5-diff" aria-label="Nossos diferenciais"><div className="pn-t5-wrap"><span className="pn-t5-kicker">03 / O que nos diferencia</span><h2>Uma nova perspectiva para cada desafio.</h2><p className="pn-t5-lead">O que torna a experiência da {brand} especial em {d.label.toLowerCase()}.</p><div className="pn-t5-diff-grid">{[
 ["Visão estratégica","Cada solução começa com entendimento do contexto, dos objetivos e das pessoas.","✧"],
 ["Criatividade aplicada","Ideias originais conectadas à realidade e às necessidades de cada projeto.","✳"],
 ["Tecnologia inteligente","Ferramentas e recursos digitais escolhidos para simplificar e evoluir.","⌘"],
 ["Experiência centrada em pessoas","Jornadas intuitivas, comunicação clara e atenção aos detalhes.","◈"],
 ["Evolução contínua","Acompanhamento das mudanças e espaço para melhorar cada entrega.","↗"],
 ["Soluções sob medida",`Abordagens alinhadas ao universo de ${d.label.toLowerCase()}, sem fórmulas genéricas.`,"✦"]
 ].map(([name,desc,glyph],i)=><article className="pn-t5-diff-card" key={name}><div><span className="pn-t5-diff-num">0{i+1} / 06</span><div className="pn-t5-diff-glyph" aria-hidden="true">{glyph}</div></div><div><h3>{name}</h3><p>{desc}</p></div></article>)}</div></div></section>
 <section id="como-funciona" className="pn-t5-process" aria-label="Como funciona"><div className="pn-t5-wrap pn-t5-process-layout"><div className="pn-t5-process-intro"><span className="pn-t5-kicker">04 / Nossa jornada</span><h2>Do primeiro contato à próxima conquista.</h2><p className="pn-t5-lead">Uma jornada clara, colaborativa e adaptada às necessidades de cada projeto.</p></div><div className="pn-t5-process-list">{[
 ["Entendemos seu cenário",`Conversamos sobre os objetivos, desafios e oportunidades no universo de ${d.label.toLowerCase()}.`],
 ["Desenhamos a solução","Transformamos as prioridades em uma proposta com etapas, entregas e direcionamento visual."],
 ["Criamos e evoluímos","Colocamos o plano em prática, validamos os resultados e identificamos novas oportunidades de melhoria."]
 ].map(([name,desc],i)=><article className="pn-t5-process-step" key={name}><span>ETAPA 0{i+1}</span><h3>{name}</h3><p>{desc}</p></article>)}</div></div></section>

 <section id="depoimentos" className="pn-t5-voices" aria-label="Nossa visão e compromisso"><div className="pn-t5-wrap"><span className="pn-t5-kicker">05 / Nossa filosofia</span><div className="pn-t5-voices-shell"><div aria-live="polite"><h2>O que orienta cada experiência.</h2><span className="pn-t5-kicker">{editorial[active].eyebrow}</span><p className="pn-t5-voices-quote">{editorial[active].quote}</p><p className="pn-t5-voices-credit">{editorial[active].caption} · {brand}</p><div className="pn-t5-voices-counter">0{active+1} / 03</div></div><div className="pn-t5-voices-controls"><button type="button" aria-label="Anterior" onClick={()=>setActive((active+editorial.length-1)%editorial.length)}>←</button><button type="button" aria-label="Próximo" onClick={()=>setActive((active+1)%editorial.length)}>→</button></div></div></div></section>
 <section id="portfolio" className="pn-t5-gallery" aria-label="Galeria de soluções"><div className="pn-t5-wrap"><span className="pn-t5-kicker">06 / Áreas de atuação</span><h2>Ideias em diferentes dimensões.</h2><p className="pn-t5-lead">Uma galeria conceitual de possibilidades para {d.label.toLowerCase()}, sem apresentar projetos fictícios como trabalhos realizados.</p><div className="pn-t5-gallery-grid">{d.services.slice(0,3).map(([name,desc],i)=><article className="pn-t5-gallery-item" key={name}><span className="pn-t5-gallery-tag">Exploração 0{i+1}</span><div><h3>{name}</h3><p>{desc}</p></div></article>)}</div><p className="pn-t5-gallery-note">Apresentação conceitual. Substitua por cases, fotografias e resultados reais da marca quando disponíveis.</p></div></section>
 </div>;
}
