"use client";

import {useEffect,useRef,useState,type SyntheticEvent} from "react";
import {ArrowLeft,ArrowRight,Expand,X} from "lucide-react";

type Photo={id:string;title:string;description:string;alt:string;credit:string};
const photos:Photo[]=[
 {id:"TCg8r4Z5Wu0",title:"Rotina de oficina",description:"Ambiente de manutenção automotiva",alt:"Fotografia ilustrativa de carro sendo trabalhado em uma garagem",credit:"Frankie Cordoba"},
 {id:"wacb2ChxA4k",title:"Revisão e manutenção",description:"Cuidados e inspeção do veículo",alt:"Fotografia ilustrativa de carro sob manutenção em oficina",credit:"Connor Botts"},
 {id:"5SH7iAdcyrg",title:"Trabalho no motor",description:"Avaliação de sistemas mecânicos",alt:"Fotografia ilustrativa de mecânico trabalhando no motor de um carro",credit:"uma dantara"},
 {id:"wtXnp09Q86w",title:"Cuidados automotivos",description:"Oficina em atividade",alt:"Fotografia ilustrativa de veículo em manutenção numa garagem",credit:"Lorenzo Hamers"},
 {id:"KhF58h0hTbc",title:"Inspeção profissional",description:"Atenção ao funcionamento do veículo",alt:"Fotografia ilustrativa de profissional trabalhando em máquina e carro dentro de oficina",credit:"Kato Blackmore"},
 {id:"WbKt-WmdMf8",title:"Técnica e precisão",description:"Acompanhamento das etapas de manutenção",alt:"Fotografia ilustrativa de mecânico trabalhando em automóveis dentro de oficina escura",credit:"Lorenzo Fustaino"}
];
const photoUrl=(id:string,w:number)=>"https://unsplash.com/photos/"+id+"/download?force=true&w="+w;
const fallback="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=85";
const onError=(event:SyntheticEvent<HTMLImageElement>)=>{
 const img=event.currentTarget;
 if(img.src!==fallback)img.src=fallback;
};

