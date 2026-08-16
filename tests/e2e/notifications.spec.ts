import { devices, expect, test } from "@playwright/test";

import { createAdminSession, insertSchedule } from "./support/assignment-schedule-fixtures";
import { createWorkerSession, deleteWorkerSessions, type WorkerSession } from "./support/worker-session";
import { WORK_DATE_BANDS, workDateInBand } from "./support/work-date-band";

import type { SupabaseClient } from "@supabase/supabase-js";

const MANAGER_POSITION_NAME = "매니저";

const CONFIRM_TRIGGER_LABEL = "스케줄 확정";
const CONFIRM_DIALOG_TITLE = "스케줄을 확정할까요?";
const CONFIRM_DIALOG_CONFIRM_LABEL = "확정하기";
const NOTIFICATION_TITLE = "근무 배정이 확정됐어요";
const NAV_LABEL = "주요 메뉴";
const NOTIFICATIONS_TAB_LABEL = "알림";
const UNREAD_MARKER_TEXT = "읽지 않음";

async function findPositionId(admin: SupabaseClient, name: string): Promise<string> {
  const { data, error } = await admin.from("positions").select("id").eq("name", name).single();
  if (error || !data) {
    throw error ?? new Error(`포지션 ${name}을 찾지 못했습니다.`);
  }
  return (data as { id: string }).id;
}

test.describe("알림함 여정", () => {
  test("관리자가 확정하면 근무자 알림함에 확정 알림이 뜨고, 탭하면 상세로 이동하며 읽음이 새로고침 후에도 유지된다(P4-T01)", async ({
    browser,
    baseURL,
  }) => {
    const adminContext = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const { admin } = await createAdminSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();

    const workerSessions: WorkerSession[] = [];
    const workerContext = await browser.newContext({
      ...devices["Pixel 5"],
      reducedMotion: "reduce",
    });
    const worker = await createWorkerSession(workerContext, baseURL, "e2e-notifications-worker");
    workerSessions.push(worker);
    const workerPage = await workerContext.newPage();

    const managerPositionId = await findPositionId(admin, MANAGER_POSITION_NAME);

    const { error: wageError } = await admin
      .from("profiles")
      .update({ hourly_wage: 15000 })
      .eq("id", worker.id);
    if (wageError) {
      throw wageError;
    }

    const workDate = workDateInBand(WORK_DATE_BANDS.notifications);
    const scheduleId = await insertSchedule(admin, workDate, "OPEN");

    const { error: ceremonyError } = await admin
      .from("ceremonies")
      .insert({ schedule_id: scheduleId, starts_at: "11:00" });
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

    const { error: requirementError } = await admin
      .from("schedule_position_requirements")
      .insert({ schedule_id: scheduleId, position_id: managerPositionId, required_count: 1 });
    if (requirementError) {
      throw requirementError;
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

      await workerPage.goto("/notifications");
      await expect(workerPage.getByRole("heading", { level: 1, name: "알림" })).toBeVisible();

      const tabBar = workerPage.getByRole("navigation", { name: NAV_LABEL });
      const notificationsTabLink = tabBar.getByRole("link", { name: NOTIFICATIONS_TAB_LABEL });
      await expect(notificationsTabLink.getByText(UNREAD_MARKER_TEXT)).toBeVisible();

      const notificationRow = workerPage.getByRole("button", {
        name: new RegExp(NOTIFICATION_TITLE),
      });
      await expect(notificationRow).toBeVisible();
      await expect(notificationRow).toHaveAccessibleName(new RegExp(UNREAD_MARKER_TEXT));

      await notificationRow.click();
      await expect(workerPage).toHaveURL(new RegExp(`/schedule/${workDate}$`));

      await workerPage.goto("/notifications");
      await expect(workerPage.getByRole("heading", { level: 1, name: "알림" })).toBeVisible();

      const reloadedRow = workerPage.getByRole("button", { name: new RegExp(NOTIFICATION_TITLE) });
      await expect(reloadedRow).toBeVisible();
      await expect(reloadedRow).not.toHaveAccessibleName(new RegExp(UNREAD_MARKER_TEXT));
      await expect(notificationsTabLink.getByText(UNREAD_MARKER_TEXT)).toHaveCount(0);
    } finally {
      const { data: notificationRows } = await admin
        .from("notifications")
        .select("id")
        .eq("aggregate_id", scheduleId);
      const notificationIds = (notificationRows ?? []).map((row) => (row as { id: string }).id);
      if (notificationIds.length > 0) {
        await admin.from("notification_outbox").delete().in("notification_id", notificationIds);
      }
      await admin.from("notifications").delete().eq("aggregate_id", scheduleId);
      await admin
        .from("assignment_positions")
        .delete()
        .eq("assignment_id", (assignmentRow as { id: string }).id);
      await admin.from("assignments").delete().eq("id", (assignmentRow as { id: string }).id);
      await admin.from("ceremonies").delete().eq("schedule_id", scheduleId);
      await deleteWorkerSessions(workerSessions);
      await adminContext.close();
      await workerContext.close();
    }
  });
});
