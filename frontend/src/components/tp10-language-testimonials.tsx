"use client";

type EducationReview={name:string;role?:string;quote:string;photo?:string};
type Props={reviews?:EducationReview[];publishedMode?:boolean;variant:"01"|"02"|"03";niche?:string;brand?:string};

export const isLanguageSchool=(niche:string,brand="")=>/(?:idiomas|language\s*school|escola\s+de\s+ingl[eê]s)/i.test(niche+" "+brand);

// Demonstration entries are always explicitly marked fictional, including on published pages.
const examples:EducationReview[]=[
 {name:"Mariana Oliveira",role:"Inglês para iniciantes",quote:"Gostei de encontrar as opções de cursos e entender como começar a estudar inglês.",photo:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Rafael Martins",role:"Conversação em inglês",quote:"As informações sobre conversação estão organizadas de forma clara e fácil de consultar.",photo:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Camila Rodrigues",role:"Espanhol",quote:"A apresentação das modalidades ajuda a visualizar possibilidades para estudar espanhol.",photo:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Lucas Ferreira",role:"Inglês para viagens",quote:"O conteúdo mostra como explorar um novo idioma pensando em viagens e experiências.",photo:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Beatriz Almeida",role:"Aulas online",quote:"Achei interessante poder conhecer as alternativas de aprendizado presencial e online.",photo:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"André Costa",role:"Inglês para negócios",quote:"A seção de cursos apresenta diferentes objetivos de estudo de um jeito acessível.",photo:"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=180&h=180&q=80"}
];

const generalExamples:EducationReview[]=[
 {name:"Mariana Oliveira",role:"Experiências de aprendizagem",quote:"Achei útil conhecer as propostas de formação e entender quais caminhos de estudo poderia explorar.",photo:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Rafael Martins",role:"Formação e desenvolvimento",quote:"As atividades foram apresentadas de forma clara, o que facilita descobrir oportunidades para desenvolver novas habilidades.",photo:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Camila Rodrigues",role:"Novos conhecimentos",quote:"Gostei da maneira como os conteúdos estão organizados. Ajuda a imaginar uma jornada de aprendizagem passo a passo.",photo:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Lucas Ferreira",role:"Aprendizado na prática",quote:"Ver diferentes áreas de interesse em um só lugar torna mais simples pensar no próximo passo da minha formação.",photo:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"Beatriz Almeida",role:"Vivências educativas",quote:"A apresentação das experiências e dos espaços despertou minha curiosidade para conhecer melhor as atividades.",photo:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=180&h=180&q=80"},
 {name:"André Costa",role:"Evolução nos estudos",quote:"Encontrei informações organizadas para entender as possibilidades e tirar dúvidas antes de buscar uma matrícula.",photo:"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=180&h=180&q=80"}
];

