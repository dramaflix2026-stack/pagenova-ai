"use client";

type EducationReview={name:string;role?:string;quote:string;photo?:string};
type Props={reviews?:EducationReview[];publishedMode?:boolean;variant:"01"|"02"|"03"};

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

export function TP10LanguageTestimonials({reviews=[],publishedMode=false,variant}:Props){
 const actual=reviews.filter(r=>!!r.name?.trim()&&!!r.quote?.trim()).slice(0,6);
 const demoCount=Math.max(0,6-actual.length);
 const entries=[
  ...actual.map(r=>({...r,isDemo:false})),
  ...examples.slice(0,demoCount).map(r=>({...r,isDemo:true}))
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
/* Approved TP10 Model 3 Editorial Premium testimonials only. */
 .tp10edu-six--03{--tr-bg:#fffdf9;--tr-ink:#242026;--tr-muted:#62585d;--tr-border:#e5d7ca;--tr-accent:#ad4b39;--tr-shadow:#38281b12;background:transparent;padding:0}
 .tp10edu-six--03 .tp10edu-six-notice{color:#62585d!important;max-width:900px;margin:0 0 24px!important;font-size:13px!important}
 .tp10edu-six--03 .tp10edu-six-grid{gap:clamp(14px,1.8vw,24px)}
 .tp10edu-six--03 .tp10edu-six-card{border:1px solid #e5d7ca;border-radius:16px;background:#fffdf9;box-shadow:0 12px 32px #38281b12;padding:clamp(22px,2.2vw,32px);transition:transform .2s ease,box-shadow .2s ease}
 .tp10edu-six--03 .tp10edu-six-card:hover{transform:translateY(-3px);box-shadow:0 18px 38px #38281b1b}
 .tp10edu-six--03 .tp10edu-six-person{margin-bottom:21px}
 .tp10edu-six--03 .tp10edu-six-avatar{width:54px;height:54px;flex-basis:54px;border:2px solid #f1d5c1;background:#ffbd66;color:#251923}
 .tp10edu-six--03 .tp10edu-six-person strong{font-size:clamp(15px,1.15vw,18px);color:#242026}
 .tp10edu-six--03 .tp10edu-six-person span{font-size:12px;color:#67585a}
 .tp10edu-six--03 .tp10edu-six-card blockquote{font-size:clamp(16px,1.25vw,19px)!important;line-height:1.7!important;color:#342d31!important}
 .tp10edu-six--03 .tp10edu-six-foot{border-top-color:#e9dbcf;color:#a43d2b;font-size:10px!important}
 @media(max-width:560px){.tp10edu-six--03 .tp10edu-six-grid{gap:15px}.tp10edu-six--03 .tp10edu-six-card{padding:23px;border-radius:14px}.tp10edu-six--03 .tp10edu-six-card blockquote{font-size:16px!important}}
 @media(max-width:900px){.tp10edu-six-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:560px){.tp10edu-six-grid{grid-template-columns:1fr;gap:14px}.tp10edu-six-card{padding:22px}.tp10edu-six-person{margin-bottom:16px}.tp10edu-six-card blockquote{font-size:16px!important;margin-bottom:19px!important}}
 `}</style>
 {demoCount>0&&<p className="tp10edu-six-notice">{publishedMode?"DEMONSTRAÇÃO FICTÍCIA — Os nomes, as fotos e os relatos abaixo são exemplos de layout, não representam alunos nem avaliações reais. Substitua-os por depoimentos verificados.":"Exemplos fictícios para demonstrar o layout. As fotos, os nomes e os comentários não representam alunos nem avaliações reais."}</p>}
 {entries.length?<div className="tp10edu-six-grid">{entries.map((r,i)=><article className="tp10edu-six-card" key={r.name+"-"+i}><div className="tp10edu-six-person"><div className="tp10edu-six-avatar" aria-label={r.isDemo?"Retrato ilustrativo":"Identificação do aluno"}>{r.name.split(/\s+/).slice(0,2).map(w=>w[0]||"").join("")}{r.photo&&<img src={r.photo} loading="lazy" alt={r.isDemo?"Retrato ilustrativo fictício":"Foto fornecida de "+r.name} onError={e=>{e.currentTarget.style.display="none"}}/>}</div><div><strong>{r.name}</strong>{r.role&&<span>{r.role}</span>}</div></div><blockquote>“{r.quote}”</blockquote><div className="tp10edu-six-foot">{r.isDemo?"Exemplo fictício · Não é aluno real":"Depoimento cadastrado"}</div></article>)}</div>:<div className="tp10edu-six-empty">Depoimentos reais serão exibidos quando forem cadastrados pela instituição.</div>}
 </div>;
}
