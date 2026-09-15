import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureProfile(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc("ensure_profile");

  if (error) {
    throw error;
  }
}
