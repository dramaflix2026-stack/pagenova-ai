"use client";

import {useEffect,useRef,useState,type SyntheticEvent} from "react";
import {ArrowLeft,ArrowRight,Expand,Images,X} from "lucide-react";

type GalleryPhoto={id:string;title:string;detail:string;alt:string;photo:string;credit:string};
const PHOTOS:GalleryPhoto[]=[
 {id:"oficina",title:"Oficina em atividade",detail:"Ambiente de manutenção e serviços automotivos",alt:"Carros pretos em oficina com capô aberto e um veículo em elevador",photo:"photo-1792326103553-4e4e8964279e",credit:"Mustafa Sheikhmouss"},
 {id:"diagnostico",title:"Diagnóstico técnico",detail:"Verificação de componentes e sistemas do veículo",alt:"Mecânico trabalhando nos componentes eletrônicos de um carro",photo:"photo-1632733711679-529326f6db12",credit:"Maxim Hopman"},
 {id:"oleo",title:"Óleo e lubrificação",detail:"Cuidados periódicos com o motor",alt:"Mecânico colocando óleo no motor durante manutenção automotiva",photo:"photo-1771340742493-52fbd5476ccb",credit:"Dextar Studio"},
 {id:"pneus",title:"Pneus e rodas",detail:"Serviços ligados à manutenção das rodas",alt:"Profissional com luvas vermelhas trabalhando na montagem de um pneu",photo:"photo-1792792944402-5e94ce198dce",credit:"Mustafa Sheikhmouss"},
 {id:"suspensao",title:"Suspensão e componentes",detail:"Detalhes mecânicos inspecionados em oficina",alt:"Vista inferior da suspensão de veículo com componentes de direção e roda",photo:"photo-1769218402167-b0ef15eaf7cc",credit:"Zoshua Colah"},
 {id:"elevador",title:"Inspeção no elevador",detail:"Veículo elevado para avaliações técnicas",alt:"Carro em elevador de oficina durante manutenção",photo:"photo-1652852592938-15bf8c50ab6d",credit:"Hyundai Motor Group"}
];
const asset=(id:string,width:number)=>"https://images.unsplash.com/"+id+"?auto=format&fit=crop&w="+width+"&q=85";
const imageFallback="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1400&q=80";

