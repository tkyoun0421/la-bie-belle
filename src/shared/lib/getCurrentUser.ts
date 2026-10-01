import type { User } from "@supabase/supabase-js";
import type { DB } from "@/shared/api/database";

export async function getCurrentUser(client: DB): Promise<User | null> {
  const { data, error } = await client.auth.getUser();

  return error ? null : data.user;
}
