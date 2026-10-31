"use client";
type Props={brand:string;niche:string;contactHref?:string};
const norm=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const records:Record<string,[string,string,string,string]> = {
"oficinas mecanicas":["Diagnóstico mecânico","Manutenção preventiva","Reparos automotivos","Atenção técnica"],
"auto centers":["Revisão automotiva","Pneus e rodas","Manutenção geral","Praticidade"],
"estetica automotiva":["Higienização interna","Polimento","Proteção estética","Acabamento"],
"detalhamento automotivo":["Detalhamento externo","Detalhamento interno","Proteção de superfícies","Precisão"],
"funilaria e pintura":["Reparo de carroceria","Preparação de superfícies","Pintura automotiva","Cuidado visual"],
"lava-rapidos":["Lavagem externa","Limpeza interna","Acabamento","Praticidade"],
"autoeletricas":["Diagnóstico elétrico","Iluminação","Sistemas elétricos","Tecnologia"],
"lojas de pneus":["Seleção de pneus","Consulta de medidas","Cuidados com rodas","Orientação"],
"centros de alinhamento":["Alinhamento","Balanceamento","Avaliação de rodas","Precisão"],
"oficinas de motos":["Revisão de motos","Manutenção mecânica","Cuidados preventivos","Duas rodas"],
"concessionarias de veiculos":["Conheça os veículos","Opções de compra","Atendimento comercial","Escolha"],
"locadoras de veiculos":["Locação por período","Opções de veículos","Consulta de disponibilidade","Mobilidade"]
};
const photo=(niche:string)=>{const n=norm(niche);const id=n.includes("moto")?"photo-1558981806-ec527fa84c39":n.includes("concession")||n.includes("locadora")?"photo-1503376780353-7e6692767b70":n.includes("estetica")||n.includes("detalhamento")||n.includes("lava")?"photo-1492144534655-ae79c964c9d7":"photo-1486262715619-67b85e0b08d3";return "https://images.unsplash.com/"+id+"?auto=format&fit=crop&w=1400&q=85"};
export function Template9AutomotiveSections({brand,niche,contactHref}:Props){
 const d=records[norm(niche)]||records["auto centers"];const image=photo(niche);const target=contactHref&&/^(https?:\/\/|mailto:|tel:)/.test(contactHref)?contactHref:"#tp9-contato";
 return <div className="pn-t9s"><style>{`
 .pn-t9s{background:#eeeae2;color:#202b29;width:100%;overflow-x:clip;font-family:Arial,sans-serif}.pn-t9s *{box-sizing:border-box}
 .pn-t9s section{padding:clamp(75px,9vw,130px) clamp(22px,6vw,90px)}.pn-t9s-inner{max-width:1350px;margin:auto}
 .pn-t9s-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.22em;color:#9a8469}
 .pn-t9s h2{font:400 clamp(40px,5.8vw,85px)/1.08 Georgia,serif;letter-spacing:-.055em;margin:24px 0 45px;overflow-wrap:break-word}
 .pn-t9s-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
 .pn-t9s-card{background:#fff;min-width:0}.pn-t9s-card img{display:block;width:100%;height:clamp(220px,25vw,340px);object-fit:cover}.pn-t9s-card div{padding:26px}.pn-t9s-card small{color:#99866b;letter-spacing:.18em}.pn-t9s-card h3{font:400 clamp(25px,2.7vw,38px) Georgia,serif;margin:18px 0}.pn-t9s-card p,.pn-t9s-about p{font-size:15px;line-height:1.85;color:#65716b}
 .pn-t9s-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(30px,7vw,110px);align-items:center}.pn-t9s-about img{width:100%;height:clamp(390px,47vw,620px);object-fit:cover}.pn-t9s-about a{display:inline-block;margin-top:25px;color:#202b29;border-bottom:1px solid #202b29;padding-bottom:8px;text-decoration:none;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
 .pn-t9s-dark{position:relative;isolation:isolate;background:#101918;color:white}.pn-t9s-dark>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}.pn-t9s-dark:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#07100fe8,#07100fbd),linear-gradient(0deg,#07100fdd,transparent);z-index:-1}.pn-t9s-dark .pn-t9s-kicker{color:#d2bda0}
 .pn-t9s-features{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px;margin-top:65px}.pn-t9s-feature{border-top:1px solid #ffffff88;padding-top:23px}.pn-t9s-feature small{color:#d2bda0;letter-spacing:.2em}.pn-t9s-feature h3{font:400 clamp(22px,2.3vw,32px) Georgia,serif;margin:26px 0 12px}.pn-t9s-feature p{font-size:13px;line-height:1.8;color:#d2d9d5}
 @media(max-width:850px){.pn-t9s-cards,.pn-t9s-about-grid{grid-template-columns:1fr}.pn-t9s-card img{height:300px}.pn-t9s-about img{height:410px}.pn-t9s-features{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:480px){.pn-t9s-features{grid-template-columns:1fr}.pn-t9s-card img{height:240px}.pn-t9s-about img{height:320px}}
 `}</style>
 <section id="tp9-servicos"><div className="pn-t9s-inner"><span className="pn-t9s-kicker">02 / Nossos serviços</span><h2>Excelência em cada detalhe.</h2><div className="pn-t9s-cards">{d.slice(0,3).map((name,i)=><article key={name} className="pn-t9s-card"><img loading="lazy" src={i===1?"https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85":image} alt={"Imagem ilustrativa de "+name}/><div><small>0{i+1} / {niche}</small><h3>{name}</h3><p>Consulte a disponibilidade e os detalhes deste serviço diretamente com a equipe.</p></div></article>)}</div></div></section>
 <section id="tp9-sobre" className="pn-t9s-about"><div className="pn-t9s-inner pn-t9s-about-grid"><img loading="lazy" src={image} alt={"Imagem ilustrativa do setor de "+niche}/><div><span className="pn-t9s-kicker">03 / Sobre a marca</span><h2>{brand}.<br/>Movidos pelo cuidado.</h2><p>Uma experiência dedicada ao universo de {niche.toLowerCase()}, com atenção às necessidades de cada cliente e de cada veículo.</p><p>Informações sobre história, equipe, qualificações e estrutura devem ser fornecidas pela empresa.</p><a href={target}>Fale com nossa equipe ↗</a></div></div></section>
 <section id="tp9-diferenciais" className="pn-t9s-dark"><img loading="lazy" src={image} alt="Imagem automotiva ilustrativa"/><div className="pn-t9s-inner"><span className="pn-t9s-kicker">04 / Nossos diferenciais</span><h2>Mais do que um serviço.<br/>Uma experiência.</h2><div className="pn-t9s-features">{[d[3],"Atendimento próximo","Orientação clara","Cuidado em cada etapa"].map((f,i)=><div key={i} className="pn-t9s-feature"><small>0{i+1}</small><h3>{f}</h3><p>Uma proposta de atendimento pensada para {niche.toLowerCase()}.</p></div>)}</div></div></section>
 <section id="tp9-contato" style={{background:"#14211f",color:"#fff",padding:"42px clamp(22px,6vw,90px)"}}><div className="pn-t9s-inner">{target==="#tp9-contato"?"Os canais oficiais de contato ainda não foram configurados.":<a style={{color:"white",textDecoration:"underline",textUnderlineOffset:7}} href={target}>Fale com nossa equipe ↗</a>}</div></section>
 </div>;
}
