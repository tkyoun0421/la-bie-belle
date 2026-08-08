import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import type { BrowserContext, Locator } from "@playwright/test";
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

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function seoulToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function monthAnchor(minMonthsAhead: number, maxMonthsAhead: number): { year: number; month: number } {
  const now = new Date();
  const span = maxMonthsAhead - minMonthsAhead;
  const offset = minMonthsAhead + Math.floor(Math.random() * span);
  const monthIndex = now.getMonth() + offset;
  const year = now.getFullYear() + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return { year, month };
}

function randomDay(): number {
  return 1 + Math.floor(Math.random() * 27);
}

function randomDayExcludingFirst(): number {
  return 2 + Math.floor(Math.random() * 26);
}

function applicationCountBadge(cell: Locator): Locator {
  return cell.locator("span.absolute");
}

async function createAdminSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-recruitment-flow-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-recruitment-flow-admin-password-Aa1!";

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
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

async function createWorkerSession(
  context: BrowserContext,
  baseURL: string | undefined,
  label: string,
) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-recruitment-flow-${label}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-recruitment-flow-worker-password-Aa1!";
  const name = `${label}근무자-${randomUUID().slice(0, 8)}`;

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    throw error ?? new Error("근무자 테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name,
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

  return { admin, id: data.user.id, name };
}

test.describe.configure({ mode: "serial" });

test.describe("모집 운영 왕복", () => {
  test("모집 생성 → 다중 신청 → 마감 전환까지 관리자·근무자 화면이 일관되게 반영된다", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext();
    const { admin } = await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const workerAContext = await browser.newContext();
    const workerA = await createWorkerSession(workerAContext, baseURL, "a");
    const workerAPage = await workerAContext.newPage();

    const workerBContext = await browser.newContext();
    const workerB = await createWorkerSession(workerBContext, baseURL, "b");
    const workerBPage = await workerBContext.newPage();

    const { year, month } = monthAnchor(6, 30);
    const day = randomDay();
    const workDate = dateKey(year, month, day);

    await adminPage.goto(`/admin/recruitment?month=${year}-${pad(month)}`);
    await expect(adminPage.getByRole("heading", { name: "모집 오픈" })).toBeVisible();

    const selectableCell = adminPage.getByRole("button", { name: `${month}월 ${day}일 선택 가능` });
    await expect(selectableCell).toBeVisible();
    await selectableCell.click();
    await expect(adminPage.getByText("1개 선택")).toBeVisible();

    await adminPage.getByLabel("마감일").fill(workDate);
    await adminPage.getByRole("button", { name: "모집 오픈" }).click();
    await expect(adminPage.getByText("모집 1건을 열었어요")).toBeVisible();

    const openCell = adminPage.getByRole("button", { name: `${month}월 ${day}일 신청 가능` });
    await expect(openCell).toBeVisible();
    await expect(applicationCountBadge(openCell)).toHaveCount(0);

    const { data: scheduleRow, error: scheduleLookupError } = await admin
      .from("schedules")
      .select("id")
      .eq("work_date", workDate)
      .neq("status", "CANCELLED")
      .single();
    if (scheduleLookupError || !scheduleRow) {
      throw scheduleLookupError ?? new Error("방금 연 모집 스케줄을 찾을 수 없습니다.");
    }
    const scheduleId = scheduleRow.id as string;

    await workerAPage.goto(`/schedule?month=${year}-${pad(month)}`);
    await workerAPage
      .getByRole("button", { name: `${month}월 ${day}일 신청 가능` })
      .click();
    await expect(workerAPage.getByText("1개 변경")).toBeVisible();
    await workerAPage.getByRole("button", { name: "신청하기" }).click();
    await expect(workerAPage.getByText("근무 가능일을 변경했어요")).toBeVisible();

    await workerBPage.goto(`/schedule?month=${year}-${pad(month)}`);
    await workerBPage
      .getByRole("button", { name: `${month}월 ${day}일 신청 가능` })
      .click();
    await expect(workerBPage.getByText("1개 변경")).toBeVisible();
    await workerBPage.getByRole("button", { name: "신청하기" }).click();
    await expect(workerBPage.getByText("근무 가능일을 변경했어요")).toBeVisible();

    await adminPage.goto(`/admin/recruitment?month=${year}-${pad(month)}`);
    const openCellWithBadge = adminPage.getByRole("button", {
      name: `${month}월 ${day}일 신청 가능`,
    });
    await expect(openCellWithBadge).toBeVisible();
    await expect(applicationCountBadge(openCellWithBadge)).toHaveText("2");

    await openCellWithBadge.click();
    const manageDialog = adminPage.getByRole("dialog", { name: "마감일 연장" });
    await expect(manageDialog).toBeVisible();
    await expect(manageDialog.getByText("신청 2명")).toBeVisible();
    await expect(manageDialog.getByText(workerA.name)).toBeVisible();
    await expect(manageDialog.getByText(workerB.name)).toBeVisible();
    await adminPage.keyboard.press("Escape");

    const { error: closeError } = await admin
      .from("schedules")
      .update({ status: "CLOSED" })
      .eq("id", scheduleId);
    if (closeError) {
      throw closeError;
    }

    await workerAPage.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(
      workerAPage.getByRole("button", { name: `${month}월 ${day}일 마감` }),
    ).toBeVisible();

    await workerAPage.goto(`/schedule/${workDate}`);
    await expect(workerAPage.getByRole("heading", { name: "모집 마감" })).toBeVisible();
    await expect(workerAPage.getByText("신청 완료")).toBeVisible();
    await expect(
      workerAPage.getByText("포지션 배정 확정을 기다리고 있어요. 확정되면 스케줄에서 알려드릴게요."),
    ).toBeVisible();

    await workerAPage.goto("/");
    await expect(workerAPage.getByText("근무 신청 마감이 임박했어요")).toHaveCount(0);
    await expect(workerAPage.getByText("신청 완료 — 마감 전까지 변경 가능")).toHaveCount(0);

    await adminContext.close();
    await workerAContext.close();
    await workerBContext.close();
  });
});

