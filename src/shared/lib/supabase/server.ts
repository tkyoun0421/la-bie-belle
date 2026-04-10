import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "#/shared/config/env";
import type { Database } from "#/shared/types/database";

type CreateSupabaseServerClientOptions = {
  canSetCookies?: boolean;
};

export async function createSupabaseServerClient(
  _options: CreateSupabaseServerClientOptions = {}
) {
  void _options;

  const cookieStore = await cookies();
  const env = getPublicEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, options, value }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot mutate cookies directly.
            // Proxy refreshes the session before render.
          }
        },
      },
    }
  );
}
