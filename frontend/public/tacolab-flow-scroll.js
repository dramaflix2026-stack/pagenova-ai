(function(){'use strict';
const total=96,frames=new Array(total),canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d',{alpha:false}),section=document.querySelector('#scroll'),error=document.querySelector('#error'),hint=document.querySelector('#hint');
let current=-1,desired=0,failed=0;
const url=i=>'/taco-flow/frames/frame_'+String(i+1).padStart(3,'0')+'.webp';
function showError(){error.style.display='block';error.textContent='Os quadros do vídeo ainda não foram publicados. Envie os 96 arquivos WebP para frontend/public/taco-flow/frames/ no repositório. O motor de scroll já está instalado.';hint.textContent='ASSETS PENDENTES'}
function draw(i){let im=frames[i];if(!im?.complete||!im.naturalWidth)return false;const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}ctx.fillStyle='#151515';ctx.fillRect(0,0,w,h);const s=Math.min(w/im.naturalWidth,h/im.naturalHeight),iw=im.naturalWidth*s,ih=im.naturalHeight*s;ctx.drawImage(im,(w-iw)/2,(h-ih)/2,iw,ih);current=i;return true}
function nearest(i){if(frames[i]?.naturalWidth)return i;for(let d=1;d<total;d++){if(i-d>=0&&frames[i-d]?.naturalWidth)return i-d;if(i+d<total&&frames[i+d]?.naturalWidth)return i+d}return -1}
function tick(){const rect=section.getBoundingClientRect(),range=section.offsetHeight-innerHeight,p=Math.max(0,Math.min(1,-rect.top/Math.max(1,range)));desired=Math.min(total-1,Math.round(p*(total-1)));const n=nearest(desired);if(n>=0&&n!==current)draw(n);document.querySelector('#percent').textContent=Math.round(p*100)+'%';document.querySelector('#bar').style.width=p*100+'%';requestAnimationFrame(tick)}
const preload=i=>{const im=new Image();im.decoding='async';im.src=url(i);im.onload=()=>{if(i===desired||current<0)draw(i);hint.textContent='ROLE PARA CONTROLAR A ANIMAÇÃO'};im.onerror=()=>{failed++;if(i===0)showError()};frames[i]=im};
preload(0);for(let i=1;i<total;i++)preload(i);
requestAnimationFrame(tick);addEventListener('resize',()=>{current=-1});
})();