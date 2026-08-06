import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { chromium, type FullConfig } from "@playwright/test";

const TEST_USER_EMAIL = "e2e-p1-t01@labiebelle.test";
const TEST_USER_PASSWORD = "e2e-p1-t01-password-Aa1!";

export const STORAGE_STATE_PATH = resolve(process.cwd(), "test-results/e2e-auth/user.json");

function parseEnvFile(path: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const content = readFileSync(path, "utf8");
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

function loadSupabaseEnv() {
  const env = parseEnvFile(resolve(process.cwd(), ".env"));
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("global-setup: .env에 Supabase URL·anon key·service role key가 모두 있어야 합니다.");
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
}

async function ensureTestUser(supabaseUrl: string, serviceRoleKey: string) {
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    throw error;
  }

  const existing = data.users.find((user) => user.email === TEST_USER_EMAIL);
  if (existing) {
    return existing;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw createError ?? new Error("global-setup: e2e 테스트 사용자 생성에 실패했습니다.");
  }
  return created.user;
}

type CapturedCookie = { name: string; value: string; options: Record<string, unknown> };

async function buildSessionCookies(supabaseUrl: string, anonKey: string) {
  const plainClient = createClient(supabaseUrl, anonKey);
  const { data: signInData, error: signInError } = await plainClient.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });
  if (signInError || !signInData.session) {
    throw signInError ?? new Error("global-setup: e2e 테스트 사용자 로그인에 실패했습니다.");
  }

  const capturedCookies: CapturedCookie[] = [];
  const cookieWritingClient = createBrowserClient(supabaseUrl, anonKey, {
    isSingleton: false,
    cookies: {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        capturedCookies.push(...cookiesToSet);
      },
    },
  });

  const { error: setSessionError } = await cookieWritingClient.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });
  if (setSessionError) {
    throw setSessionError;
  }

  return capturedCookies;
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

export default async function globalSetup(config: FullConfig) {
  const { supabaseUrl, anonKey, serviceRoleKey } = loadSupabaseEnv();

  await ensureTestUser(supabaseUrl, serviceRoleKey);
  const cookies = await buildSessionCookies(supabaseUrl, anonKey);

  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3100";
  const domain = new URL(baseURL).hostname;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies(
    cookies.map(({ name, value, options }) => ({
      name,
      value,
      domain,
      path: (options.path as string | undefined) ?? "/",
      httpOnly: Boolean(options.httpOnly),
      secure: Boolean(options.secure),
      sameSite: toPlaywrightSameSite(options.sameSite),
    })),
  );
  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
