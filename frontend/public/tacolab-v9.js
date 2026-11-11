(function(){
const section=document.querySelector('#journey'),photo=document.querySelector('.photo'),original=[...photo.querySelectorAll('img')],src=original[0]?.src;
if(!src)return;
original.forEach(el=>el.remove());
const title=document.querySelector('#title'),desc=document.querySelector('#desc'),eyebrow=document.querySelector('#eyebrow');
title.innerHTML='O SABOR<br>EM <em>MOVIMENTO.</em>';
desc.textContent='Uma fotografia consistente, com movimento contínuo controlado pelo scroll.';
eyebrow.textContent='PAGENOVA MOTION ENGINE • V9';
document.querySelector('header small').textContent='V9 • MOVIMENTO';
document.querySelector('#count').textContent='SCROLL / 01';
const style=document.createElement('style');
style.textContent=`
#journey .stage .copy{z-index:5;top:16%;pointer-events:none}
#journey .stage .copy h1{font-size:clamp(43px,9vw,76px);line-height:1.02;max-width:620px}
#journey .stage .copy p{max-width:310px;font-size:13px;line-height:1.45}
#journey .photo{inset:42% 0 10%;z-index:2;overflow:visible;perspective:1100px}
#journey .photo img{width:min(82vw,620px)!important;max-height:100%;object-fit:contain}
#journey .stage header{z-index:7}
#journey .stage .foot{z-index:7}
@media(max-width:600px){
#journey .stage .copy{top:17%;left:7%;right:7%}
#journey .stage .copy h1{font-size:clamp(42px,10vw,58px);margin:14px 0}
#journey .stage .copy p{max-width:280px;font-size:12px}
#journey .photo{inset:49% 0 13%}
#journey .photo img{width:82vw!important}
}
`;
document.head.append(style);
// The V9 engine is retained, but no false 'ingredient explosion' is simulated with image strips.
// A single consistent asset is animated continuously until isolated layer assets are available.
const layers=[{src,alt:'Taco fotográfico em movimento',keyframes:[
{at:0,x:0,y:0,rotate:0,rotateY:-7,scale:.94},
{at:.22,x:0,y:-8,rotate:-3,rotateY:8,scale:1},
{at:.5,x:8,y:-15,rotate:2,rotateY:-12,scale:1.08},
{at:.75,x:-7,y:-5,rotate:-2,rotateY:9,scale:1.02},
{at:1,x:0,y:0,rotate:0,rotateY:-7,scale:.94}
]}];
window.PageNovaMotionEngine.mount({section,container:photo,layers,progressElement:document.querySelector('#bar')});
})();