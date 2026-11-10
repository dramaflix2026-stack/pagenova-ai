import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.65;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,100);camera.position.set(0,0,12);
scene.add(new THREE.HemisphereLight(0xffdfb8,0x29170f,2.4));
const key=new THREE.DirectionalLight(0xffe4ba,3.3);key.position.set(3,6,8);scene.add(key);
const rim=new THREE.DirectionalLight(0xff843b,2.1);rim.position.set(-5,2,-3);scene.add(rim);
const root=new THREE.Group();scene.add(root);
const material=(color,roughness=.88)=>new THREE.MeshStandardMaterial({color,roughness,side:THREE.DoubleSide});
// Deterministic food-color microtexture, generated locally (no external images).
function foodTexture(base,spots,seed){
 const c=document.createElement('canvas');c.width=c.height=512;
 const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);
 let v=seed>>>0;const random=()=>{v=(1664525*v+1013904223)>>>0;return v/4294967296};
 for(let i=0;i<8500;i++){
  const px=random()*512,py=random()*512,r=.3+random()*4;
  x.fillStyle=spots[Math.floor(random()*spots.length)];
  x.globalAlpha=.07+random()*.32;x.beginPath();x.ellipse(px,py,r,r*(.5+random()),random()*6.28,0,6.283);x.fill();
 }
 x.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
