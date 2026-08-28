import { execFileSync } from "node:child_process";
import type { BrowserContext } from "@playwright/test";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

type LocalSupabase = {
  apiUrl: string;
  anonKey: string;
};

let resolved: LocalSupabase | undefined;

function localSupabase(): LocalSupabase {
  if (resolved) {
    return resolved;
  }

  const output = execFileSync("supabase", ["status", "-o", "env"], {
    encoding: "utf8",
  });

  const entries = new Map(
    output
      .split("\n")
      .map((line) => /^([A-Z0-9_]+)="(.*)"$/.exec(line.trim()))
      .filter((match): match is RegExpExecArray => match !== null)
      .map(([, key, value]): [string, string] => [key, value]),
  );

  const apiUrl = entries.get("API_URL");
  const anonKey = entries.get("ANON_KEY");
  if (!apiUrl || !anonKey) {
    throw new Error("supabase status 가 API_URL 이나 ANON_KEY 를 주지 않았다.");
  }

  resolved = { apiUrl, anonKey };
  return resolved;
}

type CapturedCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function toPlaywrightSameSite(
  sameSite: CookieOptions["sameSite"],
): "Strict" | "Lax" | "None" {
  if (sameSite === "strict") {
    return "Strict";
  }
  if (sameSite === "none") {
    return "None";
  }
  return "Lax";
}

export type SeededSession = SignedInUser;

export async function seedSignedInSession(
  context: BrowserContext,
  baseURL: string,
): Promise<SeededSession> {
  const user = await createSignedInUser();
  const { data: sessionData, error: sessionError } =
    await user.client.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error(
      `방금 가입한 사용자에게서 세션을 못 읽었다: ${sessionError?.message ?? "세션 없음"}`,
    );
  }

  const { apiUrl, anonKey } = localSupabase();
  const captured: CapturedCookie[] = [];

  const serverClient = createServerClient(apiUrl, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        captured.push(...cookiesToSet);
      },
    },
  });

  const { error: setSessionError } = await serverClient.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });
  if (setSessionError) {
    throw setSessionError;
  }
  if (captured.length === 0) {
    throw new Error(
      "setSession을 불렀는데 @supabase/ssr이 쿠키를 하나도 안 냈다. 라이브러리 동작이 바뀌었을 수 있다.",
    );
  }

  const origin = new URL(baseURL);
  await context.addCookies(
    captured.map((cookie) => {
      const expires = cookie.options?.maxAge
        ? Math.floor(Date.now() / 1000) + cookie.options.maxAge
        : undefined;

      return {
        name: cookie.name,
        value: cookie.value,
        domain: origin.hostname,
        path: cookie.options?.path ?? "/",
        httpOnly: cookie.options?.httpOnly ?? false,
        secure: cookie.options?.secure ?? false,
        sameSite: toPlaywrightSameSite(cookie.options?.sameSite),
        ...(expires ? { expires } : {}),
      };
    }),
  );

  return user;
}
