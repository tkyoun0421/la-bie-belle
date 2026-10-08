import type { DB } from "@/shared/api/database";

export type AuthCallbackResult =
  { ok: true } | { ok: false; reason: "missing_code" | "exchange_failed" };

export async function handleAuthCallback(
  code: string | null,
  client: DB,
): Promise<AuthCallbackResult> {
  if (!code) {
    return { ok: false, reason: "missing_code" };
  }

  const { error } = await client.auth.exchangeCodeForSession(code);

  return error ? { ok: false, reason: "exchange_failed" } : { ok: true };
}
