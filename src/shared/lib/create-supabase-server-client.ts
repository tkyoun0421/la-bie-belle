import { createServerClient, type CookieOptions } from "@supabase/ssr";

export type ServerCookieStore = {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options: CookieOptions) => void;
  setHeader?: (name: string, value: string) => void;
};

type CookiesToSet = { name: string; value: string; options: CookieOptions }[];

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `환경 변수 ${name} 값이 비어 있다. NEXT_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.`,
    );
  }

  return value;
}

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
  return createServerClient(
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet, headers) => {
          writeCookiesIgnoringReadOnlyStore(cookieStore, cookiesToSet);

          for (const [name, value] of Object.entries(headers)) {
            cookieStore.setHeader?.(name, value);
          }
        },
      },
    },
  );
}
