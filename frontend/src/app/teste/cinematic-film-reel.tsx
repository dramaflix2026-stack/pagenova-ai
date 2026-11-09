"use client";

const sites = [
  {title:"Gastronomia",color:"#f79754",bg:"#351a12",kind:"food"},
  {title:"Imobiliária",color:"#e7c492",bg:"#192929",kind:"estate"},
  {title:"Beleza",color:"#eea2c4",bg:"#341f32",kind:"beauty"},
  {title:"Tecnologia",color:"#88baff",bg:"#182744",kind:"tech"},
  {title:"Hotelaria",color:"#ebd2a3",bg:"#313027",kind:"hotel"},
  {title:"Saúde",color:"#8de5d0",bg:"#183a37",kind:"health"},
  {title:"Educação",color:"#e9be6c",bg:"#302543",kind:"study"},
  {title:"Automotivo",color:"#d6e0ee",bg:"#1b232c",kind:"auto"}
] as const;

function FilmPreview({site}:{site:typeof sites[number]}) {
  return <div className={"film-mini film-"+site.kind} style={{background:site.bg}}>
    <div className="film-nav"><span style={{background:site.color}}/><i/><i/><i/></div>
    <div className="film-main">
      <div className="film-copy"><em style={{color:site.color}}>{site.title}</em><b/><b/><b/><small style={{background:site.color}}/></div>
      <div className="film-art"><span/><i/></div>
    </div>
    <div className="film-footer"><span/><span/><span/></div>
  </div>;
}

function FilmBand({reverse=false,position}:{reverse?:boolean;position:string}) {
  return <div className={"film-band "+position+(reverse?" film-reverse":"")}>
    <div className="film-perforation"/>
    <div className="film-view"><div className="film-track">
      {[0,1].map(k=><div className="film-sequence" key={k}>{sites.map((site,i)=><div key={i} className="film-cell"><FilmPreview site={site}/></div>)}</div>)}
    </div></div>
    <div className="film-perforation"/>
  </div>;
}

export function CinematicFilmReel(){
  return <div aria-hidden="true" className="film-scene">
    <FilmBand position="film-top"/>
    <FilmBand reverse position="film-bottom"/>
    <style>{`
      .film-scene{position:absolute;inset:-90px -20vw -80px;z-index:0;overflow:hidden;pointer-events:none;isolation:isolate}
      .film-band{position:absolute;left:50%;width:min(1700px,145vw);height:154px;overflow:hidden;border:1px solid #b6ff6940;border-radius:10px;background:#0b140e;box-shadow:0 22px 70px #000c,0 0 35px #aaff5415;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
      .film-top{top:9%;transform:translateX(-50%) rotate(-10deg);opacity:.75}
      .film-bottom{bottom:8%;transform:translateX(-50%) rotate(9deg);opacity:.68}
      .film-perforation{height:16px;background-color:#050b07;background-image:repeating-linear-gradient(90deg,#080e09 0 9px,#b6ff6975 9px 25px,#080e09 25px 42px);border-block:4px solid #13231a}
      .film-view{height:122px;overflow:hidden;padding-top:4px}
      .film-track{display:flex;width:max-content;animation:film-flow 43s linear infinite;will-change:transform}
      .film-reverse .film-track{animation-direction:reverse;animation-duration:49s}
      .film-sequence{display:flex;gap:8px;flex:0 0 auto;padding-right:8px}
      .film-cell{flex:0 0 200px;height:112px;padding:3px;border:1px solid #d8ffe344;border-radius:4px;background:#040805}
      .film-mini{height:100%;overflow:hidden;border-radius:2px}
      .film-nav{height:17px;display:flex;align-items:center;gap:4px;padding:0 10px;border-bottom:1px solid #ffffff22}
      .film-nav span{height:5px;width:31px;border-radius:3px;margin-right:auto}.film-nav i{height:2px;width:12px;background:#fff8;border-radius:2px}
      .film-main{display:grid;grid-template-columns:1fr 1fr;gap:4px;height:70px;padding:7px}
      .film-copy{display:flex;flex-direction:column;gap:4px;align-items:flex-start}
      .film-copy em{font-size:7px;line-height:1;font-weight:800;letter-spacing:.4px;font-style:normal}
      .film-copy b{display:block;height:5px;width:80%;background:#fffd;border-radius:2px}.film-copy b:nth-of-type(2){width:66%;background:#fff9}.film-copy b:nth-of-type(3){width:48%;background:#fff6}
      .film-copy small{height:9px;width:38px;border-radius:2px}
      .film-art{position:relative;overflow:hidden;border-radius:5px;background:radial-gradient(circle at 70% 25%,#ffffff65,transparent 55%),#ffffff1a}
      .film-art span{position:absolute;width:54%;height:72%;left:22%;top:14%;background:#ffffffb9;border-radius:45% 45% 18% 18%;transform:rotate(-10deg);box-shadow:8px 7px 0 #0003}
      .film-art i{position:absolute;width:70px;height:70px;left:0;top:-18px;border-radius:50%;border:1px solid #fff5}
      .film-estate .film-art span{border-radius:1px;background:linear-gradient(90deg,#dfceab 20%,#648b8b 20% 35%,#dfceab 35% 65%,#648b8b 65%)}
      .film-food .film-art span{border-radius:50%;background:radial-gradient(circle,#ffc77c,#b9562f)}
      .film-beauty .film-art span{background:linear-gradient(145deg,#ffd9e2,#9c5d8f)}
      .film-tech .film-art span{border-radius:6px;background:linear-gradient(130deg,#91baff,#1c3286)}
      .film-hotel .film-art span{background:linear-gradient(135deg,#f2d2a6,#6b947b)}
      .film-health .film-art span{border-radius:50%;background:linear-gradient(135deg,#c2fff5,#4aab94)}
      .film-study .film-art span{border-radius:2px;transform:rotate(16deg);background:#e4bf79}
      .film-auto .film-art span{top:50%;height:34%;width:75%;left:13%;border-radius:60% 60% 12% 12%;background:#e4ecfc}
      .film-footer{display:flex;gap:4px;padding:2px 7px}.film-footer span{height:8px;width:30%;background:#ffffff20;border-radius:2px}
      @keyframes film-flow{to{transform:translateX(-50%)}}
      @media(max-width:767px){.film-scene{inset:-28px -40px -30px}.film-band{width:155vw;height:90px}.film-top{top:1%;transform:translateX(-50%) rotate(-7deg);opacity:.64}.film-bottom{bottom:1%;transform:translateX(-50%) rotate(7deg);opacity:.52}.film-perforation{height:10px;border-block-width:2px}.film-view{height:70px;padding-top:2px}.film-cell{flex-basis:122px;height:65px;padding:2px}.film-nav{height:10px;padding:0 4px}.film-main{height:48px;padding:3px}.film-copy{gap:2px}.film-copy em{font-size:4px}.film-copy b{height:3px}.film-copy small{height:6px;width:22px}.film-footer{display:none}}
      @media(prefers-reduced-motion:reduce){.film-track{animation:none!important;will-change:auto}}
    `}</style>
  </div>;
}
