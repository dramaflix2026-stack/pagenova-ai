"use client";
type Props={brand:string;niche:string;email?:string;whatsapp?:string;address?:string};
const norm=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const messages:Record<string,string>={
"oficinas mecanicas":"Seu próximo caminho começa com cuidado.",
"auto centers":"Mais confiança para seguir em frente.",
"estetica automotiva":"O seu veículo merece atenção extraordinária.",
"detalhamento automotivo":"Cada detalhe merece ser valorizado.",
"funilaria e pintura":"O cuidado faz toda a diferença.",
"lava-rapidos":"Um novo brilho para a sua rotina.",
"autoeletricas":"Tecnologia e cuidado para seguir adiante.",
"lojas de pneus":"Seu caminho começa com a escolha certa.",
"centros de alinhamento":"Precisão para a sua próxima jornada.",
"oficinas de motos":"Pronto para viver a próxima estrada?",
"concessionarias de veiculos":"O próximo capítulo começa aqui.",
"locadoras de veiculos":"Sua próxima jornada espera por você."
};
const photos:Record<string,string>={"oficinas de motos":"photo-1558981806-ec527fa84c39","concessionarias de veiculos":"photo-1503376780353-7e6692767b70","locadoras de veiculos":"photo-1503376780353-7e6692767b70","estetica automotiva":"photo-1492144534655-ae79c964c9d7","detalhamento automotivo":"photo-1492144534655-ae79c964c9d7","lava-rapidos":"photo-1492144534655-ae79c964c9d7"};
export function Template9AutomotiveFinal({brand,niche,email,whatsapp,address}:Props){
 const key=norm(niche),phone=(whatsapp||"").replace(/\D/g,""),validPhone=phone.length>=10?phone:undefined;
 const mail=email?.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())?email.trim():undefined;
 const addr=address?.trim()||undefined;
 const contact=validPhone?"https://wa.me/"+validPhone:mail?"mailto:"+mail:undefined;
 const photo="https://images.unsplash.com/"+(photos[key]||"photo-1486262715619-67b85e0b08d3")+"?auto=format&fit=crop&w=2200&q=85";
 return <div className="pn-t9f"><style>{`
 .pn-t9f{background:#0d1514;color:#f3f0e9;width:100%;overflow-x:clip;font-family:Arial,Helvetica,sans-serif}.pn-t9f *{box-sizing:border-box}
 .pn-t9f-cta{position:relative;min-height:clamp(480px,65vw,740px);display:flex;align-items:center;isolation:isolate;padding:clamp(90px,10vw,160px) clamp(22px,7vw,110px)}.pn-t9f-cta img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}.pn-t9f-cta:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#040807e8,#04080765),linear-gradient(0deg,#0408079c,transparent);z-index:-1}
 .pn-t9f-cta-inner{max-width:980px}.pn-t9f-eyebrow{font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:#dcc7a7}.pn-t9f h2{font:400 clamp(51px,8vw,119px)/1.02 Georgia,serif;letter-spacing:-.055em;margin:26px 0 35px;overflow-wrap:break-word}.pn-t9f-button{display:inline-block;background:#f1eee6;color:#15201d;text-decoration:none;padding:19px 27px;font-size:12px;letter-spacing:.12em;text-transform:uppercase}.pn-t9f-unavailable{display:block;color:#d2d5d0;font-size:13px;line-height:1.7}
 .pn-t9f-footer{background:#111a19;padding:clamp(65px,8vw,115px) clamp(22px,7vw,110px) 25px}.pn-t9f-footer-grid{display:grid;grid-template-columns:minmax(0,1.6fr) 1fr 1fr;gap:clamp(25px,5vw,80px);max-width:1450px;margin:auto}.pn-t9f-wordmark{font:400 clamp(45px,6vw,90px)/1.05 Georgia,serif;letter-spacing:-.055em;overflow-wrap:anywhere;margin:0 0 22px}.pn-t9f-footer small{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#c6ad8b;margin-bottom:25px}.pn-t9f-footer p{font-size:14px;line-height:1.9;color:#c1cbc6;overflow-wrap:anywhere}.pn-t9f-footer a{display:block;color:#f3f0e9;text-decoration:none;margin-bottom:17px;font-size:14px;overflow-wrap:anywhere}.pn-t9f-bottom{max-width:1450px;margin:70px auto 0;padding-top:22px;border-top:1px solid #ffffff30;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;color:#c2cbc6;font-size:12px}.pn-t9f-bottom span{overflow-wrap:anywhere}
 @media(max-width:850px){.pn-t9f-footer-grid{grid-template-columns:1fr 1fr}.pn-t9f-footer-grid>div:first-child{grid-column:1/-1}.pn-t9f-cta{min-height:560px}}
 @media(max-width:480px){.pn-t9f-footer-grid{grid-template-columns:1fr}.pn-t9f-footer-grid>div:first-child{grid-column:auto}.pn-t9f-bottom{margin-top:45px}}
 `}</style>
 <section className="pn-t9f-cta" id="tp9-chamada-final"><img loading="lazy" src={photo} alt={"Imagem ilustrativa do setor "+niche}/><div className="pn-t9f-cta-inner"><span className="pn-t9f-eyebrow">11 / Sua próxima jornada</span><h2>{messages[key]||"Seu próximo caminho começa aqui."}</h2>{contact?<a className="pn-t9f-button" href={contact}>Fale com nossa equipe ↗</a>:<span className="pn-t9f-unavailable">O canal oficial de atendimento ainda não foi informado.</span>}</div></section>
 <footer className="pn-t9f-footer" id="tp9-rodape"><div className="pn-t9f-footer-grid"><div><p className="pn-t9f-wordmark">{brand}</p><p>{niche} · uma apresentação dedicada ao universo automotivo.</p></div><div><small>Navegação</small><a href="#tp9-inicio">Início</a><a href="#tp9-servicos">Serviços</a><a href="#tp9-sobre">Sobre</a><a href="#tp9-galeria">Galeria</a><a href="#tp9-faq">Perguntas frequentes</a><a href="#tp9-orcamento">Orçamento</a></div><div><small>Contato e localização</small>{validPhone&&<a href={"https://wa.me/"+validPhone} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}{mail&&<a href={"mailto:"+mail}>{mail}</a>}{addr&&<><p>{addr}</p><a href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(addr)} target="_blank" rel="noopener noreferrer">Ver localização ↗</a></>}{!validPhone&&!mail&&!addr&&<p>Informações oficiais ainda não cadastradas.</p>}</div></div><div className="pn-t9f-bottom"><span>{brand} · {niche}</span><span>Informações comerciais sujeitas à confirmação com a empresa.</span></div></footer>
 </div>;
}
