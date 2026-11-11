import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
const original=await readFile(join(process.cwd(),'public','teste3d-v3-demo.html'),'utf8');
const html=original.replace('TacoLab 2.5D • Fotos reais','TacoLab V9 • PageNova Motion Engine').replace(/<script>const journey=[\s\S]*?<\/script>/,'<script src="/pagenova-motion-engine.js" defer></script><script src="/tacolab-v9.js" defer></script>').replace('</style>','.photo img{transition:none!important}.photo{isolation:isolate}</style>');
return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
}