export function TP9VerticeM2BentoGallery(){
 const [selected,setSelected]=useState<number|null>(null);
 const activeButton=useRef<HTMLButtonElement|null>(null);
 const triggers=useRef<(HTMLButtonElement|null)[]>([]);
 const close=()=>{
  setSelected(current=>{
   if(current!==null)activeButton.current=triggers.current[current]||null;
   return null;
  });
 };
 const navigate=(delta:number)=>setSelected(current=>current===null?0:(current+delta+photos.length)%photos.length);
 useEffect(()=>{
  if(selected===null){
   activeButton.current?.focus();
   activeButton.current=null;
   return;
  }
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();close();}
   if(event.key==="ArrowLeft"){event.preventDefault();navigate(-1);}
   if(event.key==="ArrowRight"){event.preventDefault();navigate(1);}
   if(event.key==="Tab"){
    const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>(".tp9m2vg-lightbox button:not([disabled])"));
    const first=buttons[0],last=buttons[buttons.length-1];
    if(first&&last){
     if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
     if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
   }
  };
  document.addEventListener("keydown",onKeyDown);
  return ()=>{
   document.body.style.overflow=oldOverflow;
   document.removeEventListener("keydown",onKeyDown);
  };
 },[selected]);
 const opened=selected===null?null:photos[selected];
 return <section className="tp9m2vg-section" id="tp9-galeria" aria-labelledby="tp9m2vg-heading">
  <style>{`
  .tp9m2-showcase .tp9m2vg-section{--vg-gold:#d0aa70;background:#0b0e0c;color:#f8f7f4;width:100%;max-width:100%;overflow-x:clip;padding:clamp(76px,8vw,130px) clamp(22px,7vw,115px);font-family:Arial,Helvetica,sans-serif}
  .tp9m2-showcase .tp9m2vg-section *{box-sizing:border-box}
  .tp9m2-showcase .tp9m2vg-section .vg-shell{max-width:1430px;margin:0 auto}
  .tp9m2-showcase .tp9m2vg-section .vg-heading{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:36px}
  .tp9m2-showcase .tp9m2vg-section .vg-eyebrow{margin:0 0 18px;display:flex;align-items:center;gap:12px;font-size:11px;font-weight:900;letter-spacing:.2em;color:var(--vg-gold);text-transform:uppercase}
  .tp9m2-showcase .tp9m2vg-section .vg-eyebrow:before{content:"";width:30px;height:2px;background:var(--vg-gold)}
  .tp9m2-showcase .tp9m2vg-section h2.vg-title{font:900 clamp(40px,5vw,75px)/1.075 Arial,Helvetica,sans-serif;letter-spacing:-.055em;text-transform:uppercase;margin:0;color:#fff;text-wrap:balance;max-width:760px}
  .tp9m2-showcase .tp9m2vg-section h2.vg-title em{font-style:normal;color:var(--vg-gold)}
  .tp9m2-showcase .tp9m2vg-section .vg-description{max-width:410px;color:#c4ccc5;line-height:1.75;font-size:clamp(14px,1.2vw,17px);margin:0}
  .tp9m2-showcase .tp9m2vg-section .vg-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:clamp(95px,9vw,138px);gap:16px;grid-auto-flow:row dense}
  .tp9m2-showcase .tp9m2vg-section .vg-tile{display:block;appearance:none;min-width:0;min-height:0;width:100%;position:relative;isolation:isolate;overflow:hidden;padding:0;border:1px solid #ffffff26;background:#1f2723;color:#fff;text-align:left;border-radius:12px;cursor:zoom-in;transition:transform .25s,border-color .25s}
  .tp9m2-showcase .tp9m2vg-section .vg-tile:hover{transform:translateY(-3px);border-color:#d0aa70b8}
  .tp9m2-showcase .tp9m2vg-section .vg-tile:nth-child(1){grid-column:span 7;grid-row:span 3}
  .tp9m2-showcase .tp9m2vg-section .vg-tile:nth-child(2){grid-column:span 5;grid-row:span 3}
  .tp9m2-showcase .tp9m2vg-section .vg-tile:nth-child(n+3){grid-column:span 6;grid-row:span 2}
  .tp9m2-showcase .tp9m2vg-section .vg-tile img{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:contrast(1.06) saturate(.85) brightness(.86);transition:transform .4s;z-index:-2}
  .tp9m2-showcase .tp9m2vg-section .vg-tile:hover img{transform:scale(1.045)}
  .tp9m2-showcase .tp9m2vg-section .vg-tile:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,#070c09ed 0%,#070c090a 65%);pointer-events:none}
  .tp9m2-showcase .tp9m2vg-section .vg-index{position:absolute;top:19px;left:19px;border:1px solid #d0aa7094;background:#0c1310c9;color:#e7c996;border-radius:6px;padding:8px 11px;font-size:11px;font-weight:900;letter-spacing:.08em}
  .tp9m2-showcase .tp9m2vg-section .vg-expand{position:absolute;top:17px;right:17px;display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:7px;background:var(--vg-gold);color:#141816}
  .tp9m2-showcase .tp9m2vg-section .vg-caption{display:block;position:absolute;left:clamp(20px,3vw,33px);right:20px;bottom:clamp(18px,3vw,32px)}
  .tp9m2-showcase .tp9m2vg-section .vg-caption strong{display:block;color:#fff;font:850 clamp(18px,2vw,28px)/1.2 Arial,Helvetica,sans-serif;letter-spacing:-.025em}
  .tp9m2-showcase .tp9m2vg-section .vg-caption small{display:block;font-size:13px;color:#e1e7df;margin-top:8px;line-height:1.5}
  .tp9m2-showcase .tp9m2vg-section .vg-note{margin:27px 0 0;padding-top:21px;border-top:1px solid #ffffff26;color:#aebbb0;font-size:12px;line-height:1.65}
  .tp9m2-showcase .tp9m2vg-section button:focus-visible{outline:3px solid #f2ce93;outline-offset:4px}
  .tp9m2vg-lightbox{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:clamp(15px,3vw,45px);background:#040807ed;backdrop-filter:blur(8px)}
  .tp9m2vg-lightbox *{box-sizing:border-box}
  .tp9m2vg-lightbox .vg-dialog{width:min(1220px,100%);max-height:97vh;display:flex;flex-direction:column;gap:14px;color:#fff}
  .tp9m2vg-lightbox .vg-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:18px}
  .tp9m2vg-lightbox .vg-dialog-head h3{font:850 clamp(17px,2.4vw,25px)/1.25 Arial,Helvetica,sans-serif;margin:0;color:#fff}
  .tp9m2vg-lightbox button{appearance:none;display:inline-flex;align-items:center;justify-content:center;min-width:48px;min-height:48px;padding:10px;border:1px solid #ffffff65;background:#17201c;border-radius:8px;color:#fff;cursor:pointer}
  .tp9m2vg-lightbox button:hover{background:#2a352d;border-color:#d0aa70}
  .tp9m2vg-lightbox button:focus-visible{outline:3px solid #efcc91;outline-offset:4px}
  .tp9m2vg-lightbox .vg-light-photo{display:block;max-height:min(73vh,890px);width:100%;min-height:160px;object-fit:contain;background:#141b16;border-radius:9px}
  .tp9m2vg-lightbox .vg-dialog-bottom{display:flex;justify-content:space-between;align-items:center;gap:20px}
  .tp9m2vg-lightbox .vg-credit{font-size:12px;color:#cbd5cc;line-height:1.55}
  .tp9m2vg-lightbox .vg-controls{display:flex;align-items:center;gap:10px}
  .tp9m2vg-lightbox .vg-counter{font-size:12px;color:#d0aa70;font-weight:900;white-space:nowrap}
  @media(max-width:900px){.tp9m2-showcase .tp9m2vg-section .vg-grid{gap:11px;grid-auto-rows:115px}.tp9m2-showcase .tp9m2vg-section .vg-heading{flex-direction:column;align-items:flex-start;gap:18px}.tp9m2-showcase .tp9m2vg-section .vg-description{max-width:760px}}
  @media(max-width:640px){.tp9m2-showcase .tp9m2vg-section .vg-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:auto;gap:14px}.tp9m2-showcase .tp9m2vg-section .vg-tile:nth-child(n){grid-column:span 2;grid-row:auto;aspect-ratio:1.33;min-height:250px}.tp9m2-showcase .tp9m2vg-section .vg-tile:nth-child(n+3){aspect-ratio:1.4;min-height:230px}.tp9m2-showcase .tp9m2vg-section .vg-tile img{height:100%}.tp9m2-showcase .tp9m2vg-section .vg-caption strong{font-size:20px}.tp9m2vg-lightbox .vg-light-photo{max-height:66vh}}
  @media(max-width:520px){.tp9m2-showcase .tp9m2vg-section{padding:65px 20px}.tp9m2-showcase .tp9m2vg-section h2.vg-title{font-size:clamp(35px,10vw,54px)}.tp9m2-showcase .tp9m2vg-section .vg-grid{gap:12px}.tp9m2vg-lightbox .vg-credit{font-size:11px}}
  @media(prefers-reduced-motion:reduce){.tp9m2-showcase .tp9m2vg-section :is(.vg-tile,.vg-tile img){transition:none}}
  `}</style>
  <div className="vg-shell">
   <div className="vg-heading"><div><p className="vg-eyebrow">05 / Galeria automotiva</p><h2 id="tp9m2vg-heading" className="vg-title">Precisão em <em>cada detalhe.</em></h2></div><p className="vg-description">Imagens ilustrativas de oficinas e manutenção automotiva. Toque nas fotos para ampliar.</p></div>
   <div className="vg-grid">{photos.map((photo,index)=><button className="vg-tile" type="button" key={photo.id} ref={node=>{triggers.current[index]=node;}} aria-label={"Ampliar fotografia "+(index+1)+": "+photo.title} onClick={()=>{activeButton.current=triggers.current[index];setSelected(index);}}>
    <img loading="lazy" decoding="async" src={photoUrl(photo.id,1100)} alt={photo.alt} onError={onError}/>
    <span className="vg-index">{String(index+1).padStart(2,"0")}</span><span className="vg-expand" aria-hidden="true"><Expand size={19}/></span>
    <span className="vg-caption"><strong>{photo.title}</strong><small>{photo.description}</small></span>
   </button>)}</div>
   <p className="vg-note">Fotografias ilustrativas de terceiros, disponíveis no Unsplash. Não representam projetos executados nem instalações da Vértice Auto Center.</p>
  </div>
  {opened&&<div className="tp9m2vg-lightbox" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)close();}}>
    <div className="vg-dialog" role="dialog" aria-modal="true" aria-label={"Galeria ampliada: "+opened.title} aria-describedby="tp9m2vg-counter">
     <div className="vg-dialog-head"><h3>{opened.title}</h3><button type="button" aria-label="Fechar fotografia ampliada" onClick={close}><X size={21}/></button></div>
     <img className="vg-light-photo" key={opened.id} src={photoUrl(opened.id,1900)} alt={opened.alt} onError={onError}/>
     <div className="vg-dialog-bottom"><span className="vg-credit">Fotografia ilustrativa · {opened.credit} / Unsplash</span>
      <div className="vg-controls"><button type="button" aria-label="Fotografia anterior" onClick={()=>navigate(-1)}><ArrowLeft size={20}/></button><span className="vg-counter" id="tp9m2vg-counter">{String((selected??0)+1).padStart(2,"0")} / 06</span><button type="button" aria-label="Próxima fotografia" onClick={()=>navigate(1)}><ArrowRight size={20}/></button></div>
     </div>
    </div>
   </div>}
 </section>;
}
