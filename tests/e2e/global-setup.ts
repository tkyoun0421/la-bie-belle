import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { chromium, type FullConfig } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
  type SupabaseTestEnv,
} from "./support/supabase-test-auth";
import {
  resolveSuperAdminFixtureEmail,
  SUPER_ADMIN_FIXTURE_PASSWORD,
} from "./support/super-admin-fixture";

const TEST_USER_EMAIL = "e2e-p1-t01@labiebelle.test";
const TEST_USER_PASSWORD = "e2e-p1-t01-password-Aa1!";

export const STORAGE_STATE_PATH = resolve(process.cwd(), "test-results/e2e-auth/user.json");

async function ensureTestUser(env: SupabaseTestEnv) {
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
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

async function ensureSuperAdminFixtureUser(env: SupabaseTestEnv) {
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = resolveSuperAdminFixtureEmail();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    throw error;
  }

  const existing = data.users.find((user) => user.email === email);
  if (existing) {
    return existing;
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: SUPER_ADMIN_FIXTURE_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw (
      createError ?? new Error("global-setup: SUPER_ADMIN_EMAIL 픽스처 사용자 생성에 실패했습니다.")
    );
  }
  return created.user;
}

async function ensureActiveProfile(env: SupabaseTestEnv, userId: string) {
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const { error } = await admin.from("profiles").upsert({
    id: userId,
    name: "이바비",
    phone: "01000000001",
    gender: "female",
    birth_date: "1990-01-01",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (error) {
    throw error;
  }
}

export default async function globalSetup(config: FullConfig) {
  const env = loadSupabaseTestEnv();

  const user = await ensureTestUser(env);
  await ensureActiveProfile(env, user.id);
  await ensureSuperAdminFixtureUser(env);
  const cookies = await signInWithPasswordCookies(env, {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });

  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3100";
  const domain = new URL(baseURL).hostname;

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies(toPlaywrightCookies(cookies, domain));
  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
