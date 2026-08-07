import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./support/supabase-test-auth";
import {
  resolveSuperAdminFixtureEmail,
  SUPER_ADMIN_FIXTURE_PASSWORD,
} from "./support/super-admin-fixture";

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

async function submitOnboardingForm(page: Page, phone: string) {
  await page.getByLabel("이름").fill("최초관리자");
  await page.getByLabel("휴대폰 번호").fill(phone);
  await page.getByRole("button", { name: /성별/ }).click();
  await page.getByRole("option", { name: "남성" }).click();
  await page.getByLabel("생년월일").fill("1990-01-01");
  await page.getByRole("button", { name: "가입 신청하기" }).click();
}

async function createActiveWorker(
  context: BrowserContext,
  baseURL: string | undefined,
  emailPrefix: string,
) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `${emailPrefix}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-roles-password-Aa1!";
  const name = `역할대상-${randomUUID().slice(0, 8)}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name,
    phone: randomPhone(),
    gender: "male",
    birth_date: "1990-01-01",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  return { id: data.user.id, name };
}

test.describe.serial("역할과 최초 슈퍼 관리자", () => {
  let superContext: BrowserContext;
  let superPage: Page;
  let target: { id: string; name: string };
  let targetContext: BrowserContext;
  let targetPage: Page;

  test.afterAll(async () => {
    await superContext?.close();
    await targetContext?.close();
  });

  test("SUPER_ADMIN_EMAIL 일치자가 온보딩을 완료하면 자동으로 승격되어 관리자 홈에 들어간다", async ({
    browser,
    baseURL,
  }) => {
    const env = loadSupabaseTestEnv();
    const email = resolveSuperAdminFixtureEmail();
    const cookies = await signInWithPasswordCookies(env, {
      email,
      password: SUPER_ADMIN_FIXTURE_PASSWORD,
    });
    const domain = new URL(baseURL ?? "http://localhost:3100").hostname;

    superContext = await browser.newContext();
    await superContext.addCookies(toPlaywrightCookies(cookies, domain));
    superPage = await superContext.newPage();

    await superPage.goto("/onboarding");
    await submitOnboardingForm(superPage, randomPhone());

    await expect(superPage).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await superPage.goto("/admin");
    await expect(superPage).toHaveURL(/\/admin$/);
    await expect(superPage.getByRole("heading", { name: "관리자" })).toBeVisible();
  });

  test("슈퍼 관리자가 /admin/roles에서 active 근무자를 admin으로 임명하면 목록에 반영된다", async ({
    browser,
    baseURL,
  }) => {
    targetContext = await browser.newContext();
    target = await createActiveWorker(targetContext, baseURL, "e2e-roles-target");

    await superPage.goto("/admin/roles");
    const targetRow = superPage.locator("li", { hasText: target.name });
    await expect(targetRow.getByRole("button", { name: "임명" })).toBeVisible();
    await targetRow.getByRole("button", { name: "임명" }).click();
    await expect(targetRow.getByRole("button", { name: "해제" })).toBeVisible();
  });

  test("임명된 admin은 /admin에 들어가지만 /admin/roles은 다시 /admin으로 보내진다", async () => {
    targetPage = await targetContext.newPage();

    await targetPage.goto("/admin");
    await expect(targetPage).toHaveURL(/\/admin$/);

    await targetPage.goto("/admin/roles");
    await expect(targetPage).toHaveURL(/\/admin$/);
  });

  test("해제하면 같은 세션에서 즉시 /admin 접근이 차단된다", async ({ baseURL }) => {
    await superPage.goto("/admin/roles");
    const targetRow = superPage.locator("li", { hasText: target.name });
    await targetRow.getByRole("button", { name: "해제" }).click();
    await expect(targetRow.getByRole("button", { name: "임명" })).toBeVisible();

    await targetPage.goto("/admin");
    await expect(targetPage).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");
  });

  test("비관리자가 /admin에 접근하면 홈으로 리다이렉트된다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    await createActiveWorker(context, baseURL, "e2e-roles-nonadmin");
    const page = await context.newPage();

    await page.goto("/admin");

    await expect(page).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await context.close();
  });
});
