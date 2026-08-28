import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getCurrentUser(
  client: SupabaseClient,
): Promise<User | null> {
  const { data, error } = await client.auth.getUser();

  return error ? null : data.user;
}
