import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 const source=await readFile(join(process.cwd(),'public','teste3d-demo.html'),'utf8');
 const html=source.replace('Taco 3D Experience — Protótipo','TacoLab V7 — GLB real')
 .replace('EXPERIÊNCIA 3D • PROTÓTIPO','TACOLAB V7 • MODELO REAL')
 .replace(/<script type="module">[\s\S]*?<\/script>/,'<script type="module" src="/tacolab-v7.js"></script>')
 .replace('</style>',`
.sticky{background:radial-gradient(ellipse at 72% 48%,#382016 0%,#150c09 52%,#0c0908 85%)}
@media(max-width:700px){.copy{top:23%;left:7vw;transform:none;max-width:86vw}.copy h1{font-size:clamp(43px,11vw,62px);line-height:.94}.copy p{max-width:240px;font-size:13px}.note{bottom:12vh;right:7vw}.tag{font-size:8px;padding:9px}header{padding:20px}}
</style>`);
 return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}
