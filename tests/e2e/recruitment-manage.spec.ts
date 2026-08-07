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

async function createAdminSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-recruitment-manage-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-recruitment-manage-admin-password-Aa1!";

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
    name: `모집관리자-${randomUUID().slice(0, 8)}`,
    phone: randomPhone(),
    gender: "male",
    birth_date: "1985-01-01",
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

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  return { admin, id: data.user.id };
}

async function createWorkerSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-recruitment-manage-worker-${randomUUID()}@labiebelle.test`;
  const password = "e2e-recruitment-manage-worker-password-Aa1!";

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
    name: `근무자-${randomUUID().slice(0, 8)}`,
    phone: randomPhone(),
    gender: "female",
    birth_date: "1992-02-02",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  return { id: data.user.id };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function manageMonthAnchor(): { year: number; month: number } {
  const now = new Date();
  const monthIndex = now.getMonth() + 2;
  const year = now.getFullYear() + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return { year, month };
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

test.describe("관리자 모집 마감 연장·재오픈", () => {
  test("OPEN 날짜를 연장하고 CLOSED 날짜를 재오픈하면 근무자 신청이 다시 가능해진다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const { year, month } = manageMonthAnchor();
    const openDay = 12;
    const closedDay = 18;
    const openWorkDate = dateKey(year, month, openDay);
    const closedWorkDate = dateKey(year, month, closedDay);
    const openInitialDeadline = dateKey(year, month, 1);

    const { error: openScheduleError } = await admin
      .from("schedules")
      .insert({ work_date: openWorkDate, application_deadline: openInitialDeadline });
    if (openScheduleError) {
      throw openScheduleError;
    }

    const { error: closedScheduleError } = await admin
      .from("schedules")
      .insert({ work_date: closedWorkDate, application_deadline: closedWorkDate });
    if (closedScheduleError) {
      throw closedScheduleError;
    }
    const { error: closeError } = await admin
      .from("schedules")
      .update({ status: "CLOSED" })
      .eq("work_date", closedWorkDate);
    if (closeError) {
      throw closeError;
    }

    await page.goto(`/admin/recruitment?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { name: "모집 오픈" })).toBeVisible();

    const openCell = page.getByRole("button", { name: `${month}월 ${openDay}일 신청 가능` });
    await expect(openCell).toBeVisible();
    await expect(openCell).not.toBeDisabled();
    await openCell.click();

    const extendDialog = page.getByRole("dialog", { name: "마감일 연장" });
    await expect(extendDialog).toBeVisible();
    await extendDialog.getByLabel("새 마감일").fill(openWorkDate);
    await extendDialog.getByRole("button", { name: "저장" }).click();

    await expect(page.getByText("마감일을 연장했어요")).toBeVisible();
    await expect(extendDialog).not.toBeVisible();

    await openCell.click();
    await expect(page.getByRole("dialog", { name: "마감일 연장" }).getByLabel("새 마감일")).toHaveValue(
      openWorkDate,
    );
    await page.keyboard.press("Escape");

    const closedCell = page.getByRole("button", { name: `${month}월 ${closedDay}일 마감` });
    await expect(closedCell).toBeVisible();
    await expect(closedCell).not.toBeDisabled();
    await closedCell.click();

    const reopenDialog = page.getByRole("dialog", { name: "모집 재오픈" });
    await expect(reopenDialog).toBeVisible();
    await reopenDialog.getByLabel("새 마감일").fill(closedWorkDate);
    await reopenDialog.getByRole("button", { name: "재오픈" }).click();

    await expect(page.getByText("모집을 다시 열었어요")).toBeVisible();
    await expect(
      page.getByRole("button", { name: `${month}월 ${closedDay}일 신청 가능` }),
    ).toBeVisible();

    await context.close();

    const workerContext = await browser.newContext();
    await createWorkerSession(workerContext, baseURL);
    const workerPage = await workerContext.newPage();

    await workerPage.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(workerPage.getByRole("heading", { name: "일정" })).toBeVisible();
    await expect(
      workerPage.getByRole("button", { name: `${month}월 ${closedDay}일 신청 가능` }),
    ).toBeVisible();

    await workerContext.close();
  });

  test("비관리자는 /admin/recruitment에 접근할 수 없다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    await createWorkerSession(context, baseURL);
    const page = await context.newPage();

    await page.goto("/admin/recruitment");

    await expect(page).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await context.close();
  });
});