const tortilla=new THREE.MeshStandardMaterial({map:foodTexture('#dfae6d',['#a65a28','#f9d48d','#7e421d'],9),roughness:.94,side:THREE.DoubleSide});
const beef=new THREE.MeshStandardMaterial({map:foodTexture('#69351e',['#28140f','#a25c32','#d08c4c'],17),roughness:1});
const beefDark=material(0x3b1d14);
const lettuce=new THREE.MeshStandardMaterial({map:foodTexture('#4c9636',['#245f1d','#a1cf64','#77b548'],31),roughness:.83,side:THREE.DoubleSide});
const lettuceLight=new THREE.MeshStandardMaterial({map:foodTexture('#7db94b',['#387d29','#c5dd72'],34),roughness:.85,side:THREE.DoubleSide});
const tomato=new THREE.MeshStandardMaterial({map:foodTexture('#d34228',['#9c2119','#f66a44','#fca96c'],41),roughness:.48});
const cheese=new THREE.MeshStandardMaterial({map:foodTexture('#f5ba42',['#e99323','#ffe09a'],47),roughness:.73});
const layers=[];
const rand=(i,s=1)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)};
function mesh(geometry,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m;}
function group(y){const g=new THREE.Group();g.position.y=y;root.add(g);layers.push({g,y});return g;}
// A curved folded tortilla: no flat circular disks.
function tortillaShell(){
 const g=group(-.48),verts=[],uv=[],indices=[],lengthSegments=58,curveSegments=32;
 // Half-cylinder folded shell, with the fold at the bottom and two open lips.
 // The long axis runs horizontally across the product, not around a torus.
 for(let i=0;i<=lengthSegments;i++){
  const u=i/lengthSegments,xx=(u-.5)*3.05;
  for(let j=0;j<=curveSegments;j++){
   const v=j/curveSegments,theta=Math.PI*v;
   const radius=.78+.07*Math.sin(u*7)+.03*Math.sin(u*27+v*9);
   const yy=-.12-radius*Math.sin(theta);
   const zz=radius*Math.cos(theta);
   const ripple=.015*Math.sin(u*53+v*27);
   verts.push(xx,yy+ripple,zz);uv.push(u*2.1,v*1.25);
   if(i<lengthSegments&&j<curveSegments){
    const k=i*(curveSegments+1)+j,n=k+curveSegments+1;
    indices.push(k,k+1,n,n,k+1,n+1);
   }
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(indices);geo.computeVertexNormals();
 mesh(geo,tortilla,g);
 // Toasting marks follow the same folded surface, without floating geometry.
 const toast=material(0xa96a35);
 for(let i=0;i<115;i++){
  const u=rand(i,1),v=rand(i,2),theta=Math.PI*v;
  const rad=.78+.07*Math.sin(u*7)+.03*Math.sin(u*27+v*9);
  const mark=mesh(new THREE.SphereGeometry(.012+rand(i,3)*.034,6,4),toast,g,
    (u-.5)*3.05,-.12-rad*Math.sin(theta)-.006,rad*Math.cos(theta));
  mark.scale.set(1.4,.18,.7);
 }
}
tortillaShell();
const meatGroup=group(.02);
for(let i=0;i<105;i++){
 const a=rand(i,4)*Math.PI*2,r=Math.sqrt(rand(i,5))*1.05;
 const size=.07+rand(i,6)*.13;
 const m=mesh(new THREE.IcosahedronGeometry(size,1),i%5===0?beefDark:beef,meatGroup,
  Math.cos(a)*r,rand(i,7)*.28,Math.sin(a)*r*.58);
 m.scale.set(.8+rand(i,8),.4+rand(i,9),.65+rand(i,10));m.rotation.set(i*.34,i*.61,i*.19);
}
const cheeseGroup=group(.17);
for(let i=0;i<65;i++){
 const a=rand(i,11)*Math.PI*2,r=Math.sqrt(rand(i,12))*1.08;
 const strip=mesh(new THREE.BoxGeometry(.045,.017,.23+rand(i,13)*.25),cheese,cheeseGroup,
  Math.cos(a)*r,rand(i,14)*.13,Math.sin(a)*r*.62);
 strip.rotation.set(rand(i,15)*.4,a,rand(i,16)*.7);
}
const tomatoGroup=group(.34);
for(let i=0;i<37;i++){
 const a=rand(i,17)*Math.PI*2,r=Math.sqrt(rand(i,18))*1.04;
 const piece=mesh(new THREE.BoxGeometry(.12+rand(i,19)*.1,.08,.12+rand(i,20)*.1),tomato,tomatoGroup,
 Math.cos(a)*r,rand(i,21)*.17,Math.sin(a)*r*.62);
 piece.rotation.set(i*.12,i*.7,i*.35);
}
const leafGroup=group(.53);
for(let i=0;i<52;i++){
 const a=rand(i,22)*Math.PI*2,r=Math.sqrt(rand(i,23))*1.13;
 const geom=new THREE.PlaneGeometry(.22+rand(i,24)*.22,.20+rand(i,25)*.19,3,3);
 const p=geom.attributes.position;
 for(let j=0;j<p.count;j++)p.setZ(j,Math.sin(j*.9+i)*.045);
 geom.computeVertexNormals();
 const leaf=mesh(geom,i%3?lettuce:lettuceLight,leafGroup,
  Math.cos(a)*r,rand(i,26)*.15,Math.sin(a)*r*.67);
 leaf.rotation.set(-.7+rand(i,27)*1.5,a,rand(i,28)*2);
}
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const section=document.querySelector('.stage'),copy=document.querySelector('#copy'),headline=document.querySelector('#headline'),desc=document.querySelector('#desc'),eyebrow=document.querySelector('#eyebrow'),note=document.querySelector('#note'),progress=document.querySelector('#progress');
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
let eased=0,prev=-1;
const chapters=[
 ['UMA EXPERIÊNCIA EXTRAORDINÁRIA','NÃO É<br/>SÓ UM<br/><em>TACO.</em>','Uma experiência gastronômica em movimento.','01 / 04 — O INÍCIO'],
 ['O MOVIMENTO COMEÇA','SINTA<br/>CADA<br/><em>GIRO.</em>','Gire o taco com o movimento do seu dedo.','02 / 04 — ROTAÇÃO'],
 ['CADA CAMADA IMPORTA','FEITO DE<br/><em>SABOR.</em>','Descubra a tortilla e os ingredientes em camadas.','03 / 04 — INGREDIENTES'],
 ['TUDO SE ENCONTRA','A MÁGICA<br/><em>ACONTECE.</em>','Cada ingrediente volta ao seu lugar.','04 / 04 — RECONSTRUÇÃO']
];
function animate(t){
 requestAnimationFrame(animate);
 const p=clamp(-section.getBoundingClientRect().top/Math.max(1,section.offsetHeight-innerHeight));
 eased+=(p-eased)*.075;const q=eased;
 const explode=smooth((q-.24)/.29)*(1-smooth((q-.73)/.20)),rotate=smooth((q-.10)/.7);
 // Original approved continuous motion math is intentionally unchanged.
 root.position.x=innerWidth>700?2.25:0;
 root.position.y=(innerWidth>700?0:-.55)+Math.sin(t*.0013)*.11;
 root.rotation.y=-.45+rotate*Math.PI*2.2;
 root.rotation.x=.18+rotate*.5;
 root.rotation.z=Math.sin(t*.0006)*.045;
 root.scale.setScalar(innerWidth>700?1.2:.88);
 layers.forEach((l,i)=>{l.g.position.y=l.y+(i-2)*explode*.75;l.g.rotation.y=explode*(i%2?-.2:.2)});
 const chapter=q<.20?0:q<.46?1:q<.77?2:3;
 if(chapter!==prev){prev=chapter;const a=chapters[chapter];eyebrow.textContent=a[0];headline.innerHTML=a[1];desc.textContent=a[2];note.textContent=a[3]}
 progress.style.width=(q*100)+'%';
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
