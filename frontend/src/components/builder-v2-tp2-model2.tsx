"use client";
import {useState,type FormEvent} from "react";
import type {BuilderV2SiteData} from "@/components/builder-v2-site";
import "./builder-v2-tp2-model2.css";
import {UniversalTemplateSections} from "./builder-v2-universal-sections";
import {TP2EvidenceNumbers,TP2EvidenceTestimonials,TP2ContactMap,TP2PremiumFooterBody,hasTP2VerifiedMetrics} from "./builder-v2-tp2-evidence";
import {universalBlockProps,universalFaqItems} from "./builder-v2-universal-bindings";
import {isConstructionMaterials,constructionPhotoFor,materialPillars,MaterialProof,MaterialTestimonials} from "./builder-v2-tp2-construction";
const photos=["photo-1600607687939-ce8a6c25118c","photo-1600585154340-be6161a56a0c","photo-1600566753190-17f0baa2a6c3","photo-1600607687920-4e2a09cf159d","photo-1487958449943-2429e8be8625","photo-1511818966892-d7d671e672a2","photo-1497366754035-f200968a6e72","photo-1600607687644-c7171b42498f","photo-1613977257363-707ba9348227","photo-1600566753086-00f18fb6b3ea","photo-1600585154526-990dced4db0d","photo-1518005020951-eccb494ad742","photo-1497366811353-6870744d04b2","photo-1600566752355-35792bedcfea","photo-1616486338812-3dadae4b4ace"];
const pic=(i:number)=>"https://images.unsplash.com/"+photos[(i+photos.length)%photos.length]+"?auto=format&fit=crop&w=1400&q=82";
const categories=[
[/engenharia|engenheiro/i,["Projetos de engenharia","Planejamento técnico","Gestão de obras","Consultoria especializada"]],
[/construtora|construção civil/i,["Construção residencial","Construção comercial","Gerenciamento de obras","Planejamento de empreendimentos"]],
[/reformas?/i,["Reformas residenciais","Reformas comerciais","Adequações de ambientes","Planejamento de reformas"]],
[/arquitetura/i,["Projetos arquitetônicos","Interiores","Estudos de viabilidade","Acompanhamento de projetos"]],
[/energia solar/i,["Projetos fotovoltaicos","Instalação de sistemas","Manutenção","Consultoria energética"]],
[/eletricista/i,["Instalações elétricas","Manutenção preventiva","Adequações elétricas","Diagnóstico técnico"]],
[/encanador/i,["Instalações hidráulicas","Reparos","Manutenção","Adequações hidráulicas"]],
[/serralheria/i,["Estruturas metálicas","Portões e grades","Projetos sob medida","Manutenção"]],
[/vidraçaria/i,["Vidros sob medida","Box e divisórias","Fachadas envidraçadas","Instalação técnica"]],
[/pintura/i,["Pintura residencial","Pintura comercial","Preparação de superfícies","Acabamentos"]],
[/marcenaria/i,["Marcenaria sob medida","Acabamentos em madeira","Projetos personalizados","Instalação"]],
[/móveis planejados/i,["Cozinhas planejadas","Armários sob medida","Ambientes corporativos","Projetos personalizados"]],
[/paisagismo/i,["Projetos paisagísticos","Jardins residenciais","Áreas externas","Manutenção verde"]],
[/materiais de construção/i,["Materiais estruturais","Acabamentos","Ferramentas","Orientação de compra"]],
[/segurança eletrônica/i,["Câmeras de segurança","Controle de acesso","Alarmes","Manutenção de sistemas"]]
] as const;
const faqs=[["Como solicitar um orçamento?","Envie os detalhes do que você precisa pelo canal de contato cadastrado."],["O atendimento é personalizado?","O escopo e as possibilidades são definidos conforme a necessidade apresentada."],["Quais regiões são atendidas?","Consulte a área de atendimento diretamente com a empresa."],["Como funciona o planejamento?","O processo começa pela compreensão da demanda e pela definição das próximas etapas."],["Como consultar prazos?","Os prazos dependem do serviço e devem ser confirmados após avaliação."],["Há atendimento para empresas?","Entre em contato para verificar as modalidades disponíveis."]];
export function BuilderV2TP2Model2({site,publishedMode=false}:{site:BuilderV2SiteData;publishedMode?:boolean}){
 const [faq,setFaq]=useState<number|null>(0),[name,setName]=useState(""),[reply,setReply]=useState(""),[msg,setMsg]=useState(""),[notice,setNotice]=useState("");
 const niche=site.niche||"Engenharia",brand=site.header?.brand||site.title||"Estúdio Técnico";
 const isMaterials=isConstructionMaterials(niche,brand,site.title);
 const services=categories.find(([rx])=>rx.test(niche))?.[1]||categories[0][1];
 const heading=site.blocks.find(b=>b.type==="heading"&&b.text?.trim())?.text;
 const description=site.blocks.find(b=>b.type==="paragraph"&&b.text?.trim())?.text;
 const footerBlocks=site.blocks.filter(b=>/^(rodape|footer)$/i.test(b.section||""));
 const footerHeading=footerBlocks.find(b=>b.type==="heading");
 const footerParagraph=footerBlocks.find(b=>b.type==="paragraph");
 const numbersHeading=site.blocks.find(b=>/^(numeros|resultados|numbers|metricas)$/i.test(b.section||"")&&b.type==="heading");
 const testimonialsHeading=site.blocks.find(b=>/^(depoimentos|testimonials|avaliacoes)$/i.test(b.section||"")&&b.type==="heading");
 const historyBlocks=site.blocks.filter(b=>/^(trajetoria|historia|history|nossa-trajetoria)$/i.test(b.section||""));
 const historyHeadings=historyBlocks.filter(b=>b.type==="heading");
 const historyTitle=historyHeadings[0];
 const historyChapters=historyHeadings.slice(1);
 const historyDescriptions=historyBlocks.filter(b=>b.type==="paragraph");
 const historyImages=historyBlocks.filter(b=>b.type==="image");
 const faqBlocks=site.blocks.filter(b=>/faq|pergunt|duvidas|dúvidas/i.test(b.section||""));
 const faqHeading=faqBlocks.find(b=>b.type==="heading");
 const faqParagraphs=faqBlocks.filter(b=>b.type==="paragraph");
 const faqItems=universalFaqItems(site.blocks,faqs);
 const contactBlocks=site.blocks.filter(b=>/^(contato|contact|entre-em-contato)$/i.test(b.section||""));
 const contactHeading=contactBlocks.find(b=>b.type==="heading");
 const contactImage=contactBlocks.find(b=>b.type==="image");
 const projectBlocks=site.blocks.filter(b=>/^(projetos|projects|portfolio-projetos)$/i.test(b.section||""));
 const projectHeading=projectBlocks.find(b=>b.type==="heading");
 const projectDescription=projectBlocks.find(b=>b.type==="paragraph");
 const projectImages=projectBlocks.filter(b=>b.type==="image");
 const processBlocks=site.blocks.filter(b=>/^(como-funciona|como-trabalhamos|processo|process)$/i.test(b.section||""));
 const processHeadings=processBlocks.filter(b=>b.type==="heading");
 const processTitle=processHeadings[0];
 const processSteps=processHeadings.slice(1);
 const processDescriptions=processBlocks.filter(b=>b.type==="paragraph");
 const processImages=processBlocks.filter(b=>b.type==="image");
 const differencesBlocks=site.blocks.filter(b=>/^(diferenciais|diferences|differentials)$/i.test(b.section||""));
 const differencesHeadings=differencesBlocks.filter(b=>b.type==="heading");
 const differencesTitle=differencesHeadings[0];
 const differencesCards=differencesHeadings.slice(1);
 const galleryBlocks=site.blocks.filter(b=>/^(galeria|gallery|portfolio)$/i.test(b.section||""));
 const galleryHeading=galleryBlocks.find(b=>b.type==="heading");
 const galleryDescription=galleryBlocks.find(b=>b.type==="paragraph");
 const galleryImages=galleryBlocks.filter(b=>b.type==="image");
 const serviceBlocks=site.blocks.filter(b=>/^(servicos|services|especialidades)$/i.test(b.section||""));
 const serviceHeadings=serviceBlocks.filter(b=>b.type==="heading");
 const serviceParagraphs=serviceBlocks.filter(b=>b.type==="paragraph");
 const serviceImages=serviceBlocks.filter(b=>b.type==="image");
 const serviceSectionHeading=serviceHeadings[0];
 const serviceCardHeadings=serviceHeadings.slice(1);
 const aboutBlocks=site.blocks.filter(b=>/^(sobre|about|essencia|nossa-essencia)$/i.test(b.section||""));
 const aboutHeading=aboutBlocks.find(b=>b.type==="heading");
 const aboutParagraphs=aboutBlocks.filter(b=>b.type==="paragraph");
 const aboutImage=aboutBlocks.find(b=>b.type==="image");
 const heroBlocks=site.blocks.filter(b=>/^(inicio|hero|home|capa)$/i.test(b.section||""));
 const heroHeading=heroBlocks.find(b=>b.type==="heading");
 const heroDescription=heroBlocks.find(b=>b.type==="paragraph");
 const heroButton=heroBlocks.find(b=>b.type==="button");
 const supplied=site.blocks.filter(b=>b.type==="image"&&b.src);
 const image=(i:number)=>isMaterials?constructionPhotoFor(supplied[i],i,2):supplied[i]?.src||pic(i);
 const visual=(block:BuilderV2SiteData["blocks"][number]|undefined,index:number)=>isMaterials?constructionPhotoFor(block,index,2):block?.src?.trim()||image(index);
 const phone=(site.footer?.whatsapp||"").replace(/\D/g,""),email=site.footer?.email?.trim()||"";
 const contact=phone.length>=10?"https://wa.me/"+(phone.startsWith("55")?phone:"55"+phone):/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?"mailto:"+email:null;
 const send=(e:FormEvent)=>{e.preventDefault();if(!name.trim()||!reply.trim()||!msg.trim()){setNotice("Preencha todos os campos.");return;}if(!contact){setNotice("A empresa ainda não cadastrou um canal de contato.");return;}const body="Nome: "+name+"\nContato: "+reply+"\nMensagem: "+msg;const url=contact.startsWith("mailto:")?contact+"?subject="+encodeURIComponent("Contato pelo site")+"&body="+encodeURIComponent(body):contact+"?text="+encodeURIComponent(body);window.location.href=url;setNotice("Confirme o envio no aplicativo de contato.");};
 const testimonials=site.blocks.filter(b=>b.type==="paragraph"&&/depoiment|testimonial|avalia[cç]|relato/i.test(b.section||"")).map(b=>(b.text||"").split("|").map(x=>x.trim())).filter(a=>a.length>=3&&a[0]&&a[2]);
 const actualProjects=site.blocks.filter(b=>b.type==="image"&&b.src&&/projet|obra|portf[oó]lio|galeria/i.test(b.section||""));
 const metrics=site.blocks.filter(b=>b.type==="paragraph"&&/n[uú]meros|resultados|indicadores|m[eé]tricas/i.test(b.section||"")).map(b=>b.text).filter(Boolean);
 const links=[["Sobre","#sobre"],["Especialidades","#especialidades"],["Projetos","#projetos"],["Contato","#contato"]];
 return <div className={"tp2m2"+(isMaterials?" pnmat-building":"")} id="inicio">
 <header className="tp2m2-header"><a href="#inicio" className="tp2m2-brand">{brand}</a><nav>{links.map(([t,h])=><a key={h} href={h}>{t}</a>)}</nav><a className="tp2m2-header-cta" href="#contato">Iniciar conversa ↗</a></header>
 <UniversalTemplateSections site={site}>
 <section data-universal-section="inicio" className="tp2m2-hero" style={{backgroundImage:"linear-gradient(90deg,rgba(10,15,18,.86),rgba(10,15,18,.18)),url('"+image(0)+"')"}}><div className="tp2m2-hero-copy"><span className="tp2m2-overline">01 / DESIGN • PRECISÃO • PROPÓSITO</span><h1 {...universalBlockProps(heroHeading)}>{heroHeading?.text||heading||"O futuro começa com um projeto bem pensado."}</h1><p {...universalBlockProps(heroDescription)}>{heroDescription?.text||description||"Soluções de "+niche.toLowerCase()+" com atenção aos detalhes e às necessidades de cada projeto."}</p><a className="tp2m2-button" href={heroButton?.href||"#especialidades"} {...universalBlockProps(heroButton)}>{heroButton?.text||"Explore nossas soluções ↗"}</a></div><span className="tp2m2-hero-side">ARQUITETURA EDITORIAL / 02</span></section>
 <section data-universal-section="sobre" className="tp2m2-section tp2m2-about" id="sobre"><div className="tp2m2-label">02 / SOBRE A EMPRESA</div><div className="tp2m2-about-grid"><img src={visual(aboutImage,1)} alt="Referência visual do setor" loading="lazy" {...universalBlockProps(aboutImage)}/><div><span className="tp2m2-kicker">NOSSA ESSÊNCIA</span><h2 {...universalBlockProps(aboutHeading)}>{aboutHeading?.text||<>Uma visão que transforma <em>ideias em possibilidades.</em></>}</h2><p {...universalBlockProps(aboutParagraphs[0])}>{aboutParagraphs[0]?.text||"Em cada demanda, valorizamos o diálogo, a organização e o cuidado com as decisões que moldam o resultado."}</p><p {...universalBlockProps(aboutParagraphs[1])}>{aboutParagraphs[1]?.text||"Conheça uma abordagem orientada às necessidades de cada cliente, do primeiro contato às próximas etapas."}</p><a href="#contato" className="tp2m2-link">Converse com nossa equipe ↗</a></div></div></section>
 <section data-universal-section="servicos" className="tp2m2-section" id="especialidades"><div className="tp2m2-label">03 / NOSSAS ESPECIALIDADES</div><div className="tp2m2-title"><span className="tp2m2-kicker">O QUE FAZEMOS</span><h2 {...universalBlockProps(serviceSectionHeading)}>{serviceSectionHeading?.text||<>Conhecimento aplicado. <em>Detalhes que importam.</em></>}</h2></div><div className="tp2m2-services">{services.map((s,i)=><article key={s}><div className="tp2m2-photo"><img src={visual(serviceImages[i],i+2)} alt={"Fotografia ilustrativa: "+s} loading="lazy" {...universalBlockProps(serviceImages[i])}/><span>0{i+1}</span></div><h3 {...universalBlockProps(serviceCardHeadings[i])}>{serviceCardHeadings[i]?.text||s}</h3><p {...universalBlockProps(serviceParagraphs[i])}>{serviceParagraphs[i]?.text||"Uma solução planejada conforme o contexto e as necessidades de cada demanda."}</p></article>)}</div></section>
 <section data-universal-section="diferenciais" className="tp2m2-section tp2m2-manifesto"><div className="tp2m2-label">04 / NOSSOS DIFERENCIAIS</div>{isMaterials?<div className="tp2m2-manifesto-grid"><div><span className="tp2m2-kicker">ESCOLHAS QUE IMPORTAM</span><h2>Por que escolher <em>nosso atendimento?</em></h2><p style={{maxWidth:680,fontSize:16,lineHeight:1.85}}>Da definição dos produtos à comparação de alternativas, cada escolha depende das características da obra. Confira o que merece atenção antes de fechar seu pedido.</p></div><div className="pnmat-m2-values">{materialPillars.map(p=><article key={p.num}><div className="pnmat-m2-value-head"><span>{p.num}</span><span aria-hidden="true">{p.icon}</span></div><h3>{p.title}</h3><p>{p.description}</p></article>)}</div></div>:<div className="tp2m2-manifesto-grid"><h2 {...universalBlockProps(differencesTitle)}>{differencesTitle?.text||<>O que nos define <em>está na maneira de fazer.</em></>}</h2><div className="tp2m2-values">{[["01","Escuta e contexto"],["02","Planejamento consciente"],["03","Atenção aos detalhes"],["04","Comunicação clara"]].map(([n,t])=><div key={n}><b>{n}</b><h3 {...universalBlockProps(differencesCards[Number(n)-1])}>{differencesCards[Number(n)-1]?.text||t}</h3></div>)}</div></div>}</section>
 <section data-universal-section="como-funciona" className="tp2m2-section"><div className="tp2m2-label">05 / COMO TRABALHAMOS</div><div className="tp2m2-title"><h2 {...universalBlockProps(processTitle)}>{processTitle?.text||<>Um caminho construído <em>etapa por etapa.</em></>}</h2></div>{[["Entender","Escutamos suas necessidades e identificamos os objetivos."],["Planejar","Organizamos alternativas e definimos as próximas etapas."],["Desenvolver","Conduzimos a solução conforme o escopo acordado."]].map(([t,d],i)=><article className="tp2m2-step" key={t}><img src={visual(processImages[i],i+6)} alt={"Etapa "+t} loading="lazy" {...universalBlockProps(processImages[i])}/><div><span>ETAPA 0{i+1}</span><h3 {...universalBlockProps(processSteps[i])}>{processSteps[i]?.text||t}</h3><p {...universalBlockProps(processDescriptions[i])}>{processDescriptions[i]?.text||d}</p></div></article>)}</section>
 <section data-universal-section="projetos" className="tp2m2-section tp2m2-projects" id="projetos"><div className="tp2m2-label">06 / PROJETOS EM DESTAQUE</div><div className="tp2m2-title"><h2 {...universalBlockProps(projectHeading)}>{projectHeading?.text||<>Projetos que contam <em>histórias.</em></>}</h2><p {...universalBlockProps(projectDescription)}>{projectDescription?.text||(actualProjects.length?"Trabalhos cadastrados pela empresa.":"Referências visuais ilustrativas. Cadastre projetos reais para exibir seu portfólio.")}</p></div><div className="tp2m2-mosaic">{Array.from({length:4},(_,i)=><figure key={i}><img src={isMaterials?visual(projectImages[i],i+9):projectImages[i]?.src?.trim()||actualProjects[i]?.src||image(i+9)} alt={actualProjects[i]?.text||"Referência arquitetônica ilustrativa"} loading="lazy" {...universalBlockProps(projectImages[i])}/><figcaption>{actualProjects[i]?.text||"REFERÊNCIA VISUAL / 0"+(i+1)}</figcaption></figure>)}</div></section>
 <section data-universal-section="galeria" className="tp2m2-section"><div className="tp2m2-label">07 / GALERIA VISUAL</div><div className="tp2m2-title"><h2 {...universalBlockProps(galleryHeading)}>{galleryHeading?.text||<>Perspectivas que <em>inspiram.</em></>}</h2><p {...universalBlockProps(galleryDescription)}>{galleryDescription?.text||"Seleção visual ilustrativa; substitua por fotografias autorizadas da empresa."}</p></div><div className="tp2m2-gallery">{Array.from({length:6},(_,i)=><img key={i} src={visual(galleryImages[i],isMaterials?i+13:i+3)} alt={"Inspiração visual "+(i+1)} loading="lazy" {...universalBlockProps(galleryImages[i])}/>)}</div></section>
 <section data-universal-section="numeros" className="tp2m2-section tp2m2-numbers"><div className="tp2m2-label">{isMaterials||hasTP2VerifiedMetrics(metrics)?"08 / RESULTADOS E NÚMEROS":"08 / NOSSA ABORDAGEM"}</div>{isMaterials?<><div className="tp2m2-title"><h2>Resultados com <em>transparência.</em></h2></div><MaterialProof variant={2}/>{metrics.length>0&&<div className="mt-8"><h3 className="mb-4 text-lg font-semibold">Indicadores informados pela empresa</h3><div className="tp2m2-metrics">{metrics.map((m,i)=><div key={i}><strong>{m}</strong></div>)}</div></div>}</>:<><div className="tp2m2-title"><h2 {...universalBlockProps(numbersHeading)}>{numbersHeading?.text|| (hasTP2VerifiedMetrics(metrics)?<>Resultados com <em>transparência.</em></>:<>O QUE ORIENTA <em>NOSSA ENTREGA.</em></>)}</h2></div><TP2EvidenceNumbers services={services.length} steps={3} faqs={faqItems.length} provided={metrics}/></>}</section>
 <section data-universal-section="depoimentos" className="tp2m2-section tp2m2-testimonials"><div className="tp2m2-label">09 / DEPOIMENTOS</div>{isMaterials?<MaterialTestimonials provided={testimonials} variant={2}/>:<><div className="tp2m2-title"><h2 {...universalBlockProps(testimonialsHeading)}>{testimonialsHeading?.text||<>A experiência de quem <em>confia.</em></>}</h2></div><TP2EvidenceTestimonials provided={testimonials} publishedMode={publishedMode}/></>}</section>
 <section data-universal-section="faq" className="tp2m2-section tp2m2-faq"><div className="tp2m2-label">10 / PERGUNTAS FREQUENTES</div><div className="tp2m2-faq-grid"><div><h2 {...universalBlockProps(faqHeading)}>{faqHeading?.text||<>Respostas para <em>suas dúvidas.</em></>}</h2><p>Informações gerais para facilitar seu primeiro contato.</p></div><div>{faqItems.map(([q,a],i)=><div className="tp2m2-faq-item" key={i} {...universalBlockProps(faqParagraphs[i])}><button type="button" onClick={()=>setFaq(faq===i?null:i)} aria-expanded={faq===i}><span>0{i+1}</span>{q}<b>{faq===i?"−":"+"}</b></button>{faq===i&&<p>{a}</p>}</div>)}</div></div></section>
 <section data-universal-section="contato" className="tp2m2-section tp2m2-contact" id="contato"><div className="tp2m2-label">11 / ENTRE EM CONTATO</div><div className="tp2m2-contact-grid"><img src={visual(contactImage,isMaterials?19:13)} alt="Ambiente arquitetônico contemporâneo" loading="lazy" {...universalBlockProps(contactImage)}/><div><span className="tp2m2-kicker">VAMOS CONVERSAR?</span><h2 {...universalBlockProps(contactHeading)}>{contactHeading?.text||<>O próximo passo <em>começa aqui.</em></>}</h2><form onSubmit={send}><label>Seu nome<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>Telefone ou e-mail<input value={reply} onChange={e=>setReply(e.target.value)} required/></label><label>Como podemos ajudar?<textarea value={msg} onChange={e=>setMsg(e.target.value)} required rows={4}/></label><button type="submit">Abrir canal de contato ↗</button><p role="status">{notice}</p></form></div></div></section>
 {!isMaterials&&<section data-universal-section="localizacao" id="localizacao" className="tp2m2-section"><div className="tp2m2-label">LOCALIZAÇÃO E CONTATO</div><TP2ContactMap footer={site.footer} publishedMode={publishedMode}/></section>}
 <section data-universal-section="trajetoria" className="tp2m2-section tp2m2-journey"><div className="tp2m2-label">12 / NOSSA TRAJETÓRIA</div><div className="tp2m2-title"><h2 {...universalBlockProps(historyTitle)}>{historyTitle?.text||<>Uma história feita de <em>escolhas e evolução.</em></>}</h2></div>{[["Nossa perspectiva","Cada projeto começa com a disposição de compreender novos desafios."],["Nossa prática","Organização, atenção e diálogo orientam o desenvolvimento do trabalho."]].map(([t,d],i)=><article className="tp2m2-step" key={t}><img src={visual(historyImages[i],isMaterials?i+20:i+11)} alt="Fotografia editorial ilustrativa" loading="lazy" {...universalBlockProps(historyImages[i])}/><div><span>CAPÍTULO 0{i+1}</span><h3 {...universalBlockProps(historyChapters[i])}>{historyChapters[i]?.text||t}</h3><p {...universalBlockProps(historyDescriptions[i])}>{isMaterials?(i===0?"Antes de comprar, é importante considerar a etapa da obra, a finalidade de cada material e as especificações técnicas. Uma lista organizada permite comparar alternativas com mais clareza.":"A organização começa pela identificação das quantidades e unidades, comparação das características de cimento, tijolos, tintas, ferramentas e revestimentos, e confirmação de preços, estoque e entregas com a loja. A compra pode ser dividida por fases para facilitar o acompanhamento e evitar escolhas por impulso."):historyDescriptions[i]?.text||d}</p></div></article>)}</section>
 <footer data-universal-section="rodape" className="tp2m2-footer pn-tp2-footer"><TP2PremiumFooterBody brand={brand} footer={site.footer} home="#inicio" headlineBlock={footerParagraph||footerHeading}/></footer>
 </UniversalTemplateSections>
 </div>;
}
