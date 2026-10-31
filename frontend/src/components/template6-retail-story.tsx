"use client";
import React from "react";

type Props={brand:string;niche:string;images:string[];aboutText?:string};
const details:Record<string,{focus:string;story:string;values:[string,string,string,string]}>={
"Loja de roupas":{focus:"Estilo com identidade",story:"Uma curadoria de peças pensadas para acompanhar diferentes momentos, com elegância, personalidade e atenção aos detalhes.",values:["Curadoria exclusiva","Qualidade em cada peça","Atendimento próximo","Estilo atemporal"]},
"Loja de calçados":{focus:"Cada passo, uma escolha",story:"Design, conforto e versatilidade se encontram em uma seleção feita para acompanhar o seu ritmo.",values:["Seleção criteriosa","Conforto e acabamento","Atendimento dedicado","Estilo versátil"]},
"Joalheria e semijoias":{focus:"Detalhes que permanecem",story:"Peças especiais para expressar personalidade e celebrar histórias, com atenção ao acabamento e à beleza de cada escolha.",values:["Peças selecionadas","Acabamento cuidadoso","Orientação personalizada","Elegância duradoura"]},
"Ótica":{focus:"Um olhar singular",story:"Armações que unem personalidade, conforto e design em uma seleção feita para valorizar cada estilo.",values:["Modelos selecionados","Conforto no uso","Atendimento atento","Design contemporâneo"]},
"Perfumaria e cosméticos":{focus:"Rituais de beleza",story:"Fragrâncias e cuidados selecionados para transformar pequenos momentos em experiências especiais.",values:["Curadoria de produtos","Qualidade e cuidado","Orientação na escolha","Beleza cotidiana"]},
"Pet shop":{focus:"Cuidado em cada detalhe",story:"Uma seleção feita com carinho para acompanhar a rotina e o bem-estar dos animais de estimação.",values:["Seleção responsável","Conforto e cuidado","Atendimento próximo","Praticidade diária"]},
"Loja de eletrônicos":{focus:"Tecnologia para viver melhor",story:"Produtos selecionados para conectar inovação, praticidade e experiências mais simples no dia a dia.",values:["Tecnologia selecionada","Funcionalidade","Suporte na escolha","Soluções atuais"]},
"Loja de celulares e acessórios":{focus:"Conecte seu estilo",story:"Dispositivos e acessórios que combinam tecnologia, utilidade e personalidade para a sua rotina.",values:["Escolhas inteligentes","Produtos funcionais","Orientação dedicada","Conexão no dia a dia"]},
"Loja de móveis e decoração":{focus:"Espaços com personalidade",story:"Móveis e objetos escolhidos para criar ambientes acolhedores, funcionais e cheios de identidade.",values:["Curadoria de design","Materiais e acabamentos","Apoio na escolha","Estilo para durar"]},
"Floricultura":{focus:"Beleza que floresce",story:"Flores e composições selecionadas para transformar gestos em lembranças e ocasiões em momentos especiais.",values:["Flores selecionadas","Composições cuidadosas","Atendimento sensível","Encanto em cada entrega"]},
"Papelaria":{focus:"Ideias em movimento",story:"Objetos e materiais escolhidos para inspirar a criatividade, a organização e os pequenos prazeres da rotina.",values:["Seleção criativa","Materiais especiais","Atendimento próximo","Inspiração diária"]},
"Loja de brinquedos":{focus:"Descobrir é brincar",story:"Brinquedos e presentes escolhidos para estimular a imaginação e criar momentos de alegria.",values:["Escolhas divertidas","Atenção à qualidade","Ajuda na escolha","Imaginação sem limites"]},
"Loja de artigos esportivos":{focus:"Movimento com propósito",story:"Equipamentos e acessórios selecionados para acompanhar conquistas, desafios e uma vida em movimento.",values:["Seleção especializada","Conforto e desempenho","Orientação na compra","Energia para evoluir"]},
"Loja de presentes e personalizados":{focus:"Presentear com significado",story:"Escolhas especiais e detalhes personalizados para celebrar pessoas e momentos que importam.",values:["Ideias exclusivas","Cuidado nos detalhes","Atendimento pessoal","Memórias especiais"]},
"E-commerce multimarcas":{focus:"Descobertas em um só lugar",story:"Uma seleção multimarcas que reúne novidades, essenciais e boas escolhas em uma experiência simples e inspiradora.",values:["Variedade selecionada","Escolhas de qualidade","Compra descomplicada","Novidades constantes"]}
};
export function Template6RetailStory({brand,niche,images,aboutText}:Props){
 const data=details[niche]||details["E-commerce multimarcas"];
 const pictures=images.filter(Boolean);
 const text=aboutText?.trim()||data.story;
 return <div className="pn-t6-story-root"><style>{`
.pn-t6-story-root{color:#26231f;background:#f6f3ee;font-family:Poppins,Arial,sans-serif}.pn-t6-story-root *{box-sizing:border-box}
.pn-t6-story-root .eyebrow{font-size:11px;font-weight:600;letter-spacing:.23em;text-transform:uppercase;color:#8c7863}
.pn-t6-about{padding:clamp(72px,9vw,142px) clamp(22px,6vw,100px);display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);align-items:center;gap:clamp(40px,7vw,130px);overflow:hidden}
.pn-t6-about-media{position:relative;min-height:540px;max-width:690px}.pn-t6-about-primary{width:78%;height:490px;object-fit:cover;display:block;background:#ded6ca}.pn-t6-about-secondary{position:absolute;width:46%;height:290px;right:0;bottom:0;object-fit:cover;box-shadow:-16px -16px 0 #f6f3ee;background:#d5cabe}
.pn-t6-about-copy{max-width:550px}.pn-t6-about h2,.pn-t6-diff h2{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.055em;line-height:1.05;font-size:clamp(45px,5.3vw,88px);margin:20px 0 30px;overflow-wrap:break-word}
.pn-t6-about p{font-size:clamp(14px,1.15vw,17px);line-height:1.95;color:#645c53;max-width:510px;margin:0 0 28px}
.pn-t6-about-sign{border-top:1px solid #b9afa4;padding-top:19px;font-family:Georgia,serif;font-size:clamp(20px,2vw,29px);letter-spacing:-.025em}
.pn-t6-diff{background:#e9e4dc;padding:clamp(70px,8vw,125px) clamp(22px,6vw,100px);display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(35px,7vw,120px);align-items:center}
.pn-t6-diff-visual{position:relative;min-height:520px;overflow:hidden;background:#d9d0c4}.pn-t6-diff-visual img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;transition:transform .8s cubic-bezier(.2,.65,.2,1)}.pn-t6-diff-visual:hover img{transform:scale(1.045)}
.pn-t6-diff h2{font-size:clamp(42px,4.5vw,76px);margin-bottom:30px}.pn-t6-diff-list{list-style:none;margin:0;padding:0;border-top:1px solid #a89e92}.pn-t6-diff-list li{display:grid;grid-template-columns:38px 1fr 20px;gap:12px;align-items:center;padding:24px 0;border-bottom:1px solid #a89e92;transition:padding-left .25s ease}.pn-t6-diff-list li:hover{padding-left:8px}.pn-t6-diff-num{font-family:Georgia,serif;font-size:15px;color:#857461}.pn-t6-diff-name{font-size:clamp(16px,1.45vw,23px);font-weight:500;line-height:1.35}.pn-t6-diff-arrow{font-size:20px;color:#8e7b68}
@media(max-width:850px){.pn-t6-about,.pn-t6-diff{grid-template-columns:1fr;gap:38px}.pn-t6-about-media{min-height:410px}.pn-t6-about-primary{height:390px}.pn-t6-about-secondary{height:230px}.pn-t6-diff-visual{min-height:420px}.pn-t6-diff-visual{order:2}}
@media(max-width:520px){.pn-t6-about,.pn-t6-diff{padding:65px 20px}.pn-t6-about h2,.pn-t6-diff h2{font-size:clamp(42px,11vw,59px)}.pn-t6-about-media{min-height:340px}.pn-t6-about-primary{height:310px;width:80%}.pn-t6-about-secondary{height:180px;width:47%}.pn-t6-diff-visual{min-height:350px}.pn-t6-diff-list li{padding:19px 0;grid-template-columns:30px 1fr 18px}}
@media(prefers-reduced-motion:reduce){.pn-t6-diff-visual img,.pn-t6-diff-list li{transition:none}}
`}</style>
<section className="pn-t6-about" id="sobre" aria-label="Sobre a marca">
 <div className="pn-t6-about-media">{pictures[0]&&<img className="pn-t6-about-primary" src={pictures[0]} alt={`Universo visual de ${brand}`} loading="lazy"/>}{pictures[1]&&<img className="pn-t6-about-secondary" src={pictures[1]} alt={`Detalhes da curadoria de ${brand}`} loading="lazy"/>}</div>
 <div className="pn-t6-about-copy"><span className="eyebrow">A essência da marca / {niche}</span><h2>{data.focus}<span style={{color:"#a28c73"}}>.</span></h2><p>{text}</p><div className="pn-t6-about-sign">{brand}</div></div>
</section>
<section className="pn-t6-diff" id="diferenciais" aria-label="Nossos diferenciais">
 <div><span className="eyebrow">O que nos torna especiais</span><h2>O cuidado está nos detalhes.</h2><ol className="pn-t6-diff-list">{data.values.map((value,i)=><li key={value}><span className="pn-t6-diff-num">0{i+1}</span><span className="pn-t6-diff-name">{value}</span><span className="pn-t6-diff-arrow" aria-hidden="true">↗</span></li>)}</ol></div>
 <div className="pn-t6-diff-visual">{pictures[2]&&<img src={pictures[2]} alt={`Seleção especial de ${brand}`} loading="lazy"/>}</div>
</section>
</div>;
}
