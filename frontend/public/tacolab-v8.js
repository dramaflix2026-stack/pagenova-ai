const journey=document.querySelector('#journey'),photos=[...document.querySelectorAll('.photo img')],eyebrow=document.querySelector('#eyebrow'),title=document.querySelector('#title'),desc=document.querySelector('#desc'),count=document.querySelector('#count'),bar=document.querySelector('#bar');
const steps=[['UMA NOVA EXPERIÊNCIA','O SABOR<br>GANHA<br><em>VIDA.</em>','Fotografia gastronômica em movimento.'],['UMA NOVA PERSPECTIVA','SINTA<br>CADA<br><em>DETALHE.</em>','O scroll controla a sequência visual.'],['CAMADAS DE SABOR','FEITO DE<br><em>SABOR.</em>','Uma composição fotográfica de ingredientes.'],['O SABOR RETORNA','TUDO SE<br><em>ENCONTRA.</em>','Uma experiência cinematográfica em evolução.']];
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
let eased=0,prev=-1;
function animate(t){
 requestAnimationFrame(animate);
 const p=clamp(-journey.getBoundingClientRect().top/Math.max(1,journey.offsetHeight-innerHeight));
 eased+=(p-eased)*.075;
 const q=eased,position=q*3,segment=Math.min(2,Math.floor(position)),phase=smooth(position-segment);
 const chapter=q<.20?0:q<.46?1:q<.77?2:3;
 if(chapter!==prev){prev=chapter;const s=steps[chapter];eyebrow.textContent=s[0];title.innerHTML=s[1];desc.textContent=s[2];count.textContent='0'+(chapter+1)+' / 04'}
 photos.forEach((img,j)=>{
  let opacity=0;
  if(j===segment)opacity=1-phase;
  if(j===segment+1)opacity=phase;
  if(position>=3&&j===3)opacity=1;
  img.style.opacity=opacity.toFixed(4);
  img.style.zIndex=String(10+j);
  img.style.transform='translate3d(0,'+(Math.sin(t*.0013)*5+(j-segment)*phase*7).toFixed(2)+'px,0) scale('+(1+.025*q).toFixed(4)+')';
 });
 bar.style.width=(q*100)+'%';
}
requestAnimationFrame(animate);
