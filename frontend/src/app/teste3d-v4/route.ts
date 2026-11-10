import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Independent TacoLab motion experiment. Uses the original approved WebGL
 * scroll motor, not the V3 photo-swapping engine. V1 and V3 remain untouched.
 */
export async function GET() {
  const source = await readFile(join(process.cwd(), "public", "teste3d-demo.html"), "utf8");
  const html = source
    .replace("Taco 3D Experience — Protótipo", "TacoLab V4 — Movimento 3D real")
    .replace("EXPERIÊNCIA 3D • PROTÓTIPO", "TACOLAB V4 • MOVIMENTO REAL")
    .replace("É uma explosão de sabores. Role a página e descubra cada camada.", "Gire o taco e explore cada camada com o movimento do seu dedo.")
    .replace("const shell=mat(0xe7a653),beef=mat(0x6a3020),lettuce=mat(0x62b83e),tomato=mat(0xe94c32),cheese=mat(0xffca3e);",
      "const shell=mat(0xd99b48,.9),beef=mat(0x63301d,.98),lettuce=mat(0x478b31,.85),tomato=mat(0xd53d24,.72),cheese=mat(0xf6b32f,.65);")
    .replace("const rim=new THREE.PointLight(0xff5722,65)", "const rim=new THREE.PointLight(0xff5722,38)")
    .replace("root.scale.setScalar(innerWidth>700?1.23:.86)", "root.scale.setScalar(innerWidth>700?1.32:.93)")
    .replace("root.rotation.y=-.45+rotate*Math.PI*2.2", "root.rotation.y=-.45+rotate*Math.PI*2.2")
    .replace("</style>", `
/* V4 test: original smooth 3D motion, darker cinematic product lighting */
.sticky{background:radial-gradient(ellipse at 70% 48%,#382116 0%,#150d0a 50%,#0d0907 85%)}
canvas{filter:contrast(1.08) saturate(1.12)}
@media(max-width:700px){.copy{top:24%}.note{bottom:13vh}}
</style>`);
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
