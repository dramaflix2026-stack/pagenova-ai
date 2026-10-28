"use client";

const colors=["#b9f77a","#4aff74","#ffffff","#ffd86c","#70e6ff","#f59aff"];
function Robot({side}:{side:"left"|"right"}){
 return <div aria-hidden="true" className={`pn-bot pn-bot-${side} pointer-events-none absolute bottom-2 z-20 sm:bottom-4`}>
  <div className="pn-bot-body relative">
   <svg viewBox="0 0 120 150" className="h-full w-full overflow-visible drop-shadow-[0_12px_12px_rgba(0,0,0,.65)]">
    <defs><linearGradient id={`pn-bot-metal-${side}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f3fff0"/><stop offset=".4" stopColor="#a6c8ad"/><stop offset="1" stopColor="#405a4a"/></linearGradient><linearGradient id={`pn-bot-green-${side}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b9ff81"/><stop offset="1" stopColor="#16ba50"/></linearGradient></defs>
    <ellipse cx="60" cy="144" rx="37" ry="5" fill="#000" opacity=".45"/>
    <g className="pn-bot-leg pn-bot-leg-a"><rect x="35" y="111" width="17" height="29" rx="7" fill="#607c68"/><rect x="26" y="134" width="28" height="10" rx="5" fill="#b9ff81"/></g>
    <g className="pn-bot-leg pn-bot-leg-b"><rect x="69" y="111" width="17" height="29" rx="7" fill="#607c68"/><rect x="67" y="134" width="29" height="10" rx="5" fill="#b9ff81"/></g>
    <rect x="25" y="65" width="70" height="60" rx="23" fill={`url(#pn-bot-metal-${side})`} stroke="#b6ff9b" strokeWidth="2"/>
    <rect x="39" y="78" width="42" height="28" rx="11" fill="#102c1c"/><path d="M47 93h26" stroke="#55ff86" strokeWidth="4" strokeLinecap="round"/>
    <rect x="13" y="76" width="16" height="39" rx="8" fill="#6d8c74" transform="rotate(15 21 96)"/>
    <rect x="91" y="76" width="16" height="39" rx="8" fill="#6d8c74" transform="rotate(-15 99 96)"/>
    <rect x="18" y="15" width="84" height="62" rx="25" fill={`url(#pn-bot-metal-${side})`} stroke="#b9ff81" strokeWidth="2.5"/>
    <rect x="27" y="29" width="66" height="33" rx="14" fill="#0b2015"/>
    <ellipse cx="46" cy="46" rx="8" ry="10" fill="#6cff86" className="pn-bot-eye"/><ellipse cx="74" cy="46" rx="8" ry="10" fill="#6cff86" className="pn-bot-eye"/>
    <path d="M51 65q9 7 18 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M60 15V6" stroke="#8eff7b" strokeWidth="4" strokeLinecap="round"/><circle cx="60" cy="5" r="5" fill="#b9ff81"/>
    <g className="pn-bot-cannon"><path d="M91 92l24-18 12 15-23 18z" fill={`url(#pn-bot-green-${side})`} stroke="#eaffde" strokeWidth="2"/><ellipse cx="121" cy="81" rx="9" ry="12" transform="rotate(-48 121 81)" fill="#102c1c" stroke="#b9ff81" strokeWidth="3"/></g>
   </svg>
  </div>
  <div className="pn-confetti absolute bottom-[55%] left-[75%]">
   {Array.from({length:20},(_,i)=><i key={i} className="pn-confetti-piece" style={{"--dx":`${(i%5-2)*30+22}px`,"--dy":`${-25-Math.floor(i/5)*27}px`,"--rot":`${i*47}deg`,"--delay":`${1.3+(i%7)*.07}s`,backgroundColor:colors[i%colors.length]} as React.CSSProperties}/>)}
  </div>
 </div>;
}
export default function HeroRobots(){return <><Robot side="left"/><Robot side="right"/></>;}
