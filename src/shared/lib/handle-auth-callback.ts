import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthCallbackResult =
  { ok: true } | { ok: false; reason: "missing_code" | "exchange_failed" };

/**
 * PKCE라서 딥링크는 세션이 아니라 코드를 싣고 온다. 코드를 세션으로 바꾸는 일과
 * 어디로 보낼지 정하는 일은 주인이 다르다 — 새로 들어온 사람은 교환에 성공해도
 * 홈이 아니라 승인 대기다. 그래서 여기는 성공 여부까지만 알린다.
 */
export async function handleAuthCallback(
  code: string | null,
  client: SupabaseClient,
): Promise<AuthCallbackResult> {
  if (!code) {
    return { ok: false, reason: "missing_code" };
  }

  const { error } = await client.auth.exchangeCodeForSession(code);

  return error ? { ok: false, reason: "exchange_failed" } : { ok: true };
}
