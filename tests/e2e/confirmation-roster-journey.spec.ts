import { devices, expect, test } from "@playwright/test";

import { createAdminSession, createWorkerProfile, insertSchedule } from "./support/assignment-schedule-fixtures";
import { createWorkerSession } from "./support/worker-session";
import { WORK_DATE_BANDS, workDateInBand } from "./support/work-date-band";

import type { SupabaseClient } from "@supabase/supabase-js";

const MANAGER_POSITION_NAME = "매니저";
const SONG_POSITION_NAME = "축가";

const CONFIRM_TRIGGER_LABEL = "스케줄 확정";
const CONFIRM_DIALOG_TITLE = "스케줄을 확정할까요?";
const CONFIRM_DIALOG_CONFIRM_LABEL = "확정하기";

async function findPositionIds(
  admin: SupabaseClient,
  names: string[],
): Promise<Record<string, string>> {
  const { data, error } = await admin.from("positions").select("id, name").in("name", names);
  if (error || !data) {
    throw error ?? new Error("포지션을 찾지 못했습니다.");
  }
  const rows = data as { id: string; name: string }[];
  const result: Record<string, string> = {};
  for (const name of names) {
    const found = rows.find((row) => row.name === name);
    if (!found) {
      throw new Error(`포지션 ${name}을 찾지 못했습니다.`);
    }
    result[name] = found.id;
  }
  return result;
}

test.describe("확정→배정표 단일 여정", () => {
  test("관리자가 화면에서 확정하면 그 즉시 배정된 근무자의 배정표 화면에 예식·예정 시각·내 배정이 반영된다(P3-T08)", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const { admin } = await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const selfContext = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const self = await createWorkerSession(selfContext, baseURL, "e2e-confirmation-roster-self");
    const selfPage = await selfContext.newPage();

    const positionIds = await findPositionIds(admin, [MANAGER_POSITION_NAME, SONG_POSITION_NAME]);
    const managerPositionId = positionIds[MANAGER_POSITION_NAME]!;
    const songPositionId = positionIds[SONG_POSITION_NAME]!;

    const traineeWorker = await createWorkerProfile(
      admin,
      "confirmation-roster-trainee",
      "여정교육생",
      "female",
    );
    const { error: traineeWageError } = await admin
      .from("profiles")
      .update({ hourly_wage: 15000 })
      .eq("id", traineeWorker.id);
    if (traineeWageError) {
      throw traineeWageError;
    }
    const { error: selfWageError } = await admin
      .from("profiles")
      .update({ hourly_wage: 14000 })
      .eq("id", self.id);
    if (selfWageError) {
      throw selfWageError;
    }

    const workDate = workDateInBand(WORK_DATE_BANDS.confirmationJourney);
    const scheduleId = await insertSchedule(admin, workDate, "OPEN");

    const { error: ceremonyError } = await admin
      .from("ceremonies")
      .insert({ schedule_id: scheduleId, starts_at: "11:30" });
    if (ceremonyError) {
      throw ceremonyError;
    }

    const { error: plannedTimesError } = await admin
      .from("schedules")
      .update({ planned_checkin: "09:30", planned_checkout: "18:30" })
      .eq("id", scheduleId);
    if (plannedTimesError) {
      throw plannedTimesError;
    }

    const { error: requirementsError } = await admin.from("schedule_position_requirements").insert([
      { schedule_id: scheduleId, position_id: managerPositionId, required_count: 1 },
      { schedule_id: scheduleId, position_id: songPositionId, required_count: 1 },
    ]);
    if (requirementsError) {
      throw requirementsError;
    }

    const { data: selfAssignmentRow, error: selfAssignmentError } = await admin
      .from("assignments")
      .insert({ schedule_id: scheduleId, profile_id: self.id })
      .select("id")
      .single();
    if (selfAssignmentError || !selfAssignmentRow) {
      throw selfAssignmentError ?? new Error("본인 배정 픽스처 생성에 실패했습니다.");
    }
    const { error: selfAssignmentPositionError } = await admin
      .from("assignment_positions")
      .insert({
        assignment_id: (selfAssignmentRow as { id: string }).id,
        position_id: managerPositionId,
      });
    if (selfAssignmentPositionError) {
      throw selfAssignmentPositionError;
    }

    const { error: traineeError } = await admin.from("assignment_trainees").insert({
      schedule_id: scheduleId,
      position_id: songPositionId,
      profile_id: traineeWorker.id,
    });
    if (traineeError) {
      throw traineeError;
    }

    await adminPage.goto(`/admin/schedule/${scheduleId}`);
    await expect(adminPage.getByRole("heading", { name: workDate })).toBeVisible();

    const confirmTrigger = adminPage.getByRole("button", {
      name: CONFIRM_TRIGGER_LABEL,
      exact: true,
    });
    await expect(confirmTrigger).toBeVisible();
    await confirmTrigger.click();

    const dialog = adminPage.getByRole("dialog", { name: CONFIRM_DIALOG_TITLE });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: CONFIRM_DIALOG_CONFIRM_LABEL, exact: true }).click();
    await expect(adminPage.getByRole("button", { name: "스케줄 취소" })).toBeVisible();
    await expect(confirmTrigger).toHaveCount(0);

    const { data: scheduleRow } = await admin
      .from("schedules")
      .select("status")
      .eq("id", scheduleId)
      .single();
    expect((scheduleRow as { status: string } | null)?.status).toBe("CONFIRMED");

    await selfPage.goto(`/schedule/${workDate}`);
    await expect(selfPage.getByText(workDate)).toBeVisible();
    await expect(selfPage.getByText("09:30 - 18:30")).toBeVisible();
    await expect(selfPage.getByText("11:30", { exact: true })).toBeVisible();

    const myAssignmentSection = selfPage
      .locator("section")
      .filter({ has: selfPage.getByRole("heading", { name: "내 배정" }) });
    await expect(myAssignmentSection).toBeVisible();
    await expect(myAssignmentSection.getByText(MANAGER_POSITION_NAME)).toBeVisible();

    await expect(selfPage.getByRole("heading", { name: MANAGER_POSITION_NAME })).toBeVisible();
    await expect(selfPage.getByRole("heading", { name: SONG_POSITION_NAME })).toBeVisible();
    await expect(selfPage.getByText("나")).toBeVisible();
    await expect(selfPage.getByText(traineeWorker.name)).toBeVisible();
    await expect(selfPage.getByText("교육", { exact: true })).toBeVisible();

    await adminContext.close();
    await selfContext.close();
  });
});
