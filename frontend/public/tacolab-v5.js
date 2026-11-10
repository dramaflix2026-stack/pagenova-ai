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
const tortilla=material(0xe2ad61),beef=material(0x65301c),beefDark=material(0x3c1a11);
const lettuce=material(0x559a37),lettuceLight=material(0x85bd48),tomato=material(0xc93722,.62),cheese=material(0xf5ba39,.7);
const layers=[];
const rand=(i,s=1)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x)};
function mesh(geometry,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m;}
function group(y){const g=new THREE.Group();g.position.y=y;root.add(g);layers.push({g,y});return g;}
// A curved folded tortilla: no flat circular disks.
function tortillaShell(){
 const g=group(-.48),verts=[],uv=[],indices=[],n=56,m=22;
 for(let i=0;i<=n;i++){
  const u=i/n,theta=(-.82+1.64*u)*Math.PI;
  for(let j=0;j<=m;j++){
   const v=j/m,rad=.72+v*.89;
   const x=Math.sin(theta)*rad;
   const y=-.18+Math.cos(theta)*rad*.58;
   const z=(u-.5)*1.05+.045*Math.sin(v*16+u*20);
   verts.push(x,y,z);uv.push(u,v);
   if(i<n&&j<m){const a=i*(m+1)+j,b=a+m+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 mesh(geo,tortilla,g);
 // Toasted irregular freckles on the tortilla surface
 const toasted=material(0xb57b39);
 for(let i=0;i<65;i++){
  const u=rand(i,1),v=rand(i,2),theta=(-.82+1.64*u)*Math.PI,rad=.72+v*.89;
  const fleck=mesh(new THREE.SphereGeometry(.018+rand(i,3)*.045,5,4),toasted,g,
   Math.sin(theta)*rad,-.18+Math.cos(theta)*rad*.58+.012,(u-.5)*1.05+.06);
  fleck.scale.set(1,.22,1.6);
 }
}
tortillaShell();
const meatGroup=group(-.15);
for(let i=0;i<105;i++){
 const a=rand(i,4)*Math.PI*2,r=Math.sqrt(rand(i,5))*1.05;
 const size=.07+rand(i,6)*.13;
 const m=mesh(new THREE.IcosahedronGeometry(size,1),i%5===0?beefDark:beef,meatGroup,
  Math.cos(a)*r,rand(i,7)*.28,Math.sin(a)*r*.58);
 m.scale.set(.8+rand(i,8),.4+rand(i,9),.65+rand(i,10));m.rotation.set(i*.34,i*.61,i*.19);
}
const cheeseGroup=group(.02);
for(let i=0;i<65;i++){
 const a=rand(i,11)*Math.PI*2,r=Math.sqrt(rand(i,12))*1.08;
 const strip=mesh(new THREE.BoxGeometry(.045,.017,.23+rand(i,13)*.25),cheese,cheeseGroup,
  Math.cos(a)*r,rand(i,14)*.13,Math.sin(a)*r*.62);
 strip.rotation.set(rand(i,15)*.4,a,rand(i,16)*.7);
}
const tomatoGroup=group(.21);
for(let i=0;i<37;i++){
 const a=rand(i,17)*Math.PI*2,r=Math.sqrt(rand(i,18))*1.04;
 const piece=mesh(new THREE.BoxGeometry(.12+rand(i,19)*.1,.08,.12+rand(i,20)*.1),tomato,tomatoGroup,
 Math.cos(a)*r,rand(i,21)*.17,Math.sin(a)*r*.62);
 piece.rotation.set(i*.12,i*.7,i*.35);
}
const leafGroup=group(.37);
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
 root.position.y=(innerWidth>700?0:-.9)+Math.sin(t*.0013)*.11;
 root.rotation.y=-.45+rotate*Math.PI*2.2;
 root.rotation.x=.18+rotate*.5;
 root.rotation.z=Math.sin(t*.0006)*.045;
 root.scale.setScalar(innerWidth>700?1.2:.72);
 layers.forEach((l,i)=>{l.g.position.y=l.y+(i-2)*explode*.75;l.g.rotation.y=explode*(i%2?-.2:.2)});
 const chapter=q<.20?0:q<.46?1:q<.77?2:3;
 if(chapter!==prev){prev=chapter;const a=chapters[chapter];eyebrow.textContent=a[0];headline.innerHTML=a[1];desc.textContent=a[2];note.textContent=a[3]}
 progress.style.width=(q*100)+'%';
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
