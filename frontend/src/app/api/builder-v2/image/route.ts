import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "IA não configurada." }, { status: 503 });
  let body: { description?: string; siteTitle?: string; section?: string; orientation?: "portrait" | "landscape" };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Pedido inválido." }, { status: 400 }); }
  const description = String(body.description || "").slice(0, 700);
  const title = String(body.siteTitle || "").slice(0, 160);
  const section = String(body.section || "").slice(0, 100);
  if (!title || !description) return NextResponse.json({ error: "Descreva a imagem." }, { status: 400 });
  const orientation = body.orientation === "portrait" ? "portrait" : "landscape";
  const bucket = "site-images";
  const architecture = /arquitet|interior|atelier|ateli[eê]|design de espa[cç]os/i.test(title);
  const healthcare = !architecture && /cl[ií]nica|sa[uú]de|fisioterap|m[eé]dic|odonto|terapia/i.test(title);
  const nicheGuard = architecture
    ? "STRICT SUBJECT RULE: this is an ARCHITECTURE AND INTERIOR DESIGN business. Photograph architecture only: contemporary residential interiors, elegant living rooms, architectural facades, furniture details, natural materials, spaces and lighting. Absolutely NO doctors, nurses, medical appointments, physiotherapy, massage, treatment beds, patients, examinations or healthcare scenes. No people unless explicitly requested and relevant to architectural practice."
    : healthcare ? "STRICT SUBJECT RULE: depict a healthcare setting only when relevant to the specific business. Avoid suggesting identifiable real employees or patients."
    : "STRICT SUBJECT RULE: the image must depict the actual industry described by the business title, not a generic clinic, doctor, massage or physiotherapy session.";
  const prompt = [
    "Create one highly realistic premium editorial photograph for a professional website.",
    "Business context: " + title + ". Website section: " + section + ".",
    nicheGuard,
    "Subject: " + description + ".",
    "Natural window light, believable textures, restrained colors, subtle imperfections, realistic camera optics and shadows.",
    orientation === "portrait" ? "Vertical mobile composition 2:3, clear subject, safe crop margins." : "Wide horizontal desktop composition 3:2, clear subject, safe crop margins.",
    "Avoid AI-looking glossy surfaces, fake skin, over-sharpening, exaggerated bokeh, impossible architecture, and artificial symmetry.",
    "No text, logos, watermarks, invented storefront signage, invented identifiable staff, or fabricated certificates.",
    "This is illustrative photography, not a claim to depict the actual business. Compose with room for website text."
  ].join(" ");
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1-mini", prompt, size: orientation === "portrait" ? "1024x1536" : "1536x1024", quality: "medium", n: 1 }),
      signal: AbortSignal.timeout(75000)
    });
    if (!response.ok) throw new Error("image-api-" + response.status);
    const payload = await response.json();
    const b64 = payload?.data?.[0]?.b64_json;
    if (typeof b64 !== "string" || !b64) throw new Error("empty-image");
    const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const filename = user.id + "/builder-v2/" + crypto.randomUUID() + ".png";
    const uploaded = await supabase.storage.from(bucket).upload(filename, binary, { contentType: "image/png", upsert: false });
    if (uploaded.error) throw new Error("storage-" + uploaded.error.message);
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(filename).data.publicUrl;
    return NextResponse.json({ src: publicUrl });
  } catch (error) {
    console.error("[builder-v2-image]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Não foi possível gerar ou armazenar a imagem. Verifique a configuração de armazenamento." }, { status: 502 });
  }
}
