"use client";
import {useState,type FormEvent} from "react";
import type {BuilderV2SiteData} from "./builder-v2-site";
import "./builder-v2-tp4-model2.css";

const specialties=[
 [/odontol|dent/i,"Odontologia",["Avaliação odontológica","Cuidados preventivos","Saúde bucal"],"dentistry"],
 [/fisioter|ortoped|terapia ocupacional/i,"Reabilitação e movimento",["Avaliação individual","Acompanhamento terapêutico","Orientação de cuidados"],"therapy"],
 [/psicolog|saúde mental/i,"Psicologia",["Acolhimento inicial","Atendimento psicológico","Acompanhamento"],"psychology"],
 [/nutri/i,"Nutrição",["Avaliação nutricional","Orientação alimentar","Acompanhamento nutricional"],"nutrition"],
 [/fono/i,"Fonoaudiologia",["Avaliação fonoaudiológica","Orientação especializada","Acompanhamento"],"speech"],
 [/laborat|análises|exames|diagn[oó]stico|radiolog/i,"Diagnóstico e exames",["Informações sobre exames","Orientações de preparo","Atendimento e resultados"],"lab"],
 [/oftalm/i,"Oftalmologia",["Avaliação oftalmológica","Cuidados com a visão","Acompanhamento"],"eyes"],
 [/cardiol/i,"Cardiologia",["Avaliação cardiovascular","Orientação especializada","Acompanhamento"],"heart"],
 [/pediatr/i,"Pediatria",["Consulta pediátrica","Orientação familiar","Acompanhamento infantil"],"pediatrics"],
 [/ginecol|obstetr/i,"Ginecologia e obstetrícia",["Consulta especializada","Orientação de saúde","Acompanhamento"],"women"],
 [/dermatol/i,"Dermatologia",["Avaliação dermatológica","Orientação de cuidados","Acompanhamento"],"skin"],
 [/neurolog/i,"Neurologia",["Consulta neurológica","Avaliação especializada","Acompanhamento"],"neuro"],
 [/clínica médica|clinica medica|consultório médico|consultorio medico|saúde integrada|saude integrada/i,"Atendimento médico",["Consultas","Orientação clínica","Acompanhamento"],"medical"]
] as const;
const imageSets:Record<string,string[]>={
 medical:["photo-1559839734-2b71ea197ec2","photo-1576091160399-112ba8d25d1d","photo-1551601651-2a8555f1a136","photo-1538108149393-fbbd81895907","photo-1581056771107-24ca5f033842"],
 dentistry:["photo-1606811971618-4486d14f3f99","photo-1609840114035-3c981b782dfe","photo-1629909613654-28e377c37b09","photo-1606811841689-23dfddce3e95","photo-1606265752439-1f18756aa5fc"],
 therapy:["photo-1571019613454-1cb2f99b2d8b","photo-1571019614242-c5c5dee9f50b","photo-1599058945522-28d584b6f0ff","photo-1552674605-db6ffd4facb5","photo-1517836357463-d25dfeac3438"],
 psychology:["photo-1573496359142-b8d87734a5a2","photo-1573497620053-ea5300f94f21","photo-1521737711867-e3b97375f902","photo-1517245386807-bb43f82c33c4","photo-1551836022-d5d88e9218df"],
 nutrition:["photo-1490645935967-10de6ba17061","photo-1512621776951-a57141f2eefd","photo-1498837167922-ddd27525d352","photo-1547592180-85f173990554","photo-1500651230702-0e2d8a49d4ad"],
 speech:["photo-1576091160550-2173dba999ef","photo-1559839734-2b71ea197ec2","photo-1576091160399-112ba8d25d1d","photo-1581056771107-24ca5f033842","photo-1538108149393-fbbd81895907"],
 lab:["photo-1579154204601-01588f351e67","photo-1582719471384-894fbb16e074","photo-1532094349884-543bc11b234d","photo-1576086213369-97a306d36557","photo-1581093458791-9d15482442f5"],
 eyes:["photo-1574258495973-f010dfbb5371","photo-1559757148-5c350d0d3c56","photo-1576091160399-112ba8d25d1d","photo-1538108149393-fbbd81895907","photo-1581056771107-24ca5f033842"],
 heart:["photo-1576091160399-112ba8d25d1d","photo-1559757175-0eb30cd8c063","photo-1551601651-2a8555f1a136","photo-1538108149393-fbbd81895907","photo-1581056771107-24ca5f033842"],
 pediatrics:["photo-1471286174890-9c112ffca5b4","photo-1515488042361-ee00e0ddd4e4","photo-1576091160399-112ba8d25d1d","photo-1538108149393-fbbd81895907","photo-1559839734-2b71ea197ec2"],
 women:["photo-1576091160399-112ba8d25d1d","photo-1559839734-2b71ea197ec2","photo-1538108149393-fbbd81895907","photo-1581056771107-24ca5f033842","photo-1551601651-2a8555f1a136"],
 skin:["photo-1556229010-6c3f2c9ca5f8","photo-1570172619644-dfd03ed5d881","photo-1596755389378-c31d21fd1273","photo-1576091160399-112ba8d25d1d","photo-1538108149393-fbbd81895907"],
 neuro:["photo-1559757148-5c350d0d3c56","photo-1576091160399-112ba8d25d1d","photo-1559839734-2b71ea197ec2","photo-1538108149393-fbbd81895907","photo-1581056771107-24ca5f033842"]
};
// Reserve independent photographs for editorial sections. The first five images
// remain specialty-specific; subsequent slots never wrap back to the same photo.
const editorialExtras=[
 "photo-1584982751601-97dcc096659c",
 "photo-1586773860418-d37222d8fce3",
 "photo-1579684385127-1ef15d508118",
 "photo-1519494026892-80bbd2d6fd0d",
 "photo-1587351021759-3e566b6af7cc",
 "photo-1538108149393-fbbd81895907",
 "photo-1559757148-5c350d0d3c56",
 "photo-1576091160550-2173dba999ef",
 "photo-1576091160399-112ba8d25d1d",
 "photo-1559839734-2b71ea197ec2",
 "photo-1551601651-2a8555f1a136",
 "photo-1581056771107-24ca5f033842"
];
const picture=(id:string,w=1400)=>"https://images.unsplash.com/"+id+"?auto=format&fit=crop&w="+w+"&q=85";
export function BuilderV2TP4Model2({site}:{site:BuilderV2SiteData}){
 const [service,setService]=useState(0),[step,setStep]=useState(0),[quote,setQuote]=useState(0),[faq,setFaq]=useState<number|null>(null),[name,setName]=useState(""),[contact,setContact]=useState(""),[message,setMessage]=useState(""),[formError,setFormError]=useState("");
 const brand=site.header?.brand||site.title||"Clínica";
 const identity=[site.niche,site.title,site.header?.brand].filter(Boolean).join(" ");
 const match=specialties.find(s=>s[0].test(site.niche||""))||specialties.find(s=>s[0].test(identity))||specialties[specialties.length-1];
 const [specialty,services,key]=[match[1],match[2],match[3]];
 const photos=imageSets[key]||imageSets.medical;
 const photoPool=key==="dentistry"?["photo-1606811971618-4486d14f3f99","photo-1609840114035-3c981b782dfe","photo-1629909613654-28e377c37b09","photo-1606811841689-23dfddce3e95","photo-1606265752439-1f18756aa5fc","https://images.pexels.com/photos/4269944/pexels-photo-4269944.jpeg","https://images.pexels.com/photos/9062525/pexels-photo-9062525.jpeg","https://images.pexels.com/photos/6501925/pexels-photo-6501925.jpeg","https://images.pexels.com/photos/3845766/pexels-photo-3845766.jpeg","https://images.pexels.com/photos/305568/pexels-photo-305568.jpeg","https://images.pexels.com/photos/6627534/pexels-photo-6627534.jpeg"]:[...new Set([...photos,...editorialExtras])];
 const img=(n:number,w=1400)=>picture(photoPool[n%photoPool.length],w);
 const heading=site.blocks.find(b=>b.type==="heading"&&b.text?.trim())?.text;
 const intro=site.blocks.find(b=>b.type==="paragraph"&&b.text?.trim())?.text;
 const existingTestimonials=site.blocks.filter(b=>b.type==="paragraph"&&/depoiment|testimonial|avaliac|relato/i.test(b.section||"")).map(b=>(b.text||"").split(/\s*\|\s*/)).filter(parts=>parts.length>=3&&parts[0]&&parts[2]);
 const phone=(site.footer?.whatsapp||site.restaurant?.whatsapp||"").replace(/\D/g,"");
 const email=site.footer?.email?.trim()||"";
 const contactUrl=phone.length>=10?"https://wa.me/"+phone:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?"mailto:"+email:site.header?.ctaHref?.startsWith("https://")?site.header.ctaHref:undefined;
 const nav=[["Sobre","#tp4-about"],["Especialidades","#tp4-services"],["Estrutura","#tp4-structure"],["Contato","#tp4-contact"]];
 const submit=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!contactUrl){setFormError("Cadastre um WhatsApp, e-mail ou link de atendimento válido para habilitar o envio.");return;}setFormError("");const body="Solicitação de contato — "+brand+"\nNome: "+name+"\nContato: "+contact+"\nMensagem: "+message;if(contactUrl.startsWith("https://wa.me/"))window.open(contactUrl+"?text="+encodeURIComponent(body),"_blank","noopener,noreferrer");else if(contactUrl.startsWith("mailto:"))window.location.href=contactUrl+"?subject="+encodeURIComponent("Solicitação de contato")+"&body="+encodeURIComponent(body);else window.open(contactUrl,"_blank","noopener,noreferrer");};
 return <div className="tp4m2" data-tp4-model="02" data-tp4-specialty={key}>
  <header className="tp4m2-header"><a href="#tp4-home" className="tp4m2-logo">{site.header?.logoUrl?<img src={site.header.logoUrl} alt={brand}/>:brand}</a><nav aria-label="Navegação principal">{nav.map(([t,h])=><a key={h} href={h}>{t}</a>)}</nav><a className="tp4m2-cta" href="#tp4-contact">Entre em contato <span aria-hidden>↗</span></a></header>
  <main>
   <section className="tp4m2-hero" id="tp4-home"><div className="tp4m2-hero-copy"><span className="tp4m2-eyebrow">SAÚDE · ATENÇÃO · CUIDADO</span><h1>{heading||"Um novo olhar para o seu cuidado."}</h1><p>{intro||"Um espaço dedicado ao acolhimento, à escuta e ao atendimento individualizado."}</p><a className="tp4m2-button" href="#tp4-contact">Conheça nosso atendimento <span>↗</span></a><div className="tp4m2-hero-note">01 / {specialty}</div></div><div className="tp4m2-hero-photo"><img src={img(0)} alt={"Imagem ilustrativa relacionada a "+specialty}/><span className="tp4m2-image-label">ATENDIMENTO COM ATENÇÃO AOS DETALHES</span></div></section>
   <section className="tp4m2-section tp4m2-about" id="tp4-about"><div className="tp4m2-photo-portrait"><img src={img(1)} alt={"Imagem editorial ilustrativa de "+specialty}/></div><div className="tp4m2-about-copy"><span className="tp4m2-eyebrow">02 / SOBRE NÓS</span><h2>Cuidar é, antes de tudo, <em>acolher.</em></h2><p>Conheça nossa proposta de atendimento e encontre as informações necessárias para conversar com nossa equipe.</p><p>Um espaço digital pensado para apresentar serviços, orientar o primeiro contato e facilitar sua jornada.</p><a className="tp4m2-text-link" href="#tp4-services">Conhecer especialidades ↗</a></div></section>
   <section className="tp4m2-section tp4m2-services" id="tp4-services"><div className="tp4m2-section-head"><span className="tp4m2-eyebrow">03 / ESPECIALIDADES</span><h2>Cuidado em cada <em>detalhe.</em></h2></div><div className="tp4m2-service-grid"><div className="tp4m2-service-list">{services.map((s,i)=><button type="button" className={service===i?"active":""} key={s} onClick={()=>setService(i)} aria-pressed={service===i}><span>0{i+1}</span><strong>{s}</strong><span>↗</span></button>)}<p>As opções apresentadas são categorias ilustrativas. Confirme a disponibilidade de serviços diretamente com a instituição.</p></div><div className="tp4m2-service-image"><img src={img(service+2)} alt={"Imagem ilustrativa para "+services[service]}/><span>{services[service]}</span></div></div></section>
   <section className="tp4m2-section tp4m2-differences"><span className="tp4m2-eyebrow">04 / NOSSA ABORDAGEM</span><h2>O essencial está na forma de <em>cuidar.</em></h2><div className="tp4m2-pillars">{[["01","Escuta","Um primeiro contato com atenção às necessidades de cada pessoa."],["02","Clareza","Informações organizadas para facilitar a sua jornada."],["03","Respeito","Comunicação acolhedora em cada etapa do atendimento."],["04","Proximidade","Canais acessíveis para esclarecer dúvidas e orientar o contato."]].map(p=><article key={p[0]}><span>{p[0]}</span><h3>{p[1]}</h3><p>{p[2]}</p></article>)}</div></section>
   <section className="tp4m2-section tp4m2-journey"><div><span className="tp4m2-eyebrow">05 / COMO FUNCIONA</span><h2>Uma jornada mais <em>simples.</em></h2><div className="tp4m2-steps">{[["Conheça os serviços","Explore as informações disponíveis sobre a especialidade."],["Entre em contato","Converse com o canal de atendimento cadastrado."],["Confirme os detalhes","Verifique disponibilidade e orientações diretamente com a equipe."]].map((s,i)=><button type="button" key={s[0]} onClick={()=>setStep(i)} className={step===i?"active":""} aria-pressed={step===i}><span>0{i+1}</span><span><strong>{s[0]}</strong><small>{s[1]}</small></span><span>↗</span></button>)}</div></div><div className="tp4m2-journey-photo"><img src={img(step+1)} alt="Imagem ilustrativa da jornada de atendimento"/></div></section>
   <section className="tp4m2-section tp4m2-team"><span className="tp4m2-eyebrow">06 / EQUIPE E PROFISSIONAIS</span><h2>Pessoas que fazem a <em>diferença.</em></h2><p>Os profissionais e suas credenciais serão apresentados aqui quando cadastrados pela instituição.</p><div className="tp4m2-team-empty">Equipe profissional ainda não cadastrada. Nenhum nome, retrato ou registro profissional foi criado artificialmente.</div></section>
   <section className="tp4m2-section tp4m2-structure" id="tp4-structure"><span className="tp4m2-eyebrow">07 / AMBIENTES E ESTRUTURA</span><h2>Espaços para <em>acolher.</em></h2><div className="tp4m2-panorama"><img src={img(5)} alt="Imagem ilustrativa de ambiente de saúde; não representa a estrutura real da instituição"/></div><div className="tp4m2-gallery"><img src={img(6)} alt="Imagem ilustrativa de saúde"/><img src={img(7)} alt="Imagem ilustrativa da especialidade"/></div><p className="tp4m2-disclaimer">Imagens editoriais ilustrativas, não fotografias verificadas das instalações.</p></section>
   <section className="tp4m2-numbers"><span className="tp4m2-eyebrow">08 / NOSSA TRAJETÓRIA EM NÚMEROS</span><div><p>Indicadores institucionais poderão ser apresentados quando houver dados reais e verificáveis cadastrados.</p><a href="#tp4-contact">Solicitar informações ↗</a></div></section>
   <section className="tp4m2-section tp4m2-testimonials"><span className="tp4m2-eyebrow">09 / RELATOS</span><h2>Experiências que merecem <em>respeito.</em></h2>{existingTestimonials.length?<div className="tp4m2-quote"><blockquote>“{existingTestimonials[quote][2]}”</blockquote><p>{existingTestimonials[quote][0]}{existingTestimonials[quote][1]?" · "+existingTestimonials[quote][1]:""}</p><div><button aria-label="Depoimento anterior" type="button" onClick={()=>setQuote(v=>(v-1+existingTestimonials.length)%existingTestimonials.length)}>←</button><span>{quote+1} / {existingTestimonials.length}</span><button aria-label="Próximo depoimento" type="button" onClick={()=>setQuote(v=>(v+1)%existingTestimonials.length)}>→</button></div></div>:<p>Relatos de pacientes não cadastrados. Esta seção será preenchida apenas com conteúdo autorizado e fornecido pela instituição.</p>}</section>
   <section className="tp4m2-section tp4m2-faq"><div className="tp4m2-faq-photo"><img src={img(8)} alt="Imagem editorial ilustrativa da especialidade"/></div><div><span className="tp4m2-eyebrow">10 / DÚVIDAS FREQUENTES</span><h2>Estamos aqui para <em>orientar.</em></h2>{[["Como posso solicitar informações?","Utilize o formulário de contato ou os canais oficiais cadastrados pela instituição."],["Quais serviços estão disponíveis?","Confirme os serviços oferecidos diretamente com a equipe antes de agendar."],["Como funciona o agendamento?","Entre em contato para verificar disponibilidade, horários e orientações."],["Posso enviar informações médicas pelo formulário?","Evite incluir dados sensíveis de saúde neste formulário. Utilize apenas canais adequados indicados pela instituição."]].map((f,i)=><div className="tp4m2-faq-item" key={f[0]}><button type="button" aria-expanded={faq===i} onClick={()=>setFaq(faq===i?null:i)}><span>{f[0]}</span><span>{faq===i?"−":"+"}</span></button>{faq===i&&<p>{f[1]}</p>}</div>)}</div></section>
   <section className="tp4m2-section tp4m2-contact" id="tp4-contact"><div className="tp4m2-contact-photo"><img src={img(9)} alt={"Imagem profissional ilustrativa de "+specialty}/></div><div className="tp4m2-contact-content"><span className="tp4m2-eyebrow">11 / CONTATO</span><h2>O primeiro passo começa com uma <em>conversa.</em></h2><p>Deixe seus dados de contato e uma mensagem sem informações médicas sensíveis.</p><form onSubmit={submit}><label>Seu nome<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Como podemos chamar você?"/></label><label>Seu contato<input required value={contact} onChange={e=>setContact(e.target.value)} placeholder="Telefone ou e-mail"/></label><label>Mensagem<textarea required value={message} onChange={e=>setMessage(e.target.value)} placeholder="Como podemos ajudar? (sem dados de saúde)"/></label><button type="submit">Abrir canal de atendimento ↗</button>{formError&&<p role="alert">{formError}</p>}</form></div></section>
   <section className="tp4m2-section tp4m2-history"><span className="tp4m2-eyebrow">12 / NOSSA TRAJETÓRIA</span><h2>Uma história construída com <em>propósito.</em></h2><div className="tp4m2-history-row"><img src={img(10)} alt="Imagem editorial ilustrativa"/><div><span>CAPÍTULO 01</span><h3>O valor de cada encontro</h3><p>Aqui, a instituição poderá compartilhar sua história real, sua equipe e sua missão, com informações verificadas.</p></div></div><div className="tp4m2-history-row reverse"><img src={img(11)} alt="Imagem editorial ilustrativa"/><div><span>CAPÍTULO 02</span><h3>Olhar para o futuro</h3><p>Um espaço para apresentar os próximos capítulos da instituição sem inventar datas, marcos ou conquistas.</p></div></div></section>
  </main>
  <footer className="tp4m2-footer"><span className="tp4m2-eyebrow">13 / INFORMAÇÕES INSTITUCIONAIS</span><div className="tp4m2-footer-top"><p>Cuidado e atenção em cada detalhe.</p><nav aria-label="Navegação do rodapé">{nav.map(([t,h])=><a href={h} key={h}>{t}</a>)}</nav>{site.footer?.address&&<p>{site.footer.address}</p>}{email&&<a href={"mailto:"+email}>{email}</a>}</div><strong className="tp4m2-footer-brand">{brand}</strong><div className="tp4m2-footer-bottom"><span>© {new Date().getFullYear()} {brand}</span><a href="#tp4-home">Voltar ao topo ↑</a></div></footer>
 </div>;
}