export function TP10LanguageTestimonials({reviews=[],publishedMode=false,variant,niche="",brand=""}:Props){
 const actual=reviews.filter(r=>!!r.name?.trim()&&!!r.quote?.trim()).slice(0,6);
 const demoCount=Math.max(0,6-actual.length);
 const nicheText=(niche+" "+brand).replace(/[-_]/g," ");
 const useLanguageExamples=variant!=="03"||isLanguageSchool(niche,brand)||/(?:idioma|ingl[eê]s|espanhol|franc[eê]s|alem[aã]o|italiano|l[ií]nguas|fluency|language|english)/i.test(nicheText);
 const demoExamples=useLanguageExamples?examples:generalExamples;
 const entries=[
  ...actual.map(r=>({...r,isDemo:false})),
  ...demoExamples.slice(0,demoCount).map(r=>({...r,isDemo:true}))
 ];
 return <div className={"tp10edu-six tp10edu-six--"+variant} data-edu-testimonial-count={entries.length}>
 <style>{`
 .tp10edu-six{--tr-bg:#fff;--tr-ink:#1b3041;--tr-muted:#546879;--tr-border:#d8e3e8;--tr-accent:#2c6aa1;--tr-shadow:#20354d10;font-family:Arial,Helvetica,sans-serif}
 .tp10edu-six *{box-sizing:border-box}
 .tp10edu-six-notice{margin:0 0 27px!important;max-width:850px;font-size:13px!important;line-height:1.6!important;color:var(--tr-muted)!important}
 .tp10edu-six-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(13px,1.7vw,22px);align-items:stretch}
 .tp10edu-six-card{min-width:0;display:flex;flex-direction:column;gap:0;padding:clamp(20px,2.15vw,30px);background:var(--tr-bg);border:1px solid var(--tr-border);border-radius:14px;box-shadow:0 10px 32px var(--tr-shadow)}
 .tp10edu-six-person{display:flex;gap:13px;align-items:center;margin-bottom:22px}
 .tp10edu-six-avatar{width:48px;height:48px;flex:0 0 48px;border-radius:50%;background:var(--tr-accent);color:#fff;display:grid;place-items:center;position:relative;overflow:hidden;font-size:15px;font-weight:800;letter-spacing:.05em}
 .tp10edu-six-avatar img{position:absolute;inset:0;width:100%!important;height:100%!important;object-fit:cover}
 .tp10edu-six-person strong{display:block;font-size:15px;font-weight:800;color:var(--tr-ink);line-height:1.3;overflow-wrap:break-word}
 .tp10edu-six-person span{display:block;margin-top:4px;font-size:12px;line-height:1.45;color:var(--tr-muted)}
 .tp10edu-six-card blockquote{flex:1;margin:0 0 23px!important;font-size:clamp(15px,1.22vw,18px)!important;font-weight:400!important;line-height:1.6!important;letter-spacing:0!important;color:var(--tr-ink)!important;overflow-wrap:break-word}
 .tp10edu-six-foot{padding-top:14px;border-top:1px solid var(--tr-border);font-size:10px!important;line-height:1.5!important;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--tr-accent)}
 .tp10edu-six-empty{padding:24px;border:1px solid var(--tr-border);border-radius:12px;color:var(--tr-muted);font-size:14px;line-height:1.6;max-width:720px}
 /* TP10 Model 1 only: approved Dark Premium testimonials. Keep all other variants unchanged. */
 .tp10edu-six--01{--tr-bg:#102a3d;--tr-ink:#f5fafb;--tr-muted:#b8cbd4;--tr-border:#ffffff20;--tr-accent:#b8f34a;--tr-shadow:#00000038;background:#061e2f;padding:clamp(22px,3vw,44px);border-radius:22px;color:#f5fafb}
 .tp10edu-six--01 .tp10edu-six-grid{gap:clamp(14px,1.8vw,24px)}
 .tp10edu-six--01 .tp10edu-six-card{border-radius:18px;background:linear-gradient(155deg,#143449,#0b293c);box-shadow:0 16px 36px #00121f35;transition:transform .2s ease,border-color .2s ease}
 .tp10edu-six--01 .tp10edu-six-card:hover{transform:translateY(-3px);border-color:#b8f34a70}
 .tp10edu-six--01 .tp10edu-six-avatar{background:#b8f34a;color:#082336;border:2px solid #b8f34a}
 .tp10edu-six--01 .tp10edu-six-person strong{color:#fff}
 .tp10edu-six--01 .tp10edu-six-person span{color:#bfd0da}
 .tp10edu-six--01 .tp10edu-six-card blockquote{color:#f5fafb!important}
 .tp10edu-six--01 .tp10edu-six-foot{color:#b8f34a;border-top-color:#ffffff24}
 .tp10edu-six--01 .tp10edu-six-notice{color:#c0d0d8!important}
 @media(max-width:560px){.tp10edu-six--01{padding:16px;border-radius:16px}.tp10edu-six--01 .tp10edu-six-card{border-radius:14px}}
 /* TP10 Model 2 only: approved Dark Premium testimonials. Model 1 and 3 unchanged. */
 .tp10edu-six--02{--tr-bg:#12324a;--tr-ink:#f5f9fb;--tr-muted:#b8cbd8;--tr-border:#ffffff24;--tr-accent:#8dc7e0;--tr-shadow:#00121e35;background:#081e30;padding:clamp(22px,3vw,45px);border-radius:18px;color:#f5f9fb}
 .tp10edu-six--02 .tp10edu-six-notice{color:#b9cdd9!important;font-size:13px!important;max-width:800px}
 .tp10edu-six--02 .tp10edu-six-grid{gap:clamp(14px,1.8vw,25px)}
 .tp10edu-six--02 .tp10edu-six-card{background:linear-gradient(145deg,#173a54,#102c42);border-color:#ffffff23;border-radius:14px;box-shadow:0 18px 40px #00101d42;padding:clamp(23px,2.3vw,34px);transition:transform .2s ease,border-color .2s ease}
 .tp10edu-six--02 .tp10edu-six-card:hover{transform:translateY(-3px);border-color:#91c7df77}
 .tp10edu-six--02 .tp10edu-six-person{margin-bottom:24px}
 .tp10edu-six--02 .tp10edu-six-avatar{width:55px;height:55px;flex-basis:55px;border:2px solid #9bcce1;background:#d7edf5;color:#103047}
 .tp10edu-six--02 .tp10edu-six-person strong{font-size:clamp(15px,1.15vw,18px);color:#fff}
 .tp10edu-six--02 .tp10edu-six-person span{color:#c0d2dd;font-size:12px}
 .tp10edu-six--02 .tp10edu-six-card blockquote{font-family:Georgia,'Times New Roman',serif;font-size:clamp(17px,1.4vw,21px)!important;line-height:1.65!important;color:#f6fafc!important}
 .tp10edu-six--02 .tp10edu-six-foot{border-top-color:#ffffff24;color:#a8d6ea;font-size:10px!important}
 @media(max-width:560px){.tp10edu-six--02{padding:15px;border-radius:14px}.tp10edu-six--02 .tp10edu-six-card{padding:23px}.tp10edu-six--02 .tp10edu-six-card blockquote{font-size:18px!important}}
 .tp10edu-six--03{--tr-bg:#fff7ed;--tr-ink:#221d20;--tr-muted:#67585a;--tr-border:#25202a;--tr-accent:#a43d2b;--tr-shadow:#221d2010}
 .tp10edu-six--03 .tp10edu-six-card{border-radius:5px;box-shadow:5px 6px 0 #211c2340}
 .tp10edu-six--03 .tp10edu-six-avatar{background:#ffbd66;color:#251923}
/* TP10 Model 3 only — Option 1, editorial portrait testimonials. Preserve M1/M2. */
 .tp10edu-six--03{--tr-bg:#fffdfa;--tr-ink:#252027;--tr-muted:#665b60;--tr-border:#e7d7c9;--tr-accent:#a94736;--tr-shadow:#38281b13;background:transparent;padding:0}
 .tp10edu-six--03 .tp10edu-six-notice{color:#65575c!important;max-width:880px;margin:0 0 26px!important;font-size:13px!important}
 .tp10edu-six--03 .tp10edu-six-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(14px,1.65vw,23px);align-items:stretch}
 .tp10edu-six--03 .tp10edu-six-card{display:grid;grid-template-columns:clamp(86px,8vw,120px) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;column-gap:clamp(13px,1.5vw,22px);min-width:0;min-height:292px;padding:clamp(17px,1.7vw,26px);border:1px solid #e7d7c9;border-radius:19px;background:#fffdfa;box-shadow:0 14px 38px #38281b13;transition:transform .23s ease,box-shadow .23s ease,border-color .23s ease}
 @media(hover:hover){.tp10edu-six--03 .tp10edu-six-card:hover{transform:translateY(-4px);border-color:#d9bba9;box-shadow:0 21px 43px #38281b21}}
 .tp10edu-six--03 .tp10edu-six-person{display:contents}
 .tp10edu-six--03 .tp10edu-six-avatar{grid-column:1;grid-row:1 / span 3;align-self:stretch;width:100%;height:100%;min-height:237px;min-width:0;flex:none;border:0;border-radius:11px;background:linear-gradient(145deg,#e9b69a,#b65742);font-size:25px;color:#fff;overflow:hidden}
 .tp10edu-six--03 .tp10edu-six-avatar img{width:100%!important;height:100%!important;object-fit:cover;object-position:center;filter:none}
 .tp10edu-six--03 .tp10edu-six-person>div:last-child{grid-column:2;grid-row:1;min-width:0;align-self:start;padding:2px 0 18px}
 .tp10edu-six--03 .tp10edu-six-person strong{font-size:clamp(15px,1.2vw,18px);line-height:1.27;color:#252027;letter-spacing:-.02em;overflow-wrap:break-word}
 .tp10edu-six--03 .tp10edu-six-person span{font-size:11px;line-height:1.5;color:#795f61;margin-top:7px}
 .tp10edu-six--03 .tp10edu-six-card blockquote{grid-column:2;grid-row:2;min-width:0;margin:0 0 17px!important;font-size:clamp(14px,1.08vw,17px)!important;line-height:1.68!important;letter-spacing:0!important;color:#393036!important;font-family:Georgia,'Times New Roman',serif;font-weight:400!important;overflow-wrap:break-word}
 .tp10edu-six--03 .tp10edu-six-foot{grid-column:2;grid-row:3;min-width:0;margin:0;padding-top:13px;border-top:1px solid #e9d9cf;color:#a94736;font-size:9px!important;line-height:1.5!important;letter-spacing:.045em;overflow-wrap:break-word}
 @media(max-width:1080px){.tp10edu-six--03 .tp10edu-six-card{grid-template-columns:80px minmax(0,1fr);min-height:278px;column-gap:12px;padding:18px}.tp10edu-six--03 .tp10edu-six-avatar{min-height:232px}}
 @media(max-width:900px){.tp10edu-six--03 .tp10edu-six-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.tp10edu-six--03 .tp10edu-six-card{grid-template-columns:100px minmax(0,1fr);min-height:255px}.tp10edu-six--03 .tp10edu-six-avatar{min-height:215px}}
 @media(max-width:560px){.tp10edu-six--03 .tp10edu-six-grid{grid-template-columns:1fr;gap:16px}.tp10edu-six--03 .tp10edu-six-card{grid-template-columns:clamp(82px,25vw,110px) minmax(0,1fr);min-height:225px;column-gap:15px;padding:17px;border-radius:15px}.tp10edu-six--03 .tp10edu-six-avatar{min-height:190px;border-radius:9px}.tp10edu-six--03 .tp10edu-six-person>div:last-child{padding-bottom:12px}.tp10edu-six--03 .tp10edu-six-card blockquote{font-size:15px!important;line-height:1.58!important;margin-bottom:13px!important}.tp10edu-six--03 .tp10edu-six-foot{font-size:9px!important;padding-top:11px}}
 @media(max-width:365px){.tp10edu-six--03 .tp10edu-six-card{grid-template-columns:72px minmax(0,1fr);column-gap:12px;padding:14px}.tp10edu-six--03 .tp10edu-six-avatar{min-height:188px}}
 @media(prefers-reduced-motion:reduce){.tp10edu-six--03 .tp10edu-six-card{transition:none}}
 @media(max-width:900px){.tp10edu-six-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:560px){.tp10edu-six-grid{grid-template-columns:1fr;gap:14px}.tp10edu-six-card{padding:22px}.tp10edu-six-person{margin-bottom:16px}.tp10edu-six-card blockquote{font-size:16px!important;margin-bottom:19px!important}}
 `}</style>
 {demoCount>0&&<p className="tp10edu-six-notice">{publishedMode?"DEMONSTRAÇÃO FICTÍCIA — Os nomes, as fotos e os relatos abaixo são exemplos de layout, não representam alunos nem avaliações reais. Substitua-os por depoimentos verificados.":"Exemplos fictícios para demonstrar o layout. As fotos, os nomes e os comentários não representam alunos nem avaliações reais."}</p>}
 {entries.length?<div className="tp10edu-six-grid">{entries.map((r,i)=><article className="tp10edu-six-card" key={r.name+"-"+i}><div className="tp10edu-six-person"><div className="tp10edu-six-avatar" aria-label={r.isDemo?"Retrato ilustrativo":"Identificação do aluno"}>{r.name.split(/\s+/).slice(0,2).map(w=>w[0]||"").join("")}{r.photo&&<img src={variant==="03"&&r.isDemo?r.photo.replace("w=180&h=180","w=480&h=680"):r.photo} loading="lazy" alt={r.isDemo?"Retrato ilustrativo fictício":"Foto fornecida de "+r.name} onError={e=>{e.currentTarget.style.display="none"}}/>}</div><div><strong>{r.name}</strong>{r.role&&<span>{r.role}</span>}</div></div><blockquote>“{r.quote}”</blockquote><div className="tp10edu-six-foot">{r.isDemo?"Exemplo fictício · Não é aluno real":"Depoimento cadastrado"}</div></article>)}</div>:<div className="tp10edu-six-empty">Depoimentos reais serão exibidos quando forem cadastrados pela instituição.</div>}
 </div>;
}
