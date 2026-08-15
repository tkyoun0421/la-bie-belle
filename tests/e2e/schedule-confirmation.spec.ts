import { devices, expect, test } from "@playwright/test";

import {
  createAdminSession,
  createWorkerProfile,
  insertSchedule,
} from "./support/assignment-schedule-fixtures";
import { WORK_DATE_BANDS, workDateInBand } from "./support/work-date-band";

import type { SupabaseClient } from "@supabase/supabase-js";

const MANAGER_POSITION_NAME = "매니저";
const SONG_POSITION_NAME = "축가";

const CONFIRM_TRIGGER_LABEL = "스케줄 확정";
const CONFIRM_DIALOG_TITLE = "스케줄을 확정할까요?";
const CONFIRM_DIALOG_CONFIRM_LABEL = "확정하기";
const CLOSING_NOTICE = "모집도 함께 마감됩니다";
const NO_CEREMONY_MESSAGE = "예식을 먼저 만들어 주세요";

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

test.describe("확정, 경고, revision", () => {
  test("AC7 happy path: 버튼→다이얼로그(미달·담당자 없음·마감 안내)→확정→편집 가능·취소 버튼 전환(P3-T09)", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const positionIds = await findPositionIds(admin, [MANAGER_POSITION_NAME, SONG_POSITION_NAME]);
    const managerPositionId = positionIds[MANAGER_POSITION_NAME]!;
    const songPositionId = positionIds[SONG_POSITION_NAME]!;

    const assignedWorker = await createWorkerProfile(
      admin,
      "confirm-understaffed",
      "확정미달",
      "female",
    );
    const { error: wageError } = await admin
      .from("profiles")
      .update({ hourly_wage: 13000 })
      .eq("id", assignedWorker.id);
    if (wageError) {
      throw wageError;
    }

    const traineeWorker = await createWorkerProfile(
      admin,
      "confirm-no-manager",
      "확정담당자없음",
      "female",
    );
    const { error: traineeWageError } = await admin
      .from("profiles")
      .update({ hourly_wage: 15000 })
      .eq("id", traineeWorker.id);
    if (traineeWageError) {
      throw traineeWageError;
    }

    const workDate = workDateInBand(WORK_DATE_BANDS.scheduleConfirmation);
    const scheduleId = await insertSchedule(admin, workDate, "OPEN");

    const { error: ceremonyError } = await admin
      .from("ceremonies")
      .insert({ schedule_id: scheduleId, starts_at: "10:00" });
    if (ceremonyError) {
      throw ceremonyError;
    }

    const { error: plannedTimesError } = await admin
      .from("schedules")
      .update({ planned_checkin: "09:00", planned_checkout: "18:00" })
      .eq("id", scheduleId);
    if (plannedTimesError) {
      throw plannedTimesError;
    }

    const { error: requirementsError } = await admin.from("schedule_position_requirements").insert([
      { schedule_id: scheduleId, position_id: managerPositionId, required_count: 2 },
      { schedule_id: scheduleId, position_id: songPositionId, required_count: 1 },
    ]);
    if (requirementsError) {
      throw requirementsError;
    }

    const { data: assignmentRow, error: assignmentError } = await admin
      .from("assignments")
      .insert({ schedule_id: scheduleId, profile_id: assignedWorker.id })
      .select("id")
      .single();
    if (assignmentError || !assignmentRow) {
      throw assignmentError ?? new Error("배정 픽스처 생성에 실패했습니다.");
    }
    const { error: assignmentPositionError } = await admin
      .from("assignment_positions")
      .insert({ assignment_id: (assignmentRow as { id: string }).id, position_id: managerPositionId });
    if (assignmentPositionError) {
      throw assignmentPositionError;
    }

    const { error: traineeError } = await admin.from("assignment_trainees").insert({
      schedule_id: scheduleId,
      position_id: songPositionId,
      profile_id: traineeWorker.id,
    });
    if (traineeError) {
      throw traineeError;
    }

    await page.goto(`/admin/schedule/${scheduleId}`);
    await expect(page.getByRole("heading", { name: workDate })).toBeVisible();

    const confirmTrigger = page.getByRole("button", { name: CONFIRM_TRIGGER_LABEL, exact: true });
    await expect(confirmTrigger).toBeVisible();
    await confirmTrigger.click();

    const dialog = page.getByRole("dialog", { name: CONFIRM_DIALOG_TITLE });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(CLOSING_NOTICE)).toBeVisible();
    await expect(dialog.getByText(`${MANAGER_POSITION_NAME} · 필요 2 / 배정 1`)).toBeVisible();
    await expect(dialog.getByText(`${SONG_POSITION_NAME} · 필요 1 / 배정 0`)).toBeVisible();
    await expect(dialog.getByText(`${SONG_POSITION_NAME} · 교육 1`)).toBeVisible();

    await dialog.getByRole("button", { name: CONFIRM_DIALOG_CONFIRM_LABEL, exact: true }).click();

    await expect(confirmTrigger).toHaveCount(0);
    await expect(page.getByRole("button", { name: "스케줄 취소" })).toBeVisible();

    const { data: scheduleRow } = await admin
      .from("schedules")
      .select("status")
      .eq("id", scheduleId)
      .single();
    expect((scheduleRow as { status: string } | null)?.status).toBe("CONFIRMED");

    const { data: auditEvents } = await admin
      .from("scheduling_audit_logs")
      .select("event")
      .eq("schedule_id", scheduleId);
    const eventNames = (auditEvents ?? []).map((row) => (row as { event: string }).event);
    expect(eventNames).toContain("schedule_closed");
    expect(eventNames).toContain("schedule_confirmed");

    const { data: assignmentAfterConfirm } = await admin
      .from("assignments")
      .select("hourly_wage_snapshot")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", assignedWorker.id)
      .single();
    expect((assignmentAfterConfirm as { hourly_wage_snapshot: number } | null)?.hourly_wage_snapshot).toBe(
      13000,
    );

    await context.close();
  });

  test("구조 오류(예식 없음)는 다이얼로그 오류 안내를 띄우고 화면을 준비 상태로 유지한다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const workDate = workDateInBand(WORK_DATE_BANDS.scheduleConfirmation);
    const scheduleId = await insertSchedule(admin, workDate, "OPEN");

    await page.goto(`/admin/schedule/${scheduleId}`);
    await expect(page.getByRole("heading", { name: workDate })).toBeVisible();

    const confirmTrigger = page.getByRole("button", { name: CONFIRM_TRIGGER_LABEL, exact: true });
    await confirmTrigger.click();

    const dialog = page.getByRole("dialog", { name: CONFIRM_DIALOG_TITLE });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: CONFIRM_DIALOG_CONFIRM_LABEL, exact: true }).click();

    await expect(dialog.getByText(NO_CEREMONY_MESSAGE)).toBeVisible();
    await expect(dialog).toBeVisible();

    const { data: scheduleRow } = await admin
      .from("schedules")
      .select("status")
      .eq("id", scheduleId)
      .single();
    expect((scheduleRow as { status: string } | null)?.status).toBe("OPEN");

    await context.close();
  });
});
