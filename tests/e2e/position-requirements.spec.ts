import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
  const email = `e2e-position-requirements-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-position-requirements-admin-password-Aa1!";

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
    name: `필요인원관리자-${randomUUID().slice(0, 8)}`,
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

function randomFutureWorkDate(): string {
  const offsetDays = 550 + Math.floor(Math.random() * 300);
  const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return target.toISOString().slice(0, 10);
}

async function insertOpenSchedule(admin: SupabaseClient, workDate: string): Promise<string> {
  const { data, error } = await admin
    .from("schedules")
    .insert({ work_date: workDate, application_deadline: workDate, status: "OPEN" })
    .select("id")
    .single();
  if (error || !data) {
    throw error ?? new Error("스케줄 픽스처 생성에 실패했습니다.");
  }
  return (data as { id: string }).id;
}

test.describe("포지션 기본 설정과 스케줄 필요 인원", () => {
  test("포지션 추가는 표가 있는 열린 스케줄에 자동 반영되고, 기본값 변경은 이미 복사된 표를 바꾸지 않으며, 비활성화는 새 스케줄 선택지에서 제외된다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const positionName = `E2E포지션-${randomUUID().slice(0, 8)}`;
    const workDateA = randomFutureWorkDate();
    const workDateB = randomFutureWorkDate();
    const scheduleAId = await insertOpenSchedule(admin, workDateA);
    let scheduleBId: string | null = null;
    let positionId: string | null = null;

    try {
      await page.goto(`/admin/schedule/${scheduleAId}`);
      await expect(page.getByRole("heading", { name: workDateA })).toBeVisible();
      await expect(page.getByRole("heading", { name: "필요 인원" })).toBeVisible();

      await page.goto("/admin/positions");
      await page.getByRole("button", { name: "추가" }).click();
      await page.getByLabel("이름").fill(positionName);
      await page.getByLabel("기본 필요 인원").fill("2");
      await page.getByRole("button", { name: "저장", exact: true }).click();
      await expect(page.getByText(positionName)).toBeVisible();

      const { data: createdPosition, error: createdPositionError } = await admin
        .from("positions")
        .select("id")
        .eq("name", positionName)
        .single();
      if (createdPositionError || !createdPosition) {
        throw createdPositionError ?? new Error("생성한 포지션을 찾지 못했습니다.");
      }
      positionId = (createdPosition as { id: string }).id;

      await page.goto(`/admin/schedule/${scheduleAId}`);
      await expect(page.getByLabel(positionName)).toHaveValue("2");

      await page.goto("/admin/positions");
      await page.getByText(positionName).click();
      await page.getByLabel("기본 필요 인원").fill("9");
      await page.getByRole("button", { name: "저장", exact: true }).click();
      await expect(page.getByRole("button", { name: "삭제", exact: true })).toBeHidden();

      await page.goto(`/admin/schedule/${scheduleAId}`);
      await expect(page.getByLabel(positionName)).toHaveValue("2");

      await page.goto("/admin/positions");
      await page.getByText(positionName).click();
      await page.getByRole("button", { name: "활성", exact: true }).click();
      await page.getByRole("button", { name: "저장", exact: true }).click();
      await expect(page.getByRole("button", { name: "삭제", exact: true })).toBeHidden();
      await expect(page.getByText("비활성 포지션 1개")).toBeVisible();

      scheduleBId = await insertOpenSchedule(admin, workDateB);
      await page.goto(`/admin/schedule/${scheduleBId}`);
      await expect(page.getByRole("heading", { name: workDateB })).toBeVisible();
      await expect(page.getByLabel(positionName)).toHaveCount(0);
    } finally {
      if (positionId !== null) {
        await admin.from("schedule_position_requirements").delete().eq("position_id", positionId);
        await admin.from("positions").delete().eq("id", positionId);
      }
      await admin.from("schedule_position_requirements").delete().eq("schedule_id", scheduleAId);
      await admin.from("schedules").delete().eq("id", scheduleAId);
      if (scheduleBId !== null) {
        await admin
          .from("schedule_position_requirements")
          .delete()
          .eq("schedule_id", scheduleBId);
        await admin.from("schedules").delete().eq("id", scheduleBId);
      }
      await context.close();
    }
  });
});
