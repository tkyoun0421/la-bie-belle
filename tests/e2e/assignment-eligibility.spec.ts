import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BrowserContext, Page } from "@playwright/test";
import { devices, expect, test } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./support/supabase-test-auth";
import { WORK_DATE_BANDS, workDatesInBand } from "./support/work-date-band";

const DRESS_POSITION_NAME = "드레스";

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

const DRAWER_OPEN_TRANSITION_MS = 700;

async function waitForDrawerOpenTransitionToSettle(page: Page): Promise<void> {
  await page.waitForTimeout(DRAWER_OPEN_TRANSITION_MS);
}

async function createAdminSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-assignment-eligibility-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-assignment-eligibility-admin-password-Aa1!";

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
    name: `배정관리자-${randomUUID().slice(0, 8)}`,
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

async function createWorkerProfile(
  admin: SupabaseClient,
  slug: string,
  label: string,
  gender: "male" | "female",
): Promise<{ id: string; name: string }> {
  const email = `e2e-assignment-eligibility-${slug}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-assignment-eligibility-worker-password-Aa1!";
  const name = `${label}-${randomUUID().slice(0, 8)}`;

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
    gender,
    birth_date: "1994-04-04",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  return { id: data.user.id, name };
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
  return (data as { id: string }).id;
}

test.describe("배정 후보와 자격 검사", () => {
  test("여성 전용 포지션에서 자격 없는 근무자는 접힌 목록에 이유와 함께 표시되고, 신청자 배정 저장·교체·초과 배정이 반영되며, 확정 스케줄에서는 배정 시트가 열리지 않는다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const { data: dressPosition, error: dressPositionError } = await admin
      .from("positions")
      .select("id")
      .eq("name", DRESS_POSITION_NAME)
      .single();
    if (dressPositionError || !dressPosition) {
      throw dressPositionError ?? new Error("드레스 포지션을 찾지 못했습니다.");
    }
    const dressPositionId = (dressPosition as { id: string }).id;

    const femaleA = await createWorkerProfile(admin, "female-a", "여성A", "female");
    const femaleB = await createWorkerProfile(admin, "female-b", "여성B", "female");
    const femaleC = await createWorkerProfile(admin, "female-c", "여성C", "female");
    const maleA = await createWorkerProfile(admin, "male-a", "남성A", "male");

    const [workDateOpen, workDateConfirmed] = workDatesInBand(
      WORK_DATE_BANDS.assignmentEligibility,
      2,
    ) as [string, string];

    const scheduleOpenId = await insertSchedule(admin, workDateOpen, "OPEN");
    const scheduleConfirmedId = await insertSchedule(admin, workDateConfirmed, "CONFIRMED");

    const { error: applicationsError } = await admin.from("applications").insert([
      { schedule_id: scheduleOpenId, profile_id: femaleA.id },
      { schedule_id: scheduleOpenId, profile_id: femaleB.id },
      { schedule_id: scheduleOpenId, profile_id: femaleC.id },
      { schedule_id: scheduleOpenId, profile_id: maleA.id },
    ]);
    if (applicationsError) {
      throw applicationsError;
    }

    const { error: eligibilityError } = await admin.from("worker_position_eligibilities").insert([
      { profile_id: femaleA.id, position_id: dressPositionId },
      { profile_id: femaleB.id, position_id: dressPositionId },
      { profile_id: femaleC.id, position_id: dressPositionId },
    ]);
    if (eligibilityError) {
      throw eligibilityError;
    }

    const { error: confirmedRequirementError } = await admin
      .from("schedule_position_requirements")
      .insert({ schedule_id: scheduleConfirmedId, position_id: dressPositionId, required_count: 1 });
    if (confirmedRequirementError) {
      throw confirmedRequirementError;
    }

    await page.goto(`/admin/schedule/${scheduleOpenId}`);
    await expect(page.getByRole("heading", { name: workDateOpen })).toBeVisible();

    const dressCandidateButton = page.getByRole("button", {
      name: new RegExp(`^${DRESS_POSITION_NAME} 필요`),
    });
    await expect(dressCandidateButton).toHaveCount(1);
    await dressCandidateButton.click();

    const sheet = page.getByRole("dialog", { name: DRESS_POSITION_NAME, exact: true });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("필요 1 / 배정 0")).toBeVisible();

    await expect(sheet.getByText(femaleA.name)).toBeVisible();
    await expect(sheet.getByText(femaleB.name)).toBeVisible();
    await expect(sheet.getByText(femaleC.name)).toBeVisible();

    const ineligibleSummary = sheet.getByText(/조건에 맞지 않는 \d+명 보기/);
    await expect(ineligibleSummary).toBeVisible();
    await waitForDrawerOpenTransitionToSettle(page);

    function candidateRow(name: string) {
      return sheet.locator("li").filter({ hasText: name });
    }

    const femaleARow = candidateRow(femaleA.name);
    const femaleBRow = candidateRow(femaleB.name);
    await femaleARow.getByRole("button", { name: "선택", exact: true }).click({ force: true });
    await femaleBRow.getByRole("button", { name: "선택", exact: true }).click({ force: true });
    await expect(sheet.getByText("2개 변경")).toBeVisible();

    await sheet.getByRole("button", { name: "저장", exact: true }).click({ force: true });
    await expect(page.getByText("배정을 변경했어요")).toBeVisible();
    await expect(sheet.getByText("필요 1 / 배정 2")).toBeVisible();
    await expect(sheet.getByRole("button", { name: /되돌리기/ })).toBeVisible();

    const femaleARowAfterSave = candidateRow(femaleA.name);
    const femaleCRow = candidateRow(femaleC.name);
    await femaleARowAfterSave
      .getByRole("button", { name: "선택됨", exact: true })
      .click({ force: true });
    await femaleCRow.getByRole("button", { name: "선택", exact: true }).click({ force: true });
    await expect(sheet.getByText("2개 변경")).toBeVisible();

    await sheet.getByRole("button", { name: "저장", exact: true }).click({ force: true });
    await expect(page.getByText("배정을 변경했어요")).toBeVisible();
    await expect(sheet.getByText("필요 1 / 배정 2")).toBeVisible();

    const femaleBRowAfterSecondSave = candidateRow(femaleB.name);
    const femaleCRowAfterSecondSave = candidateRow(femaleC.name);
    await expect(
      femaleBRowAfterSecondSave.getByRole("button", { name: "선택됨", exact: true }),
    ).toBeVisible();
    await expect(
      femaleCRowAfterSecondSave.getByRole("button", { name: "선택됨", exact: true }),
    ).toBeVisible();

    await ineligibleSummary.click({ force: true });
    const maleARow = sheet.locator("li").filter({ hasText: maleA.name });
    await expect(maleARow).toBeVisible();
    await expect(maleARow.getByText("포지션 성별 조건과 맞지 않아요")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();

    await page.goto(`/admin/schedule/${scheduleOpenId}`);
    await expect(page.getByText("필요 1 / 배정 2")).toBeVisible();

    await page.goto(`/admin/schedule/${scheduleConfirmedId}`);
    await expect(page.getByRole("heading", { name: workDateConfirmed })).toBeVisible();
    const confirmedDressListItem = page
      .locator("li")
      .filter({ has: page.getByText(DRESS_POSITION_NAME, { exact: true }) });
    await expect(confirmedDressListItem).toBeVisible();
    await expect(confirmedDressListItem.getByRole("button")).toHaveCount(0);

    await context.close();
  });
});
