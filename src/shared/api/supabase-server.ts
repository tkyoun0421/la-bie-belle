import "server-only";

import { createServerClient } from "@supabase/ssr";

import { env } from "@/shared/config/env.server";

export function createSupabaseServerClient() {
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return [];
      },
    },
  });
}
