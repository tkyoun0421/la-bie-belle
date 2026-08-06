import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export type SupabaseTestEnv = {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
};

function parseEnvFile(path: string): Record<string, string> {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return {};
  }

  const entries: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    entries[trimmed.slice(0, separatorIndex)] = trimmed.slice(separatorIndex + 1);
  }
  return entries;
}

export function loadSupabaseTestEnv(): SupabaseTestEnv {
  const fromDotEnv = parseEnvFile(resolve(process.cwd(), ".env"));
  const fromDotEnvLocal = parseEnvFile(resolve(process.cwd(), ".env.local"));
  const merged = { ...fromDotEnv, ...fromDotEnvLocal };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? merged.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? merged.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? merged.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Supabase URL·anon key·service role key를 찾지 못했습니다. process.env 또는 .env.local·.env를 확인하세요.",
    );
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
}

export type CapturedCookie = { name: string; value: string; options: Record<string, unknown> };

export function createCookieCapturingBrowserClient(supabaseUrl: string, anonKey: string) {
  const cookies: CapturedCookie[] = [];

  const client = createBrowserClient(supabaseUrl, anonKey, {
    isSingleton: false,
    cookies: {
      getAll: () => cookies.map(({ name, value }) => ({ name, value })),
      setAll: (cookiesToSet) => {
        for (const cookie of cookiesToSet) {
          const index = cookies.findIndex((existing) => existing.name === cookie.name);
          if (index >= 0) {
            cookies[index] = cookie;
          } else {
            cookies.push(cookie);
          }
        }
      },
    },
  });

  return { client, cookies };
}

export async function signInWithPasswordCookies(
  env: SupabaseTestEnv,
  credentials: { email: string; password: string },
): Promise<CapturedCookie[]> {
  const plainClient = createClient(env.supabaseUrl, env.anonKey);
  const { data, error } = await plainClient.auth.signInWithPassword(credentials);
  if (error || !data.session) {
    throw error ?? new Error(`${credentials.email} 비밀번호 로그인에 실패했습니다.`);
  }

  const { client, cookies } = createCookieCapturingBrowserClient(env.supabaseUrl, env.anonKey);
  const { error: setSessionError } = await client.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  if (setSessionError) {
    throw setSessionError;
  }

  return cookies;
}

function toPlaywrightSameSite(value: unknown): "Strict" | "Lax" | "None" {
  if (value === "strict") {
    return "Strict";
  }
  if (value === "none") {
    return "None";
  }
  return "Lax";
}

export function toPlaywrightCookies(cookies: CapturedCookie[], domain: string) {
  return cookies.map(({ name, value, options }) => ({
    name,
    value,
    domain,
    path: (options.path as string | undefined) ?? "/",
    httpOnly: Boolean(options.httpOnly),
    secure: Boolean(options.secure),
    sameSite: toPlaywrightSameSite(options.sameSite),
  }));
}
