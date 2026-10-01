import { createClient } from "@supabase/supabase-js";
import type { Database, Db } from "@/shared/api/database";
import { sessionStorage } from "@/shared/lib/session-storage";

export function createSupabaseClient(url: string, anonKey: string): Db {
  return createClient<Database>(url, anonKey, {
    auth: {
      storage: sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      // 주소창이 없다. 딥링크는 세션 대신 코드를 싣고 오고 pkce가 그 코드를 받는다.
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
}
