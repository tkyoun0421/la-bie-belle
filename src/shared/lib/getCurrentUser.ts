import type { User } from "@supabase/supabase-js";
import type { Db } from "@/shared/api/database";

export async function getCurrentUser(client: Db): Promise<User | null> {
  const { data, error } = await client.auth.getUser();

  return error ? null : data.user;
}
