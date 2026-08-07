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
  const email = `e2e-worker-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-worker-admin-password-Aa1!";
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

async function createActiveWorker(
  context: BrowserContext,
  baseURL: string | undefined,
  emailPrefix: string,
  namePrefix: string,
) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `${emailPrefix}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-worker-password-Aa1!";
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
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  await signInSession(context, baseURL, { email, password });

  return { id: data.user.id, name, phone };
}

async function scopedSaveButton(page: Page, sectionHeading: string) {
  return page.locator("section", { hasText: sectionHeading }).getByRole("button", {
    name: "저장",
  });
}

test.describe("근무자 관리", () => {
  test("관리자가 근무자 개인정보·시급·포지션을 완주해 수정한다", async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext();
    await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const targetContext = await browser.newContext();
    const target = await createActiveWorker(
      targetContext,
      baseURL,
      "e2e-worker-target",
      "대상근무자",
    );

    await adminPage.goto("/admin/workers");
    await expect(adminPage.getByText(target.name)).toBeVisible();
    await adminPage.getByText(target.name).click();
    await expect(adminPage).toHaveURL(new RegExp(`/admin/workers/${target.id}$`));

    const updatedName = `${target.name}-수정`;
    await adminPage.getByLabel("이름").fill(updatedName);
    await (await scopedSaveButton(adminPage, "개인정보")).click();
    await expect(adminPage.getByRole("heading", { name: updatedName })).toBeVisible();

    await adminPage.getByLabel("시급").fill("15000");
    await (await scopedSaveButton(adminPage, "시급")).click();
    await expect(adminPage.getByText("기본 시급 적용 중")).not.toBeVisible();

    const positionSection = adminPage.locator("section", { hasText: "가능 포지션" });
    const scanRow = positionSection.locator("li", { hasText: "스캔" });
    await scanRow.getByRole("button", { name: "부여" }).click();
    await expect(scanRow.getByRole("button", { name: "회수" })).toBeVisible();

    await adminPage.reload();
    await expect(adminPage.getByRole("heading", { name: updatedName })).toBeVisible();
    await expect(adminPage.getByLabel("시급")).toHaveValue("15000");
    await expect(
      adminPage.locator("section", { hasText: "가능 포지션" }).locator("li", { hasText: "스캔" }),
    ).toContainText("회수");

    await adminContext.close();
    await targetContext.close();
  });

  test("본인이 내 정보에서 휴대폰·시급을 완주해 수정하고 이름·성별·생년월일은 표시만 된다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await createActiveWorker(context, baseURL, "e2e-worker-self", "본인근무자");
    const page = await context.newPage();

    await page.goto("/my-profile");
    await expect(page.getByText(worker.name)).toBeVisible();
    await expect(page.getByLabel("이름")).toHaveCount(0);

    const newPhone = randomPhone();
    await page.getByLabel("휴대폰 번호").fill(newPhone);
    await (await scopedSaveButton(page, "휴대폰 번호")).click();
    await expect(page.getByLabel("휴대폰 번호")).toHaveValue(newPhone);

    await page.getByLabel("시급").fill("13000");
    await (await scopedSaveButton(page, "시급")).click();
    await expect(page.getByText("기본 시급 적용 중")).not.toBeVisible();

    await page.reload();
    await expect(page.getByLabel("휴대폰 번호")).toHaveValue(newPhone);
    await expect(page.getByLabel("시급")).toHaveValue("13000");

    await context.close();
  });

  test("비관리자는 근무자 목록·상세에 접근할 수 없다", async ({ browser, baseURL }) => {
    const adminContext = await browser.newContext();
    await createAdminSession(adminContext, baseURL);

    const targetContext = await browser.newContext();
    const target = await createActiveWorker(
      targetContext,
      baseURL,
      "e2e-worker-blocked-target",
      "차단대상근무자",
    );
    await targetContext.close();

    const nonAdminContext = await browser.newContext();
    const nonAdmin = await createActiveWorker(
      nonAdminContext,
      baseURL,
      "e2e-worker-nonadmin",
      "일반근무자",
    );
    const nonAdminPage = await nonAdminContext.newPage();

    await nonAdminPage.goto("/admin/workers");
    await expect(nonAdminPage).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await nonAdminPage.goto(`/admin/workers/${target.id}`);
    await expect(nonAdminPage).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await expect(nonAdminPage.getByText(nonAdmin.phone)).not.toBeVisible();

    await adminContext.close();
    await nonAdminContext.close();
  });
});
