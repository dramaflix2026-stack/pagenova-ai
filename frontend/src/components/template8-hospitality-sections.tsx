"use client";
type Props={niche:string;brand:string;contactHref?:string};
const img=[
"https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85",
"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85",
"https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85",
"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85"
];
const norm=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const data:Record<string,{label:string;items:[string,string,string];about:string;experience:string;detail:string}>={
"hoteis":{label:"Acomodações",items:["Quartos e suítes","Conforto e tranquilidade","Ambientes para descansar"],about:"Uma estadia pensada para transformar pequenos momentos em boas lembranças.",experience:"Viva o melhor de cada estadia",detail:"Hospitalidade, descanso e momentos que merecem ser vividos."},
"pousadas":{label:"Refúgios",items:["Acomodações acolhedoras","Cantinhos para relaxar","Paisagens para contemplar"],about:"O encanto de uma pausa acolhedora, com tempo para apreciar cada detalhe.",experience:"O charme está nos detalhes",detail:"Descubra uma forma mais leve de aproveitar a viagem."},
"resorts":{label:"Universo do resort",items:["Acomodações","Lazer e descanso","Momentos especiais"],about:"Uma experiência de férias em que cada instante convida a aproveitar mais.",experience:"Mais do que uma hospedagem",detail:"Tempo para descansar, descobrir e criar memórias."},
"hoteis boutique":{label:"Espaços e atmosferas",items:["Suítes com personalidade","Design e acolhimento","Momentos privativos"],about:"Personalidade, atenção aos detalhes e uma hospitalidade com identidade própria.",experience:"A arte de receber",detail:"Uma experiência marcada por charme e autenticidade."},
"chales e cabanas":{label:"Nossos refúgios",items:["Chalés aconchegantes","Cabanas na natureza","Momentos a dois"],about:"Um convite a desacelerar, respirar fundo e reencontrar a simplicidade.",experience:"Reconecte-se com o essencial",detail:"Paisagens, silêncio e a liberdade de aproveitar o tempo."},
"casas de temporada":{label:"Estadias",items:["Casas para compartilhar","Espaços de descanso","Experiências em família"],about:"A liberdade de viajar no seu ritmo e sentir-se em casa longe de casa.",experience:"Sua viagem, seu ritmo",detail:"Mais espaço para viver o destino do seu jeito."},
"agencias de viagens":{label:"Destinos e roteiros",items:["Praias e natureza","Cidades e cultura","Viagens sob medida"],about:"Viajar é descobrir o mundo de um jeito único. Cada roteiro começa com uma boa conversa.",experience:"A próxima história começa aqui",detail:"Inspiração, planejamento e descobertas em cada jornada."},
"turismo de luxo":{label:"Viagens selecionadas",items:["Destinos exclusivos","Roteiros personalizados","Experiências singulares"],about:"Uma curadoria de viagens que valoriza tempo, autenticidade e atenção aos detalhes.",experience:"Viajar de forma extraordinária",detail:"Descubra experiências para além do convencional."},
"operadoras de turismo":{label:"Roteiros e destinos",items:["Viagens organizadas","Destinos nacionais","Experiências internacionais"],about:"Conectamos destinos, possibilidades e novas maneiras de conhecer o mundo.",experience:"Cada jornada abre caminhos",detail:"Do planejamento à descoberta, uma viagem cheia de possibilidades."},
"passeios e excursoes":{label:"Passeios e jornadas",items:["Passeios ao ar livre","Roteiros culturais","Excursões especiais"],about:"Uma boa viagem também se constrói nos pequenos encontros pelo caminho.",experience:"Descubra mais em cada passeio",detail:"Conheça lugares, histórias e perspectivas diferentes."},
"experiencias turisticas":{label:"Experiências",items:["Cultura e tradição","Natureza e aventura","Sabores e encontros"],about:"O destino é só o começo. O que permanece são as experiências vividas.",experience:"Sinta o lugar de verdade",detail:"Vivências para criar uma conexão especial com cada destino."},
"ecoturismo":{label:"Natureza e descobertas",items:["Trilhas e paisagens","Aventuras ao ar livre","Conexão com a natureza"],about:"Descobrir a natureza é também aprender a olhar o mundo com mais cuidado.",experience:"Natureza que transforma",detail:"A beleza está no caminho e no respeito ao ambiente."}
};
export function Template8HospitalitySections({niche,brand,contactHref}:Props){
 const key=norm(niche||"");const cfg=data[key]||data[Object.keys(data).find(k=>key.includes(k)||k.includes(key))||"hoteis"];
 const cta=contactHref&&/^(https?:\/\/|mailto:|tel:|#)/i.test(contactHref)?contactHref:"#tp8-contato";
 return <div className="pn-t8-sections">
 <style>{`
 .pn-t8-sections{font-family:Arial,Helvetica,sans-serif;width:100%;max-width:100%;overflow-x:clip;color:#253332;background:#f5f1e9}.pn-t8-sections *{box-sizing:border-box}
 .pn-t8-container{max-width:1400px;margin:auto;padding:clamp(70px,9vw,140px) clamp(22px,6vw,92px)}
 .pn-t8-eyebrow{text-transform:uppercase;font-size:11px;letter-spacing:.24em;font-weight:700;color:#87765f}
 .pn-t8-h2{font:400 clamp(38px,5.3vw,78px)/1.1 Georgia,'Times New Roman',serif;letter-spacing:-.05em;margin:20px 0 25px;overflow-wrap:break-word}
 .pn-t8-lead{font-size:clamp(15px,1.4vw,19px);line-height:1.85;color:#5d6660;max-width:610px}
 .pn-t8-mosaic{display:grid;grid-template-columns:1.35fr 1fr;grid-template-rows:repeat(2,minmax(210px,290px));gap:16px;margin-top:46px}
 .pn-t8-tile{position:relative;min-width:0;overflow:hidden;background:#b9b4a8;isolation:isolate}.pn-t8-tile:first-child{grid-row:span 2}
 .pn-t8-tile img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;z-index:-2;transition:transform .5s}.pn-t8-tile:hover img{transform:scale(1.045)}
 .pn-t8-tile:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#10221bba,transparent 70%);z-index:-1}
 .pn-t8-tiletext{position:absolute;left:clamp(22px,3vw,45px);bottom:clamp(20px,3vw,45px);color:#fff}
 .pn-t8-tiletext span{display:block;font-size:10px;letter-spacing:.24em;margin-bottom:10px}.pn-t8-tiletext h3{font:400 clamp(24px,3vw,43px)/1.15 Georgia,serif;margin:0}
 .pn-t8-about{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:clamp(35px,7vw,115px)}
 .pn-t8-about-photo{width:100%;aspect-ratio:4/5;object-fit:cover;display:block}.pn-t8-about-copy{padding:30px 0}
 .pn-t8-rule{width:68px;height:1px;background:#a58b67;margin:32px 0}
 .pn-t8-experience{position:relative;isolation:isolate;min-height:650px;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;background:#1d302e;padding:100px 24px;overflow:hidden}
 .pn-t8-experience img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-3}
 .pn-t8-experience:after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,#071b1bda,#071b1b73);z-index:-2}
 .pn-t8-experience-content{max-width:900px}.pn-t8-experience .pn-t8-eyebrow{color:#eee0c6}.pn-t8-experience .pn-t8-h2{font-size:clamp(44px,7vw,100px)}
 .pn-t8-experience p{font-size:clamp(16px,1.5vw,20px);line-height:1.8;max-width:620px;margin:0 auto 35px;color:#f3eee7}
 .pn-t8-cta{display:inline-block;text-decoration:none;color:#24342f;background:#f1e9db;padding:18px 28px;font-size:11px;letter-spacing:.17em;text-transform:uppercase;font-weight:700}
 @media(max-width:760px){.pn-t8-container{padding:75px 22px}.pn-t8-mosaic{grid-template-columns:1fr 1fr;grid-template-rows:310px 200px;gap:10px}.pn-t8-tile:first-child{grid-column:span 2;grid-row:auto}.pn-t8-tiletext{left:18px;bottom:20px}.pn-t8-tiletext h3{font-size:clamp(20px,5vw,31px)}.pn-t8-about{grid-template-columns:1fr;gap:24px}.pn-t8-about-photo{aspect-ratio:5/4}.pn-t8-about-copy{padding:0}.pn-t8-experience{min-height:570px;padding:80px 22px}}
 @media(prefers-reduced-motion:reduce){.pn-t8-tile img{transition:none}}
 `}</style>
 <section id="tp8-destinos" className="pn-t8-container"><span className="pn-t8-eyebrow">01 / Descubra</span><h2 className="pn-t8-h2">{cfg.label}</h2><p className="pn-t8-lead">Encontre inspiração para o seu próximo momento especial. Explore possibilidades e escolha o que combina com você.</p>
 <div className="pn-t8-mosaic">{cfg.items.map((item,i)=><article className="pn-t8-tile" key={item}><img loading="lazy" src={img[i]} alt={"Imagem ilustrativa de "+item}/><div className="pn-t8-tiletext"><span>0{i+1} / {cfg.label}</span><h3>{item}</h3></div></article>)}</div>
 </section>
 <section id="tp8-sobre" style={{background:"#eae5da"}}><div className="pn-t8-container pn-t8-about"><img loading="lazy" className="pn-t8-about-photo" src={img[3]} alt="Imagem ilustrativa de hospitalidade e viagem"/><div className="pn-t8-about-copy"><span className="pn-t8-eyebrow">02 / Nossa essência</span><h2 className="pn-t8-h2">O cuidado faz parte da jornada.</h2><div className="pn-t8-rule"/><p className="pn-t8-lead">{cfg.about}</p><p className="pn-t8-lead">Na {brand}, acreditamos que cada experiência merece atenção, autenticidade e boas histórias para contar.</p></div></div></section>
 <section id="tp8-experiencia-exclusiva" className="pn-t8-experience"><img loading="lazy" src={img[2]} alt="Paisagem inspiradora ilustrativa"/><div className="pn-t8-experience-content"><span className="pn-t8-eyebrow">03 / Experiências</span><h2 className="pn-t8-h2">{cfg.experience}</h2><p>{cfg.detail}</p><a className="pn-t8-cta" href={cta}>{cta==="#tp8-contato"?"Conheça nossas possibilidades":"Planejar minha experiência"} ↗</a></div></section>
 </div>;
}
