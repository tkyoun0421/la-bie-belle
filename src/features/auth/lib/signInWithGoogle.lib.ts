import { AUTH_CALLBACK_PATH } from "@/features/auth/consts/auth.const";
import { handleAuthCallback } from "@/features/auth/lib/handleAuthCallback.lib";
import type {
  AuthWindowResult,
  GoogleSignInDeps,
  GoogleSignInResult,
} from "@/features/auth/model/auth.type";
import {
  extractAuthCode,
  makeAuthRedirectUri,
} from "@/features/auth/utils/authRedirect.utils";

async function openInAppBrowser(
  url: string,
  redirectUri: string,
): Promise<AuthWindowResult> {
  const WebBrowser = await import("expo-web-browser");

  return WebBrowser.openAuthSessionAsync(url, redirectUri);
}

export async function signInWithGoogle({
  client,
  openAuthSession = openInAppBrowser,
  redirectUri = makeAuthRedirectUri(AUTH_CALLBACK_PATH),
}: GoogleSignInDeps): Promise<GoogleSignInResult> {
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUri, skipBrowserRedirect: true },
  });

  if (error || !data.url) {
    return { ok: false, reason: "start_failed" };
  }

  const result = await openAuthSession(data.url, redirectUri);

  if (result.type !== "success") {
    return { ok: false, reason: "cancelled" };
  }

  return handleAuthCallback(extractAuthCode(result.url ?? ""), client);
}
