import { devices, expect, test } from "@playwright/test";

import { createAdminSession, insertSchedule } from "./support/assignment-schedule-fixtures";
import { createWorkerSession, deleteWorkerSessions, type WorkerSession } from "./support/worker-session";
import { WORK_DATE_BANDS, workDatesInBand } from "./support/work-date-band";

import type { SupabaseClient } from "@supabase/supabase-js";

const MANAGER_POSITION_NAME = "매니저";
const SONG_POSITION_NAME = "축가";

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

const [postConfirmationChangesWorkDateA, postConfirmationChangesWorkDateB] = workDatesInBand(
  WORK_DATE_BANDS.postConfirmationChanges,
  2,
) as [string, string];

test.describe("확정 후 변경", () => {
  test("확정 후 예식 변경이 revision을 올리고 근무자 상세에 변경 안내가 뜬다(AC1·AC9)", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({
      ...devices["Pixel 5"],
      reducedMotion: "reduce",
    });
    const { admin } = await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const workerSessions: WorkerSession[] = [];
    const workerContext = await browser.newContext({
      ...devices["Pixel 5"],
      reducedMotion: "reduce",
    });
    const worker = await createWorkerSession(workerContext, baseURL, "e2e-post-confirm-revision");
    workerSessions.push(worker);
    const workerPage = await workerContext.newPage();

    const positionIds = await findPositionIds(admin, [MANAGER_POSITION_NAME]);
    const managerPositionId = positionIds[MANAGER_POSITION_NAME]!;

    const workDate = postConfirmationChangesWorkDateA;
    const scheduleId = await insertSchedule(admin, workDate, "CONFIRMED");

    const { error: ceremonyError } = await admin
      .from("ceremonies")
      .insert({ schedule_id: scheduleId, starts_at: "10:00" });
    if (ceremonyError) {
      throw ceremonyError;
    }

    const { data: assignmentRow, error: assignmentError } = await admin
      .from("assignments")
      .insert({ schedule_id: scheduleId, profile_id: worker.id })
      .select("id")
      .single();
    if (assignmentError || !assignmentRow) {
      throw assignmentError ?? new Error("배정 픽스처 생성에 실패했습니다.");
    }
    const { error: assignmentPositionError } = await admin.from("assignment_positions").insert({
      assignment_id: (assignmentRow as { id: string }).id,
      position_id: managerPositionId,
    });
    if (assignmentPositionError) {
      throw assignmentPositionError;
    }

    try {
      await adminPage.goto(`/admin/schedule/${scheduleId}`);
      await expect(adminPage.getByRole("heading", { name: workDate })).toBeVisible();
      await expect(adminPage.getByLabel("예식 1")).toHaveValue("10:00");

      await adminPage.getByLabel("예식 1").fill("11:00");
      await adminPage.getByRole("button", { name: "저장", exact: true }).click();

      const recommendationDialog = adminPage.getByRole("dialog", {
        name: "예정 시각을 다시 추천할까요?",
      });
      await expect(recommendationDialog).toBeVisible();
      await recommendationDialog.getByRole("button", { name: "유지", exact: true }).click();
      await expect(recommendationDialog).not.toBeVisible();

      const { data: scheduleRow } = await admin
        .from("schedules")
        .select("revision")
        .eq("id", scheduleId)
        .single();
      expect((scheduleRow as { revision: number } | null)?.revision).toBe(2);

      await workerPage.goto(`/schedule/${workDate}`);
      await expect(workerPage.getByText(workDate)).toBeVisible();
      await expect(workerPage.getByText(/변경됐어요/)).toBeVisible();
    } finally {
      await admin.from("ceremonies").delete().eq("schedule_id", scheduleId);
      await admin.from("assignment_positions").delete().eq("assignment_id", (assignmentRow as { id: string }).id);
      await admin.from("assignments").delete().eq("id", (assignmentRow as { id: string }).id);
      await deleteWorkerSessions(workerSessions);
      await adminContext.close();
      await workerContext.close();
    }
  });

  test("확정 스케줄 취소가 영향 인원 수 다이얼로그를 거쳐 데이터를 보존한 채 취소로 전환하고, 근무자는 취소 안내 화면을 본다(AC4·AC7·AC10)", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({
      ...devices["Pixel 5"],
      reducedMotion: "reduce",
    });
    const { admin } = await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const workerSessions: WorkerSession[] = [];
    const assignedContext = await browser.newContext({
      ...devices["Pixel 5"],
      reducedMotion: "reduce",
    });
    const assignedWorker = await createWorkerSession(
      assignedContext,
      baseURL,
      "e2e-post-confirm-cancel-assigned",
    );
    workerSessions.push(assignedWorker);
    const assignedPage = await assignedContext.newPage();

    const traineeSessionContext = await browser.newContext({
      ...devices["Pixel 5"],
      reducedMotion: "reduce",
    });
    const traineeWorker = await createWorkerSession(
      traineeSessionContext,
      baseURL,
      "e2e-post-confirm-cancel-trainee",
    );
    workerSessions.push(traineeWorker);

    const positionIds = await findPositionIds(admin, [MANAGER_POSITION_NAME, SONG_POSITION_NAME]);
    const managerPositionId = positionIds[MANAGER_POSITION_NAME]!;
    const songPositionId = positionIds[SONG_POSITION_NAME]!;

    const workDate = postConfirmationChangesWorkDateB;
    const scheduleId = await insertSchedule(admin, workDate, "CONFIRMED");

    const { error: ceremonyError } = await admin
      .from("ceremonies")
      .insert({ schedule_id: scheduleId, starts_at: "10:00" });
    if (ceremonyError) {
      throw ceremonyError;
    }

    const { data: assignmentRow, error: assignmentError } = await admin
      .from("assignments")
      .insert({ schedule_id: scheduleId, profile_id: assignedWorker.id })
      .select("id")
      .single();
    if (assignmentError || !assignmentRow) {
      throw assignmentError ?? new Error("배정 픽스처 생성에 실패했습니다.");
    }
    const { error: assignmentPositionError } = await admin.from("assignment_positions").insert({
      assignment_id: (assignmentRow as { id: string }).id,
      position_id: managerPositionId,
    });
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

    try {
      await adminPage.goto(`/admin/schedule/${scheduleId}`);
      await expect(adminPage.getByRole("heading", { name: workDate })).toBeVisible();

      const cancelTrigger = adminPage.getByRole("button", { name: "스케줄 취소", exact: true });
      await expect(cancelTrigger).toBeVisible();
      await cancelTrigger.click();

      const cancelDialog = adminPage.getByRole("dialog", { name: "스케줄을 취소할까요?" });
      await expect(cancelDialog).toBeVisible();
      await expect(cancelDialog.getByText("배정된 2명에게 영향이 가요")).toBeVisible();
      await cancelDialog.getByRole("button", { name: "취소하기", exact: true }).click();
      await expect(cancelDialog).not.toBeVisible();

      await expect(
        adminPage.getByText("취소된 스케줄은 예식·예정 시각을 수정할 수 없어요"),
      ).toBeVisible();
      await expect(adminPage.getByRole("button", { name: "스케줄 취소" })).toHaveCount(0);
      await expect(adminPage.getByRole("button", { name: "스케줄 확정" })).toHaveCount(0);
      await expect(adminPage.getByRole("button", { name: "저장", exact: true })).toHaveCount(0);

      const { data: scheduleRow } = await admin
        .from("schedules")
        .select("status, revision")
        .eq("id", scheduleId)
        .single();
      expect((scheduleRow as { status: string; revision: number } | null)?.status).toBe(
        "CANCELLED",
      );
      expect((scheduleRow as { status: string; revision: number } | null)?.revision).toBe(1);

      const { data: preservedAssignment } = await admin
        .from("assignments")
        .select("id")
        .eq("id", (assignmentRow as { id: string }).id)
        .maybeSingle();
      expect(preservedAssignment).not.toBeNull();

      const { data: auditEvents } = await admin
        .from("scheduling_audit_logs")
        .select("event")
        .eq("schedule_id", scheduleId);
      const eventNames = (auditEvents ?? []).map((row) => (row as { event: string }).event);
      expect(eventNames).toContain("schedule_cancelled");

      await assignedPage.goto(`/schedule/${workDate}`);
      await expect(assignedPage.getByRole("heading", { name: "취소됨" })).toBeVisible();
      await expect(assignedPage.getByText("이 스케줄은 취소됐어요")).toBeVisible();
    } finally {
      await admin.from("assignment_trainees").delete().eq("schedule_id", scheduleId);
      await admin.from("assignment_positions").delete().eq("assignment_id", (assignmentRow as { id: string }).id);
      await admin.from("assignments").delete().eq("id", (assignmentRow as { id: string }).id);
      await admin.from("ceremonies").delete().eq("schedule_id", scheduleId);
      await deleteWorkerSessions(workerSessions);
      await adminContext.close();
      await assignedContext.close();
      await traineeSessionContext.close();
    }
  });
});
