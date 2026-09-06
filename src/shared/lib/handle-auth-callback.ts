import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthDestination } from "@/shared/lib/resolve-auth-destination";

export async function handleAuthCallback(
  code: string | null,
  client: SupabaseClient,
): Promise<AuthDestination> {
  if (!code) {
    return "/login";
  }

  const { error } = await client.auth.exchangeCodeForSession(code);

  return error ? "/login" : "/";
}