test.describe("모집 시간대 회귀", () => {
  test("KST가 아닌 브라우저 시간대에서도 달력 월 경계·마감 표시·홈 카드가 KST 기준과 동일하다", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({ timezoneId: "America/Los_Angeles" });
    const { admin } = await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const { year, month } = monthAnchor(31, 60);
    const closedDay = randomDayExcludingFirst();
    const closedWorkDate = dateKey(year, month, closedDay);

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

    await adminPage.goto(`/admin/recruitment?month=${year}-${pad(month)}`);
    await expect(adminPage.getByRole("heading", { name: "모집 오픈" })).toBeVisible();

    await expect(
      adminPage.getByRole("button", { name: `${month}월 1일 선택 가능` }),
    ).toBeVisible();
    await expect(
      adminPage.getByRole("button", { name: `${month}월 ${closedDay}일 마감` }),
    ).toBeVisible();

    await adminContext.close();

    const workerContext = await browser.newContext({ timezoneId: "America/Los_Angeles" });
    const worker = await createWorkerSession(workerContext, baseURL, "tz");
    const workerPage = await workerContext.newPage();

    await workerPage.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(
      workerPage.getByRole("button", { name: `${month}월 ${closedDay}일 마감` }),
    ).toBeVisible();

    const today = seoulToday();
    const { year: farYear, month: farMonth } = monthAnchor(61, 90);
    const farDay = randomDay();
    const imminentWorkDate = dateKey(farYear, farMonth, farDay);

    const { error: imminentScheduleError } = await worker.admin
      .from("schedules")
      .insert({ work_date: imminentWorkDate, application_deadline: imminentWorkDate });
    if (imminentScheduleError) {
      throw imminentScheduleError;
    }
    const { error: imminentDeadlineError } = await worker.admin
      .from("schedules")
      .update({ application_deadline: today })
      .eq("work_date", imminentWorkDate);
    if (imminentDeadlineError) {
      throw imminentDeadlineError;
    }

    await workerPage.goto("/");
    await expect(workerPage.getByText("근무 신청 마감이 임박했어요")).toBeVisible();
    await expect(workerPage.getByRole("link", { name: "지금 신청하기" })).toBeVisible();

    const { error: imminentCleanupError } = await worker.admin
      .from("schedules")
      .update({ status: "CANCELLED" })
      .eq("work_date", imminentWorkDate);
    if (imminentCleanupError) {
      throw imminentCleanupError;
    }

    await workerContext.close();
  });
});
