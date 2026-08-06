import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/shared/config/env.server";

const READONLY_COOKIES_ERROR_CODE = "E1180";

function isReadonlyCookiesError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "__NEXT_ERROR_CODE" in error &&
    (error as { __NEXT_ERROR_CODE?: unknown }).__NEXT_ERROR_CODE === READONLY_COOKIES_ERROR_CODE
  );
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (error) {
          if (!isReadonlyCookiesError(error)) {
            throw error;
          }
        }
      },
    },
  });
}
