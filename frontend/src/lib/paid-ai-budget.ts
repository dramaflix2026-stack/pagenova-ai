import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Internal anti-abuse guard for legacy routes that contact paid AI providers.
 * These are daily request ceilings, NOT subscription credits or dollar costs.
 * UTC calendar day; atomic counters are held in the private Supabase schema.
 * If the database is unavailable we fail closed before contacting the provider.
 */
export const PAID_AI_DAILY_LIMITS = {
  legacy_site_copy: 80,
  legacy_site_image: 20,
  legacy_site_brief: 40,
  site_attachment_analysis: 30,
  universal_template_copy: 40,
} as const;

export type PaidAiAction = keyof typeof PAID_AI_DAILY_LIMITS;
type BudgetResult =
  | { ok: true }
  | { ok: false; status: 429 | 503; message: string };

export async function reservePaidAiBudget(
  admin: SupabaseClient,
  ownerId: string,
  action: PaidAiAction,
): Promise<BudgetResult> {
  if (!/^[0-9a-f-]{36}$/i.test(ownerId)) {
    return { ok: false, status: 503, message: "Não foi possível confirmar sua conta." };
  }
  try {
    const { data, error } = await admin.rpc("pagenova_paid_ai_reserve", {
      p_owner_id: ownerId,
      p_action: action,
      p_limit: PAID_AI_DAILY_LIMITS[action],
    });
    if (error || typeof data !== "boolean") {
      console.error("[PageNova AI Budget] Private quota unavailable", {
        action,
        code: error?.code || "INVALID_RESULT",
      });
      return { ok: false, status: 503, message: "Limite de segurança indisponível. Nenhuma chamada de IA foi iniciada." };
    }
    if (!data) return {
      ok: false, status: 429,
      message: "Limite diário de segurança para esta operação atingido. Tente novamente amanhã.",
    };
    return { ok: true };
  } catch {
    return {
      ok: false, status: 503,
      message: "Não foi possível validar o limite de uso. Nenhuma chamada de IA foi iniciada.",
    };
  }
}
