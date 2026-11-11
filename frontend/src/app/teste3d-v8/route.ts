import {readFile} from "node:fs/promises";
import {join} from "node:path";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
 const source=await readFile(join(process.cwd(),"public","teste3d-v3-demo.html"),"utf8");
 const html=source
 .replace("TacoLab 2.5D • Fotos reais","TacoLab V8 • Estudo de sequência fotográfica")
 .replace("EXPERIMENTO 2.5D","V8 • ESTUDO CINEMATOGRÁFICO")
 .replace(/<script>const journey=[\s\S]*?<\/script>/,'<script src="/tacolab-v8.js" defer></script>')
 .replace("</style>",`
.photo img{transition:none!important;transform-style:preserve-3d;filter:contrast(1.08) saturate(1.08) drop-shadow(0 22px 28px #0009)}
.photo{isolation:isolate}
@media(max-width:600px){.photo{inset:44% 0 13%}.photo img{width:91vw}}
</style>`);
 return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
}
