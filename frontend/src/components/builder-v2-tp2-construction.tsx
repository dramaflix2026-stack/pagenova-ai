"use client";
import {useState} from "react";
import "./builder-v2-tp2-construction.css";

export const isConstructionMaterials=(...parts:(string|undefined|null)[])=>/materiais?\s+(?:de|para)\s+constru[cç][aã]o|loja\s+de\s+materiais|dep[oó]sito\s+de\s+materiais|materiais\s+para\s+obra/i.test(parts.filter(Boolean).join(" "));
/* Every image ID below is an individual construction-related Pexels photo.
 * Never use interior-design stock images for this particular niche. */
const materialPhotoIds=[
 10261153, // construction inventory racks
 15360457, // stacked stone building materials in warehouse
 29519165, // cement bags
 40059189, // red bricks with trowel
 17419786, // hardware and construction tools
 29181494, // tile work during renovation
 36878025, // metal pipes in warehouse
 3847697, // retail spray paints
 33894661, // patterned concrete blocks
 5493676, // worker measuring project
 36003983, // metal beams warehouse
 30571032, // bricks material detail
 36397989, // industrial metal sheets
 40059290, // worker carrying cement
 15098592, // detailed concrete blocks
 36162732, // concrete supplies
 36386830, // concrete blocks in sunlight
 37432684, // foundation metal bars
 33894655, // making concrete blocks
 33667908, // construction supply yard
 32913796, // builder measuring
 30729599, // concrete surface
 29278167, // unfinished brick wall
 31931999, // industrial brick exterior
 36397983, // warehouse beams
 11461860, // moving bricks
 9762091, // brick stock work
 12327261, // precast concrete stock
 29872037, // concrete and brick texture
 32913796 // construction measurement alternate framing
] as const;
export const materialPhoto=(index:number,model=1)=> {
 const shift=model===1?0:model===2?9:17;
 const id=materialPhotoIds[((index+shift)%materialPhotoIds.length+materialPhotoIds.length)%materialPhotoIds.length];
 return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1500`;
};
export const constructionPhotoFor=(image:{src?:string;userUploaded?:boolean}|undefined,index:number,model=1)=>image?.userUploaded&&image.src?.trim()?image.src.trim():materialPhoto(index,model);
export const materialFAQ=[
 ["Como escolher os materiais para minha obra?","Informe o tipo de obra, a etapa em andamento e as medidas disponíveis. A equipe poderá orientar a seleção de itens e explicar diferenças entre aplicações."],
 ["Posso consultar preços e disponibilidade?","Sim. Solicite uma cotação dos produtos desejados para verificar valores, marcas, quantidades e condições atuais."],
 ["Quais tipos de materiais posso procurar?","Cimento, areia, tijolos, ferramentas, tintas, impermeabilizantes, materiais hidráulicos e elétricos são exemplos de categorias que você pode consultar. Confirme o catálogo com a loja."],
 ["É possível organizar compras por etapa da reforma?","Você pode preparar uma lista separada por fundação, alvenaria, instalações e acabamento para facilitar a consulta e a comparação dos materiais."],
 ["A empresa realiza entregas?","Informe seu CEP ou endereço no contato para verificar se há entrega, disponibilidade, custo e prazo. Nenhuma condição é presumida."],
 ["Quais informações ajudam a solicitar um orçamento?","Liste materiais, quantidades aproximadas, marcas de preferência e o local da obra. Caso não saiba a quantidade, peça orientação antes de fechar a compra."]
];
export const materialPillars=[
 {num:"01",title:"Escolha orientada",description:"Compare as alternativas por finalidade de uso, dimensões, resistência e especificações. A compra começa pelo material adequado à etapa da obra.",icon:"◎"},
 {num:"02",title:"Mix de produtos",description:"Do básico da alvenaria ao acabamento, organize suas necessidades entre materiais estruturais, ferramentas, tintas e revestimentos.",icon:"▦"},
 {num:"03",title:"Orçamento com clareza",description:"A lista de compras pode ser organizada por quantidade, unidade de medida, marca e aplicação para facilitar a conferência e evitar dúvidas.",icon:"▤"},
 {num:"04",title:"Planejamento de etapas",description:"Antecipe o que será necessário em cada fase e confirme condições de retirada, entrega e disponibilidade diretamente com a loja.",icon:"↗"}
];
export const materialPractices=[
 {title:"01 / Entender a etapa",text:"Identificar se a demanda envolve fundação, alvenaria, instalações, impermeabilização ou acabamento antes de selecionar produtos."},
 {title:"02 / Conferir especificações",text:"Comparar dimensões, rendimentos, classe de resistência, cores e orientações do fabricante quando a escolha exigir."},
 {title:"03 / Organizar a lista",text:"Separar quantidades, unidades, marcas e alternativas para facilitar a cotação e o controle de materiais da obra."},
 {title:"04 / Confirmar a compra",text:"Verificar preços, estoque, condições de pagamento e logística no canal de contato da loja antes de concluir o pedido."}
];
export const materialProof=[
 {number:"01",tag:"ESCOLHA CERTA",title:"Compatibilidade dos materiais",text:"Observe o tipo de superfície, finalidade de uso, resistência e recomendações do fabricante para reduzir decisões incompatíveis."},
 {number:"02",tag:"COMPRA ORGANIZADA",title:"Lista por etapa da obra",text:"Divida produtos e quantidades por fase para cotar materiais com mais contexto e facilitar o acompanhamento da reforma."},
 {number:"03",tag:"DECISÃO INFORMADA",title:"Preços e alternativas",text:"Peça propostas com quantidade, unidade, marca e opções equivalentes, quando disponíveis, para comparar o que realmente importa."},
 {number:"04",tag:"LOGÍSTICA CLARA",title:"Disponibilidade confirmada",text:"Cheque estoque, retirada, entregas e prazos com a empresa. Condições comerciais variam e não são assumidas nesta demonstração."}
];
type Testimonial={name:string;role:string;quote:string;portrait:string;demo:boolean};
const portrait=(id:number)=>`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=380`;
export const materialDemoTestimonials:Testimonial[]=[
 {name:"Mariana Oliveira",role:"Reforma residencial · Personagem fictícia",quote:"Ao organizar uma reforma, ajuda muito poder comparar diferentes tipos de revestimento e calcular o que será necessário antes de comprar.",portrait:portrait(27066067),demo:true},
 {name:"Ricardo Almeida",role:"Obra de pequeno porte · Personagem fictício",quote:"Uma lista dividida entre alvenaria, elétrica e acabamento deixa a cotação muito mais clara e facilita as compras por etapa.",portrait:portrait(30004315),demo:true},
 {name:"Patrícia Souza",role:"Renovação de ambiente · Personagem fictícia",quote:"Escolher tintas e materiais adequados para cada superfície faz diferença. Gosto quando as características de uso são explicadas.",portrait:portrait(33614428),demo:true},
 {name:"Carlos Ferreira",role:"Manutenção e reparos · Personagem fictício",quote:"Na hora de comprar ferramentas e materiais hidráulicos, é importante conferir medidas, compatibilidade e finalidade de cada item.",portrait:portrait(13999482),demo:true},
 {name:"Juliana Martins",role:"Ampliação residencial · Personagem fictícia",quote:"Orçamento detalhado e informações sobre estoque e entrega ajudam a planejar o cronograma da obra sem adivinhar condições.",portrait:portrait(6413499),demo:true}
];
export function MaterialProof({variant=2}:{variant?:2|3}){
 return <div className={"pnmat-proof pnmat-proof-"+variant}>
  <div className="pnmat-proof-lead"><span>UM PROCESSO MAIS CLARO</span><h3>Planejamento antes da escolha.<br/><em>Informação em cada decisão.</em></h3><p>Em vez de inventar indicadores e números de desempenho, mostramos os critérios que ajudam clientes a organizar suas compras de construção.</p></div>
  <div className="pnmat-proof-grid">{materialProof.map(item=><article key={item.number}><div className="pnmat-proof-top"><span>{item.number}</span><small>{item.tag}</small></div><h4>{item.title}</h4><p>{item.text}</p><span className="pnmat-proof-arrow" aria-hidden="true">↗</span></article>)}</div>
  <p className="pnmat-proof-disclaimer">Resultados quantitativos e avaliações reais poderão ser adicionados após comprovação pela empresa.</p>
 </div>;
}
export function MaterialTestimonials({provided=[],variant=2}:{provided?:string[][];variant?:2|3}){
 const [index,setIndex]=useState(0);
 const real=provided.map((t,i)=>({name:t[0],role:t[1]||"Cliente · relato cadastrado",quote:t.slice(2).join(" | "),portrait:portrait([27066067,30004315,33614428,13999482,6413499][i%5]),demo:false}));
 const items:Testimonial[]=[...real,...materialDemoTestimonials.slice(0,Math.max(0,5-real.length))];
 const viewCount=items.length;
 return <div className={"pnmat-testimonials pnmat-testimonials-"+variant}>
  <div className="pnmat-testimonials-header"><div><span>RELATOS SOBRE O UNIVERSO DE OBRAS E REFORMAS</span><h3>Experiências que <em>ajudam a imaginar.</em></h3></div><span className="pnmat-demo-label">{items.some(t=>t.demo)?"EXEMPLOS FICTÍCIOS • PRÉVIA DE LAYOUT":"RELATOS CADASTRADOS PELA EMPRESA"}</span></div>
  <div className="pnmat-testimonials-list">{items.map((item,i)=><article className="pnmat-testimonial-card" key={item.name+"-"+i}>
    <div className="pnmat-testimonial-meta"><img src={item.portrait} alt={"Retrato de banco de imagens usado apenas para ilustrar o layout de "+item.name} loading="lazy"/><div><strong>{item.name}</strong><small>{item.role}</small></div></div>
    <p>“{item.quote}”</p><span className="pnmat-testimonial-mark">{item.demo?"RELATO FICTÍCIO · FOTO ILUSTRATIVA":"RELATO FORNECIDO PELA EMPRESA · FOTO ILUSTRATIVA"}</span>
  </article>)}</div>
  <p className="pnmat-testimonials-disclaimer">Os nomes, as fotos e os relatos identificados como fictícios são apenas demonstrações visuais. Não representam compradores reais nem avaliações verificadas. Substitua por depoimentos e retratos autorizados antes de apresentar avaliações verdadeiras.</p>
 </div>;
}
