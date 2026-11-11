/* PageNova Motion Engine: V13 natural burst timeline. Preserves photographic fallback.
   Requires consistent transparent ingredient images in /motion-assets/taco/ for actual explosion. */
(function(){
const section=document.querySelector('#journey'),stage=document.querySelector('.stage'),photo=document.querySelector('.photo');
const original=[...photo.querySelectorAll('img')],fallback=original[0]?.src;
if(!fallback||!window.PageNovaMotionEngine)return;
const manifest=[
{id:'shell',name:'Tortilla',src:'/motion-assets/taco/shell.webp',x:0,y:24,rotate:-3,delay:0},
{id:'beef',name:'Carne',src:'/motion-assets/taco/beef.webp',x:23,y:-85,rotate:9,delay:.04},
{id:'cheese',name:'Queijo',src:'/motion-assets/taco/cheese.webp',x:-34,y:-137,rotate:-13,delay:.09},
{id:'lettuce',name:'Alface',src:'/motion-assets/taco/lettuce.webp',x:38,y:-192,rotate:15,delay:.14},
{id:'tomato',name:'Tomate',src:'/motion-assets/taco/tomato.webp',x:-48,y:-247,rotate:-19,delay:.18},
{id:'herbs',name:'Ervas',src:'/motion-assets/taco/herbs.webp',x:18,y:-294,rotate:24,delay:.22}
];
const style=document.createElement('style');
style.textContent=`
#journey .stage header{z-index:20;left:6%;right:6%;top:5%;font-size:clamp(13px,3vw,18px);gap:10px}
#journey .stage header small{font-size:clamp(7px,1.8vw,10px);padding:9px 11px;white-space:nowrap}
#journey .stage .copy{z-index:12;top:16%;left:7%;right:7%;pointer-events:none}
#journey .stage .copy h1{font-size:clamp(41px,8vw,70px);line-height:1.03;margin:14px 0}
#journey .stage .copy p{font-size:13px;line-height:1.5;max-width:330px}
#journey .photo{inset:44% 0 12%;z-index:2;overflow:visible;perspective:1200px}
#journey .photo img{width:min(82vw,620px)!important;max-height:100%;object-fit:contain}
#journey .stage .foot{z-index:15}
@media(max-width:600px){#journey .stage .copy{top:17%}#journey .stage .copy h1{font-size:clamp(38px,10vw,56px)}#journey .stage .copy p{max-width:280px;font-size:12px}#journey .photo{inset:54% 0 14%}#journey .photo img{width:82vw!important}}
`;
document.head.append(style);
document.querySelector('#eyebrow').textContent='PAGENOVA MOTION ENGINE • V13';
document.querySelector('#title').innerHTML='O SABOR<br><em>EM CAMADAS.</em>';
document.querySelector('#desc').textContent='Um movimento contínuo, com explosão e reconstrução quando os ingredientes fotográficos estiverem disponíveis.';
document.querySelector('header small').textContent='V13 • BURST TIMELINE';
const keyframes=(layer)=>{
 const d=layer.delay, peak=.49+d*.3,hold=.68+d*.15,returnAt=.94;
 const factor=innerWidth<700?.62:1;
 const x=layer.x*factor,y=layer.y*factor;
 return [{at:0,x:0,y:0,scale:.96},{at:.16+d*.2,x:0,y:0,scale:1},
 {at:.28+d*.24,x:x*.34,y:y*.65-16,rotate:layer.rotate*.45,scale:1.035},
 {at:peak,x,y,rotate:layer.rotate,rotateY:layer.rotate*.7,scale:1.07},
 {at:hold,x,y:y+7,rotate:layer.rotate+3,rotateY:layer.rotate*.7,scale:1.07},
 {at:.83+d*.06,x:x*.4,y:y*.38,rotate:layer.rotate*.25,scale:1.015},
 {at:returnAt,x:0,y:0,rotate:0,scale:.96},{at:1,x:0,y:0,scale:.96}];
};
const available=src=>new Promise(resolve=>{const img=new Image();let finished=false;const done=ok=>{if(!finished){finished=true;resolve(ok)}};img.onload=()=>done(img.naturalWidth>0);img.onerror=()=>done(false);img.src=src;setTimeout(()=>done(false),3000)});
Promise.all(manifest.map(x=>available(x.src))).then(results=>{
 const ready=results.every(Boolean);
 original.forEach(n=>n.remove());
 const layers=ready?manifest.map(x=>({src:x.src,alt:x.name,keyframes:keyframes(x)})):[{src:fallback,alt:'Taco fotográfico',keyframes:[{at:0,x:0,y:0,scale:.96},{at:.23,x:0,y:-7,scale:1},{at:.51,x:6,y:-13,rotateY:8,scale:1.045},{at:.73,x:-4,y:-8,rotateY:-6,scale:1.015},{at:1,x:0,y:0,scale:.96}]}];
 const motion=window.PageNovaMotionEngine.mount({section,container:photo,layers,progressElement:document.querySelector('#bar')});
 const label=document.createElement('div');label.style.cssText='position:absolute;bottom:10%;left:7%;z-index:10;color:#e7b995;font-size:10px;letter-spacing:.08em;max-width:78%';label.textContent=ready?'EXPLOSÃO FOTOGRÁFICA ATIVA':'INGREDIENTES FOTOGRÁFICOS PENDENTES • MOVIMENTO BASE';stage.append(label);
 let last=-1;function tick(){const p=motion.getProgress(),step=p<.27?1:p<.78?2:3;if(step!==last){last=step;document.querySelector('#count').textContent='0'+step+' / 03'}requestAnimationFrame(tick)}requestAnimationFrame(tick);
});
})();