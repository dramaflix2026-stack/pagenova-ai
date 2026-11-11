/* PageNova Motion Engine 0.1 — generic scroll timeline with stable layered assets. */
(function(global){
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
 const lerp=(a,b,t)=>a+(b-a)*t;
 function interpolate(frames,p){if(!frames?.length)return {};if(p<=frames[0].at)return frames[0];for(let i=1;i<frames.length;i++){const a=frames[i-1],b=frames[i];if(p<=b.at){const t=ease((p-a.at)/Math.max(.00001,b.at-a.at));const out={};for(const key of ['x','y','z','rotate','rotateX','rotateY','scale','opacity'])out[key]=lerp(a[key]??(key==='scale'||key==='opacity'?1:0),b[key]??(key==='scale'||key==='opacity'?1:0),t);return out;}}return frames[frames.length-1];}
 function mount({section,container,layers,progressElement,debug=false,smoothing=.075}){
  const nodes=[];
  container.style.position='absolute';container.style.inset='0';container.style.pointerEvents='none';container.style.perspective='1000px';container.style.transformStyle='preserve-3d';
  for(const layer of layers){const node=document.createElement('img');node.src=layer.src;node.alt=layer.alt||'';node.decoding='async';node.draggable=false;node.style.cssText='position:absolute;left:50%;top:50%;width:'+ (layer.width||'min(88vw,700px)')+';height:auto;max-height:100%;object-fit:contain;transform-origin:center;will-change:transform,opacity;backface-visibility:hidden;filter:drop-shadow(0 16px 24px #0005);';if(layer.mask){node.style.clipPath=layer.mask}container.append(node);nodes.push({node,layer})}
  let eased=0,raf=0,destroyed=false;
  function tick(){if(destroyed)return;const distance=Math.max(1,section.offsetHeight-innerHeight);const target=clamp(-section.getBoundingClientRect().top/distance);eased+= (target-eased)*smoothing;
   for(const {node,layer} of nodes){const f=interpolate(layer.keyframes,eased);const x=f.x||0,y=f.y||0,z=f.z||0,rz=f.rotate||0,rx=f.rotateX||0,ry=f.rotateY||0,scale=f.scale??1;node.style.transform='translate3d(calc(-50% + '+x+'px),calc(-50% + '+y+'px),'+z+'px) rotateX('+rx+'deg) rotateY('+ry+'deg) rotateZ('+rz+'deg) scale('+scale+')';node.style.opacity=String(f.opacity??1)}
   if(progressElement)progressElement.style.width=(eased*100)+'%';raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);return {destroy(){destroyed=true;cancelAnimationFrame(raf);nodes.forEach(x=>x.node.remove())},getProgress(){return eased}};
 }
 global.PageNovaMotionEngine={mount,interpolate,version:'0.1.0'};
})(window);
