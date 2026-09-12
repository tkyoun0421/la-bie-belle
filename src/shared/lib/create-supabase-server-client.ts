import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { readSupabaseEnv } from "@/shared/lib/read-supabase-env";

export type ServerCookieStore = {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options: CookieOptions) => void;
  setHeader?: (name: string, value: string) => void;
};

type CookiesToSet = { name: string; value: string; options: CookieOptions }[];

function writeCookiesIgnoringReadOnlyStore(
  cookieStore: ServerCookieStore,
  cookiesToSet: CookiesToSet,
) {
  try {
    for (const { name, value, options } of cookiesToSet) {
      cookieStore.set(name, value, options);
    }
  } catch {
    return;
  }
}

export function createSupabaseServerClient(cookieStore: ServerCookieStore) {
  const { url, anonKey } = readSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet, headers) => {
        writeCookiesIgnoringReadOnlyStore(cookieStore, cookiesToSet);

        for (const [name, value] of Object.entries(headers)) {
          cookieStore.setHeader?.(name, value);
        }
      },
    },
  });
}
