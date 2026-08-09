import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BrowserContext } from "@playwright/test";
import { expect, test } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./support/supabase-test-auth";
import { WORK_DATE_BANDS, workDateInBand } from "./support/work-date-band";

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

async function createAdminSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-ceremony-edit-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-ceremony-edit-admin-password-Aa1!";

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
    name: `예식관리자-${randomUUID().slice(0, 8)}`,
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

  return { admin };
}

async function insertSchedule(
  admin: SupabaseClient,
  workDate: string,
  status: "OPEN" | "CONFIRMED",
): Promise<string> {
  const { data, error } = await admin
    .from("schedules")
    .insert({ work_date: workDate, application_deadline: workDate, status })
    .select("id")
    .single();
  if (error || !data) {
    throw error ?? new Error("스케줄 픽스처 생성에 실패했습니다.");
  }
  return data.id as string;
}

async function deleteScheduleFixture(admin: SupabaseClient, scheduleId: string) {
  await admin.from("ceremonies").delete().eq("schedule_id", scheduleId);
  await admin.from("schedules").delete().eq("id", scheduleId);
}

test.describe("관리자 예식 시간 편집", () => {
  test("예식 생성·수정·저장 후 첫 예식 변경 시 재추천을 승인하면 예정 출근이 반영된다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const workDate = workDateInBand(WORK_DATE_BANDS.ceremonyEditOpen);
    const scheduleId = await insertSchedule(admin, workDate, "OPEN");

    try {
      await page.goto(`/admin/schedule/${scheduleId}`);
      await expect(page.getByRole("heading", { name: workDate })).toBeVisible();
      await expect(page.getByLabel("예식 개수")).toBeVisible();

      await page.getByLabel("예식 개수").fill("3");
      await page.getByLabel("첫 예식 시각").fill("11:00");
      await page.getByRole("button", { name: "예식 목록 생성" }).click();

      await expect(page.getByLabel("예식 1")).toHaveValue("11:00");
      await expect(page.getByLabel("예식 2")).toHaveValue("12:00");
      await expect(page.getByLabel("예식 3")).toHaveValue("13:00");

      await page.getByLabel("예식 2").fill("12:10");
      await expect(page.getByLabel("예식 1")).toHaveValue("11:00");
      await expect(page.getByLabel("예식 2")).toHaveValue("12:10");
      await expect(page.getByLabel("예식 3")).toHaveValue("13:00");

      await page.getByLabel("예식 1").fill("10:00");
      const saveButton = page.getByRole("button", { name: "저장", exact: true });
      await saveButton.click();

      const dialog = page.getByRole("dialog", { name: "예정 시각을 다시 추천할까요?" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText("08:20");
      await dialog.getByRole("button", { name: "반영" }).click();
      await expect(dialog).not.toBeVisible();

      await expect(page.getByLabel("예정 출근")).toHaveValue("08:20");
    } finally {
      await deleteScheduleFixture(admin, scheduleId);
      await context.close();
    }
  });

  test("확정된 스케줄은 예식·예정 시각을 읽기 전용으로 보여준다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const workDate = workDateInBand(WORK_DATE_BANDS.ceremonyEditConfirmed);
    const scheduleId = await insertSchedule(admin, workDate, "CONFIRMED");

    try {
      await page.goto(`/admin/schedule/${scheduleId}`);
      await expect(page.getByRole("heading", { name: workDate })).toBeVisible();
      await expect(
        page.getByText("확정되었거나 취소된 스케줄은 예식·예정 시각을 수정할 수 없어요"),
      ).toBeVisible();
      await expect(page.getByLabel("예식 개수")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "저장", exact: true })).toHaveCount(0);
    } finally {
      await deleteScheduleFixture(admin, scheduleId);
      await context.close();
    }
  });
});
