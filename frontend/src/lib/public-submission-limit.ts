import type { SupabaseClient } from "@supabase/supabase-js";

/** Atomic anti-abuse ceiling for anonymous Form and Quiz submissions.
 * Independent from customer subscription credits. The DB migration is
 * service_role-only and never accepts an owner/client-supplied threshold.
 */
export type PublicSubmissionKind = "form" | "quiz";
type Reservation =
  | { ok: true }
  | { ok: false; status: 429 | 503; message: string };

type ReserveResponse = { data: unknown; error: { code?: string } | null };
type ReserveRpc = (
  fn: "pagenova_public_submission_reserve",
  args: { p_kind: PublicSubmissionKind; p_resource_id: string },
) => Promise<ReserveResponse>;

export async function reservePublicSubmission(
  admin: SupabaseClient,
  kind: PublicSubmissionKind,
  resourceId: string,
): Promise<Reservation> {
  if (!/^[0-9a-f-]{36}$/i.test(resourceId))
    return { ok: false, status: 503, message: "Identificador da publicação inválido." };
  try {
    // Database-generated RPC signatures are not available in this app's
    // untyped Supabase client. Cast this single, server-only call narrowly.
    const call = admin.rpc.bind(admin) as unknown as ReserveRpc;
    const { data, error } = await call("pagenova_public_submission_reserve", {
      p_kind: kind,
      p_resource_id: resourceId,
    });
    if (error || typeof data !== "boolean") {
      console.error("[PageNova submissions] Private counter unavailable", {
        kind, code: error?.code || "INVALID_RESULT",
      });
      return { ok: false, status: 503, message: "Envio temporariamente indisponível." };
    }
    if (!data) return {
      ok: false, status: 429,
      message: "Esta publicação atingiu o limite diário de respostas.",
    };
    return { ok: true };
  } catch {
    return {
      ok: false, status: 503,
      message: "Não foi possível validar o limite diário de respostas.",
    };
  }
}
