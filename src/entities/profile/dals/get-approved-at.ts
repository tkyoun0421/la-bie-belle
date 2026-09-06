import type { SupabaseClient } from "@supabase/supabase-js";

export async function getApprovedAt(
  client: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await client
    .from("profiles")
    .select("approved_at")
    .eq("id", userId)
    .maybeSingle<{ approved_at: string | null }>();

  if (error) {
    throw error;
  }

  return data?.approved_at ?? null;
}
