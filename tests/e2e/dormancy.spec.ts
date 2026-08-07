import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";
import { expect, test } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./support/supabase-test-auth";

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

async function signInSession(
  context: BrowserContext,
  baseURL: string | undefined,
  credentials: { email: string; password: string },
) {
  const env = loadSupabaseTestEnv();
  const cookies = await signInWithPasswordCookies(env, credentials);
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));
}

async function createAdminSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-dormancy-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-dormancy-admin-password-Aa1!";
  const name = `관리자-${randomUUID().slice(0, 8)}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("관리자 테스트 사용자 생성에 실패했습니다.");
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

  const { error: roleError } = await admin
    .from("profile_roles")
    .insert({ profile_id: data.user.id, role: "admin" });
  if (roleError) {
    throw roleError;
  }

  await signInSession(context, baseURL, { email, password });

  return { id: data.user.id, name };
}

async function createWorkerWithStatus(
  context: BrowserContext,
  baseURL: string | undefined,
  emailPrefix: string,
  namePrefix: string,
  status: "active" | "dormant" | "departed",
) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `${emailPrefix}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-dormancy-worker-password-Aa1!";
  const name = `${namePrefix}-${randomUUID().slice(0, 8)}`;
  const phone = randomPhone();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("근무자 테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name,
    phone,
    gender: "female",
    birth_date: "1992-02-02",
    status,
    inactivity_anchor_at: status === "departed" ? null : new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  await signInSession(context, baseURL, { email, password });

  return { id: data.user.id, name, email, password };
}

test.describe("휴면 계정 상태와 접근 차단", () => {
  test("관리자가 근무자를 휴면 처리하면 대상은 즉시 차단되고 본인이 재활성화해 홈으로 돌아온다", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext();
    await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const targetContext = await browser.newContext();
    const target = await createWorkerWithStatus(
      targetContext,
      baseURL,
      "e2e-dormancy-target",
      "휴면대상근무자",
      "active",
    );
    const targetPage = await targetContext.newPage();

    await targetPage.goto("/schedule");
    await expect(targetPage).toHaveURL(/\/schedule$/);

    await adminPage.goto(`/admin/workers/${target.id}`);
    await expect(adminPage.getByRole("heading", { name: target.name })).toBeVisible();
    await adminPage.getByRole("button", { name: "수동 휴면" }).click();
    await adminPage.getByRole("button", { name: "휴면 처리" }).click();
    await expect(adminPage.getByRole("button", { name: "재활성화" })).toBeVisible();

    await targetPage.goto("/schedule");
    await expect(targetPage).toHaveURL(/\/dormant$/);
    await expect(targetPage.getByRole("heading")).toHaveText("휴면 상태예요");
    await expect(targetPage.getByText(/자동 탈퇴 예정일/)).toBeVisible();

    await targetPage.getByRole("button", { name: "다시 활동하기" }).click();
    await expect(targetPage).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await targetPage.goto("/schedule");
    await expect(targetPage).toHaveURL(/\/schedule$/);

    await adminContext.close();
    await targetContext.close();
  });

  test("관리자가 휴면 근무자를 재활성화하면 그 근무자는 다시 서비스를 이용할 수 있다", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext();
    await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const targetContext = await browser.newContext();
    const target = await createWorkerWithStatus(
      targetContext,
      baseURL,
      "e2e-dormancy-reactivate",
      "재활성화대상근무자",
      "dormant",
    );
    const targetPage = await targetContext.newPage();

    await targetPage.goto("/schedule");
    await expect(targetPage).toHaveURL(/\/dormant$/);

    await adminPage.goto(`/admin/workers/${target.id}`);
    await expect(adminPage.getByRole("heading", { name: target.name })).toBeVisible();
    await adminPage.getByRole("button", { name: "재활성화" }).click();
    await adminPage.getByRole("button", { name: "재활성화하기" }).click();
    await expect(adminPage.getByRole("button", { name: "수동 휴면" })).toBeVisible();

    await targetPage.goto("/schedule");
    await expect(targetPage).toHaveURL(/\/schedule$/);

    await adminContext.close();
    await targetContext.close();
  });

  test("탈퇴 처리된 사용자는 /departed 안내만 보고 재활성화 경로가 없다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await createWorkerWithStatus(
      context,
      baseURL,
      "e2e-dormancy-departed",
      "탈퇴대상근무자",
      "departed",
    );
    const page = await context.newPage();

    await page.goto("/schedule");
    await expect(page).toHaveURL(/\/departed$/);
    await expect(page.getByRole("heading")).toHaveText("탈퇴 처리된 계정이에요");
    await expect(page.getByRole("button")).toHaveCount(0);

    await page.goto("/dormant");
    await expect(page).toHaveURL(/\/departed$/);

    await context.close();
  });
});
