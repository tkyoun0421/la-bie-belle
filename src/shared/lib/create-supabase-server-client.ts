import { createServerClient, type CookieOptions } from "@supabase/ssr";

export type ServerCookieStore = {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options: CookieOptions) => void;
  setHeader?: (name: string, value: string) => void;
};

export function createSupabaseServerClient(cookieStore: ServerCookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet, headers) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            return;
          }

          for (const [name, value] of Object.entries(headers)) {
            cookieStore.setHeader?.(name, value);
          }
        },
      },
    },
  );
}
