import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const projectId = "builder-v2-default";
type VersionInput = { id?: unknown; label?: unknown; site?: unknown };

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  const { data, error } = await supabase.from("pagenova_builder_versions")
    .select("id,label,site,created_at").eq("project_id", projectId)
    .order("created_at", { ascending: false }).limit(25);
  if (error) return NextResponse.json({ error: "Não foi possível carregar o histórico na nuvem." }, { status: 503 });
  return NextResponse.json({ versions: (data ?? []).map(v => ({ id: v.id, label: v.label, site: v.site, at: v.created_at })) });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  let body: VersionInput;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Dados inválidos." }, { status: 400 }); }
  const site = body.site;
  if (!site || typeof site !== "object" || Array.isArray(site) || !Array.isArray((site as { blocks?: unknown }).blocks) || (site as { blocks: unknown[] }).blocks.length > 200 || typeof body.label !== "string" || body.label.length > 120)
    return NextResponse.json({ error: "Versão inválida." }, { status: 400 });
  const { data, error } = await supabase.from("pagenova_builder_versions").insert({
    user_id: user.id, project_id: projectId, label: body.label.trim() || "Versão salva", site
  }).select("id,label,site,created_at").single();
  if (error) return NextResponse.json({ error: "Não foi possível salvar na nuvem." }, { status: 503 });
  return NextResponse.json({ version: { id: data.id, label: data.label, site: data.site, at: data.created_at } }, { status: 201 });
}
