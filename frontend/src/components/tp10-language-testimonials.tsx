"use client";

type EducationReview={name:string;role?:string;quote:string;photo?:string};
type Props={reviews?:EducationReview[];publishedMode?:boolean;variant:"01"|"02"|"03"};

export const isLanguageSchool=(niche:string,brand="")=>/(?:idiomas|language\s*school|escola\s+de\s+ingl[eê]s)/i.test(niche+" "+brand);

// Demonstration content is never published as a real student statement.
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
 const demoCount=publishedMode?0:Math.max(0,6-actual.length);
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
 .tp10edu-six--01{--tr-bg:#244b43;--tr-ink:#f8faf5;--tr-muted:#bfd4c9;--tr-border:#ffffff3c;--tr-accent:#b9e1c9;--tr-shadow:#061f192a}
 .tp10edu-six--01 .tp10edu-six-avatar{background:#e4efe4;color:#234b43}
 .tp10edu-six--01 .tp10edu-six-notice{color:#d0e0d7!important}
 .tp10edu-six--02{--tr-bg:#fff;--tr-ink:#172d48;--tr-muted:#5e7182;--tr-border:#d5e3ef;--tr-accent:#1c66a4;--tr-shadow:#15354b10}
 .tp10edu-six--03{--tr-bg:#fff7ed;--tr-ink:#221d20;--tr-muted:#67585a;--tr-border:#25202a;--tr-accent:#a43d2b;--tr-shadow:#221d2010}
 .tp10edu-six--03 .tp10edu-six-card{border-radius:5px;box-shadow:5px 6px 0 #211c2340}
 .tp10edu-six--03 .tp10edu-six-avatar{background:#ffbd66;color:#251923}
 @media(max-width:900px){.tp10edu-six-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:560px){.tp10edu-six-grid{grid-template-columns:1fr;gap:14px}.tp10edu-six-card{padding:22px}.tp10edu-six-person{margin-bottom:16px}.tp10edu-six-card blockquote{font-size:16px!important;margin-bottom:19px!important}}
 `}</style>
 {demoCount>0&&<p className="tp10edu-six-notice">Exemplos fictícios para demonstrar o layout. As fotos, os nomes e os comentários não representam alunos nem avaliações reais.</p>}
 {entries.length?<div className="tp10edu-six-grid">{entries.map((r,i)=><article className="tp10edu-six-card" key={r.name+"-"+i}><div className="tp10edu-six-person"><div className="tp10edu-six-avatar" aria-label={r.isDemo?"Retrato ilustrativo":"Identificação do aluno"}>{r.name.split(/\s+/).slice(0,2).map(w=>w[0]||"").join("")}{r.photo&&<img src={r.photo} loading="lazy" alt={r.isDemo?"Retrato ilustrativo fictício":"Foto fornecida de "+r.name} onError={e=>{e.currentTarget.style.display="none"}}/>}</div><div><strong>{r.name}</strong>{r.role&&<span>{r.role}</span>}</div></div><blockquote>“{r.quote}”</blockquote><div className="tp10edu-six-foot">{r.isDemo?"Exemplo fictício · Não é aluno real":"Depoimento cadastrado"}</div></article>)}</div>:<div className="tp10edu-six-empty">Depoimentos reais serão exibidos quando forem cadastrados pela instituição.</div>}
 </div>;
}