export function TP9VerticeGallery(){
 const [selected,setSelected]=useState<number|null>(null);
 const closeButtonRef=useRef<HTMLButtonElement|null>(null);
 const triggerRefs=useRef<(HTMLButtonElement|null)[]>([]);
 const close=()=>setSelected(null);
 const move=(delta:number)=>setSelected(current=>current===null?0:(current+delta+PHOTOS.length)%PHOTOS.length);
 useEffect(()=>{
  if(selected===null)return;
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();close();}
   if(event.key==="ArrowLeft"){event.preventDefault();move(-1);}
   if(event.key==="ArrowRight"){event.preventDefault();move(1);}
   if(event.key==="Tab"){
    // Keep keyboard focus inside the modal's three controls.
    const controls=Array.from(document.querySelectorAll<HTMLButtonElement>(".pvg-lightbox button:not([disabled])"));
    if(!controls.length)return;
    const first=controls[0],last=controls[controls.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  };
  const oldOverflow=document.body.style.overflow;
  document.body.style.overflow="hidden";
  document.addEventListener("keydown",onKeyDown);
  closeButtonRef.current?.focus();
  return ()=>{document.body.style.overflow=oldOverflow;document.removeEventListener("keydown",onKeyDown);};
 },[selected]);
 const selectedPhoto=selected===null?null:PHOTOS[selected];
 const showImage=(index:number)=>()=>{setSelected(index);};
 const onPhotoError=(event:SyntheticEvent<HTMLImageElement>)=>{
  const image=event.currentTarget;
  if(!image.src.includes("photo-1619642751034-765dfdf7c58e"))image.src=imageFallback;
 };
 return <section id="tp9-galeria" className="pvg-section" aria-labelledby="pvg-title">
  <style>{`
   .pn-t9x .pvg-section{--pvg-orange:#fa7135;background:#101719;color:#f8f9f6;padding:clamp(70px,8vw,124px) clamp(22px,6vw,100px);width:100%;max-width:100%;overflow-x:clip;font-family:Inter,Arial,sans-serif}
   .pn-t9x .pvg-section *{box-sizing:border-box}
   .pn-t9x .pvg-wrap{max-width:1400px;margin:auto}
   .pn-t9x .pvg-heading-row{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:44px}
   .pn-t9x .pvg-eyebrow{display:flex;align-items:center;gap:12px;margin:0 0 21px;font-size:11px;letter-spacing:.19em;font-weight:900;color:var(--pvg-orange);text-transform:uppercase}
   .pn-t9x .pvg-eyebrow:before{content:"";width:30px;height:2px;flex:none;background:var(--pvg-orange)}
   .pn-t9x .pvg-title{font:900 clamp(39px,5.3vw,76px)/1.06 Inter,Arial,sans-serif;letter-spacing:-.057em;color:#fff;margin:0;max-width:780px;text-wrap:balance}
   .pn-t9x .pvg-title em{color:var(--pvg-orange);font-style:normal}
   .pn-t9x .pvg-intro{max-width:360px;color:#b4c2bc;font-size:clamp(14px,1.2vw,17px);line-height:1.75;margin:0 0 5px}
   .pn-t9x .pvg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
   .pn-t9x .pvg-tile{appearance:none;display:block;position:relative;overflow:hidden;aspect-ratio:1.3;border-radius:14px;min-width:0;min-height:230px;width:100%;border:1px solid #ffffff20;background:#293234;color:#fff;padding:0;text-align:left;cursor:zoom-in;isolation:isolate;transition:transform .25s,border-color .25s,box-shadow .25s}
   .pn-t9x .pvg-tile:hover{transform:translateY(-4px);border-color:#fa7135a6;box-shadow:0 18px 35px #0008}
   .pn-t9x .pvg-tile img{display:block;width:100%;height:100%;object-fit:cover;position:absolute;inset:0;z-index:-2;transition:transform .42s;filter:saturate(.91) contrast(1.03)}
   .pn-t9x .pvg-tile:hover img{transform:scale(1.06)}
   .pn-t9x .pvg-tile:after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(0deg,#090f11e8,#090f1108 64%);pointer-events:none}
   .pn-t9x .pvg-number{position:absolute;left:18px;top:17px;display:inline-flex;justify-content:center;align-items:center;min-width:42px;min-height:36px;padding:6px 10px;border:1px solid #ffffff68;background:#101719bf;border-radius:7px;font-size:11px;letter-spacing:.07em;font-weight:900}
   .pn-t9x .pvg-zoom{position:absolute;top:16px;right:16px;display:flex;align-items:center;justify-content:center;width:37px;height:37px;border-radius:10px;background:var(--pvg-orange);color:#16191a;opacity:.9;transition:transform .2s}
   .pn-t9x .pvg-tile:hover .pvg-zoom{transform:scale(1.08)}
   .pn-t9x .pvg-caption{position:absolute;left:22px;right:18px;bottom:22px;display:block}
   .pn-t9x .pvg-caption strong{display:block;font-size:clamp(17px,1.7vw,24px);font-weight:900;line-height:1.2;letter-spacing:-.027em}
   .pn-t9x .pvg-caption small{display:block;font-size:12px;color:#dbe2dd;line-height:1.55;margin-top:8px}
   .pn-t9x .pvg-footnote{display:flex;align-items:center;gap:9px;margin:25px 0 0;color:#93a39b;font-size:12px;line-height:1.5}
   .pn-t9x .pvg-section button:focus-visible{outline:3px solid #ffac80;outline-offset:4px}
   .pvg-lightbox{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:clamp(14px,3vw,40px);background:#05090cef;backdrop-filter:blur(9px)}
   .pvg-lightbox *{box-sizing:border-box}
   .pvg-lightbox .pvg-modal{position:relative;display:flex;flex-direction:column;gap:12px;max-height:96vh;width:min(1300px,100%);color:#fff}
   .pvg-lightbox .pvg-modal-bar{display:flex;align-items:center;justify-content:space-between;gap:20px}
   .pvg-lightbox .pvg-modal-heading{margin:0;font:850 clamp(16px,2vw,24px)/1.25 Inter,Arial,sans-serif;letter-spacing:-.02em}
   .pvg-lightbox button{display:inline-flex;align-items:center;justify-content:center;min-width:46px;min-height:46px;border:1px solid #ffffff5f;background:#1c2528;color:#fff;border-radius:10px;cursor:pointer;transition:background .2s,border-color .2s}
   .pvg-lightbox button:hover{background:#334044;border-color:#fa7135}
   .pvg-lightbox button:focus-visible{outline:3px solid #ffb183;outline-offset:4px}
   .pvg-lightbox .pvg-main-photo{display:block;max-height:min(73vh,950px);width:100%;object-fit:contain;background:#141c1f;border-radius:12px;min-height:160px}
   .pvg-lightbox .pvg-modal-footer{display:flex;align-items:center;justify-content:space-between;gap:16px}
   .pvg-lightbox .pvg-modal-meta{font:700 12px/1.5 Inter,Arial,sans-serif;color:#c2cec7}
   .pvg-lightbox .pvg-modal-control{display:flex;align-items:center;gap:10px}
   .pvg-lightbox .pvg-modal-counter{font:850 12px Inter,Arial,sans-serif;color:#fa7135;letter-spacing:.12em}
   @media(max-width:920px){.pn-t9x .pvg-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pn-t9x .pvg-heading-row{flex-direction:column;align-items:start;gap:20px}.pn-t9x .pvg-intro{max-width:760px}}
   @media(max-width:580px){.pn-t9x .pvg-section{padding:65px 20px}.pn-t9x .pvg-grid{grid-template-columns:1fr;gap:16px}.pn-t9x .pvg-tile{aspect-ratio:1.45;min-height:260px}.pn-t9x .pvg-heading-row{margin-bottom:30px}.pn-t9x .pvg-title{font-size:clamp(35px,10vw,55px)}.pvg-lightbox .pvg-main-photo{max-height:68vh}.pvg-lightbox .pvg-modal-meta{font-size:10px}}
   @media(prefers-reduced-motion:reduce){.pn-t9x .pvg-tile,.pn-t9x .pvg-tile img,.pvg-lightbox button{transition:none}}
  `}</style>
  <div className="pvg-wrap">
   <div className="pvg-heading-row"><div><p className="pvg-eyebrow">06 / Galeria automotiva</p><h2 className="pvg-title" id="pvg-title">O cuidado está <em>nos detalhes.</em></h2></div>
    <p className="pvg-intro">Uma seleção de imagens ilustrativas de manutenção, diagnóstico e serviços de oficina. Clique para ampliar.</p>
   </div>
   <div className="pvg-grid">{PHOTOS.map((photo,index)=><button type="button" className="pvg-tile" key={photo.id} ref={element=>{triggerRefs.current[index]=element}} onClick={showImage(index)} aria-label={"Ampliar foto "+(index+1)+": "+photo.title}>
    <img src={asset(photo.photo,1050)} alt={photo.alt} loading="lazy" decoding="async" onError={onPhotoError}/>
    <span className="pvg-number">{String(index+1).padStart(2,"0")}</span><span className="pvg-zoom" aria-hidden="true"><Expand size={18}/></span>
    <span className="pvg-caption"><strong>{photo.title}</strong><small>{photo.detail}</small></span>
   </button>)}</div>
   <p className="pvg-footnote"><Images size={16} aria-hidden="true"/>Fotografias ilustrativas de terceiros. Não representam necessariamente a estrutura da Vértice Auto Center.</p>
  </div>
  {selectedPhoto&&<div className="pvg-lightbox" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}>
   <div className="pvg-modal" role="dialog" aria-modal="true" aria-label={"Galeria ampliada: "+selectedPhoto.title} aria-describedby="pvg-gallery-counter">
    <div className="pvg-modal-bar"><h3 className="pvg-modal-heading">{selectedPhoto.title}</h3><button type="button" aria-label="Fechar imagem ampliada" ref={closeButtonRef} onClick={()=>{const last=selected;close();if(last!==null)requestAnimationFrame(()=>triggerRefs.current[last]?.focus());}}><X size={22}/></button></div>
    <img key={selectedPhoto.id} className="pvg-main-photo" src={asset(selectedPhoto.photo,2000)} alt={selectedPhoto.alt} onError={onPhotoError}/>
    <div className="pvg-modal-footer"><span className="pvg-modal-meta">Foto ilustrativa · {selectedPhoto.credit} / Unsplash</span><div className="pvg-modal-control">
      <button type="button" onClick={()=>move(-1)} aria-label="Imagem anterior"><ArrowLeft size={20}/></button><span className="pvg-modal-counter" id="pvg-gallery-counter">{String((selected||0)+1).padStart(2,"0")} / 06</span><button type="button" onClick={()=>move(1)} aria-label="Próxima imagem"><ArrowRight size={20}/></button>
    </div></div>
   </div>
  </div>}
 </section>;
}
