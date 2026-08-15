import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { devices, expect, test } from "@playwright/test";

import { loadSupabaseTestEnv } from "./support/supabase-test-auth";
import {
  closeSheet,
  openPositionSheet,
  positionRow,
  toggleCandidateAndSave,
  waitForDrawerOpenTransitionToSettle,
} from "./support/assignment-candidate-sheet";
import {
  createAdminSession,
  createWorkerProfile,
  insertSchedule,
} from "./support/assignment-schedule-fixtures";
import { WORK_DATE_BANDS, workDateInBand } from "./support/work-date-band";

const SCAN_POSITION_NAME = "스캔";
const MAIN_POSITION_NAME = "메인";
const DRESS_POSITION_NAME = "드레스";

const HEADCOUNT_LINE_PATTERN = /오는 사람 \d+명 · 포지션 합계 \d+/;
const TRAINEE_ALREADY_ASSIGNED_MESSAGE =
  "이미 다른 포지션에 정식 배정되었거나 교육생으로 등록된 사람이 있어요";
const TRAINEE_DUPLICATE_MESSAGE = "이미 다른 포지션의 교육생으로 등록된 사람이 있어요";

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

test.describe("교육생 배정", () => {
  test("AC1·AC5·AC6·AC7: 교육생 추가는 정식 배정과 별도로 집계되고 필요 인원 화면에 교육 수·담당자 없음으로 보인다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const { admin } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const positionIds = await findPositionIds(admin, [SCAN_POSITION_NAME, MAIN_POSITION_NAME]);
    const scanPositionId = positionIds[SCAN_POSITION_NAME]!;
    const mainPositionId = positionIds[MAIN_POSITION_NAME]!;

    const trainee = await createWorkerProfile(admin, "trainee-not-eligible", "교육대상", "female");

    const workDate = workDateInBand(WORK_DATE_BANDS.assignmentTrainee);
    const scheduleId = await insertSchedule(admin, workDate, "OPEN");

    const { error: requirementsError } = await admin.from("schedule_position_requirements").insert([
      { schedule_id: scheduleId, position_id: scanPositionId, required_count: 1 },
      { schedule_id: scheduleId, position_id: mainPositionId, required_count: 1 },
    ]);
    if (requirementsError) {
      throw requirementsError;
    }

    await page.goto(`/admin/schedule/${scheduleId}`);
    await expect(page.getByRole("heading", { name: workDate })).toBeVisible();
    await expect(page.getByText(HEADCOUNT_LINE_PATTERN)).toHaveCount(0);
    await expect(positionRow(page, SCAN_POSITION_NAME).getByText("필요 1 / 배정 0")).toBeVisible();
    await expect(positionRow(page, SCAN_POSITION_NAME).getByText("담당자 없음")).toHaveCount(0);

    const scanSheet = await openPositionSheet(page, SCAN_POSITION_NAME);
    await expect(scanSheet.getByText("필요 1 / 배정 0")).toBeVisible();
    const ineligibleSummary = scanSheet.getByText(/조건에 맞지 않는 \d+명 보기/);
    await expect(ineligibleSummary).toBeVisible();
    await waitForDrawerOpenTransitionToSettle(page);
    await ineligibleSummary.click({ force: true });

    const traineeRow = scanSheet.locator("li").filter({ hasText: trainee.name });
    await expect(traineeRow).toBeVisible();
    await expect(
      traineeRow.getByText("이 포지션의 가능 포지션으로 등록되지 않았어요"),
    ).toBeVisible();
    await expect(traineeRow.getByRole("button", { name: "선택", exact: true })).toHaveCount(0);

    await toggleCandidateAndSave(page, scanSheet, trainee.name, "교육");
    await expect(scanSheet.getByText("필요 1 / 배정 0")).toBeVisible();
    await closeSheet(page, scanSheet);

    await page.goto(`/admin/schedule/${scheduleId}`);
    await expect(page.getByText(HEADCOUNT_LINE_PATTERN)).toHaveCount(0);
    await expect(
      positionRow(page, SCAN_POSITION_NAME).getByText("필요 1 / 배정 0 · 교육 1"),
    ).toBeVisible();
    await expect(positionRow(page, SCAN_POSITION_NAME).getByText("담당자 없음")).toBeVisible();
    await expect(positionRow(page, MAIN_POSITION_NAME).getByText("필요 1 / 배정 0")).toBeVisible();
    await expect(positionRow(page, MAIN_POSITION_NAME).getByText("담당자 없음")).toHaveCount(0);

    const { data: traineeRowsAfterSave } = await admin
      .from("assignment_trainees")
      .select("position_id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", trainee.id);
    expect(traineeRowsAfterSave).toHaveLength(1);

    const { data: assignmentRowsAfterSave } = await admin
      .from("assignments")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", trainee.id);
    expect(assignmentRowsAfterSave ?? []).toHaveLength(0);

    await context.close();
  });

  test("AC2·AC3·AC4: 성별 불일치는 교육으로도 거부되고, 정식·교육 겸함은 양방향으로 거부되며, 교육생 중복은 다른 문구로 거부된다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    const { admin, email, password } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const positionIds = await findPositionIds(admin, [
      SCAN_POSITION_NAME,
      MAIN_POSITION_NAME,
      DRESS_POSITION_NAME,
    ]);
    const scanPositionId = positionIds[SCAN_POSITION_NAME]!;
    const mainPositionId = positionIds[MAIN_POSITION_NAME]!;
    const dressPositionId = positionIds[DRESS_POSITION_NAME]!;

    const genderMismatchWorker = await createWorkerProfile(
      admin,
      "trainee-gender-mismatch",
      "교육성별불일치",
      "male",
    );
    const alreadyTraineeWorker = await createWorkerProfile(
      admin,
      "trainee-already-trainee",
      "겸함거부A",
      "female",
    );
    const alreadyAssignedWorker = await createWorkerProfile(
      admin,
      "trainee-already-assigned",
      "겸함거부B",
      "female",
    );
    const duplicateTraineeWorker = await createWorkerProfile(
      admin,
      "trainee-duplicate",
      "중복거부",
      "female",
    );

    const { error: eligibilityError } = await admin.from("worker_position_eligibilities").insert([
      { profile_id: alreadyTraineeWorker.id, position_id: scanPositionId },
      { profile_id: alreadyTraineeWorker.id, position_id: mainPositionId },
      { profile_id: alreadyAssignedWorker.id, position_id: scanPositionId },
      { profile_id: alreadyAssignedWorker.id, position_id: mainPositionId },
      { profile_id: duplicateTraineeWorker.id, position_id: scanPositionId },
      { profile_id: duplicateTraineeWorker.id, position_id: mainPositionId },
    ]);
    if (eligibilityError) {
      throw eligibilityError;
    }

    const workDate = workDateInBand(WORK_DATE_BANDS.assignmentTrainee);
    const scheduleId = await insertSchedule(admin, workDate, "OPEN");

    const { error: requirementsError } = await admin.from("schedule_position_requirements").insert([
      { schedule_id: scheduleId, position_id: scanPositionId, required_count: 3 },
      { schedule_id: scheduleId, position_id: mainPositionId, required_count: 3 },
      { schedule_id: scheduleId, position_id: dressPositionId, required_count: 1 },
    ]);
    if (requirementsError) {
      throw requirementsError;
    }

    const env = loadSupabaseTestEnv();
    const authenticatedAdminClient = createClient(env.supabaseUrl, env.anonKey);
    const { error: signInError } = await authenticatedAdminClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      throw signInError;
    }

    const { data: genderRejectData, error: genderRejectError } = await authenticatedAdminClient.rpc(
      "replace_position_assignments",
      {
        target_schedule_id: scheduleId,
        target_position_id: dressPositionId,
        profile_ids: [],
        trainee_profile_ids: [genderMismatchWorker.id],
      },
    );
    expect(genderRejectData).toBeNull();
    expect(genderRejectError?.code).toBe("LB023");
    expect(genderRejectError?.message).toBe("포지션 성별 조건에 맞지 않습니다");

    await page.goto(`/admin/schedule/${scheduleId}`);
    const scanSheetForTrainee = await openPositionSheet(page, SCAN_POSITION_NAME);
    await toggleCandidateAndSave(page, scanSheetForTrainee, alreadyTraineeWorker.name, "교육");
    await closeSheet(page, scanSheetForTrainee);

    await page.goto(`/admin/schedule/${scheduleId}`);
    const mainSheetForDirection1 = await openPositionSheet(page, MAIN_POSITION_NAME);
    const alreadyTraineeRowAtMain = mainSheetForDirection1
      .locator("li")
      .filter({ hasText: alreadyTraineeWorker.name });
    await alreadyTraineeRowAtMain
      .getByRole("button", { name: "선택", exact: true })
      .click({ force: true });
    await mainSheetForDirection1.getByRole("button", { name: "저장", exact: true }).click({ force: true });
    await expect(page.getByText(TRAINEE_ALREADY_ASSIGNED_MESSAGE)).toBeVisible();
    await closeSheet(page, mainSheetForDirection1);

    const { data: direction1AssignmentRows } = await admin
      .from("assignment_positions")
      .select("position_id, assignments!inner(profile_id, schedule_id)")
      .eq("position_id", mainPositionId)
      .eq("assignments.schedule_id", scheduleId)
      .eq("assignments.profile_id", alreadyTraineeWorker.id);
    expect(direction1AssignmentRows).toHaveLength(0);

    const { data: direction1TraineeRows } = await admin
      .from("assignment_trainees")
      .select("position_id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", alreadyTraineeWorker.id);
    expect(direction1TraineeRows).toHaveLength(1);
    expect(direction1TraineeRows?.[0]?.position_id).toBe(scanPositionId);

    await page.goto(`/admin/schedule/${scheduleId}`);
    const scanSheetForAssigned = await openPositionSheet(page, SCAN_POSITION_NAME);
    await toggleCandidateAndSave(page, scanSheetForAssigned, alreadyAssignedWorker.name, "선택");
    await closeSheet(page, scanSheetForAssigned);

    const { data: alreadyAssignedTraineeRejectData, error: alreadyAssignedTraineeRejectError } =
      await authenticatedAdminClient.rpc("replace_position_assignments", {
        target_schedule_id: scheduleId,
        target_position_id: mainPositionId,
        profile_ids: [],
        trainee_profile_ids: [alreadyAssignedWorker.id],
      });
    expect(alreadyAssignedTraineeRejectData).toBeNull();
    expect(alreadyAssignedTraineeRejectError?.code).toBe("LB024");
    expect(alreadyAssignedTraineeRejectError?.message).toBe(
      "이미 다른 포지션에 정식 배정되어 있어 교육생으로 지정할 수 없습니다",
    );

    const { data: direction2TraineeRows } = await admin
      .from("assignment_trainees")
      .select("position_id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", alreadyAssignedWorker.id);
    expect(direction2TraineeRows ?? []).toHaveLength(0);

    const { data: direction2AssignmentRows } = await admin
      .from("assignment_positions")
      .select("position_id, assignments!inner(profile_id, schedule_id)")
      .eq("position_id", scanPositionId)
      .eq("assignments.schedule_id", scheduleId)
      .eq("assignments.profile_id", alreadyAssignedWorker.id);
    expect(direction2AssignmentRows).toHaveLength(1);

    await page.goto(`/admin/schedule/${scheduleId}`);
    const scanSheetForDuplicate = await openPositionSheet(page, SCAN_POSITION_NAME);
    await toggleCandidateAndSave(page, scanSheetForDuplicate, duplicateTraineeWorker.name, "교육");
    await closeSheet(page, scanSheetForDuplicate);

    await page.goto(`/admin/schedule/${scheduleId}`);
    const mainSheetForDuplicate = await openPositionSheet(page, MAIN_POSITION_NAME);
    const duplicateRowAtMain = mainSheetForDuplicate
      .locator("li")
      .filter({ hasText: duplicateTraineeWorker.name });
    await duplicateRowAtMain.getByRole("button", { name: "교육", exact: true }).click({ force: true });
    await mainSheetForDuplicate.getByRole("button", { name: "저장", exact: true }).click({ force: true });
    await expect(page.getByText(TRAINEE_DUPLICATE_MESSAGE)).toBeVisible();
    await closeSheet(page, mainSheetForDuplicate);

    expect(TRAINEE_DUPLICATE_MESSAGE).not.toBe(TRAINEE_ALREADY_ASSIGNED_MESSAGE);

    const { data: duplicateTraineeRows } = await admin
      .from("assignment_trainees")
      .select("position_id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", duplicateTraineeWorker.id);
    expect(duplicateTraineeRows).toHaveLength(1);
    expect(duplicateTraineeRows?.[0]?.position_id).toBe(scanPositionId);

    await context.close();
  });
});
