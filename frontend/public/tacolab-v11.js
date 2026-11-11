(function(){
const section=document.querySelector('#journey'),photo=document.querySelector('.photo'),images=[...photo.querySelectorAll('img')],src=images[0]?.src;
if(!src)return;images.forEach(n=>n.remove());
const css=document.createElement('style');
css.textContent=`
#journey .stage header{z-index:20;left:6%;right:6%;top:5%;gap:12px;font-size:clamp(12px,3vw,18px)}
#journey .stage header small{font-size:clamp(7px,1.8vw,10px);white-space:nowrap;padding:9px 12px}
#journey .stage .copy{z-index:12;top:15%;left:7%;right:7%;pointer-events:none}
#journey .stage .copy h1{font-size:clamp(42px,9vw,70px);line-height:1.04;margin:14px 0}
#journey .stage .copy p{font-size:13px;line-height:1.45;max-width:330px}
#journey .photo{inset:42% 0 12%;z-index:2;overflow:visible;perspective:1000px}
#journey .photo img{width:min(83vw,640px)!important;max-height:100%;object-fit:contain;filter:drop-shadow(0 20px 20px #0007)}
#journey .stage .foot{z-index:15}
@media(max-width:600px){
#journey .stage .copy{top:17%}
#journey .stage .copy h1{font-size:clamp(38px,10vw,56px)}
#journey .stage .copy p{max-width:285px;font-size:12px}
#journey .photo{inset:52% 0 14%}
#journey .photo img{width:82vw!important}
}`;
document.head.append(css);
document.querySelector('#eyebrow').textContent='PAGENOVA MOTION ENGINE • V11';
document.querySelector('#title').innerHTML='UM TACO.<br><em>EM MOVIMENTO.</em>';
document.querySelector('#desc').textContent='Fotografia real e movimento contínuo. Teste de composição mobile.';
document.querySelector('header small').textContent='V11 • FOTOGRÁFICO';
document.querySelector('#count').textContent='01 / 03';
const k=(x,y,ry,scale)=>[{at:0,x:0,y:0,rotateY:0,scale:.96},{at:.18,x:0,y:0,rotateY:0,scale:1},{at:.52,x,y,rotateY:ry,scale},{at:.73,x,y,rotateY:ry,scale},{at:.96,x:0,y:0,rotateY:0,scale:.96},{at:1,x:0,y:0,rotateY:0,scale:.96}];
// A single photo is deliberately retained. Separate photo-consistent ingredient assets
// are required before claiming a physical ingredient explosion.
const layers=[{src,alt:'Taco fotográfico',keyframes:k(0,-15,10,1.08)}];
const motion=window.PageNovaMotionEngine.mount({section,container:photo,layers,progressElement:document.querySelector('#bar')});
let previous=-1;function status(){const p=motion.getProgress(),step=p<.25?1:p<.78?2:3;if(step!==previous){previous=step;document.querySelector('#count').textContent='0'+step+' / 03'}requestAnimationFrame(status)}requestAnimationFrame(status);
})();