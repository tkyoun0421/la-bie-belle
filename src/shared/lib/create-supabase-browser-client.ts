import { createBrowserClient } from "@supabase/ssr";

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(
      `환경 변수 ${name} 값이 비어 있다. NEXT_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.`,
    );
  }

  return value;
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    requireEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  );
}
