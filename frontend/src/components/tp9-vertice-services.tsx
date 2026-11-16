"use client";

type Props={contactHref?:string};
const photos=[
 "https://unsplash.com/photos/XP8o9_Arwqg/download?force=true&w=1200",
 "https://unsplash.com/photos/gW34cv-Ojjs/download?force=true&w=1200",
 "https://unsplash.com/photos/RDhXpNrafIU/download?force=true&w=1200",
 "https://unsplash.com/photos/8t6tk7LYLrE/download?force=true&w=1200",
 "https://unsplash.com/photos/rU_bvNfr8pQ/download?force=true&w=1200",
 "https://unsplash.com/photos/8IOn8x1zrGE/download?force=true&w=1200"
];
const items=[
 {name:"Revisão preventiva",description:"Inspeções e cuidados periódicos para acompanhar as condições do veículo e planejar sua manutenção.",tag:"INSPEÇÃO E CUIDADO"},
 {name:"Troca de óleo e filtros",description:"Serviço de lubrificação e substituição de filtros conforme as especificações aplicáveis ao veículo.",tag:"LUBRIFICAÇÃO"},
 {name:"Freios e suspensão",description:"Avaliação dos componentes de frenagem e suspensão para orientar os reparos necessários.",tag:"SEGURANÇA E CONTROLE"},
 {name:"Diagnóstico eletrônico",description:"Verificação técnica de falhas e sistemas eletrônicos para orientar as próximas etapas do serviço.",tag:"ANÁLISE TÉCNICA"},
 {name:"Ar-condicionado automotivo",description:"Avaliação das condições de funcionamento e manutenção do sistema de climatização.",tag:"CONFORTO E CLIMATIZAÇÃO"},
 {name:"Alinhamento e balanceamento",description:"Inspeção e ajustes de rodas conforme a necessidade e a disponibilidade dos equipamentos.",tag:"RODAS E ESTABILIDADE"}
];
const fallbackPhoto="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=85";
export function TP9VerticeServices({contactHref}:Props){
 const contact=contactHref&&(/^(https?:\/\/|mailto:|tel:)/i.test(contactHref)||contactHref==="#tp9-contato")?contactHref:"#tp9-orcamento";
 const external=/^https?:\/\//.test(contact);
 return <section className="pn-vh-services" id="tp9-servicos" aria-labelledby="tp9-vertice-services-title"><style>{`
 .pn-vh-services{--vhs-orange:#fa7135;background:#101518;color:#f8f8f6;padding:clamp(68px,8vw,120px) clamp(22px,6vw,100px);width:100%;overflow-x:clip;font-family:Inter,Arial,sans-serif}
 .pn-vh-services *{box-sizing:border-box}
 .pn-vh-services .vhs-wrap{max-width:1380px;margin:0 auto}
 .pn-vh-services .vhs-intro{display:flex;align-items:end;justify-content:space-between;gap:35px;margin-bottom:42px}
 .pn-vh-services .vhs-kicker{display:flex;align-items:center;gap:12px;color:var(--vhs-orange);font-size:11px;font-weight:850;letter-spacing:.23em;text-transform:uppercase;margin:0 0 19px}
 .pn-vh-services .vhs-kicker:before{content:"";width:30px;height:2px;background:var(--vhs-orange)}
 .pn-vh-services h2{color:white;font-size:clamp(39px,5.3vw,74px);line-height:1.06;letter-spacing:-.055em;max-width:800px;font-weight:900;margin:0}
 .pn-vh-services .vhs-subtitle{font-size:clamp(14px,1.15vw,17px);line-height:1.7;color:#aebdb5;max-width:360px;margin:0}
 .pn-vh-services .vhs-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
 .pn-vh-services .vhs-card{position:relative;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:#1b2427;border:1px solid #ffffff20;border-radius:15px;transition:transform .22s,border-color .22s,box-shadow .22s}
 .pn-vh-services .vhs-card:hover{transform:translateY(-5px);border-color:#fa7135a3;box-shadow:0 18px 40px #0000005c}
 .pn-vh-services .vhs-image{position:relative;overflow:hidden;aspect-ratio:1.35;background:#2d363a}
 .pn-vh-services .vhs-image:after{content:"";pointer-events:none;position:absolute;inset:0;background:linear-gradient(0deg,#10151887,transparent 55%)}
 .pn-vh-services .vhs-image img{display:block;width:100%;height:100%;object-fit:cover;object-position:center;transition:transform .4s}
 .pn-vh-services .vhs-card:hover .vhs-image img{transform:scale(1.045)}
 .pn-vh-services .vhs-index{position:absolute;z-index:2;top:18px;left:18px;border:1px solid #ffffff72;color:#fff;background:#111a1fc7;border-radius:6px;padding:9px 11px;font-size:11px;font-weight:850;letter-spacing:.11em}
 .pn-vh-services .vhs-info{padding:27px 27px 28px;display:flex;flex-direction:column;flex:1}
 .pn-vh-services .vhs-tag{font-size:10px;font-weight:850;letter-spacing:.14em;color:var(--vhs-orange);margin:0 0 13px}
 .pn-vh-services .vhs-info h3{font-size:clamp(21px,2vw,29px);font-weight:850;color:#fff;letter-spacing:-.035em;margin:0 0 13px;line-height:1.15}
 .pn-vh-services .vhs-desc{font-size:14px;line-height:1.7;color:#b5c3bb;margin:0 0 24px;flex:1}
 .pn-vh-services .vhs-link{display:inline-flex;align-items:center;gap:12px;align-self:start;border-bottom:1px solid #fa7135;color:#f8f8f6;font-weight:850;font-size:12px;padding-bottom:8px;text-decoration:none;transition:color .2s}
 .pn-vh-services .vhs-link:hover{color:#fa7135}
 .pn-vh-services a:focus-visible{outline:3px solid #ff9c6a;outline-offset:4px}
 @media(max-width:1050px){.pn-vh-services .vhs-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pn-vh-services .vhs-intro{align-items:start;flex-direction:column;gap:18px}.pn-vh-services .vhs-subtitle{max-width:650px}}
 @media(max-width:630px){.pn-vh-services{padding:65px 20px}.pn-vh-services .vhs-grid{grid-template-columns:1fr;gap:17px}.pn-vh-services .vhs-intro{margin-bottom:29px}.pn-vh-services .vhs-image{aspect-ratio:1.6}.pn-vh-services .vhs-info{padding:22px 22px 24px}}
 @media(prefers-reduced-motion:reduce){.pn-vh-services .vhs-card,.pn-vh-services .vhs-image img{transition:none}}
 `}</style>
 <div className="vhs-wrap"><div className="vhs-intro"><div><p className="vhs-kicker">02 / Nossos serviços</p><h2 id="tp9-vertice-services-title">Excelência técnica em cada serviço.</h2></div><p className="vhs-subtitle">Do diagnóstico à manutenção, conheça os cuidados que podem fazer parte da rotina do seu veículo.</p></div>
 <div className="vhs-grid">{items.map((item,index)=><article className="vhs-card" key={item.name}><div className="vhs-image"><img src={photos[index]} alt={"Fotografia ilustrativa relacionada a "+item.name.toLowerCase()} loading="lazy" onError={event=>{if(event.currentTarget.src!==fallbackPhoto)event.currentTarget.src=fallbackPhoto}}/><span className="vhs-index">{String(index+1).padStart(2,"0")}</span></div><div className="vhs-info"><p className="vhs-tag">{item.tag}</p><h3>{item.name}</h3><p className="vhs-desc">{item.description}</p><a className="vhs-link" href={contact} target={external?"_blank":undefined} rel={external?"noopener noreferrer":undefined}>Solicitar avaliação <span aria-hidden="true">↗</span></a></div></article>)}</div>
 </div>
 </section>;
}
