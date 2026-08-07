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

async function createWorkerSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-schedule-worker-${randomUUID()}@labiebelle.test`;
  const password = "e2e-schedule-worker-password-Aa1!";
  const name = `근무자-${randomUUID().slice(0, 8)}`;

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
    phone: randomPhone(),
    gender: "female",
    birth_date: "1993-03-03",
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

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function randomMonthAnchor(): { year: number; month: number } {
  const now = new Date();
  const offset = 6 + Math.floor(Math.random() * 24);
  const monthIndex = now.getMonth() + offset;
  const year = now.getFullYear() + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return { year, month };
}

function pickDistinctDays(): [number, number, number] {
  const days = new Set<number>();
  while (days.size < 3) {
    days.add(1 + Math.floor(Math.random() * 27));
  }
  const ordered = Array.from(days);
  return [ordered[0]!, ordered[1]!, ordered[2]!];
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

test.describe("근무자 달력과 다중 신청", () => {
  test("모집 날짜 선택과 기존 신청 해제를 batch로 저장하고 되돌리기로 원상 복귀한다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await createWorkerSession(context, baseURL);
    const page = await context.newPage();

    const { year, month } = randomMonthAnchor();
    const [dayA, dayB, dayC] = pickDistinctDays();
    const dateA = dateKey(year, month, dayA);
    const dateB = dateKey(year, month, dayB);
    const dateC = dateKey(year, month, dayC);

    const { data: scheduleRows, error: scheduleError } = await worker.admin
      .from("schedules")
      .insert([
        { work_date: dateA, application_deadline: dateA },
        { work_date: dateB, application_deadline: dateB },
        { work_date: dateC, application_deadline: dateC },
      ])
      .select("id, work_date");
    if (scheduleError || !scheduleRows) {
      throw scheduleError ?? new Error("모집 날짜 시딩에 실패했습니다.");
    }

    const scheduleC = scheduleRows.find((row) => row.work_date === dateC);
    if (scheduleC === undefined) {
      throw new Error("dateC 스케줄을 찾을 수 없습니다.");
    }

    const { error: applicationError } = await worker.admin.from("applications").insert({
      schedule_id: scheduleC.id,
      profile_id: worker.id,
      status: "applied",
    });
    if (applicationError) {
      throw applicationError;
    }

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { name: "일정" })).toBeVisible();

    const cellA = page.getByRole("button", { name: `${month}월 ${dayA}일 신청 가능` });
    const cellB = page.getByRole("button", { name: `${month}월 ${dayB}일 신청 가능` });
    const cellC = page.getByRole("button", { name: `${month}월 ${dayC}일 신청` });

    await expect(cellA).toBeVisible();
    await expect(cellB).toBeVisible();
    await expect(cellC).toBeVisible();

    await cellA.click();
    await cellB.click();
    await cellC.click();

    await expect(page.getByText("3개 변경")).toBeVisible();

    await page.getByRole("button", { name: "신청하기" }).click();

    await expect(page.getByText("근무 가능일을 변경했어요")).toBeVisible();
    await expect(
      page.getByRole("button", { name: `${month}월 ${dayA}일 신청` }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: `${month}월 ${dayB}일 신청` }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: `${month}월 ${dayC}일 신청 가능` }),
    ).toBeVisible();

    await page.getByRole("button", { name: "방금 변경한 3개 날짜 되돌리기" }).click();

    await expect(
      page.getByRole("button", { name: `${month}월 ${dayA}일 신청 가능` }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: `${month}월 ${dayB}일 신청 가능` }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: `${month}월 ${dayC}일 신청` })).toBeVisible();

    await context.close();
  });
});
