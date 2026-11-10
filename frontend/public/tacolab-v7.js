import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';
const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(37,1,.1,100);camera.position.set(0,0,12);
scene.add(new THREE.HemisphereLight(0xffdfb8,0x29170f,2.4));
const key=new THREE.DirectionalLight(0xffe4ba,3.3);key.position.set(3,6,8);scene.add(key);
const rim=new THREE.DirectionalLight(0xff843b,2.1);rim.position.set(-5,2,-3);scene.add(rim);
const root=new THREE.Group();scene.add(root);
const status=document.createElement('div');status.style.cssText='position:fixed;bottom:16px;left:16px;color:#f6d6a0;font:12px system-ui;z-index:99;pointer-events:none';status.textContent='Carregando taco 3D…';document.body.append(status);
new GLTFLoader().load('/taco.glb',gltf=>{
 const model=gltf.scene;model.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 if(Math.max(size.x,size.y,size.z)<.00001){status.textContent='Modelo 3D inválido';return}
 const scale=3.1/Math.max(size.x,size.y,size.z);
 model.position.sub(center);
 const holder=new THREE.Group();holder.scale.setScalar(scale);holder.add(model);root.add(holder);
 model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.side=THREE.DoubleSide)}}});
 status.remove();
},undefined,error=>{status.textContent='Não foi possível carregar o taco 3D';console.error(error)});
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const section=document.querySelector('.stage'),headline=document.querySelector('#headline'),desc=document.querySelector('#desc'),eyebrow=document.querySelector('#eyebrow'),note=document.querySelector('#note'),progress=document.querySelector('#progress');
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
let eased=0,prev=-1;
const chapters=[
 ['UMA EXPERIÊNCIA EXTRAORDINÁRIA','NÃO É<br/>SÓ UM<br/><em>TACO.</em>','Uma experiência gastronômica em movimento.','01 / 04 — O INÍCIO'],
 ['O MOVIMENTO COMEÇA','SINTA<br/>CADA<br/><em>GIRO.</em>','Gire o taco com o movimento do seu dedo.','02 / 04 — ROTAÇÃO'],
 ['CADA DETALHE IMPORTA','FEITO DE<br/><em>SABOR.</em>','Texturas reais e detalhes de um taco em 3D.','03 / 04 — DETALHES'],
 ['TUDO SE ENCONTRA','A MÁGICA<br/><em>ACONTECE.</em>','Uma experiência que acompanha o seu movimento.','04 / 04 — EXPERIÊNCIA']
];
function animate(t){
 requestAnimationFrame(animate);
 const p=clamp(-section.getBoundingClientRect().top/Math.max(1,section.offsetHeight-innerHeight));
 eased+=(p-eased)*.075;const q=eased;
 const rotate=smooth((q-.10)/.7);
 root.position.x=innerWidth>700?2.25:0;
 root.position.y=(innerWidth>700?0:-.55)+Math.sin(t*.0013)*.11;
 root.rotation.y=-.45+rotate*Math.PI*2.2;
 root.rotation.x=.18+rotate*.5;
 root.rotation.z=Math.sin(t*.0006)*.045;
 root.scale.setScalar(innerWidth>700?1.2:.88);
 const chapter=q<.20?0:q<.46?1:q<.77?2:3;
 if(chapter!==prev){prev=chapter;const a=chapters[chapter];eyebrow.textContent=a[0];headline.innerHTML=a[1];desc.textContent=a[2];note.textContent=a[3]}
 progress.style.width=(q*100)+'%';renderer.render(scene,camera);
}
requestAnimationFrame(animate);
