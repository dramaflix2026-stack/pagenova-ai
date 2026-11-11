(function(){
const section=document.querySelector('#journey'),photo=document.querySelector('.photo'),original=[...photo.querySelectorAll('img')],src=original[0]?.src;
if(!src)return;
original.forEach(el=>el.remove());
photo.style.inset=innerWidth>700?'19% 0 7%':'35% 0 11%';
photo.style.perspective='1000px';
const title=document.querySelector('#title'),desc=document.querySelector('#desc'),eyebrow=document.querySelector('#eyebrow');
title.innerHTML='UM TACO.<br><em>INFINITAS</em><br>CAMADAS.';
desc.textContent='Deslize para separar e reconstruir. Uma fotografia, movimento contínuo.';
eyebrow.textContent='PAGENOVA MOTION ENGINE • V9';
document.querySelector('header small').textContent='V9 • PROTÓTIPO 2.5D';
document.querySelector('#count').textContent='SCROLL / 01';
const neutral={at:0,x:0,y:0,scale:1,opacity:1};
const k=(dy,dx,rz)=>[neutral,{at:.19,x:0,y:0,scale:1.04},{at:.48,x:dx,y:dy,rotate:rz,scale:1.06},{at:.7,x:dx,y:dy,rotate:rz,scale:1.06},{at:.94,x:0,y:0,scale:1},{at:1,x:0,y:0,scale:1}];
const layers=[
 {src,alt:'Taco fotográfico completo',keyframes:[{at:0,opacity:1},{at:.18,opacity:1},{at:.4,opacity:.22},{at:.73,opacity:.22},{at:.94,opacity:1},{at:1,opacity:1}]},
 {src,alt:'Camada superior do taco',mask:'polygon(0 0,100% 0,100% 43%,0 43%)',keyframes:k(-105,-15,-4)},
 {src,alt:'Camada central do taco',mask:'polygon(0 35%,100% 35%,100% 68%,0 68%)',keyframes:k(0,36,5)},
 {src,alt:'Camada inferior do taco',mask:'polygon(0 60%,100% 60%,100% 100%,0 100%)',keyframes:k(105,-20,-3)}
];
window.PageNovaMotionEngine.mount({section,container:photo,layers,progressElement:document.querySelector('#bar')});
})();
