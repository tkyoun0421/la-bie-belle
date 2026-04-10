import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "#/shared/config/env";
import type { Database } from "#/shared/types/database";

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const env = getServerEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
