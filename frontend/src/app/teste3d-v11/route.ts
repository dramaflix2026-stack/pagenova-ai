import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){const source=await readFile(join(process.cwd(),'public','teste3d-v3-demo.html'),'utf8');
const html=source.replace('TacoLab 2.5D • Fotos reais','TacoLab V11 • Fotografia e composição mobile').replace(/<script>const journey=[\s\S]*?<\/script>/,'<script src="/pagenova-motion-engine.js" defer></script><script src="/tacolab-v11.js" defer></script>').replace('</style>','.photo img{transition:none!important}.photo{isolation:isolate}</style>');
return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});}
