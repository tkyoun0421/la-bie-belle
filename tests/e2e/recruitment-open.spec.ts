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
  const email = `e2e-recruitment-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-recruitment-admin-password-Aa1!";
  const name = `모집관리자-${randomUUID().slice(0, 8)}`;

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

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  return { admin, id: data.user.id, name };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function nextMonthAnchor(): { year: number; month: number } {
  const now = new Date();
  const monthIndex = now.getMonth() + 1;
  const year = now.getFullYear() + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return { year, month };
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

test.describe("관리자 모집 일괄 오픈", () => {
  test("기존 활성 모집 날짜는 관리 대상으로 탭할 수 있고, 새 날짜를 선택해 모집을 열면 성공 안내와 함께 해당 날짜도 관리 대상으로 바뀐다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const { year, month } = nextMonthAnchor();
    const existingDay = 10;
    const selectDayA = 2;
    const selectDayB = 3;
    const existingDate = dateKey(year, month, existingDay);
    const selectDateA = dateKey(year, month, selectDayA);
    const selectDateB = dateKey(year, month, selectDayB);

    const { error: scheduleError } = await admin
      .from("schedules")
      .insert({ work_date: existingDate, application_deadline: existingDate });
    if (scheduleError) {
      throw scheduleError;
    }

    await page.goto(`/admin/recruitment?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { name: "모집 오픈" })).toBeVisible();

    const existingCell = page.getByRole("button", { name: `${month}월 ${existingDay}일 신청 가능` });
    await expect(existingCell).toBeVisible();
    await expect(existingCell).not.toBeDisabled();

    const cellA = page.getByRole("button", { name: `${month}월 ${selectDayA}일 선택 가능` });
    const cellB = page.getByRole("button", { name: `${month}월 ${selectDayB}일 선택 가능` });
    await expect(cellA).not.toBeDisabled();
    await expect(cellB).not.toBeDisabled();
    await cellA.click();
    await cellB.click();

    await expect(page.getByText("2개 선택")).toBeVisible();

    await page.getByLabel("마감일").fill(selectDateA);
    await page.getByRole("button", { name: "모집 오픈" }).click();

    await expect(page.getByText("모집 2건을 열었어요")).toBeVisible();

    await expect(
      page.getByRole("button", { name: `${month}월 ${selectDayA}일 신청 가능` }),
    ).not.toBeDisabled();
    await expect(
      page.getByRole("button", { name: `${month}월 ${selectDayB}일 신청 가능` }),
    ).not.toBeDisabled();

    await context.close();
  });

  test("비관리자는 /admin/recruitment에 접근할 수 없다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const env = loadSupabaseTestEnv();
    const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
    const email = `e2e-recruitment-worker-${randomUUID()}@labiebelle.test`;
    const password = "e2e-recruitment-worker-password-Aa1!";

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
      birth_date: "1991-01-01",
      status: "active",
      inactivity_anchor_at: new Date().toISOString(),
    });
    if (profileError) {
      throw profileError;
    }

    const cookies = await signInWithPasswordCookies(env, { email, password });
    const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
    await context.addCookies(toPlaywrightCookies(cookies, domain));
    const page = await context.newPage();

    await page.goto("/admin/recruitment");

    await expect(page).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");

    await context.close();
  });
});
