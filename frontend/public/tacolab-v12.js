/* PageNova Motion Engine: photographic ingredient scene adapter.
   Layer URLs are optional until approved transparent assets are available.
   Never simulate separated ingredients by slicing a full photograph. */
(function(){
const section=document.querySelector('#journey'),stage=document.querySelector('.stage'),photo=document.querySelector('.photo');
const original=[...photo.querySelectorAll('img')],fallback=original[0]?.src;
if(!fallback||!window.PageNovaMotionEngine)return;
const manifest=[
{id:'shell',name:'Tortilla',src:'/motion-assets/taco/shell.webp',x:-12,y:140,rotate:-8},
{id:'beef',name:'Carne',src:'/motion-assets/taco/beef.webp',x:14,y:73,rotate:5},
{id:'cheese',name:'Queijo',src:'/motion-assets/taco/cheese.webp',x:-12,y:6,rotate:-4},
{id:'lettuce',name:'Alface',src:'/motion-assets/taco/lettuce.webp',x:18,y:-60,rotate:6},
{id:'tomato',name:'Tomate',src:'/motion-assets/taco/tomato.webp',x:-15,y:-120,rotate:-7},
{id:'herbs',name:'Ervas',src:'/motion-assets/taco/herbs.webp',x:8,y:-169,rotate:9}
];
const css=document.createElement('style');
css.textContent=`
#journey .stage header{z-index:20;left:6%;right:6%;top:5%;font-size:clamp(13px,3vw,18px);gap:10px}
#journey .stage header small{font-size:clamp(7px,1.8vw,10px);padding:9px 11px;white-space:nowrap}
#journey .stage .copy{z-index:12;top:16%;left:7%;right:7%;pointer-events:none}
#journey .stage .copy h1{font-size:clamp(41px,8vw,70px);line-height:1.03;margin:14px 0}
#journey .stage .copy p{font-size:13px;line-height:1.5;max-width:330px}
#journey .photo{inset:43% 0 12%;z-index:2;overflow:visible}
#journey .photo img{width:min(82vw,620px)!important;max-height:100%;object-fit:contain}
#journey .stage .foot{z-index:15}
@media(max-width:600px){#journey .stage .copy{top:17%}#journey .stage .copy h1{font-size:clamp(38px,10vw,56px)}#journey .stage .copy p{max-width:280px;font-size:12px}#journey .photo{inset:53% 0 14%}#journey .photo img{width:82vw!important}}
`;
document.head.append(css);
document.querySelector('#eyebrow').textContent='PAGENOVA MOTION ENGINE • V12';
document.querySelector('#title').innerHTML='O SABOR<br><em>EM CAMADAS.</em>';
document.querySelector('#desc').textContent='Movimento contínuo no scroll, preparado para ingredientes fotográficos independentes.';
document.querySelector('header small').textContent='V12 • MOTION ENGINE';
const clamp=v=>Math.max(0,Math.min(1,v));
const keyframes=(layer)=>[{at:0,x:0,y:0,scale:.96},{at:.19,x:0,y:0,scale:1},{at:.51,x:layer.x,y:layer.y,rotate:layer.rotate,scale:1.04},{at:.70,x:layer.x,y:layer.y,rotate:layer.rotate,scale:1.04},{at:.95,x:0,y:0,scale:.96},{at:1,x:0,y:0,scale:.96}];
function check(src){return new Promise(resolve=>{const img=new Image();let done=false;const finish=ok=>{if(!done){done=true;resolve(ok)}};img.onload=()=>finish(img.naturalWidth>0);img.onerror=()=>finish(false);img.src=src;setTimeout(()=>finish(false),3500)})}
Promise.all(manifest.map(x=>check(x.src))).then(results=>{
 const ready=results.every(Boolean);
 original.forEach(n=>n.remove());
 const layers=ready?manifest.map(x=>({src:x.src,alt:x.name,keyframes:keyframes(x)})):[{src:fallback,alt:'Taco fotográfico completo',keyframes:[{at:0,x:0,y:0,scale:.96},{at:.25,x:0,y:-6,rotateY:0,scale:1},{at:.53,x:4,y:-12,rotateY:8,scale:1.04},{at:.78,x:-3,y:-5,rotateY:-5,scale:1.01},{at:1,x:0,y:0,scale:.96}]}];
 const motion=window.PageNovaMotionEngine.mount({section,container:photo,layers,progressElement:document.querySelector('#bar')});
 const status=document.createElement('div');status.style.cssText='position:absolute;left:7%;bottom:10%;z-index:10;color:#e5b892;font-size:10px;letter-spacing:.08em;max-width:70%';status.textContent=ready?'CAMADAS FOTOGRÁFICAS ATIVAS':'MODO FOTOGRÁFICO • AGUARDANDO ASSETS INDIVIDUAIS';stage.append(status);
 let last=-1;function update(){const p=motion.getProgress(),step=p<.25?1:p<.78?2:3;if(step!==last){last=step;document.querySelector('#count').textContent='0'+step+' / 03'}requestAnimationFrame(update)}requestAnimationFrame(update);
});
})();