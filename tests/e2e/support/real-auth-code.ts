import type { BrowserContext } from "@playwright/test";

import { findMagicLinkUrl } from "./mailpit";
import {
  createCookieCapturingBrowserClient,
  toPlaywrightCookies,
  type SupabaseTestEnv,
} from "./supabase-test-auth";

export async function primeRealAuthCallback(
  context: BrowserContext,
  env: SupabaseTestEnv,
  params: { email: string; redirectTo: string; domain: string },
): Promise<string> {
  const { client, cookies } = createCookieCapturingBrowserClient(env.supabaseUrl, env.anonKey);
  const { error } = await client.auth.signInWithOtp({
    email: params.email,
    options: { emailRedirectTo: params.redirectTo },
  });
  if (error) {
    throw error;
  }

  await context.addCookies(toPlaywrightCookies(cookies, params.domain));

  return findMagicLinkUrl(params.email);
}
