import { createBrowserClient } from "@supabase/ssr";
import { readSupabaseEnv } from "@/shared/lib/read-supabase-env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = readSupabaseEnv();

  return createBrowserClient(url, anonKey);
}
