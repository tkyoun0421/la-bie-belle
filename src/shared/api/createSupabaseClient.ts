import { createClient } from "@supabase/supabase-js";
import type { Database, DB } from "@/shared/api/database";
import { sessionStorage } from "@/shared/lib/sessionStorage.lib";

export function createSupabaseClient(url: string, anonKey: string): DB {
  return createClient<Database>(url, anonKey, {
    auth: {
      storage: sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
}
