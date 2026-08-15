import { devices, expect, test } from "@playwright/test";

import { createWorkerProfile, insertSchedule } from "./support/assignment-schedule-fixtures";
import { createWorkerSession } from "./support/worker-session";
import { WORK_DATE_BANDS, workDateInBand } from "./support/work-date-band";

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

test.describe("확정 배정표", () => {
  test("AC8: 확정 상세는 포지션 그룹·내 배정·교육 구분을 보여주고, 그날 미배정 근무자는 내 배정 섹션이 없다", async ({
    browser,
    baseURL,
  }) => {
    const selfContext = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const self = await createWorkerSession(selfContext, baseURL, "e2e-roster-self");
    const selfPage = await selfContext.newPage();

    const positionIds = await findPositionIds(self.admin, [
      MANAGER_POSITION_NAME,
      SONG_POSITION_NAME,
    ]);
    const managerPositionId = positionIds[MANAGER_POSITION_NAME]!;
    const songPositionId = positionIds[SONG_POSITION_NAME]!;

    const otherWorker = await createWorkerProfile(self.admin, "roster-other", "동료배정자", "female");
    const traineeWorker = await createWorkerProfile(
      self.admin,
      "roster-trainee",
      "교육생배정",
      "female",
    );

    const workDate = workDateInBand(WORK_DATE_BANDS.scheduleRoster);
    const scheduleId = await insertSchedule(self.admin, workDate, "CONFIRMED");

    const { error: plannedTimesError } = await self.admin
      .from("schedules")
      .update({ planned_checkin: "09:00", planned_checkout: "18:00" })
      .eq("id", scheduleId);
    if (plannedTimesError) {
      throw plannedTimesError;
    }

    const { error: ceremonyError } = await self.admin
      .from("ceremonies")
      .insert({ schedule_id: scheduleId, starts_at: "10:00" });
    if (ceremonyError) {
      throw ceremonyError;
    }

    const { data: selfAssignmentRow, error: selfAssignmentError } = await self.admin
      .from("assignments")
      .insert({ schedule_id: scheduleId, profile_id: self.id })
      .select("id")
      .single();
    if (selfAssignmentError || !selfAssignmentRow) {
      throw selfAssignmentError ?? new Error("본인 배정 픽스처 생성에 실패했습니다.");
    }
    const { data: otherAssignmentRow, error: otherAssignmentError } = await self.admin
      .from("assignments")
      .insert({ schedule_id: scheduleId, profile_id: otherWorker.id })
      .select("id")
      .single();
    if (otherAssignmentError || !otherAssignmentRow) {
      throw otherAssignmentError ?? new Error("동료 배정 픽스처 생성에 실패했습니다.");
    }

    const { error: assignmentPositionsError } = await self.admin
      .from("assignment_positions")
      .insert([
        {
          assignment_id: (selfAssignmentRow as { id: string }).id,
          position_id: managerPositionId,
        },
        {
          assignment_id: (otherAssignmentRow as { id: string }).id,
          position_id: managerPositionId,
        },
      ]);
    if (assignmentPositionsError) {
      throw assignmentPositionsError;
    }

    const { error: traineeError } = await self.admin.from("assignment_trainees").insert({
      schedule_id: scheduleId,
      position_id: songPositionId,
      profile_id: traineeWorker.id,
    });
    if (traineeError) {
      throw traineeError;
    }

    await selfPage.goto(`/schedule/${workDate}`);
    await expect(selfPage.getByText(workDate)).toBeVisible();
    const myAssignmentSection = selfPage
      .locator("section")
      .filter({ has: selfPage.getByRole("heading", { name: "내 배정" }) });
    await expect(myAssignmentSection).toBeVisible();
    await expect(myAssignmentSection.getByText(MANAGER_POSITION_NAME)).toBeVisible();
    await expect(selfPage.getByRole("heading", { name: MANAGER_POSITION_NAME })).toBeVisible();
    await expect(selfPage.getByRole("heading", { name: SONG_POSITION_NAME })).toBeVisible();
    await expect(selfPage.getByText("나")).toBeVisible();
    await expect(selfPage.getByText(otherWorker.name)).toBeVisible();
    await expect(selfPage.getByText(traineeWorker.name)).toBeVisible();
    await expect(selfPage.getByText("교육", { exact: true })).toBeVisible();
    await selfContext.close();

    const otherContext = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    await createWorkerSession(otherContext, baseURL, "e2e-roster-unassigned");
    const otherPage = await otherContext.newPage();

    await otherPage.goto(`/schedule/${workDate}`);
    await expect(otherPage.getByText(workDate)).toBeVisible();
    await expect(otherPage.getByRole("heading", { name: "내 배정" })).toHaveCount(0);
    await expect(otherPage.getByRole("heading", { name: MANAGER_POSITION_NAME })).toBeVisible();
    await expect(otherPage.getByText(otherWorker.name)).toBeVisible();
    await otherContext.close();
  });

  test("AC10: OPEN 스케줄을 URL로 직접 열면 배정표 없이 모집 중 안내가 나온다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const worker = await createWorkerSession(context, baseURL, "e2e-roster-open");
    const page = await context.newPage();

    const workDate = workDateInBand(WORK_DATE_BANDS.scheduleRoster);
    const scheduleId = await insertSchedule(worker.admin, workDate, "OPEN");

    await page.goto(`/schedule/${workDate}`);
    await expect(page.getByText(workDate)).toBeVisible();
    await expect(page.getByRole("heading", { name: "모집 중" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "전체 배정표" })).toHaveCount(0);

    await context.close();
  });
});
