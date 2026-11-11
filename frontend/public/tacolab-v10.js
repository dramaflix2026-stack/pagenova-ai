(function(){
const section=document.querySelector('#journey'),photo=document.querySelector('.photo'),old=[...photo.querySelectorAll('img')];
old.forEach(n=>n.remove());
const svg=(s)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">'+s+'</svg>');
const tortilla=svg('<defs><linearGradient id="g" x2=".8" y2="1"><stop stop-color="#ffdd78"/><stop offset=".55" stop-color="#e8a63a"/><stop offset="1" stop-color="#ae5a1d"/></linearGradient></defs><path d="M95 250 Q110 95 288 118 Q450 90 515 255 Q493 328 322 350 Q170 360 95 250Z" fill="url(#g)" stroke="#f7c565" stroke-width="12"/><path d="M124 255 Q160 180 288 178 Q407 160 483 249" fill="none" stroke="#9c4c15" stroke-width="16" opacity=".5"/><g fill="#ae661f" opacity=".7"><circle cx="150" cy="230" r="5"/><circle cx="240" cy="156" r="5"/><circle cx="390" cy="290" r="7"/><circle cx="456" cy="237" r="4"/><circle cx="280" cy="318" r="5"/></g>');
const beef=svg('<g fill="#713516" stroke="#3d190c" stroke-width="4"><ellipse cx="185" cy="232" rx="66" ry="28"/><ellipse cx="252" cy="225" rx="75" ry="31"/><ellipse cx="338" cy="220" rx="77" ry="30"/><ellipse cx="423" cy="225" rx="63" ry="26"/></g><g fill="#a95b27"><circle cx="160" cy="222" r="14"/><circle cx="208" cy="232" r="16"/><circle cx="253" cy="209" r="13"/><circle cx="289" cy="232" r="15"/><circle cx="338" cy="212" r="16"/><circle cx="385" cy="233" r="15"/><circle cx="431" cy="220" r="13"/></g>');
const cheese=svg('<path d="M130 230 Q170 202 208 218 T300 212 T388 223 T473 211" stroke="#ffae18" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M165 252 Q230 233 272 255 T365 245 T452 248" stroke="#fdd449" stroke-width="15" fill="none" stroke-linecap="round"/>');
const lettuce=svg('<path d="M119 220 Q93 177 144 163 Q131 123 180 140 Q209 105 245 144 Q282 103 311 145 Q344 109 370 151 Q418 115 441 168 Q491 161 478 215 Q444 190 416 211 Q384 184 354 211 Q316 183 282 212 Q246 184 209 215 Q162 181 119 220Z" fill="#65ad27" stroke="#b6e15e" stroke-width="9"/><path d="M135 193 Q245 154 307 186 T465 192" stroke="#d1f07a" stroke-width="5" fill="none"/>');
const tomatoes=svg('<g fill="#ee4b22" stroke="#ff9b61" stroke-width="6"><path d="M150 184 l42 -36 41 28 -25 40Z"/><path d="M255 164 l50 -38 37 35 -26 43Z"/><path d="M360 177 l49 -34 40 32 -29 41Z"/></g>');
const herbs=svg('<g fill="#2e7d36"><ellipse cx="200" cy="137" rx="31" ry="13" transform="rotate(-24 200 137)"/><ellipse cx="290" cy="112" rx="27" ry="12" transform="rotate(18 290 112)"/><ellipse cx="389" cy="128" rx="29" ry="13" transform="rotate(-15 389 128)"/></g>');
const k=(dy,dx,rot)=>[{at:0,x:0,y:0,scale:.95},{at:.18,x:0,y:0,scale:1},{at:.52,x:dx,y:dy,rotate:rot,scale:1.08},{at:.7,x:dx,y:dy,rotate:rot,scale:1.08},{at:.96,x:0,y:0,scale:.95},{at:1,x:0,y:0,scale:.95}];
const layers=[
{src:tortilla,alt:'Tortilla',keyframes:k(125,-6,-7)},
{src:beef,alt:'Carne',keyframes:k(56,23,4)},
{src:cheese,alt:'Queijo',keyframes:k(0,-23,-3)},
{src:lettuce,alt:'Alface',keyframes:k(-64,19,5)},
{src:tomatoes,alt:'Tomates',keyframes:k(-129,-12,-5)},
{src:herbs,alt:'Ervas',keyframes:k(-180,10,8)}
];
const style=document.createElement('style');
style.textContent='#journey .stage .copy{z-index:6;top:17%}#journey .stage .copy h1{font-size:clamp(42px,9vw,78px);line-height:1.04}#journey .stage .copy p{font-size:13px;max-width:310px}#journey .photo{inset:43% 0 12%;z-index:2}#journey .photo img{width:min(90vw,630px)!important;max-height:none;filter:drop-shadow(0 15px 18px #0006)}#journey header,#journey .foot{z-index:8}@media(max-width:600px){#journey .stage .copy{top:17%}#journey .stage .copy h1{font-size:clamp(42px,10vw,60px)}#journey .photo{inset:53% 0 15%}#journey .photo img{width:91vw!important}}';
document.head.append(style);
document.querySelector('#eyebrow').textContent='PAGENOVA MOTION ENGINE • V10';
document.querySelector('#title').innerHTML='UM TACO.<br><em>SEIS CAMADAS.</em>';
document.querySelector('#desc').textContent='Role para separar e reconstruir os ingredientes, em movimento contínuo.';
document.querySelector('header small').textContent='V10 • CAMADAS INDEPENDENTES';
document.querySelector('#count').textContent='01 / 03';
const motion=window.PageNovaMotionEngine.mount({section,container:photo,layers,progressElement:document.querySelector('#bar')});
let last=-1;
function update(){const p=motion.getProgress(),n=p<.25?1:p<.79?2:3;if(n!==last){last=n;document.querySelector('#count').textContent='0'+n+' / 03'}requestAnimationFrame(update)}requestAnimationFrame(update);
})();