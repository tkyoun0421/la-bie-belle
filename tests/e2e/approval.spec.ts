import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import type { BrowserContext, Page } from "@playwright/test";
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
  const email = `e2e-approval-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-approval-admin-password-Aa1!";
  const name = `승인관리자-${randomUUID().slice(0, 8)}`;

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

async function createPendingApplicant(
  context: BrowserContext,
  baseURL: string | undefined,
  emailPrefix: string,
) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `${emailPrefix}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-approval-applicant-password-Aa1!";
  const name = `신청자-${randomUUID().slice(0, 8)}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("신청자 테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name,
    phone: randomPhone(),
    gender: "female",
    birth_date: "1992-02-02",
    status: "pending",
  });
  if (profileError) {
    throw profileError;
  }

  await signInSession(context, baseURL, { email, password });

  return { id: data.user.id, name };
}

async function createActiveNonAdmin(
  context: BrowserContext,
  baseURL: string | undefined,
  emailPrefix: string,
) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `${emailPrefix}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-approval-nonadmin-password-Aa1!";
  const name = `일반근무자-${randomUUID().slice(0, 8)}`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("일반 근무자 테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name,
    phone: randomPhone(),
    gender: "male",
    birth_date: "1990-01-01",
    status: "active",
  });
  if (profileError) {
    throw profileError;
  }

  await signInSession(context, baseURL, { email, password });

  return { id: data.user.id, name };
}

async function openApprovalRow(adminPage: Page, applicantName: string) {
  await adminPage.goto("/admin/approvals");
  const row = adminPage.locator("li", { hasText: applicantName });
  await expect(row).toBeVisible();
  return row;
}

test.describe("관리자 가입 승인", () => {
  test("관리자가 승인하면 목록에서 사라지고 대상은 다음 요청부터 근무자 홈에 들어간다", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext();
    await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const applicantContext = await browser.newContext();
    const applicant = await createPendingApplicant(applicantContext, baseURL, "e2e-approval-approve");
    const applicantPage = await applicantContext.newPage();

    const row = await openApprovalRow(adminPage, applicant.name);
    await row.getByRole("button", { name: "승인" }).click();
    await expect(row).toHaveCount(0);

    await applicantPage.goto("/");
    await expect(applicantPage).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await adminContext.close();
    await applicantContext.close();
  });

  test("관리자가 사유와 함께 거절하면 대상은 /rejected로 가고 사유는 노출되지 않는다", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext();
    await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const applicantContext = await browser.newContext();
    const applicant = await createPendingApplicant(applicantContext, baseURL, "e2e-approval-reject");
    const applicantPage = await applicantContext.newPage();

    const row = await openApprovalRow(adminPage, applicant.name);
    await row.getByRole("button", { name: "거절" }).click();
    await adminPage.getByLabel("거절 사유(선택)").fill("제출 서류가 불완전해요");
    await adminPage.getByRole("button", { name: "거절하기" }).click();
    await expect(row).toHaveCount(0);

    await applicantPage.goto("/");
    await expect(applicantPage).toHaveURL(/\/rejected$/);
    await expect(applicantPage.getByText("제출 서류가 불완전해요")).not.toBeVisible();

    await adminContext.close();
    await applicantContext.close();
  });

  test("비관리자는 /admin/approvals에 접근할 수 없다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    await createActiveNonAdmin(context, baseURL, "e2e-approval-nonadmin");
    const page = await context.newPage();

    await page.goto("/admin/approvals");

    await expect(page).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await context.close();
  });
});
