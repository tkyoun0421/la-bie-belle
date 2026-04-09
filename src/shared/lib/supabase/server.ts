import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicEnv } from "#/shared/config/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getPublicEnv();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, options, value }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
