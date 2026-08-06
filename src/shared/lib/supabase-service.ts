import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/shared/config/env.server";

export function createSupabaseServiceClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
