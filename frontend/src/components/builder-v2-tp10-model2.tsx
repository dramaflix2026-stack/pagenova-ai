"use client";
import {useState,type FormEvent} from "react";
import {TP10LanguageTestimonials,isLanguageSchool} from "./tp10-language-testimonials";
import {UniversalTemplateSections} from "./builder-v2-universal-sections";
import {readUniversalSectionPhoto} from "@/lib/builder-v2-universal-section-photo";
import {universalSpecialtyCards} from "@/lib/builder-v2-universal-specialties";
import {resolveUniversalSection} from "@/lib/builder-v2-universal-targets";
import type {UniversalSite} from "@/lib/builder-v2-universal-operations";
type Props={brand:string;niche:string;universalSectionImages?:Record<string,string>;site?:UniversalSite;email?:string;phone?:string;address?:string;reviews?:{name:string;role?:string;quote:string;photo?:string}[];publishedMode?:boolean;faqs?:{question:string;answer:string}[];gallery?:string[]};
const norm=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const profiles:Record<string,{focus:string;topics:[string,string,string];photos:string[]}>={
"escolas particulares":{focus:"Aprender é descobrir possibilidades",topics:["Etapas de ensino","Vivências educativas","Projetos pedagógicos"],photos:["photo-1509062522246-3755977927d7","photo-1497633762265-9d179a990aa6","photo-1427504494785-3a9ca7044f45","photo-1503676260728-1c00da094a0b"]},
"escolas de idiomas":{focus:"Novos idiomas, novos horizontes",topics:["Aprendizado de idiomas","Prática de conversação","Vivências culturais"],photos:["photo-1523240795612-9a054b0db644","photo-1546410531-bb4caa6b424d","photo-1434030216411-0b793f4b4173","photo-1513258496099-48168024aec0"]},
"cursos profissionalizantes":{focus:"Conhecimento para novas jornadas",topics:["Formação profissional","Aprendizagem prática","Desenvolvimento de competências"],photos:["photo-1523580494863-6f3031224c94","photo-1556761175-b413da4baf72","photo-1552664730-d307ca884978","photo-1516321318423-f06f85e504b3"]},
"escolas tecnicas":{focus:"Aprender, experimentar, evoluir",topics:["Formação técnica","Atividades práticas","Projetos aplicados"],photos:["photo-1581091226825-a6a2a5aee158","photo-1532094349884-543bc11b234d","photo-1581092160562-40aa08e78837","photo-1516321318423-f06f85e504b3"]},
"escolas de musica":{focus:"O conhecimento tem seu ritmo",topics:["Prática instrumental","Expressão vocal","Fundamentos musicais"],photos:["photo-1511379938547-c1f69419868d","photo-1524178232363-1fb2b075b655","photo-1516280440614-37939bbacd81","photo-1507838153414-b4b713384a76"]},
"escolas de danca":{focus:"Aprender também é movimento",topics:["Técnica de dança","Expressão corporal","Vivências em movimento"],photos:["photo-1508700115892-45ecd05ae2ad","photo-1518837695005-2083093ee35b","photo-1547153760-18fc86324498","photo-1531058020387-3be344556be6"]},
"escolas de artes":{focus:"Ideias que ganham forma",topics:["Desenho e criação","Experimentação visual","Práticas artísticas"],photos:["photo-1513364776144-60967b0f800f","photo-1460661419201-fd4cecdf8a8b","photo-1541961017774-22349e4a1262","photo-1494438639946-1ebd1d20bf85"]},
"cursos preparatorios":{focus:"Prepare-se para o próximo passo",topics:["Organização de estudos","Revisão de conteúdos","Prática de exercícios"],photos:["photo-1434030216411-0b793f4b4173","photo-1456513080510-7bf3a84b82f8","photo-1497633762265-9d179a990aa6","photo-1513258496099-48168024aec0"]},
"reforco escolar":{focus:"Cada conquista começa aprendendo",topics:["Apoio à aprendizagem","Prática de conteúdos","Acompanhamento escolar"],photos:["photo-1503676260728-1c00da094a0b","photo-1509062522246-3755977927d7","photo-1497633762265-9d179a990aa6","photo-1427504494785-3a9ca7044f45"]},
"escolas de programacao":{focus:"Crie o que vem a seguir",topics:["Lógica e algoritmos","Desenvolvimento digital","Projetos de tecnologia"],photos:["photo-1516321318423-f06f85e504b3","photo-1498050108023-c5249f4df085","photo-1515879218367-8466d910aaa4","photo-1531482615713-2afd69097998"]},
"escolas de gastronomia":{focus:"A criatividade também se aprende",topics:["Técnicas culinárias","Práticas gastronômicas","Criação e apresentação"],photos:["photo-1556911220-bff31c812dba","photo-1577219491135-ce391730fb2c","photo-1556910103-1c02745aae4d","photo-1507048331197-7d4ac70811cf"]},
"centros de treinamento corporativo":{focus:"Conhecimento que move equipes",topics:["Desenvolvimento de equipes","Aprendizagem corporativa","Competências profissionais"],photos:["photo-1552664730-d307ca884978","photo-1521737711867-e3b97375f902","photo-1556761175-b413da4baf72","photo-1531482615713-2afd69097998"]}
};
const extra=["photo-1524178232363-1fb2b075b655","photo-1523050854058-8df90110c9f1","photo-1523580494863-6f3031224c94","photo-1513258496099-48168024aec0","photo-1503676260728-1c00da094a0b","photo-1546410531-bb4caa6b424d","photo-1497633762265-9d179a990aa6","photo-1531482615713-2afd69097998"];
const img=(id:string)=>"https://images.unsplash.com/"+id+"?auto=format&fit=crop&w=1400&q=85";
const fallback=(e:React.SyntheticEvent<HTMLImageElement>)=>{const el=e.currentTarget;if(el.dataset.fallbackApplied)return;el.dataset.fallbackApplied="1";el.src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80";};
export function BuilderV2TP10Model2({brand,niche,universalSectionImages,site,email,phone,address,reviews=[],publishedMode=false,faqs=[],gallery=[]}:Props){
 const [menu,setMenu]=useState(false),[open,setOpen]=useState<number|null>(0),[notice,setNotice]=useState("");
 const languageM2=isLanguageSchool(niche,brand);
 const p=profiles[norm(niche)]||profiles["cursos profissionalizantes"];
 // Only explicit course names present in the generated site's content qualify as offerings.
 // Manual edits from the universal engine take precedence over inferred briefing content.
 const languageOfferings:[RegExp,string,string][]=[
  [/\\bingl[eê]s\\s+(?:para\\s+)?neg[oó]cios\\b/i,"Inglês para negócios","photo-1556761175-b413da4baf72"],
  [/\\b(?:curso\\s+de\\s+)?conversa[cç][aã]o\\b/i,"Conversação","photo-1521737711867-e3b97375f902"],
  [/\\b(?:curso\\s+de\\s+)?ingl[eê]s\\b/i,"Inglês","photo-1523240795612-9a054b0db644"],
  [/\\b(?:curso\\s+de\\s+)?espanhol\\b/i,"Espanhol","photo-1546410531-bb4caa6b424d"],
  [/\\b(?:curso\\s+de\\s+)?franc[eê]s\\b/i,"Francês","photo-1516321318423-f06f85e504b3"],
  [/\\b(?:curso\\s+de\\s+)?alem[aã]o\\b/i,"Alemão","photo-1524178232363-1fb2b075b655"],
  [/\\b(?:curso\\s+de\\s+)?italiano\\b/i,"Italiano","photo-1513258496099-48168024aec0"]
 ];
 const courseSection=site?resolveUniversalSection(site,"cursos"):null;
 const sourceText=site?.blocks.filter(b=>typeof b.text==="string"&&b.type!=="button"&&b.section!==courseSection).map(b=>b.text).join(" ")||"";
 const explicitOfferings=languageM2?languageOfferings.filter(([pattern])=>pattern.test(sourceText)).map(([,title,photo])=>({title,photo})).filter((item,i,arr)=>arr.findIndex(other=>other.title===item.title)===i):[];
 const inferredDefaults=explicitOfferings.length?explicitOfferings.map(item=>item.title):p.topics;
 const courseCards=site?universalSpecialtyCards(site,"cursos",languageM2?inferredDefaults:p.topics):p.topics.map((title,i)=>({id:"original-"+i,title,description:"",image:undefined as string|undefined}));
 const displayedCourses=languageM2?courseCards.map((card,i)=>({...card,image:card.image||(explicitOfferings[i]&&card.title===explicitOfferings[i].title?img(explicitOfferings[i].photo):undefined)})):courseCards;
 const heroSection=site?resolveUniversalSection(site,"capa"):null;
 const editedHeroTitle=site?.blocks.find(b=>b.section===heroSection&&b.type==="heading"&&b.textExplicit===true)?.text;
 const editedHeroDescription=site?.blocks.find(b=>b.section===heroSection&&b.type==="paragraph"&&b.textExplicit===true)?.text;
 const editedHeroImage=site?.blocks.find(b=>b.section===heroSection&&b.type==="image"&&b.imageExplicit===true&&typeof b.src==="string"&&/^https:\/\//i.test(b.src))?.src;
 const images=[...p.photos,...extra.filter(id=>!p.photos.includes(id))];
 const safeEmail=email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:undefined;
 const digits=(phone||"").replace(/\D/g,"");const safePhone=digits.length>=10?digits:undefined;
 const contact=safePhone?"https://wa.me/"+safePhone:safeEmail?"mailto:"+safeEmail:"#tp10m2-contact";
 const questions=faqs.length?faqs:[{question:"Como conhecer as opções de formação?",answer:"Entre em contato com a instituição para consultar as opções efetivamente disponíveis."},{question:"Como obter informações sobre matrículas?",answer:"Consulte os canais oficiais cadastrados para saber sobre disponibilidade e procedimentos."},{question:"Como confirmar horários e condições?",answer:"Horários, valores e políticas devem ser confirmados diretamente com a instituição."}];
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const body="Nome: "+f.get("name")+"\nContato: "+f.get("sender")+"\nMensagem: "+f.get("message");if(!safeEmail&&!safePhone){setNotice("Não há canal cadastrado. A mensagem não foi enviada.");return;}setNotice("Seu aplicativo de contato será aberto. Confirme o envio nele.");window.location.href=safePhone?"https://wa.me/"+safePhone+"?text="+encodeURIComponent(body):"mailto:"+safeEmail+"?subject="+encodeURIComponent("Contato - "+brand)+"&body="+encodeURIComponent(body);}
 return <main className="tp10m2" data-tp10-languages="true"><style>{`
.tp10m2{--navy:#102844;--blue:#1b4d87;--accent:#e9a747;--muted:#536477;background:#f7f9fc;color:#132c48;font-family:Arial,Helvetica,sans-serif;overflow:hidden}.tp10m2 *{box-sizing:border-box}.tp10m2 a{text-decoration:none;color:inherit}.tp10m2 img{display:block;width:100%;height:100%;object-fit:cover}.tp10m2 h1,.tp10m2 h2,.tp10m2 h3{letter-spacing:-.045em}.tp10m2 h2{font-size:clamp(2.4rem,5vw,5rem);line-height:1.08;margin:15px 0 25px}.tp10m2 p{line-height:1.75;color:#536477}.tp10m2 .eyebrow{color:#2564a4;font-size:11px;text-transform:uppercase;letter-spacing:.22em;font-weight:800}.tp10m2 .section{padding:clamp(65px,8vw,125px) clamp(22px,7vw,115px)}.tp10m2 .btn{display:inline-flex;justify-content:center;align-items:center;padding:16px 24px;border-radius:8px;background:#1d4c80;color:white;font-size:13px;font-weight:800;min-height:48px}.tp10m2 .btn.secondary{background:white;color:#163a61;border:1px solid #d2dce6}.tp10m2 .header{display:flex;justify-content:space-between;align-items:center;gap:25px;padding:22px 6%;background:#fff;position:relative;z-index:3}.tp10m2 .brand{font-size:clamp(18px,2vw,27px);font-weight:900;overflow-wrap:anywhere;max-width:50%}.tp10m2 .links{display:flex;align-items:center;gap:25px;font-size:12px;font-weight:700}.tp10m2 .toggle{display:none;border:1px solid #ccd5e0;border-radius:6px;background:white;padding:10px}.tp10m2 .hero{position:relative;min-height:680px;display:grid;grid-template-columns:1fr 1.12fr;background:#e9f1fa}.tp10m2 .heroCopy{padding:clamp(75px,9vw,145px) 8% clamp(70px,8vw,120px) 12%;display:flex;flex-direction:column;align-items:start;justify-content:center}.tp10m2 h1{font-size:clamp(3.1rem,6vw,6.7rem);line-height:1.03;margin:25px 0}.tp10m2 .heroCopy p{max-width:500px;font-size:17px}.tp10m2 .heroImage{position:relative;min-height:600px}.tp10m2 .heroImage img{position:absolute;inset:0}.tp10m2 .heroImage:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#e9f1fa 0%,transparent 25%)}.tp10m2 .heroButtons{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.tp10m2 .about{display:grid;grid-template-columns:1fr 1fr;gap:8%;align-items:center}.tp10m2 .aboutPhotos{height:560px;display:grid;grid-template-columns:1fr .75fr;align-items:end;gap:15px}.tp10m2 .aboutPhotos img:first-child{height:100%;border-radius:24px}.tp10m2 .aboutPhotos img:last-child{height:70%;border-radius:20px}.tp10m2 .cards{background:#eef4fa}.tp10m2 .cardsHead{display:flex;justify-content:space-between;gap:30px;align-items:end}.tp10m2 .cardsHead p{max-width:400px}.tp10m2 .courseGrid{display:grid;grid-template-columns:1.2fr .8fr;grid-template-rows:310px 310px;gap:18px;margin-top:40px}.tp10m2 .course{position:relative;overflow:hidden;border-radius:18px}.tp10m2 .course:first-child{grid-row:span 2}.tp10m2 .course img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;object-fit:cover!important;filter:brightness(.67);transition:transform .4s}.tp10m2 .courseLabel,.tp10m2 .courseLabel *{color:#fff!important;text-shadow:0 1px 5px #0008}.tp10m2 .courseLabel small{color:#dce7f3!important}.tp10m2 .course{background:#1b344e;isolation:isolate}.tp10m2 .course:hover img{transform:scale(1.04)}.tp10m2 .courseLabel{position:absolute;bottom:0;left:0;right:0;padding:30px;background:linear-gradient(transparent,#092139e8);color:white}.tp10m2 .courseLabel h3{font-size:clamp(22px,3vw,40px);margin:10px 0}.tp10m2 .difference{display:grid;grid-template-columns:1fr 1fr;background:#122d4c;color:white;min-height:610px}.tp10m2 .difference>img{min-height:610px}.tp10m2 .differenceCopy{padding:clamp(60px,7vw,115px);align-self:center}.tp10m2 .difference p{color:#c2d1e0}.tp10m2 .adv{padding:20px 0;border-top:1px solid #ffffff4a;display:flex;gap:20px}.tp10m2 .adv b{color:#f1b65d}.tp10m2 .methodGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px}.tp10m2 .method{background:#fff;border:1px solid #dce5ef;border-radius:15px;overflow:hidden}.tp10m2 .method img{height:245px}.tp10m2 .methodBody{padding:25px}.tp10m2 .methodBody b{font-size:34px;color:#2462a4}.tp10m2 .methodBody h3{font-size:22px}.tp10m2 .gallery{background:#eef4fa}.tp10m2 .mosaic{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:220px;gap:14px;margin-top:35px}.tp10m2 .mosaic figure{margin:0;overflow:hidden;border-radius:13px}.tp10m2 .mosaic figure:first-child{grid-row:span 2}.tp10m2 .mosaic figure:nth-child(4){grid-column:span 2}.tp10m2 .testimonialGrid{display:grid;grid-template-columns:1.4fr 1fr;gap:22px}.tp10m2 .quote{background:#fff;border:1px solid #dbe5ef;border-radius:18px;padding:32px}.tp10m2 blockquote{font-size:clamp(19px,2.3vw,31px);line-height:1.5;margin:20px 0}.tp10m2 .faqGrid{display:grid;grid-template-columns:1fr 1.2fr;gap:9%}.tp10m2 .faqItem{border-bottom:1px solid #cad5e0}.tp10m2 .faqItem button{border:0;background:transparent;display:flex;justify-content:space-between;gap:20px;text-align:left;padding:24px 0;width:100%;font:inherit;color:#16304b;font-weight:700;cursor:pointer}.tp10m2 .faqItem p{margin:0 0 25px}.tp10m2 .contact{background:#eaf2fb}.tp10m2 .contactGrid{display:grid;grid-template-columns:1fr 1fr;gap:9%}.tp10m2 form{display:grid;gap:15px}.tp10m2 label{display:grid;gap:8px;font-size:12px;font-weight:800}.tp10m2 input,.tp10m2 textarea{width:100%;min-width:0;border:1px solid #c4d4e4;border-radius:8px;padding:14px;background:white;font:inherit}.tp10m2 form button{border:0;background:#1d4c80;color:white;padding:17px;border-radius:8px;cursor:pointer;font-weight:800}.tp10m2 .map{margin-top:40px}.tp10m2 .map iframe{width:100%;height:340px;border:0;border-radius:15px}.tp10m2 .footer{background:#102844;color:white;padding:95px 7% 30px}.tp10m2 .footer h2{font-size:clamp(3rem,7vw,7rem);max-width:1100px}.tp10m2 .footer p{color:#b8c8d8}.tp10m2 .footerBottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:20px;border-top:1px solid #ffffff3b;margin-top:90px;padding-top:25px;font-size:12px}
@media(max-width:850px){.tp10m2 .links{display:none;position:absolute;top:75px;left:0;right:0;padding:25px;background:white;flex-direction:column}.tp10m2 .links.open{display:flex}.tp10m2 .toggle{display:block}.tp10m2 .hero,.tp10m2 .about,.tp10m2 .difference,.tp10m2 .faqGrid,.tp10m2 .contactGrid,.tp10m2 .testimonialGrid{grid-template-columns:1fr}.tp10m2 .heroImage{min-height:370px}.tp10m2 .heroCopy{padding:75px 7%}.tp10m2 .heroImage:after{background:linear-gradient(0deg,transparent,#e9f1fa)}.tp10m2 .aboutPhotos{height:370px}.tp10m2 .difference>img{min-height:360px;height:360px}.tp10m2 .differenceCopy{padding:60px 7%}.tp10m2 .methodGrid{grid-template-columns:1fr}.tp10m2 .cardsHead{display:block}.tp10m2 .courseGrid{grid-template-columns:1fr;grid-template-rows:none}.tp10m2 .course,.tp10m2 .course:first-child{height:300px;min-height:300px;grid-row:auto}.tp10m2 .mosaic{grid-template-columns:repeat(2,1fr)}.tp10m2 .mosaic figure:nth-child(4){grid-column:auto}}
@media(max-width:480px){.tp10m2 .course,.tp10m2 .course:first-child{height:265px;min-height:265px}.tp10m2 .courseLabel{padding:20px}.tp10m2 .courseLabel h3{font-size:25px}.tp10m2 .mosaic{grid-template-columns:1fr;grid-auto-rows:220px}.tp10m2 .mosaic figure:first-child{grid-row:auto}.tp10m2 .aboutPhotos{height:290px}.tp10m2 h1{font-size:clamp(2.7rem,12vw,4rem)}}
/* Mobile spacing and rhythm: keep the approved composition while reducing excess vertical whitespace. */
@media(max-width:850px){.tp10m2 .section{padding:58px 5%}.tp10m2 .hero{min-height:0}.tp10m2 .heroCopy{padding:62px 6% 45px}.tp10m2 .heroImage{min-height:360px}.tp10m2 .difference{min-height:0}.tp10m2 .difference>img{min-height:300px;max-height:430px}.tp10m2 .differenceCopy{padding:48px 6%}.tp10m2 .courseGrid{margin-top:26px}.tp10m2 .methodGrid{margin-top:26px}.tp10m2 .mosaic{margin-top:25px}}
@media(max-width:480px){.tp10m2 .section{padding:42px 20px}.tp10m2 .header{padding:17px 20px}.tp10m2 .heroCopy{padding:42px 20px 34px}.tp10m2 .heroCopy h1{margin:15px 0 20px;line-height:1.05}.tp10m2 .heroButtons{margin-top:14px;gap:10px}.tp10m2 .heroImage{min-height:280px}.tp10m2 .aboutPhotos{height:245px}.tp10m2 .courseGrid{gap:12px;margin-top:22px}.tp10m2 .course,.tp10m2 .course:first-child{height:230px;min-height:230px}.tp10m2 .courseLabel{padding:16px}.tp10m2 .difference>img{min-height:240px;max-height:300px}.tp10m2 .differenceCopy{padding:38px 20px}.tp10m2 .adv{padding:15px 0}.tp10m2 .methodGrid{gap:14px;margin-top:22px}.tp10m2 .method img{height:180px}.tp10m2 .methodBody{padding:18px}.tp10m2 .mosaic{gap:12px;grid-auto-rows:185px;margin-top:22px}.tp10m2 .mosaic figure:nth-child(4){grid-column:auto}.tp10m2 .quote{padding:22px}.tp10m2 .faqItem button{padding:18px 0}}

/* Restrained school-of-languages footer: all other niches retain their approved footer. */
.tp10m2[data-tp10-languages="true"] .footer{padding:clamp(52px,6vw,82px) clamp(24px,7vw,110px) 30px;border-top:3px solid #e9a747}
.tp10m2[data-tp10-languages="true"] .footer h2{font-size:clamp(2.3rem,4.7vw,4.9rem);line-height:1.12;letter-spacing:-.045em;max-width:790px;margin:20px 0 25px}
.tp10m2[data-tp10-languages="true"] .footerNav{display:flex;flex-wrap:wrap;gap:14px 26px;margin-top:45px;padding:24px 0;border-top:1px solid #ffffff30}
.tp10m2[data-tp10-languages="true"] .footerNav a{font-size:13px;line-height:1.6;color:#d5e2ee;font-weight:600}
.tp10m2[data-tp10-languages="true"] .footerNav a:hover{text-decoration:underline}
.tp10m2[data-tp10-languages="true"] .footerBottom{margin-top:0;gap:12px 24px;align-items:center}
.tp10m2[data-tp10-languages="true"] .footerBottom strong{font-size:16px;letter-spacing:-.01em;overflow-wrap:normal;word-break:normal}
@media(max-width:560px){.tp10m2[data-tp10-languages="true"] .footer{padding:48px 22px 26px}.tp10m2[data-tp10-languages="true"] .footerNav{gap:14px 20px;margin-top:32px}}
/* TP10 courses: clean editorial heading instead of a floating nested card. */
.tp10m2 .cardsHead,.tp10m2 .cardsHead>div,.tp10m2 .cardsHead>p{background:transparent!important;box-shadow:none!important;border:0!important;border-radius:0!important;backdrop-filter:none!important;filter:none!important}
.tp10m2 .cardsHead{padding:0!important;margin:0!important;align-items:end!important}
.tp10m2 .cardsHead>div,.tp10m2 .cardsHead>p{padding:0!important;margin:0!important}
.tp10m2 .cardsHead h2{margin:12px 0 0!important;line-height:1.08!important;overflow-wrap:anywhere}
@media(max-width:850px){.tp10m2 .cardsHead{display:grid!important;grid-template-columns:1fr!important;gap:16px!important}.tp10m2 .cardsHead h2{font-size:clamp(2.1rem,8vw,3.5rem)!important}.tp10m2 .cardsHead p{max-width:100%!important;line-height:1.6!important}.tp10m2 .courseGrid{margin-top:26px!important}}
@media(max-width:480px){.tp10m2 .cardsHead{gap:14px!important}.tp10m2 .cardsHead h2{font-size:clamp(2rem,9vw,2.75rem)!important}.tp10m2 .courseGrid{margin-top:22px!important}}

/* TP10 mobile rhythm audit 2026-11 */
.tp10m2{overflow-x:clip}
.tp10m2 .section,.tp10m2 .difference,.tp10m2 .hero{box-sizing:border-box}
.tp10m2 .section h2,.tp10m2 .hero h1,.tp10m2 .difference h2{overflow-wrap:break-word}
.tp10m2 .section img,.tp10m2 .hero img,.tp10m2 .difference img{max-width:100%}
@media(max-width:850px){
.tp10m2 .section{padding-top:clamp(42px,8vw,72px);padding-bottom:clamp(42px,8vw,72px)}
.tp10m2 .about,.tp10m2 .cards{gap:clamp(20px,5vw,36px)}
.tp10m2 .cardsHead{width:100%;min-width:0}
.tp10m2 .cardsHead>*{min-width:0}
.tp10m2 .cardsHead h2{max-width:100%;word-break:normal!important;overflow-wrap:break-word!important}
.tp10m2 .cardsHead p{margin-top:0!important}
.tp10m2 .courseGrid{gap:18px}
}
@media(max-width:480px){
.tp10m2 .section{padding-top:44px;padding-bottom:44px}
.tp10m2 .cardsHead{gap:12px!important}
.tp10m2 .cardsHead h2{font-size:clamp(1.85rem,8vw,2.55rem)!important;line-height:1.13!important}
.tp10m2 .cardsHead p{font-size:clamp(.94rem,3.8vw,1.05rem);line-height:1.55!important}
.tp10m2 .courseGrid{margin-top:20px!important;gap:16px}
}

/* Approved Editorial Premium first fold: TP10 Model 2 language schools only. */
.tp10m2[data-tp10-languages="true"]{--editorial-ink:#102b42;--editorial-paper:#f8f7f3}
.tp10m2[data-tp10-languages="true"] .header{background:#fbfaf7;padding:19px clamp(22px,5.8vw,95px);border-bottom:1px solid #e5e9e8;gap:24px}
.tp10m2[data-tp10-languages="true"] .brand{color:#112e47;font-size:clamp(19px,1.8vw,26px);font-weight:850;letter-spacing:-.045em;max-width:42%}
.tp10m2[data-tp10-languages="true"] .links{gap:clamp(16px,2.2vw,32px);font-size:13px;color:#29455a}
.tp10m2[data-tp10-languages="true"] .links>a:not(.headerCta){transition:color .2s}
.tp10m2[data-tp10-languages="true"] .links>a:not(.headerCta):hover{color:#2777a5}
.tp10m2[data-tp10-languages="true"] .headerCta{background:#123b5a;color:#fff;padding:13px 19px;border-radius:6px;white-space:nowrap;font-weight:750}
.tp10m2[data-tp10-languages="true"] .hero{grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr);min-height:clamp(570px,48vw,730px);background:var(--editorial-paper)}
.tp10m2[data-tp10-languages="true"] .heroCopy{padding:clamp(75px,9vw,145px) clamp(25px,4vw,70px) clamp(70px,8vw,125px) clamp(28px,7vw,115px);position:relative;z-index:1}
.tp10m2[data-tp10-languages="true"] .heroCopy .eyebrow{color:#346a8e;font-size:11px;letter-spacing:.18em}
.tp10m2[data-tp10-languages="true"] .hero h1{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(52px,5.7vw,94px);line-height:1.06;letter-spacing:-.057em;color:#102b42;margin:25px 0 24px;max-width:11ch;text-wrap:balance}
.tp10m2[data-tp10-languages="true"] .heroCopy p{font-size:clamp(16px,1.25vw,19px);line-height:1.72;color:#566c78;max-width:46ch;margin:0}
.tp10m2[data-tp10-languages="true"] .heroButtons{gap:12px;margin-top:33px}
.tp10m2[data-tp10-languages="true"] .heroButtons .btn{background:#123b5a;color:white;border:1px solid #123b5a;padding:17px 24px;border-radius:6px;font-size:13px}
.tp10m2[data-tp10-languages="true"] .heroButtons .btn.secondary{background:transparent;color:#123b5a;border-color:#b7c6cc}
.tp10m2[data-tp10-languages="true"] .heroImage{min-height:570px;overflow:hidden}
.tp10m2[data-tp10-languages="true"] .heroImage img{object-position:center;filter:saturate(.85)}
.tp10m2[data-tp10-languages="true"] .heroImage:after{background:linear-gradient(90deg,var(--editorial-paper) 0%,#f8f7f380 13%,transparent 32%)}
@media(max-width:850px){
.tp10m2[data-tp10-languages="true"] .header{padding:17px 22px}
.tp10m2[data-tp10-languages="true"] .links{background:#fbfaf7;top:100%;box-shadow:0 15px 25px #123b5a19;align-items:stretch}
.tp10m2[data-tp10-languages="true"] .links.open{display:flex}
.tp10m2[data-tp10-languages="true"] .headerCta{text-align:center}
.tp10m2[data-tp10-languages="true"] .hero{grid-template-columns:1fr;min-height:0}
.tp10m2[data-tp10-languages="true"] .heroCopy{padding:65px 7% 42px}
.tp10m2[data-tp10-languages="true"] .hero h1{font-size:clamp(47px,8vw,75px);max-width:13ch}
.tp10m2[data-tp10-languages="true"] .heroImage{min-height:360px}
.tp10m2[data-tp10-languages="true"] .heroImage:after{background:linear-gradient(180deg,var(--editorial-paper),transparent 24%)}
}
@media(max-width:480px){
.tp10m2[data-tp10-languages="true"] .heroCopy{padding:44px 22px 34px}
.tp10m2[data-tp10-languages="true"] .hero h1{font-size:clamp(42px,10.8vw,55px);margin:19px 0;line-height:1.09}
.tp10m2[data-tp10-languages="true"] .heroButtons{margin-top:25px}
.tp10m2[data-tp10-languages="true"] .heroButtons .btn{width:100%}
.tp10m2[data-tp10-languages="true"] .heroImage{min-height:285px}
}

/* Approved Editorial Split Premium: TP10 M2 language-school about section only. */
.tp10m2[data-tp10-languages="true"] .about{background:#fbfaf7;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:clamp(44px,7vw,115px);align-items:center;padding-top:clamp(95px,10vw,155px);padding-bottom:clamp(95px,10vw,155px)}
.tp10m2[data-tp10-languages="true"] .aboutPhotos{height:clamp(420px,43vw,600px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.72fr);gap:clamp(14px,2vw,24px);align-items:center;min-width:0}
.tp10m2[data-tp10-languages="true"] .aboutPhotos img:first-child{height:100%;border-radius:10px;object-position:center;box-shadow:0 24px 45px #14324817}
.tp10m2[data-tp10-languages="true"] .aboutPhotos img:last-child{height:76%;border-radius:10px;object-position:center;transform:translateY(38px);box-shadow:0 20px 38px #14324816}
.tp10m2[data-tp10-languages="true"] .aboutContent{min-width:0;max-width:560px}
.tp10m2[data-tp10-languages="true"] .aboutContent .eyebrow{color:#386f93;letter-spacing:.19em}
.tp10m2[data-tp10-languages="true"] .aboutContent h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(43px,4.45vw,72px);font-weight:400;letter-spacing:-.055em;line-height:1.12;color:#112f47;margin:22px 0 25px;text-wrap:balance}
.tp10m2[data-tp10-languages="true"] .aboutContent h2 em{font-weight:400;color:#356d89}
.tp10m2[data-tp10-languages="true"] .aboutContent p{font-size:clamp(16px,1.25vw,18px);line-height:1.85;color:#586d78;max-width:47ch;margin:0 0 29px}
.tp10m2[data-tp10-languages="true"] .aboutContent .btn{background:#123b5a;border-radius:6px;padding:17px 26px;font-size:13px}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .about{grid-template-columns:1fr;gap:58px;padding:65px 7%}.tp10m2[data-tp10-languages="true"] .aboutPhotos{height:clamp(320px,65vw,500px)}.tp10m2[data-tp10-languages="true"] .aboutContent h2{font-size:clamp(43px,7vw,65px)}}
@media(max-width:480px){.tp10m2[data-tp10-languages="true"] .about{padding:52px 22px;gap:42px}.tp10m2[data-tp10-languages="true"] .aboutPhotos{height:280px;gap:12px}.tp10m2[data-tp10-languages="true"] .aboutPhotos img:last-child{transform:translateY(19px)}.tp10m2[data-tp10-languages="true"] .aboutContent h2{font-size:clamp(38px,10vw,49px);margin:17px 0}.tp10m2[data-tp10-languages="true"] .aboutContent p{font-size:15px;line-height:1.7}}

/* Approved Bento Editorial Premium: language-school TP10 M2 courses only. */
.tp10m2[data-tp10-languages="true"] .cards{background:#f0f3f2;padding-top:clamp(85px,9vw,140px);padding-bottom:clamp(85px,9vw,140px)}
.tp10m2[data-tp10-languages="true"] .cardsHead{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr)!important;gap:clamp(25px,5vw,75px)!important;align-items:end!important}
.tp10m2[data-tp10-languages="true"] .cardsHead .eyebrow{color:#39708c;letter-spacing:.18em}
.tp10m2[data-tp10-languages="true"] .cardsHead h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(42px,4.4vw,70px);font-weight:400;letter-spacing:-.055em;line-height:1.12;color:#122f47;max-width:15ch;text-wrap:balance;margin:17px 0 0!important}
.tp10m2[data-tp10-languages="true"] .cardsHead p{color:#5b707c;font-size:clamp(15px,1.2vw,17px);line-height:1.75!important;max-width:38ch!important}
.tp10m2[data-tp10-languages="true"] .courseGrid{grid-template-columns:minmax(0,1.13fr) minmax(0,.87fr);grid-template-rows:repeat(2,minmax(0,270px));gap:18px;margin-top:40px}
.tp10m2[data-tp10-languages="true"] .course{border-radius:12px;background:#183b50;box-shadow:0 14px 30px #122f4714}
.tp10m2[data-tp10-languages="true"] .course img{filter:brightness(.84) saturate(.86)}
.tp10m2[data-tp10-languages="true"] .courseLabel{padding:clamp(22px,3vw,38px);background:linear-gradient(180deg,transparent 0%,#061b2ec9 54%,#061b2ff5 100%)}
.tp10m2[data-tp10-languages="true"] .courseLabel small{font-size:10px;letter-spacing:.17em;font-weight:750;color:#d9e6ee!important}
.tp10m2[data-tp10-languages="true"] .courseLabel h3{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(27px,2.9vw,43px);line-height:1.14;letter-spacing:-.035em;margin:12px 0 0;text-wrap:balance}
.tp10m2[data-tp10-languages="true"] .course:first-child .courseLabel h3{font-size:clamp(35px,3.8vw,57px)}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .cards{padding:65px 7%}.tp10m2[data-tp10-languages="true"] .cardsHead{grid-template-columns:1fr!important;gap:16px!important}.tp10m2[data-tp10-languages="true"] .cardsHead h2{font-size:clamp(40px,7vw,58px)!important}.tp10m2[data-tp10-languages="true"] .courseGrid{grid-template-columns:1fr;grid-template-rows:none;gap:16px}.tp10m2[data-tp10-languages="true"] .course,.tp10m2[data-tp10-languages="true"] .course:first-child{height:310px;min-height:310px;grid-row:auto}}
@media(max-width:480px){.tp10m2[data-tp10-languages="true"] .cards{padding:48px 22px}.tp10m2[data-tp10-languages="true"] .cardsHead h2{font-size:clamp(36px,9vw,46px)!important}.tp10m2[data-tp10-languages="true"] .course,.tp10m2[data-tp10-languages="true"] .course:first-child{height:260px;min-height:260px}.tp10m2[data-tp10-languages="true"] .courseLabel{padding:22px}.tp10m2[data-tp10-languages="true"] .courseLabel h3,.tp10m2[data-tp10-languages="true"] .course:first-child .courseLabel h3{font-size:clamp(28px,8vw,38px)}}

/* Approved Premium Feature Grid: TP10 M2 language-school differences only. */
.tp10m2[data-tp10-languages="true"] .difference--language{display:block;min-height:0;background:#fbfaf7;color:#123249;padding:clamp(85px,9vw,145px) clamp(25px,7vw,112px)}
.tp10m2[data-tp10-languages="true"] .differenceIntro{max-width:850px;margin:0 auto 48px;text-align:center}
.tp10m2[data-tp10-languages="true"] .differenceIntro .eyebrow{color:#39718e;letter-spacing:.2em;font-size:11px}
.tp10m2[data-tp10-languages="true"] .differenceIntro h2{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.055em;line-height:1.1;font-size:clamp(43px,5vw,76px);margin:20px auto 23px;max-width:15ch;text-wrap:balance}
.tp10m2[data-tp10-languages="true"] .differenceIntro h2 em{font-weight:400;color:#38748e}
.tp10m2[data-tp10-languages="true"] .differenceIntro p{color:#607783;font-size:clamp(15px,1.2vw,18px);line-height:1.75;max-width:60ch;margin:auto}
.tp10m2[data-tp10-languages="true"] .differenceFeatures{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(12px,1.5vw,22px);max-width:1400px;margin:0 auto}
.tp10m2[data-tp10-languages="true"] .differenceFeature{background:#fff;border:1px solid #e3e9e8;border-radius:12px;padding:clamp(23px,2.5vw,35px);min-height:280px;box-shadow:0 15px 35px #1232490b;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}
.tp10m2[data-tp10-languages="true"] .differenceFeature:hover{transform:translateY(-4px);box-shadow:0 19px 42px #12324915}
.tp10m2[data-tp10-languages="true"] .differenceFeatureTop{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:40px}
.tp10m2[data-tp10-languages="true"] .differenceFeatureIcon{width:49px;height:49px;border-radius:10px;display:grid;place-items:center;background:#e9f1f2;color:#215d7c;font-size:25px}
.tp10m2[data-tp10-languages="true"] .differenceFeatureNumber{font-size:11px;letter-spacing:.1em;color:#91a4aa;font-weight:700}
.tp10m2[data-tp10-languages="true"] .differenceFeature h3{font-family:Georgia,'Times New Roman',serif;font-size:clamp(23px,2vw,30px);font-weight:400;letter-spacing:-.035em;line-height:1.18;margin:0 0 15px;color:#173a50}
.tp10m2[data-tp10-languages="true"] .differenceFeature p{font-size:14px;line-height:1.7;color:#627986;margin:0}
@media(max-width:1050px){.tp10m2[data-tp10-languages="true"] .differenceFeatures{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){.tp10m2[data-tp10-languages="true"] .difference--language{padding:65px 22px}.tp10m2[data-tp10-languages="true"] .differenceIntro{text-align:left;margin-bottom:30px}.tp10m2[data-tp10-languages="true"] .differenceIntro h2{font-size:clamp(40px,10vw,55px);margin-left:0}.tp10m2[data-tp10-languages="true"] .differenceIntro p{margin-left:0}.tp10m2[data-tp10-languages="true"] .differenceFeatures{grid-template-columns:1fr;gap:13px}.tp10m2[data-tp10-languages="true"] .differenceFeature{min-height:0;padding:25px}.tp10m2[data-tp10-languages="true"] .differenceFeatureTop{margin-bottom:24px}}

/* Approved Learning Journey Premium: language-school TP10 Model 2 methodology only. */
.tp10m2[data-tp10-languages="true"] .method--language{background:#f8f7f3;color:#123249;padding-top:clamp(85px,9vw,135px);padding-bottom:clamp(85px,9vw,135px)}
.tp10m2[data-tp10-languages="true"] .method--language>.eyebrow{color:#3b7393;letter-spacing:.18em;font-size:11px}
.tp10m2[data-tp10-languages="true"] .methodHeading{display:flex;justify-content:space-between;align-items:end;gap:35px;margin:19px 0 50px}
.tp10m2[data-tp10-languages="true"] .methodHeading h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(43px,5vw,76px);font-weight:400;line-height:1.12;letter-spacing:-.055em;max-width:13ch;margin:0;text-wrap:balance}
.tp10m2[data-tp10-languages="true"] .methodHeading h2 em{font-weight:400;color:#3b7791}
.tp10m2[data-tp10-languages="true"] .methodHeading>p{font-size:clamp(15px,1.2vw,18px);line-height:1.75;color:#617784;max-width:39ch;margin:0 0 6px}
.tp10m2[data-tp10-languages="true"] .methodGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(15px,2vw,28px);margin-top:0;position:relative}
.tp10m2[data-tp10-languages="true"] .methodGrid:before{content:"";position:absolute;top:calc(clamp(190px,19vw,275px) + 29px);left:10%;right:10%;height:1px;background:#c7d7d9;z-index:0}
.tp10m2[data-tp10-languages="true"] .method{position:relative;border:1px solid #e2e8e8;background:#fff;border-radius:12px;overflow:visible;box-shadow:0 14px 35px #1232490b;min-width:0}
.tp10m2[data-tp10-languages="true"] .methodPhoto{height:clamp(190px,19vw,275px);overflow:hidden;border-radius:11px 11px 0 0}
.tp10m2[data-tp10-languages="true"] .methodPhoto img{height:100%;width:100%;object-fit:cover;filter:saturate(.88)}
.tp10m2[data-tp10-languages="true"] .methodBody{padding:clamp(24px,2.6vw,38px);position:relative}
.tp10m2[data-tp10-languages="true"] .methodBody b{display:grid;place-items:center;width:55px;height:55px;border-radius:50%;background:#123b5a;color:white;border:5px solid #fff;font-size:17px;position:absolute;top:-28px;left:clamp(24px,2.6vw,38px);box-shadow:0 3px 15px #123b5a22}
.tp10m2[data-tp10-languages="true"] .methodBody h3{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(29px,2.6vw,41px);letter-spacing:-.04em;line-height:1.12;margin:24px 0 14px;color:#123249}
.tp10m2[data-tp10-languages="true"] .methodBody p{font-size:clamp(14px,1.05vw,16px);line-height:1.7;color:#607681;margin:0}
.tp10m2[data-tp10-languages="true"] .methodDisclaimer{font-size:12px;color:#72848c;line-height:1.6;margin:26px 0 0;text-align:center}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .methodHeading{display:block;margin-bottom:30px}.tp10m2[data-tp10-languages="true"] .methodHeading h2{font-size:clamp(43px,7vw,64px)}.tp10m2[data-tp10-languages="true"] .methodHeading>p{margin-top:18px}.tp10m2[data-tp10-languages="true"] .methodGrid{grid-template-columns:1fr;gap:22px}.tp10m2[data-tp10-languages="true"] .methodGrid:before{display:none}.tp10m2[data-tp10-languages="true"] .methodPhoto{height:260px}}
@media(max-width:480px){.tp10m2[data-tp10-languages="true"] .method--language{padding:58px 22px}.tp10m2[data-tp10-languages="true"] .methodHeading h2{font-size:clamp(39px,10vw,50px)}.tp10m2[data-tp10-languages="true"] .methodPhoto{height:220px}.tp10m2[data-tp10-languages="true"] .methodBody{padding:24px}.tp10m2[data-tp10-languages="true"] .methodBody b{left:24px}.tp10m2[data-tp10-languages="true"] .methodBody h3{font-size:31px}}

/* Approved Editorial Photo Wall: TP10 M2 language school only; works with 1-6 photos. */
.tp10m2[data-tp10-languages="true"] .gallery--language{background:#f9f8f4;padding-top:clamp(85px,9vw,145px);padding-bottom:clamp(85px,9vw,145px)}
.tp10m2[data-tp10-languages="true"] .gallery--language>.eyebrow{color:#37718d;letter-spacing:.18em}
.tp10m2[data-tp10-languages="true"] .galleryIntro{display:flex;align-items:end;justify-content:space-between;gap:32px;margin:18px 0 45px}
.tp10m2[data-tp10-languages="true"] .galleryIntro h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(44px,5vw,78px);font-weight:400;line-height:1.08;letter-spacing:-.055em;max-width:13ch;margin:0;color:#123249;text-wrap:balance}
.tp10m2[data-tp10-languages="true"] .galleryIntro h2 em{font-weight:400;color:#39758e}
.tp10m2[data-tp10-languages="true"] .galleryIntro p{max-width:38ch;margin:0 0 6px;font-size:clamp(14px,1.15vw,17px);line-height:1.75;color:#617783}
.tp10m2[data-tp10-languages="true"] .mosaic--editorial{display:grid;grid-template-columns:1.12fr .95fr .95fr;grid-template-rows:repeat(2,minmax(0,225px));gap:clamp(12px,1.8vw,24px);margin-top:0;align-items:stretch}
.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure{margin:0;min-width:0;min-height:0;overflow:hidden;border-radius:10px;grid-column:auto;grid-row:auto;box-shadow:0 14px 34px #12324912}
.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:first-child{grid-row:span 2}
.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:nth-child(4){grid-column:auto}
.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:nth-child(3){transform:translateY(15px)}
.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:nth-child(5){transform:translateY(15px)}
.tp10m2[data-tp10-languages="true"] .mosaic--editorial img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease}
.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:hover img{transform:scale(1.035)}
.tp10m2[data-tp10-languages="true"] .mosaic--count-1{grid-template-columns:1fr;grid-template-rows:minmax(280px,510px)}
.tp10m2[data-tp10-languages="true"] .mosaic--count-1 figure:first-child{grid-row:auto}
.tp10m2[data-tp10-languages="true"] .mosaic--count-2{grid-template-columns:1.2fr 1fr;grid-template-rows:minmax(250px,420px)}
.tp10m2[data-tp10-languages="true"] .mosaic--count-2 figure:first-child{grid-row:auto}
.tp10m2[data-tp10-languages="true"] .mosaic--count-3{grid-template-columns:1.12fr 1fr;grid-template-rows:repeat(2,minmax(0,215px))}
.tp10m2[data-tp10-languages="true"] .mosaic--count-3 figure:nth-child(3){transform:none}
.tp10m2[data-tp10-languages="true"] .mosaic--count-4{grid-template-columns:1.12fr 1fr 1fr;grid-template-rows:repeat(2,minmax(0,215px))}
.tp10m2[data-tp10-languages="true"] .mosaic--count-4 figure:nth-child(2){grid-column:span 2}
.tp10m2[data-tp10-languages="true"] .mosaic--count-4 figure:nth-child(3){transform:none}
.tp10m2[data-tp10-languages="true"] .mosaic--count-5{grid-template-columns:1.12fr 1fr 1fr;grid-template-rows:repeat(2,minmax(0,215px))}
.tp10m2[data-tp10-languages="true"] .mosaic--count-5 figure:nth-child(3),.tp10m2[data-tp10-languages="true"] .mosaic--count-5 figure:nth-child(5){transform:none}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .galleryIntro{display:block;margin-bottom:30px}.tp10m2[data-tp10-languages="true"] .galleryIntro p{margin-top:18px}.tp10m2[data-tp10-languages="true"] .mosaic--editorial{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none;grid-auto-rows:210px}.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure,.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:first-child,.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:nth-child(2){grid-column:auto;grid-row:auto;transform:none}.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:first-child{grid-row:span 2}.tp10m2[data-tp10-languages="true"] .mosaic--count-1{grid-template-columns:1fr}.tp10m2[data-tp10-languages="true"] .mosaic--count-1 figure:first-child{grid-row:auto}.tp10m2[data-tp10-languages="true"] .mosaic--count-2{grid-template-columns:repeat(2,minmax(0,1fr))}.tp10m2[data-tp10-languages="true"] .mosaic--count-2 figure:first-child{grid-row:auto}}
@media(max-width:480px){.tp10m2[data-tp10-languages="true"] .gallery--language{padding:58px 22px}.tp10m2[data-tp10-languages="true"] .galleryIntro h2{font-size:clamp(39px,10vw,51px)}.tp10m2[data-tp10-languages="true"] .mosaic--editorial{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:155px;gap:10px}.tp10m2[data-tp10-languages="true"] .mosaic--editorial figure:first-child{grid-row:span 2}.tp10m2[data-tp10-languages="true"] .mosaic--count-1{grid-template-columns:1fr;grid-auto-rows:290px}.tp10m2[data-tp10-languages="true"] .mosaic--count-1 figure:first-child{grid-row:auto}.tp10m2[data-tp10-languages="true"] .mosaic--count-2{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:220px}.tp10m2[data-tp10-languages="true"] .mosaic--count-2 figure:first-child{grid-row:auto}}

/* Approved Signature Footer Premium: language-school TP10 Model 2 only. */
.tp10m2[data-tp10-languages="true"] .footer--language{background:#071b2a;color:#f6fafc;padding:clamp(85px,9vw,145px) clamp(22px,7vw,115px) 32px}
.tp10m2[data-tp10-languages="true"] .footer--language .footerLead{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:45px;padding-bottom:clamp(55px,7vw,105px)}
.tp10m2[data-tp10-languages="true"] .footer--language .footerLeadCopy>.eyebrow{color:#9bc8e1;letter-spacing:.19em}
.tp10m2[data-tp10-languages="true"] .footer--language .footerLead h2{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.055em;line-height:1.1;font-size:clamp(46px,6.3vw,100px);max-width:14ch;margin:23px 0 22px;color:#f7fbfc;text-wrap:balance}
.tp10m2[data-tp10-languages="true"] .footer--language .footerLead h2 em{font-weight:400;color:#9bcbe3}
.tp10m2[data-tp10-languages="true"] .footer--language .footerLeadCopy>p{color:#b6cbd7;font-size:clamp(15px,1.2vw,18px);line-height:1.7;max-width:48ch}
.tp10m2[data-tp10-languages="true"] .footer--language .footerContactCta{display:inline-flex;align-items:center;justify-content:space-between;gap:38px;min-width:245px;padding:22px 27px;background:#357ba8;color:#fff;border-radius:9px;font-size:15px;font-weight:700;white-space:nowrap;box-shadow:0 15px 35px #0003;transition:background .2s,transform .2s}
.tp10m2[data-tp10-languages="true"] .footer--language .footerContactCta:hover{background:#4b93bf;transform:translateY(-2px)}
.tp10m2[data-tp10-languages="true"] .footer--language .footerContactCta:focus-visible,.tp10m2[data-tp10-languages="true"] .footer--language a:focus-visible{outline:3px solid #a6d7f0;outline-offset:4px}
.tp10m2[data-tp10-languages="true"] .footer--language .footerMain{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:40px;border-top:1px solid #ffffff2b;padding:clamp(40px,5vw,75px) 0}
.tp10m2[data-tp10-languages="true"] .footer--language .footerIdentity strong{font-family:Georgia,'Times New Roman',serif;font-size:clamp(25px,2.7vw,42px);font-weight:400;line-height:1.2;overflow-wrap:anywhere}
.tp10m2[data-tp10-languages="true"] .footer--language .footerIdentity p{color:#b1c4d0;margin:14px 0 0;font-size:14px}
.tp10m2[data-tp10-languages="true"] .footer--language .footerNav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:25px;margin:0;padding:0;border:0}
.tp10m2[data-tp10-languages="true"] .footer--language .footerNavColumn{display:flex;flex-direction:column;align-items:start;gap:15px}
.tp10m2[data-tp10-languages="true"] .footer--language .footerNavColumn>span{font-size:11px;text-transform:uppercase;letter-spacing:.17em;color:#8cb7d0;font-weight:800;margin-bottom:7px}
.tp10m2[data-tp10-languages="true"] .footer--language .footerNav a{font-size:14px;color:#e4edf3;font-weight:500;line-height:1.5}
.tp10m2[data-tp10-languages="true"] .footer--language .footerBottom{margin:0;border-top:1px solid #ffffff2b;padding:25px 0 0;display:flex;justify-content:space-between;gap:18px;align-items:center;font-size:12px;color:#afc2cf}
.tp10m2[data-tp10-languages="true"] .footer--language .footerBottom a{color:#dcecf4;font-weight:700}
@media(max-width:900px){.tp10m2[data-tp10-languages="true"] .footer--language .footerLead{grid-template-columns:1fr;align-items:start;gap:24px}.tp10m2[data-tp10-languages="true"] .footer--language .footerContactCta{width:max-content;max-width:100%}}
@media(max-width:560px){.tp10m2[data-tp10-languages="true"] .footer--language{padding:65px 22px 28px}.tp10m2[data-tp10-languages="true"] .footer--language .footerLead h2{font-size:clamp(41px,10vw,56px)}.tp10m2[data-tp10-languages="true"] .footer--language .footerLead{padding-bottom:48px}.tp10m2[data-tp10-languages="true"] .footer--language .footerContactCta{width:100%;min-width:0}.tp10m2[data-tp10-languages="true"] .footer--language .footerMain{grid-template-columns:1fr;gap:33px;padding:39px 0}.tp10m2[data-tp10-languages="true"] .footer--language .footerNav{gap:17px}.tp10m2[data-tp10-languages="true"] .footer--language .footerBottom{align-items:flex-start}}

/* Approved Split Contact Experience: TP10 language-school Model 2 only. */
.tp10m2[data-tp10-languages="true"] .contact--language{background:#f4f3ee;padding-top:clamp(85px,9vw,145px);padding-bottom:clamp(85px,9vw,145px)}
.tp10m2[data-tp10-languages="true"] .contact--language .contactGrid{display:grid;grid-template-columns:minmax(0,1.06fr) minmax(0,.94fr);gap:clamp(35px,6vw,105px);align-items:start}
.tp10m2[data-tp10-languages="true"] .contact--language .contactIntro>h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(45px,5vw,77px);font-weight:400;line-height:1.1;letter-spacing:-.055em;color:#122d45;max-width:13ch;margin:22px 0 24px}
.tp10m2[data-tp10-languages="true"] .contact--language .contactIntro>h2 em{color:#37729a;font-weight:400}
.tp10m2[data-tp10-languages="true"] .contact--language .contactIntro>p{max-width:49ch;font-size:clamp(15px,1.15vw,18px);line-height:1.75;color:#546b7d}
.tp10m2[data-tp10-languages="true"] .contact--language .contactPhoto{position:relative;overflow:hidden;border-radius:17px;margin:34px 0 22px;aspect-ratio:1.65;background:#dce6ec}
.tp10m2[data-tp10-languages="true"] .contact--language .contactPhoto img{width:100%;height:100%;object-fit:cover}
.tp10m2[data-tp10-languages="true"] .contact--language .contactPhoto figcaption{position:absolute;right:12px;bottom:12px;background:#071e30dc;color:#fff;border-radius:6px;padding:7px 11px;font-size:10px;letter-spacing:.03em}
.tp10m2[data-tp10-languages="true"] .contact--language .contactChannels{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center}
.tp10m2[data-tp10-languages="true"] .contact--language .contactChannels p{margin:0;font-size:14px;overflow-wrap:anywhere}
.tp10m2[data-tp10-languages="true"] .contact--language .contactChannels a{color:#205c83;text-decoration:underline;text-underline-offset:4px;font-weight:700}
.tp10m2[data-tp10-languages="true"] .contact--language form{display:grid;gap:19px;background:#fff;border:1px solid #e1e8ec;border-radius:20px;box-shadow:0 22px 65px #17374d13;padding:clamp(26px,3.5vw,52px)}
.tp10m2[data-tp10-languages="true"] .contact--language .contactFormHeading h3{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(27px,2.3vw,38px);line-height:1.2;color:#152e45;margin:12px 0}
.tp10m2[data-tp10-languages="true"] .contact--language .contactFormHeading p{font-size:14px;margin:0 0 8px;color:#617385}
.tp10m2[data-tp10-languages="true"] .contact--language form label{font-size:12px;color:#233e55;letter-spacing:.025em;gap:9px}
.tp10m2[data-tp10-languages="true"] .contact--language form input,.tp10m2[data-tp10-languages="true"] .contact--language form textarea{font-size:15px;padding:17px 18px;border:1px solid #d5e1e9;border-radius:9px;background:#f9fbfc;color:#162f45;line-height:1.5}
.tp10m2[data-tp10-languages="true"] .contact--language form input:focus-visible,.tp10m2[data-tp10-languages="true"] .contact--language form textarea:focus-visible{outline:3px solid #9ac8e4;outline-offset:1px}
.tp10m2[data-tp10-languages="true"] .contact--language form button{background:#153e63;color:#fff;padding:19px 22px;border-radius:9px;font-size:14px;transition:background .2s}
.tp10m2[data-tp10-languages="true"] .contact--language form button:hover{background:#24618d}
.tp10m2[data-tp10-languages="true"] .contact--language form [role="status"]{font-size:13px;color:#284f70;margin:0}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .contact--language .contactGrid{grid-template-columns:1fr;gap:30px}.tp10m2[data-tp10-languages="true"] .contact--language .contactIntro>h2{max-width:17ch}}
@media(max-width:560px){.tp10m2[data-tp10-languages="true"] .contact--language{padding-top:65px;padding-bottom:65px}.tp10m2[data-tp10-languages="true"] .contact--language .contactIntro>h2{font-size:clamp(40px,10vw,55px)}.tp10m2[data-tp10-languages="true"] .contact--language .contactPhoto{margin-top:23px}.tp10m2[data-tp10-languages="true"] .contact--language form{padding:23px}}

/* Approved FAQ Cards Premium: TP10 language-school Model 2 only. */
.tp10m2[data-tp10-languages="true"] .faq--language{background:#f4f3ee;color:#142c42;padding-top:clamp(90px,10vw,150px);padding-bottom:clamp(90px,10vw,150px)}
.tp10m2[data-tp10-languages="true"] .faq--language .faqGrid{grid-template-columns:minmax(0,.9fr) minmax(0,1.15fr);gap:clamp(45px,7vw,125px);align-items:start}
.tp10m2[data-tp10-languages="true"] .faq--language .faqIntro>.eyebrow{font-size:11px;letter-spacing:.19em;color:#2a638e}
.tp10m2[data-tp10-languages="true"] .faq--language .faqIntro>h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(43px,4.9vw,76px);line-height:1.12;letter-spacing:-.055em;font-weight:400;color:#132e46;margin:22px 0 24px;max-width:12ch;text-wrap:balance}
.tp10m2[data-tp10-languages="true"] .faq--language .faqIntro>h2 em{font-weight:400;color:#3d7299}
.tp10m2[data-tp10-languages="true"] .faq--language .faqIntro>p{font-size:clamp(15px,1.2vw,18px);line-height:1.75;color:#53697a;max-width:40ch}
.tp10m2[data-tp10-languages="true"] .faq--language .faqQuestions{display:grid;gap:15px}
.tp10m2[data-tp10-languages="true"] .faq--language .faqItem{border:1px solid #dce5e9;border-radius:15px;background:#fff;box-shadow:0 10px 30px #18374b0a;overflow:hidden;transition:border-color .2s,box-shadow .2s}
.tp10m2[data-tp10-languages="true"] .faq--language .faqItem:has(button[aria-expanded="true"]){border-color:#b6cfdd;box-shadow:0 15px 36px #18374b13}
.tp10m2[data-tp10-languages="true"] .faq--language .faqItem button{display:flex;align-items:center;gap:16px;padding:clamp(20px,2vw,29px);font-size:clamp(15px,1.16vw,18px);line-height:1.45;color:#152f46;font-weight:700}
.tp10m2[data-tp10-languages="true"] .faq--language .faqItem button:focus-visible{outline:3px solid #4b91c5;outline-offset:-4px}
.tp10m2[data-tp10-languages="true"] .faq--language .faqNumber{font-size:11px;letter-spacing:.1em;color:#6090b0;font-weight:800;flex:none}
.tp10m2[data-tp10-languages="true"] .faq--language .faqQuestionText{flex:1;min-width:0}
.tp10m2[data-tp10-languages="true"] .faq--language .faqToggle{width:31px;height:31px;border-radius:50%;background:#e9f1f6;color:#245e86;display:grid;place-items:center;font-size:20px;line-height:1;flex:none}
.tp10m2[data-tp10-languages="true"] .faq--language .faqItem p{padding:0 clamp(20px,2vw,29px) 25px;margin:0;color:#536b7d;font-size:clamp(14px,1.1vw,16px);line-height:1.75}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .faq--language .faqGrid{grid-template-columns:1fr;gap:30px}.tp10m2[data-tp10-languages="true"] .faq--language .faqIntro>h2{max-width:18ch}}
@media(max-width:560px){.tp10m2[data-tp10-languages="true"] .faq--language{padding-top:65px;padding-bottom:65px}.tp10m2[data-tp10-languages="true"] .faq--language .faqItem button{gap:10px;padding:19px}.tp10m2[data-tp10-languages="true"] .faq--language .faqIntro>h2{font-size:clamp(39px,10vw,53px)}}

/* Approved Dark Premium Testimonials: language-school TP10 Model 2 only. */
.tp10m2[data-tp10-languages="true"] .reviews--language{background:#071e30;color:#f6f9fa;padding-top:clamp(85px,9vw,145px);padding-bottom:clamp(85px,9vw,145px)}
.tp10m2[data-tp10-languages="true"] .reviews--language>.eyebrow{color:#9bbad0;font-size:11px;letter-spacing:.2em}
.tp10m2[data-tp10-languages="true"] .reviews--language>h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(43px,5vw,76px);font-weight:400;line-height:1.12;letter-spacing:-.05em;max-width:16ch;margin:20px 0 35px;text-wrap:balance;color:#fff}
.tp10m2[data-tp10-languages="true"] .reviews--language>h2 em{font-weight:400;color:#9bc5db}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02{--tr-bg:#102e43;--tr-ink:#f6f9fb;--tr-muted:#bbd0dd;--tr-border:#ffffff27;--tr-accent:#a8d5ea;--tr-shadow:#00000028;background:transparent}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(15px,1.8vw,25px)}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-card{background:linear-gradient(150deg,#14364d,#0e2a3f);border:1px solid #ffffff25;border-radius:16px;padding:clamp(24px,2.4vw,35px);box-shadow:0 18px 38px #00101d38;transition:transform .2s,border-color .2s}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-card:hover{transform:translateY(-4px);border-color:#9bc5db80}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-person{margin-bottom:22px}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-avatar{width:56px;height:56px;flex-basis:56px;background:#a8d5ea;color:#09253a;border:2px solid #a8d5ea}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-person strong{font-size:16px;color:#fff}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-person span{font-size:12px;color:#b6ccda}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-card blockquote{font-family:Georgia,'Times New Roman',serif;font-size:clamp(17px,1.35vw,21px)!important;line-height:1.65!important;color:#f7fbfd!important;margin-bottom:26px!important}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-card blockquote:before{content:"“";display:block;font-size:48px;line-height:.85;color:#9bc5db;margin-bottom:13px;font-family:Georgia,serif}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-foot{color:#b6d9e9;border-top-color:#ffffff28;font-size:10px!important;letter-spacing:.07em}
.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-notice{color:#c1d5e0!important;font-size:14px!important;max-width:880px}
@media(max-width:1000px){.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.tp10m2[data-tp10-languages="true"] .reviews--language{padding:65px 22px}.tp10m2[data-tp10-languages="true"] .reviews--language>h2{font-size:clamp(39px,10vw,53px)}.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-grid{grid-template-columns:1fr;gap:15px}.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-card{padding:24px}.tp10m2[data-tp10-languages="true"] .reviews--language .tp10edu-six--02 .tp10edu-six-card blockquote{font-size:18px!important}}
/* TP10 M2: approved editorial bento differences for non-language education niches. */
.tp10m2 .difference--language:has(.differenceBento){display:block;padding:clamp(70px,8vw,120px) clamp(22px,6vw,100px);background:#f7f6f2;min-height:0}
.tp10m2 .differenceBento{max-width:1380px;margin:auto;width:100%}
.tp10m2 .differenceBentoIntro{max-width:800px;margin:0 0 42px}
.tp10m2 .differenceBentoIntro h2{font:400 clamp(38px,5vw,74px)/1.08 Georgia,serif;letter-spacing:-.055em;color:#15334a;margin:15px 0 20px;text-wrap:balance}
.tp10m2 .differenceBentoIntro h2 em{color:#34728a;font-weight:400}
.tp10m2 .differenceBentoIntro p{max-width:62ch;font-size:clamp(15px,1.4vw,18px);color:#596f7c}
.tp10m2 .differenceBentoGrid{display:grid;grid-template-columns:1.15fr 1fr 1fr;grid-template-rows:repeat(2,minmax(245px,1fr));gap:16px}
.tp10m2 .differenceBentoGrid article{position:relative;border-radius:18px;overflow:hidden;min-width:0}
.tp10m2 .differenceBentoLarge{grid-row:span 2}
.tp10m2 .differenceBentoPhoto{min-height:245px;background:#16334b}
.tp10m2 .differenceBentoPhoto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.tp10m2 .differenceBentoPhoto:after{content:'';position:absolute;inset:25% 0 0;background:linear-gradient(transparent,#0b1d30c9)}
.tp10m2 .differenceBentoPhoto>div{position:absolute;z-index:1;bottom:24px;left:25px;right:22px;color:#fff}
.tp10m2 .differenceBentoPhoto span,.tp10m2 .differenceBentoTile>span:first-child{font-size:10px;letter-spacing:.15em;font-weight:800}
.tp10m2 .differenceBentoPhoto h3{font:400 clamp(25px,2.6vw,38px)/1.15 Georgia,serif;color:#fff;margin:10px 0 0}
.tp10m2 .differenceBentoTile{background:#e9eff0;padding:clamp(23px,2.5vw,38px);display:flex;flex-direction:column;align-items:flex-start}
.tp10m2 .differenceBentoAccent{background:#183b51;color:#fff}
.tp10m2 .differenceBentoGlyph{font-size:48px;line-height:1;margin:auto 0 12px;color:#74a9ae}
.tp10m2 .differenceBentoAccent .differenceBentoGlyph{color:#e6b46e}
.tp10m2 .differenceBentoTile h3{font:400 clamp(24px,2.2vw,34px)/1.1 Georgia,serif;margin:0 0 12px;color:inherit}
.tp10m2 .differenceBentoTile p{margin:0;font-size:13px;line-height:1.6;color:inherit;opacity:.83}
.tp10m2 .differenceBentoNote{font-size:12px;color:#637987;margin:22px 0 0}
@media(max-width:950px){.tp10m2 .differenceBentoGrid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:auto}.tp10m2 .differenceBentoLarge{grid-row:span 2}}
@media(max-width:600px){.tp10m2 .differenceBentoGrid{grid-template-columns:1fr;gap:12px}.tp10m2 .differenceBentoLarge{grid-row:auto;min-height:360px}.tp10m2 .differenceBentoGrid article{min-height:230px}.tp10m2 .differenceBentoIntro{margin-bottom:30px}}


/* Approved TP10 M2 cinematic six-photo bento gallery, all education niches. */
.tp10m2[data-tp10-languages="true"] .gallery--bento{background:#f9f8f4;padding:clamp(75px,8vw,125px) clamp(22px,6vw,95px)}
.tp10m2[data-tp10-languages="true"] .gallery--bento .galleryIntro{margin-bottom:32px}
.tp10m2[data-tp10-languages="true"] .mosaic--bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,190px));gap:14px;align-items:stretch;margin:0}
.tp10m2[data-tp10-languages="true"] .mosaic--bento figure{display:block;margin:0;min-width:0;min-height:0;grid-column:auto;grid-row:auto;transform:none;overflow:hidden;border-radius:16px;background:#dce4e8;box-shadow:none}
.tp10m2[data-tp10-languages="true"] .mosaic--bento .mosaicBentoItem--1{grid-column:span 2;grid-row:span 3}
.tp10m2[data-tp10-languages="true"] .mosaic--bento .mosaicBentoItem--2{grid-column:span 2}
.tp10m2[data-tp10-languages="true"] .mosaic--bento .mosaicBentoItem--3{grid-row:auto}
.tp10m2[data-tp10-languages="true"] .mosaic--bento img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.tp10m2[data-tp10-languages="true"] .mosaic--bento figure:hover img{transform:scale(1.04)}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .mosaic--bento{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(3,190px)}.tp10m2[data-tp10-languages="true"] .mosaic--bento .mosaicBentoItem--1{grid-column:auto;grid-row:auto}.tp10m2[data-tp10-languages="true"] .mosaic--bento .mosaicBentoItem--2{grid-column:auto}.tp10m2[data-tp10-languages="true"] .mosaic--bento .mosaicBentoItem--3{grid-row:auto}}
@media(max-width:550px){.tp10m2[data-tp10-languages="true"] .mosaic--bento{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(5,145px);gap:9px}.tp10m2[data-tp10-languages="true"] .mosaic--bento .mosaicBentoItem--1{grid-column:span 2;grid-row:span 2}.tp10m2[data-tp10-languages="true"] .mosaic--bento .mosaicBentoItem--2{grid-column:span 2}.tp10m2[data-tp10-languages="true"] .mosaic--bento figure{border-radius:11px}}

/* Approved TP10 Model 2: six-card Wall of Love, 3x2 desktop. */
.tp10m2[data-tp10-languages="true"] .reviews--wall{background:#071f35;color:#fff;padding:clamp(78px,8vw,125px) clamp(22px,6vw,95px)}
.tp10m2[data-tp10-languages="true"] .reviewsWallHeading{text-align:center;max-width:780px;margin:0 auto 45px}
.tp10m2[data-tp10-languages="true"] .reviewsWallHeading .eyebrow{color:#a4d6e8;letter-spacing:.18em}
.tp10m2[data-tp10-languages="true"] .reviewsWallHeading h2{font-family:Georgia,'Times New Roman',serif;color:#fff;font-weight:400;font-size:clamp(40px,5vw,68px);line-height:1.12;margin:18px 0}
.tp10m2[data-tp10-languages="true"] .reviewsWallHeading h2 em{color:#a9d9eb;font-weight:400}
.tp10m2[data-tp10-languages="true"] .reviewsWallHeading p{color:#b7ccdb;font-size:15px;line-height:1.7}
.tp10m2[data-tp10-languages="true"] .reviewsWallGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:stretch}
.tp10m2[data-tp10-languages="true"] .reviewsWallCard{display:flex;flex-direction:column;position:relative;min-width:0;min-height:255px;padding:26px;border:1px solid #35536a;background:#102f49;border-radius:18px;box-shadow:0 14px 35px #0000001a}
.tp10m2[data-tp10-languages="true"] .reviewsWallQuote{font-family:Georgia,serif;color:#9dc9db;font-size:60px;line-height:.7;height:35px}
.tp10m2[data-tp10-languages="true"] .reviewsWallText{color:#f1f6f9;font-size:clamp(15px,1.15vw,17px);line-height:1.65;margin:12px 0 26px;flex:1}
.tp10m2[data-tp10-languages="true"] .reviewsWallPerson{display:flex;align-items:center;gap:12px}
.tp10m2[data-tp10-languages="true"] .reviewsWallPerson img{width:48px;height:48px;flex:0 0 48px;object-fit:cover;border-radius:50%;border:2px solid #a2c8dc}
.tp10m2[data-tp10-languages="true"] .reviewsWallPerson strong{display:block;color:white;font-size:14px;line-height:1.3}
.tp10m2[data-tp10-languages="true"] .reviewsWallPerson span{display:block;color:#a8c1d2;font-size:12px;margin-top:4px}
.tp10m2[data-tp10-languages="true"] .reviewsWallSample{display:block;margin-top:15px;color:#b8d5e3;font-size:9px;letter-spacing:.13em;font-weight:700}
@media(max-width:900px){.tp10m2[data-tp10-languages="true"] .reviewsWallGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.tp10m2[data-tp10-languages="true"] .reviewsWallGrid{grid-template-columns:1fr;gap:13px}.tp10m2[data-tp10-languages="true"] .reviewsWallCard{min-height:215px;padding:24px}.tp10m2[data-tp10-languages="true"] .reviewsWallHeading{margin-bottom:30px}}

/* Approved TP10 Model 2 editorial FAQ: elegant two-column layout and accessible accordion. */
.tp10m2[data-tp10-languages="true"] .faq--editorial{background:#f6f4ef;color:#172f44;padding:clamp(80px,9vw,135px) clamp(22px,7vw,110px)}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqGrid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.2fr);gap:clamp(40px,7vw,120px);align-items:start}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqIntro{position:relative}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqIntro>.eyebrow{color:#39718c;font-size:11px;letter-spacing:.2em}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqIntro>h2{font-family:Georgia,'Times New Roman',serif;font-size:clamp(45px,5.3vw,79px);font-weight:400;line-height:1.08;letter-spacing:-.055em;max-width:12ch;margin:22px 0 26px;color:#16364a}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqIntro>h2 em{font-weight:400;color:#55839a}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqIntro>p{font-size:16px;line-height:1.8;color:#5a6c75;max-width:39ch;margin:0 0 25px}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqEditorialContact{display:inline-flex;align-items:center;gap:15px;border-bottom:1px solid #7294a3;padding-bottom:9px;font-size:13px;font-weight:700;color:#214f65}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqQuestions{display:block;border-top:1px solid #c5d0d2}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqItem{border:0;border-bottom:1px solid #c5d0d2;border-radius:0;background:transparent;box-shadow:none;overflow:visible}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqItem:has(button[aria-expanded="true"]){border-color:#b1c4ca;box-shadow:none}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqItem h3{margin:0;font-size:inherit;letter-spacing:normal}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqItem button{width:100%;display:grid;grid-template-columns:35px minmax(0,1fr) 34px;align-items:center;gap:16px;padding:26px 0;border:0;background:transparent;text-align:left;font-size:clamp(15px,1.2vw,18px);font-weight:600;line-height:1.45;color:#17344a;cursor:pointer}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqItem button:focus-visible{outline:3px solid #377ea5;outline-offset:3px}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqNumber{font-family:Georgia,serif;color:#7994a0;font-size:13px;font-weight:400}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqToggle{width:32px;height:32px;display:grid;place-items:center;border:1px solid #c0d1d7;border-radius:50%;font-size:20px;font-weight:400;color:#2a6885;background:transparent}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqItem button[aria-expanded="true"] .faqToggle{background:#19445c;color:white;border-color:#19445c}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqEditorialAnswer{padding:0 48px 24px 51px}
.tp10m2[data-tp10-languages="true"] .faq--editorial .faqEditorialAnswer p{margin:0;color:#526a78;font-size:15px;line-height:1.8}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .faq--editorial .faqGrid{grid-template-columns:1fr;gap:38px}.tp10m2[data-tp10-languages="true"] .faq--editorial .faqIntro>h2{max-width:16ch}}
@media(max-width:550px){.tp10m2[data-tp10-languages="true"] .faq--editorial .faqItem button{grid-template-columns:25px minmax(0,1fr) 32px;gap:9px;padding:22px 0}.tp10m2[data-tp10-languages="true"] .faq--editorial .faqEditorialAnswer{padding:0 10px 22px 34px}}

/* Approved TP10 Model 2 option 2: photography and premium functional contact form. */
.tp10m2[data-tp10-languages="true"] .contact--photo-premium{background:#f3f3ef;padding:clamp(80px,9vw,135px) clamp(22px,7vw,110px)}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactGrid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(30px,5vw,90px);align-items:center}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactIntro>h2{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(43px,5vw,77px);line-height:1.08;letter-spacing:-.055em;color:#16364a;margin:18px 0 20px;max-width:14ch}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactIntro>h2 em{color:#477d99;font-weight:400}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactIntro>p{font-size:clamp(15px,1.1vw,18px);line-height:1.7;color:#576c7a;max-width:44ch}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactPhoto{position:relative;display:block;margin:29px 0 21px;aspect-ratio:1.55;overflow:hidden;border-radius:20px;background:#dce6e9;box-shadow:0 18px 40px #183e5514}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactPhoto img{width:100%;height:100%;object-fit:cover}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactPhoto figcaption{position:absolute;bottom:13px;right:13px;background:#102f43df;color:#fff;font-size:10px;padding:8px 11px;border-radius:7px}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactChannels{display:flex;gap:10px 22px;flex-wrap:wrap}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactChannels p{margin:0;font-size:13px;overflow-wrap:anywhere}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactChannels a{color:#215d80;font-weight:700;text-decoration:underline;text-underline-offset:4px}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium form{display:grid;gap:17px;background:#fff;border:1px solid #e0e8e9;border-radius:23px;padding:clamp(25px,3.5vw,50px);box-shadow:0 25px 65px #193d5014}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactFormHeading h3{font-family:Georgia,'Times New Roman',serif;font-size:clamp(27px,2.5vw,39px);line-height:1.2;font-weight:400;color:#17384d;margin:12px 0}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactFormHeading p{color:#657988;font-size:14px;margin:0 0 10px}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium form label{font-size:12px;color:#244357;gap:9px;font-weight:700}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium form input,.tp10m2[data-tp10-languages="true"] .contact--photo-premium form textarea{width:100%;background:#f8fafb;border:1px solid #d5e1e7;border-radius:10px;padding:16px;color:#16364a;font-size:15px;line-height:1.5}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium form button{background:#174666;border-radius:10px;padding:18px;color:#fff;font-size:14px;font-weight:700;cursor:pointer}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium form button:hover{background:#24658a}
.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactNoChannel{color:#86652e;font-size:12px;line-height:1.5;margin:0}
@media(max-width:850px){.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactGrid{grid-template-columns:1fr;gap:30px}.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactIntro>h2{max-width:17ch}}
@media(max-width:550px){.tp10m2[data-tp10-languages="true"] .contact--photo-premium .contactPhoto{aspect-ratio:1.35}.tp10m2[data-tp10-languages="true"] .contact--photo-premium form{padding:23px}}

/* TP10 M2 footer CTA heading repair: prevent orphan "O" and title crushing beside action. */
.tp10m2[data-tp10-languages="true"] .footer--language .footerNoBreak{white-space:nowrap}
.tp10m2[data-tp10-languages="true"] .footer--language .footerLead{grid-template-columns:minmax(0,1fr);justify-items:start;align-items:start;gap:25px}
.tp10m2[data-tp10-languages="true"] .footer--language .footerLeadCopy{min-width:0;width:100%}
.tp10m2[data-tp10-languages="true"] .footer--language .footerLead h2{font-size:clamp(39px,4.9vw,72px);max-width:22ch;text-wrap:pretty;overflow-wrap:normal}
@media(min-width:1350px){.tp10m2[data-tp10-languages="true"] .footer--language .footerLead{grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:45px}.tp10m2[data-tp10-languages="true"] .footer--language .footerLead h2{max-width:17ch}}
@media(max-width:560px){.tp10m2[data-tp10-languages="true"] .footer--language .footerLead h2{font-size:clamp(33px,8.5vw,44px);max-width:100%}}

/* TP10 M2 - Approved academic premium footer, Option 1 (only this component). */
.tp10m2[data-tp10-languages="true"] .footer--academic{position:relative;overflow:hidden;background:#0a1d2b;color:#f5f8f8;padding:0 clamp(22px,6.5vw,100px) 30px;border-top:4px solid #a0bbce}
.tp10m2[data-tp10-languages="true"] .footer--academic:before{content:"";position:absolute;width:440px;height:440px;right:-240px;top:-230px;border:1px solid #a8bdca25;border-radius:50%;pointer-events:none}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLead{position:relative;display:grid;grid-template-columns:minmax(0,1.5fr) minmax(245px,.65fr);align-items:end;gap:clamp(28px,5vw,85px);padding:clamp(65px,7vw,98px) 0 clamp(52px,6vw,86px);border-bottom:1px solid #ffffff2a}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadCopy{min-width:0}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadCopy>.eyebrow{font-size:11px;letter-spacing:.22em;color:#9ebed0;font-weight:800}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLead h2{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.04em;line-height:1.12;font-size:clamp(37px,4.4vw,67px);color:#fff;max-width:22ch;margin:22px 0;overflow-wrap:normal;text-wrap:pretty}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerNoBreak{white-space:nowrap}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLead h2 em{font-style:italic;font-weight:400;color:#b7d3df}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadCopy>p{font-size:clamp(14px,1.15vw,16px);line-height:1.7;max-width:46ch;color:#afc3cc;margin:0}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadAction{display:flex;flex-direction:column;align-items:stretch;gap:15px;min-width:0;padding-bottom:7px}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadActionLabel{color:#9fb8c7;font-size:10px;font-weight:800;letter-spacing:.19em}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerContactCta{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;min-height:60px;padding:15px 18px 15px 22px;background:#c5dfeb;color:#0b2b3b;font-size:14px;font-weight:800;border-radius:8px;white-space:normal;box-shadow:none;transition:background .2s,transform .2s}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerContactCta:hover{background:#e1f1f7;transform:translateY(-2px)}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerContactCta:focus-visible,.tp10m2[data-tp10-languages="true"] .footer--academic a:focus-visible{outline:2px solid #e0d3a5;outline-offset:4px}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerArrow{width:32px;height:32px;flex:0 0 32px;display:grid;place-items:center;color:#d6eff8;background:#173d55;border-radius:50%;font-size:18px}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadNote{color:#94aebc;font-size:12px;line-height:1.6}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerMain{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1.35fr) minmax(0,.8fr);gap:clamp(24px,4vw,70px);padding:clamp(45px,5vw,72px) 0;align-items:start}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerIdentity{min-width:0}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerBrandLink{display:flex;align-items:center;gap:12px;width:max-content;max-width:100%;color:#fff}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerBrandMark{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border:1px solid #7599aa80;border-radius:8px;color:#c5d6af;font-size:18px}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerIdentity strong{font-family:Georgia,'Times New Roman',serif;font-size:clamp(23px,2.1vw,32px);font-weight:400;line-height:1.15;overflow-wrap:anywhere;color:#fff}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerIdentity p{margin:15px 0 10px;font-size:14px;line-height:1.5;color:#c4d4dc}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerIdentityNote{display:block;color:#8daab8;font-size:12px;line-height:1.6}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerNav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(20px,2.5vw,40px);margin:0;padding:0;border:0}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerNavColumn,.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo{min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:13px}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerNavColumn>span,.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfoHeading{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#a7c1d1;font-weight:800;margin-bottom:10px}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerNav a,.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo a{display:block;font-size:13px;line-height:1.55;font-weight:500;color:#e5eff4;text-decoration:none;overflow-wrap:anywhere}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerNav a:hover,.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo a:hover{text-decoration:underline;text-underline-offset:4px}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo p{font-size:13px;color:#bfced7;line-height:1.6;overflow-wrap:anywhere;margin:0}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerBottom{margin:0;border-top:1px solid #ffffff2a;padding:23px 0 0;display:flex;align-items:center;justify-content:space-between;gap:15px 30px;flex-wrap:wrap;font-size:11px;color:#9db3c0}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerBottom a{color:#e5eef4;text-decoration:none;font-weight:700}
@media(max-width:1050px){.tp10m2[data-tp10-languages="true"] .footer--academic .footerLead{grid-template-columns:minmax(0,1fr);align-items:start;gap:25px}.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadAction{max-width:370px}.tp10m2[data-tp10-languages="true"] .footer--academic .footerMain{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:38px}.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo{grid-column:2}}
@media(max-width:650px){.tp10m2[data-tp10-languages="true"] .footer--academic{padding:0 22px 26px}.tp10m2[data-tp10-languages="true"] .footer--academic .footerLead{padding:55px 0 48px}.tp10m2[data-tp10-languages="true"] .footer--academic .footerLead h2{font-size:clamp(32px,8.3vw,44px);max-width:100%;line-height:1.16}.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadAction{max-width:none;width:100%}.tp10m2[data-tp10-languages="true"] .footer--academic .footerMain{grid-template-columns:minmax(0,1fr);gap:32px;padding:38px 0}.tp10m2[data-tp10-languages="true"] .footer--academic .footerNav{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo{grid-column:auto}.tp10m2[data-tp10-languages="true"] .footer--academic .footerBottom{align-items:flex-start}}

/* TP10 M2 approved academic footer visual regression fix:
   full-width heading, prominent CTA and legible, balanced column structure. */
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLead{
 display:flex;flex-direction:column;align-items:stretch;gap:clamp(26px,3.2vw,42px);
 padding:clamp(55px,6vw,82px) 0 clamp(40px,5vw,60px)
}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadCopy{width:100%;max-width:none}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLead h2{
 width:100%;max-width:none;font-size:clamp(35px,4vw,58px);line-height:1.12;
 margin:18px 0 22px;letter-spacing:-.035em;text-wrap:initial;overflow-wrap:normal
}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerHeadlineLine{display:block}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadCopy>p{max-width:65ch}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadAction{
 display:grid;grid-template-columns:minmax(0,1fr) minmax(290px,350px);
 grid-template-rows:auto auto;gap:4px clamp(16px,3vw,38px);
 align-items:center;max-width:none;width:100%;padding:23px clamp(20px,2.7vw,34px);
 border:1px solid #4770866e;border-radius:13px;background:#17344770
}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadActionLabel{
 grid-column:1;grid-row:1;align-self:end;font-size:11px
}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadNote{
 grid-column:1;grid-row:2;align-self:start;max-width:55ch;font-size:13px
}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerContactCta{
 grid-column:2;grid-row:1 / span 2;width:100%;max-width:none;min-width:0;
 min-height:66px;padding:16px 20px;font-size:15px;white-space:nowrap
}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerMain{
 display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1.25fr) minmax(0,.85fr);
 gap:clamp(25px,3vw,55px);padding:clamp(40px,4.5vw,58px) 0
}
.tp10m2[data-tp10-languages="true"] .footer--academic .footerNav a,
.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo a,
.tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo p{
 font-size:14px;line-height:1.6
}
@media(max-width:900px){
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerMain{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:32px}
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo{grid-column:1 / -1}
}
@media(max-width:700px){
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerLead h2{font-size:clamp(31px,7.4vw,43px);max-width:100%}
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadAction{grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto;gap:8px;padding:20px}
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadActionLabel{grid-row:1;grid-column:1}
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerLeadNote{grid-row:2;grid-column:1}
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerContactCta{grid-row:3;grid-column:1;margin-top:9px}
}
@media(max-width:560px){
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerMain{grid-template-columns:minmax(0,1fr);gap:28px}
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerInfo{grid-column:1}
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerLead h2{font-size:clamp(30px,8.1vw,39px)}
 .tp10m2[data-tp10-languages="true"] .footer--academic .footerNav{gap:16px}
}

/* User requested removal of entire footer CTA/hero banner circled in builder preview. */
.tp10m2[data-tp10-languages="true"] .footer--academic.footer--compact{
 padding-top:clamp(25px,3vw,45px);
 border-top:3px solid #7896a7;
}
.tp10m2[data-tp10-languages="true"] .footer--academic.footer--compact .footerMain{
 padding:clamp(24px,3vw,44px) 0 clamp(30px,4vw,50px);
}
@media(max-width:650px){
 .tp10m2[data-tp10-languages="true"] .footer--academic.footer--compact{
  padding-top:24px;
 }
}
`}

</style>
<header className="header"><a href="#tp10m2-home" className="brand">{brand}</a><button className="toggle" onClick={()=>setMenu(!menu)} aria-expanded={menu}>☰ Menu</button><nav className={"links"+(menu?" open":"")}><a href="#tp10m2-about" onClick={()=>setMenu(false)}>Instituição</a><a href="#tp10m2-courses" onClick={()=>setMenu(false)}>Programas</a><a href="#tp10m2-gallery" onClick={()=>setMenu(false)}>Experiências</a><a href="#tp10m2-contact" onClick={()=>setMenu(false)}>Contato</a>{languageM2&&<a href="#tp10m2-contact" className="headerCta" onClick={()=>setMenu(false)}>Conhecer matrículas ↗</a>}</nav></header>
<section className="hero" id="tp10m2-home"><div className="heroCopy"><span className="eyebrow">{languageM2?"IDIOMAS · NOVAS POSSIBILIDADES":"Modern Learning Experience"}</span><h1>{editedHeroTitle||p.focus}</h1><p>{editedHeroDescription||("Conheça "+brand+" e descubra possibilidades de aprendizagem em "+niche.toLowerCase()+".")}</p><div className="heroButtons"><a href="#tp10m2-courses" className="btn">{languageM2?"Conhecer nossos cursos ↗":"Explorar áreas de aprendizagem ↗"}</a><a href="#tp10m2-contact" className="btn secondary">{languageM2?"Falar sobre matrículas":"Fale com a instituição"}</a></div></div><div className="heroImage"><img src={editedHeroImage||img(images[0])} alt={"Fotografia ilustrativa de "+niche}/></div></section>
<section className="section about" id="tp10m2-about"><div className="aboutPhotos"><img src={img(images[1])} alt="Fotografia ilustrativa do universo de aprendizagem"/><img src={img(images[2])} alt="Fotografia ilustrativa de atividade de estudo"/></div><div className="aboutContent"><span className="eyebrow">01 / Sobre a instituição</span><h2>{languageM2?<>Mais que idiomas.<br/><em>Novas perspectivas.</em></>:<>Aprender é <em>transformar.</em></>}</h2><p>{languageM2?<>Na {brand}, aprender um novo idioma é descobrir maneiras de se comunicar, compartilhar experiências e ampliar horizontes. Conheça nossa proposta de ensino e encontre o caminho que combina com seus objetivos.</>:<>{brand} apresenta um universo de possibilidades ligadas a {niche.toLowerCase()}. Conheça a instituição e consulte diretamente suas atividades e propostas pedagógicas.</>}</p><a className="btn" href="#tp10m2-contact">{languageM2?"Converse com nossa equipe ↗":"Conheça mais ↗"}</a></div></section>
<UniversalTemplateSections site={site||{blocks:[]}} customSectionTheme={{background:"#eef4fa",color:"#132c48",accent:"#1d4c80"}}><section data-universal-section="cursos" className="section cards" id="tp10m2-courses"><div className="cardsHead"><div><span className="eyebrow">02 / Cursos e programas</span><h2>{languageM2?"Um idioma. Muitas possibilidades.":"Explore possibilidades."}</h2></div><p>{languageM2?(explicitOfferings.length?"Conheça as opções de aprendizado apresentadas pela instituição. Consulte disponibilidade e condições para matrícula.":"Explore experiências de aprendizagem. Confirme os cursos disponíveis diretamente com a instituição."):"Áreas ilustrativas relacionadas ao segmento. A oferta efetiva de cursos deve ser confirmada com a instituição."}</p></div><div className="courseGrid">{displayedCourses.map((card,i)=><article className="course" key={card.id}><img src={card.image||img(images[3+i]||images[3])} onError={fallback} alt={"Área de aprendizagem: "+card.title}/><div className="courseLabel"><small>0{i+1} / {languageM2?"CURSO E EXPERIÊNCIA":"ÁREA DE INTERESSE"}</small><h3>{card.title}</h3>{card.id.startsWith("universal-extra-card-")&&card.description&&<p style={{fontSize:14,lineHeight:1.5,color:"#fff",margin:"8px 0 0"}}>{card.description}</p>}</div></article>)}</div></section></UniversalTemplateSections>
<section className={"difference"+" difference--language"} id="tp10m2-difference">{languageM2?<><div className="differenceIntro"><span className="eyebrow">03 / Nossos diferenciais</span><h2>Uma forma mais humana de <em>aprender.</em></h2><p>O que faz uma experiência de aprendizado valer a pena? Conheça os diferenciais e confirme os detalhes diretamente com a instituição.</p></div><div className="differenceFeatures">{[{number:"01",symbol:"✦",title:"Professores experientes",description:"Orientação de profissionais que acompanham a jornada de aprendizagem."},{number:"02",symbol:"◈",title:"Turmas reduzidas",description:"Mais espaço para participar, praticar e tirar dúvidas."},{number:"03",symbol:"◎",title:"Metodologia prática",description:"Aprendizado voltado à comunicação e às situações do cotidiano."},{number:"04",symbol:"↗",title:"Atendimento personalizado",description:"Atenção aos objetivos e às necessidades de cada estudante."}].map(feature=><article className="differenceFeature" key={feature.number}><div className="differenceFeatureTop"><span className="differenceFeatureIcon" aria-hidden="true">{feature.symbol}</span><span className="differenceFeatureNumber">{feature.number}</span></div><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div></>:<div className="differenceBento"><div className="differenceBentoIntro"><span className="eyebrow">03 / Nossos diferenciais</span><h2>Conhecimento que abre <em>novos caminhos.</em></h2><p>Explore possibilidades de aprendizagem em {niche.toLowerCase()} e conheça a proposta da {brand}.</p></div><div className="differenceBentoGrid"><article className="differenceBentoPhoto differenceBentoLarge"><img src={readUniversalSectionPhoto(universalSectionImages,"differences",img(images[6]))} loading="lazy" alt={"Experiência de aprendizagem em "+niche}/><div><span>01 / EXPERIÊNCIAS</span><h3>Aprender é descobrir.</h3></div></article><article className="differenceBentoTile differenceBentoAccent"><span>02 / CONHECIMENTO</span><span className="differenceBentoGlyph" aria-hidden="true">✳</span><h3>Novas perspectivas.</h3><p>Conteúdos e experiências que ajudam a explorar interesses e desenvolver habilidades.</p></article><article className="differenceBentoTile"><span>03 / DESENVOLVIMENTO</span><span className="differenceBentoGlyph" aria-hidden="true">↗</span><h3>Evolução contínua.</h3><p>Uma jornada de descoberta, participação e desenvolvimento.</p></article><article className="differenceBentoPhoto"><img src={img(images[7])} loading="lazy" alt={"Atividades de formação em "+niche}/><div><span>04 / POSSIBILIDADES</span><h3>Seu próximo passo.</h3></div></article></div><p className="differenceBentoNote">Imagens e conceitos ilustrativos. Consulte a instituição sobre sua estrutura, metodologia e atividades disponíveis.</p></div>}</section>
<section className={"section"+" method--language"} id="tp10m2-method"><span className="eyebrow">04 / Metodologia</span><div className="methodHeading"><h2>Uma jornada de <em>aprendizagem.</em></h2>{languageM2&&<p>Do primeiro contato com o idioma à confiança para se comunicar: conheça uma jornada ilustrativa de aprendizagem.</p>}</div><div className="methodGrid">{(languageM2?[{title:"Conhecer",description:"Descubra seus objetivos e explore novas possibilidades de comunicação.",photo:"photo-1523240795612-9a054b0db644"},{title:"Praticar",description:"Amplie seu repertório por meio de atividades e situações de conversação.",photo:"photo-1521737711867-e3b97375f902"},{title:"Evoluir",description:"Continue desenvolvendo suas habilidades e sua confiança no idioma.",photo:"photo-1516321318423-f06f85e504b3"}]:["Conhecer","Experimentar","Evoluir"].map((title,i)=>({title,description:"Uma visão ilustrativa do processo de aprendizagem. Consulte a metodologia real da instituição.",photo:images[7+i]}))).map((step,i)=><article className="method" key={step.title}><div className="methodPhoto"><img src={img(step.photo)} loading="lazy" alt={"Fotografia ilustrativa da etapa "+step.title}/></div><div className="methodBody"><b>0{i+1}</b><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div>{languageM2&&<p className="methodDisclaimer">Etapas ilustrativas. Consulte a instituição para conhecer sua metodologia, modalidades e disponibilidade.</p>}</section>
<section className={"section gallery gallery--language gallery--bento"} id="tp10m2-gallery"><span className="eyebrow">05 / Ambientes e experiências</span><div className="galleryIntro"><h2>{languageM2?<>Descobertas que <em>aproximam.</em></>:<>Experiências que <em>inspiram.</em></>}</h2><p>{gallery.length?"Fotografias enviadas pela instituição e imagens ilustrativas complementares.":"Fotografias ilustrativas relacionadas ao universo educacional. Não representam necessariamente as instalações da instituição."}</p></div><div className="mosaic mosaic--bento">{(()=>{const stock=languageM2?["photo-1523240795612-9a054b0db644","photo-1521737711867-e3b97375f902","photo-1546410531-bb4caa6b424d","photo-1513258496099-48168024aec0","photo-1434030216411-0b793f4b4173","photo-1524178232363-1fb2b075b655"]:["photo-1523580494863-6f3031224c94","photo-1516321318423-f06f85e504b3","photo-1552664730-d307ca884978","photo-1531482615713-2afd69097998","photo-1521737711867-e3b97375f902","photo-1556761175-b413da4baf72"];const photos=[...new Set([...gallery.filter(src=>/^https:\/\//i.test(src)),...stock.map(img)])].slice(0,6);return photos.map((src,i)=><figure key={src+i} className={"mosaicBentoItem mosaicBentoItem--"+(i+1)}><img src={src} loading="lazy" onError={fallback} alt={(i<gallery.length?"Fotografia fornecida pela instituição: ":"Fotografia ilustrativa de aprendizagem: ")+(i+1)}/></figure>);})()}</div></section>
<section className="section reviews--language reviews--wall" id="tp10m2-reviews"><div className="reviewsWallHeading"><span className="eyebrow">06 / Vozes da comunidade</span><h2>{languageM2?<>Cada jornada tem uma <em>história.</em></>:"Histórias de aprendizagem."}</h2><p>{reviews.length?"Depoimentos compartilhados pela comunidade da instituição.":"Exemplos ilustrativos de apresentação. Substitua pelos depoimentos reais da instituição antes da divulgação."}</p></div><div className="reviewsWallGrid">{(()=>{const samples=[{name:"Mariana Oliveira",role:"Exemplo de aluna",quote:"As aulas me ajudaram a ganhar confiança para aprender coisas novas.",photo:"photo-1534528741775-53994a69daeb"},{name:"Lucas Ferreira",role:"Exemplo de aluno",quote:"A experiência de aprendizagem foi prática, acolhedora e motivadora.",photo:"photo-1500648767791-00dcc994a43e"},{name:"Camila Rodrigues",role:"Exemplo de aluna",quote:"Encontrei um ambiente que incentiva o desenvolvimento a cada etapa.",photo:"photo-1531123897727-8f129e1688ce"},{name:"Rafael Martins",role:"Exemplo de aluno",quote:"A organização das atividades tornou a rotina de estudos mais clara.",photo:"photo-1506794778202-cad84cf45f1d"},{name:"Juliana Costa",role:"Exemplo de aluna",quote:"Foi muito bom encontrar novas possibilidades de aprendizado.",photo:"photo-1544005313-94ddf0286df2"},{name:"André Almeida",role:"Exemplo de aluno",quote:"Os conteúdos me incentivaram a continuar evoluindo.",photo:"photo-1507003211169-0a1dd7228f2d"}];return Array.from({length:6},(_,i)=>{const real=reviews[i];const item=real||samples[i];const photo=real?.photo&&/^https:\/\//i.test(real.photo)?real.photo:img(samples[i].photo);return <article className="reviewsWallCard" key={i}><span className="reviewsWallQuote" aria-hidden="true">“</span><p className="reviewsWallText">{item.quote}</p><div className="reviewsWallPerson"><img src={photo} onError={fallback} loading="lazy" alt={real?"Fotografia do depoente "+item.name:"Retrato ilustrativo"}/><div><strong>{item.name}</strong><span>{real?(item.role||"Comunidade da instituição"):"Depoimento ilustrativo"}</span></div></div>{!real&&<span className="reviewsWallSample">EXEMPLO FICTÍCIO</span>}</article>})})()}</div></section>
<section className="section faq--language faq--editorial" id="tp10m2-faq"><div className="faqGrid"><div className="faqIntro"><span className="eyebrow">07 / Dúvidas frequentes</span><h2>{languageM2?<>Tudo o que você <em>precisa saber.</em></>:<>Informação para <em>decidir.</em></>}</h2><p>{faqs.length?"Encontre respostas sobre a instituição com base nas informações cadastradas.":"As respostas abaixo são orientações gerais. Consulte a instituição para confirmar informações específicas."}</p><a className="faqEditorialContact" href="#tp10m2-contact">Ainda tem dúvidas? Entre em contato <span aria-hidden="true">↗</span></a></div><div className="faqQuestions">{questions.map((q,i)=><div className="faqItem" key={i}><h3><button type="button" aria-expanded={open===i} aria-controls={"tp10m2-faq-answer-"+i} onClick={()=>setOpen(open===i?null:i)}><span className="faqNumber">{String(i+1).padStart(2,"0")}</span><span className="faqQuestionText">{q.question}</span><span className="faqToggle" aria-hidden="true">{open===i?"−":"+"}</span></button></h3>{open===i&&<div className="faqEditorialAnswer" id={"tp10m2-faq-answer-"+i} role="region"><p>{q.answer}</p></div>}</div>)}</div></div></section>
<section className="section contact contact--language contact--photo-premium" id="tp10m2-contact"><div className="contactGrid"><div className="contactIntro"><span className="eyebrow">08 / Contato e matrículas</span><h2>{languageM2?<>Seu próximo capítulo <em>começa aqui.</em></>:<>Comece uma <em>conversa.</em></>}</h2><p>Solicite informações sobre {niche.toLowerCase()} e consulte condições de matrícula diretamente com a instituição.</p><figure className="contactPhoto"><img src={img(p.photos[0]||images[0])} onError={fallback} loading="lazy" alt={"Fotografia ilustrativa relacionada a "+niche}/><figcaption>Fotografia ilustrativa</figcaption></figure><div className="contactChannels">{safePhone&&<p><a href={"https://wa.me/"+safePhone} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a></p>}{safeEmail&&<p><a href={"mailto:"+safeEmail}>{safeEmail}</a></p>}{address&&<p>{address}</p>}</div></div><form onSubmit={submit}><div className="contactFormHeading"><span className="eyebrow">Vamos conversar?</span><h3>Conte-nos o que você procura.</h3><p>Preencha seus dados para preparar uma mensagem para a instituição.</p></div><label>Nome<input name="name" required autoComplete="name" placeholder="Seu nome completo"/></label><label>Contato<input name="sender" required placeholder="E-mail ou telefone" autoComplete="email"/></label><label>Mensagem<textarea name="message" required rows={5} placeholder="Como podemos ajudar?"/></label><button type="submit">Preparar contato <span aria-hidden="true">↗</span></button>{!safePhone&&!safeEmail&&<p className="contactNoChannel">A instituição ainda não cadastrou um canal de contato para envio.</p>}{notice&&<p role="status">{notice}</p>}</form></div>{address?.trim()&&<div className="map"><iframe title={"Localização de "+brand} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={"https://www.google.com/maps?q="+encodeURIComponent(address)+"&output=embed"}/></div>}</section>
<footer className="footer footer--academic footer--compact" aria-label={"Rodapé de "+brand}>
<div className="footerMain">
 <div className="footerIdentity">
  <a className="footerBrandLink" href="#tp10m2-home" aria-label={"Voltar ao início - "+brand}><span className="footerBrandMark" aria-hidden="true">✦</span><strong>{brand}</strong></a>
  <p>{niche}</p>
  <span className="footerIdentityNote">Informações institucionais e de aprendizagem.</span>
 </div>
 <nav className="footerNav" aria-label="Navegação do rodapé">
  <div className="footerNavColumn"><span>Explore</span><a href="#tp10m2-home">Início</a><a href="#tp10m2-courses">Cursos e programas</a><a href="#tp10m2-reviews">Depoimentos</a></div>
  <div className="footerNavColumn"><span>Informações</span><a href="#tp10m2-faq">Dúvidas frequentes</a><a href="#tp10m2-contact">Contato e matrículas</a></div>
 </nav>
 <div className="footerInfo"><span className="footerInfoHeading">Contato</span>
  {safePhone&&<a href={"https://wa.me/"+safePhone} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}
  {safeEmail&&<a href={"mailto:"+safeEmail}>{safeEmail}</a>}
  {address?.trim()&&<p>{address}</p>}
  {!safePhone&&!safeEmail&&!address?.trim()&&<a href="#tp10m2-contact">Informações de contato</a>}
 </div>
</div>
<div className="footerBottom"><span>{brand} · {niche}</span><a href="#tp10m2-home">Voltar ao topo <span aria-hidden="true">↑</span></a></div>
</footer>
</main>;
}
