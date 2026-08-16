import { createClient } from "@supabase/supabase-js";
import { devices, expect, test } from "@playwright/test";

import { loadSupabaseTestEnv } from "./support/supabase-test-auth";
import {
  closeSheet,
  openPositionSheet,
  positionButton,
  positionRow,
  toggleCandidateAndSave,
  waitForDrawerOpenTransitionToSettle,
} from "./support/assignment-candidate-sheet";
import {
  createAdminSession,
  createWorkerProfile,
  insertSchedule,
} from "./support/assignment-schedule-fixtures";
import { splitBand, WORK_DATE_BANDS, workDateInBand, workDatesInBand } from "./support/work-date-band";

const DRESS_POSITION_NAME = "드레스";
const MAIN_POSITION_NAME = "메인";
const SCAN_POSITION_NAME = "스캔";

const ELIGIBILITY_SUB_BANDS = splitBand(WORK_DATE_BANDS.assignmentEligibility, 2);
const ELIGIBILITY_BAND_A = ELIGIBILITY_SUB_BANDS[0]!;
const ELIGIBILITY_BAND_B = ELIGIBILITY_SUB_BANDS[1]!;

test.describe("배정 후보와 자격 검사", () => {
  test("여성 전용 포지션에서 자격 없는 근무자는 접힌 목록에 이유와 함께 표시되고, 신청자 배정 저장·교체·초과 배정이 반영되며, 확정 스케줄에서도 배정 시트가 열린다(P3-T09)", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    try {
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

    const [workDateOpen, workDateConfirmed] = workDatesInBand(ELIGIBILITY_BAND_A, 2) as [
      string,
      string,
    ];

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
    const confirmedDressCandidateButton = page.getByRole("button", {
      name: new RegExp(`^${DRESS_POSITION_NAME} 필요`),
    });
    await expect(confirmedDressCandidateButton).toHaveCount(1);
    await confirmedDressCandidateButton.click();
    const confirmedSheet = page.getByRole("dialog", { name: DRESS_POSITION_NAME, exact: true });
    await expect(confirmedSheet).toBeVisible();
    await expect(confirmedSheet.getByText("필요 1 / 배정 0")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(confirmedSheet).toBeHidden();
    } finally {
      await context.close();
    }
  });
});

const HEADCOUNT_LINE_PATTERN = /오는 사람 \d+명 · 포지션 합계 \d+/;

test.describe("복수 포지션 배정", () => {
  test("한 근무자가 두 포지션을 겸하면 각각 집계되고, 한쪽만 빼도 남아 있으며, 마지막 포지션을 빼야 스케줄에서 사라지고, 자격 없는 두 번째 포지션은 DB 함수가 거부하며, 겸직일 때만 실인원 줄이 뜬다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ ...devices["Pixel 5"], reducedMotion: "reduce" });
    try {
    const { admin, email, password } = await createAdminSession(context, baseURL);
    const page = await context.newPage();

    const { data: positionsData, error: positionsError } = await admin
      .from("positions")
      .select("id, name")
      .in("name", [MAIN_POSITION_NAME, SCAN_POSITION_NAME, DRESS_POSITION_NAME]);
    if (positionsError || !positionsData) {
      throw positionsError ?? new Error("포지션을 찾지 못했습니다.");
    }
    const positionRows = positionsData as { id: string; name: string }[];
    function positionId(name: string): string {
      const found = positionRows.find((row) => row.name === name);
      if (!found) {
        throw new Error(`포지션 ${name}을 찾지 못했습니다.`);
      }
      return found.id;
    }
    const mainPositionId = positionId(MAIN_POSITION_NAME);
    const scanPositionId = positionId(SCAN_POSITION_NAME);
    const dressPositionId = positionId(DRESS_POSITION_NAME);

    const coWorker = await createWorkerProfile(admin, "co-worker", "겸직자", "female");
    const coWorker2 = await createWorkerProfile(admin, "co-worker-2", "겸직자2", "male");
    const dressNotEligibleWorker = await createWorkerProfile(
      admin,
      "dress-not-eligible",
      "가능포지션미등록자",
      "female",
    );

    const { error: eligibilityError } = await admin.from("worker_position_eligibilities").insert([
      { profile_id: coWorker.id, position_id: mainPositionId },
      { profile_id: coWorker.id, position_id: scanPositionId },
      { profile_id: coWorker2.id, position_id: mainPositionId },
    ]);
    if (eligibilityError) {
      throw eligibilityError;
    }

    const workDate = workDateInBand(ELIGIBILITY_BAND_B);
    const scheduleId = await insertSchedule(admin, workDate, "OPEN");

    await page.goto(`/admin/schedule/${scheduleId}`);
    await expect(page.getByRole("heading", { name: workDate })).toBeVisible();
    await expect(page.getByText(HEADCOUNT_LINE_PATTERN)).toHaveCount(0);

    const mainSheetFirstOpen = await openPositionSheet(page, MAIN_POSITION_NAME);
    await expect(mainSheetFirstOpen.getByText("필요 1 / 배정 0")).toBeVisible();
    await toggleCandidateAndSave(page, mainSheetFirstOpen, coWorker.name, "선택");
    await expect(mainSheetFirstOpen.getByText("필요 1 / 배정 1")).toBeVisible();
    await closeSheet(page, mainSheetFirstOpen);

    await page.goto(`/admin/schedule/${scheduleId}`);
    await expect(page.getByText(HEADCOUNT_LINE_PATTERN)).toHaveCount(0);
    await expect(positionRow(page, MAIN_POSITION_NAME).getByText("필요 1 / 배정 1")).toBeVisible();

    const scanSheetFirstOpen = await openPositionSheet(page, SCAN_POSITION_NAME);
    await expect(scanSheetFirstOpen.getByText("필요 1 / 배정 0")).toBeVisible();
    await toggleCandidateAndSave(page, scanSheetFirstOpen, coWorker.name, "선택");
    await expect(scanSheetFirstOpen.getByText("필요 1 / 배정 1")).toBeVisible();
    await closeSheet(page, scanSheetFirstOpen);

    await page.goto(`/admin/schedule/${scheduleId}`);
    await expect(page.getByText("오는 사람 1명 · 포지션 합계 2")).toBeVisible();
    await expect(positionRow(page, MAIN_POSITION_NAME).getByText("필요 1 / 배정 1")).toBeVisible();
    await expect(positionRow(page, SCAN_POSITION_NAME).getByText("필요 1 / 배정 1")).toBeVisible();

    const { data: coWorkerAssignmentAfterBoth } = await admin
      .from("assignments")
      .select("id, assignment_positions(position_id)")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", coWorker.id);
    expect(coWorkerAssignmentAfterBoth).toHaveLength(1);
    expect(coWorkerAssignmentAfterBoth?.[0]?.assignment_positions).toHaveLength(2);

    const mainSheetForRemoval = await openPositionSheet(page, MAIN_POSITION_NAME);
    await expect(
      mainSheetForRemoval
        .locator("li")
        .filter({ hasText: coWorker.name })
        .getByText(SCAN_POSITION_NAME, { exact: true }),
    ).toBeVisible();
    await toggleCandidateAndSave(page, mainSheetForRemoval, coWorker.name, "선택됨");
    await expect(mainSheetForRemoval.getByText("필요 1 / 배정 0")).toBeVisible();
    await closeSheet(page, mainSheetForRemoval);

    const { data: coWorkerAssignmentAfterOneRemoved } = await admin
      .from("assignments")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", coWorker.id)
      .maybeSingle();
    expect(coWorkerAssignmentAfterOneRemoved).not.toBeNull();

    await page.goto(`/admin/schedule/${scheduleId}`);
    await expect(page.getByText(HEADCOUNT_LINE_PATTERN)).toHaveCount(0);
    await expect(positionRow(page, MAIN_POSITION_NAME).getByText("필요 1 / 배정 0")).toBeVisible();
    await expect(positionRow(page, SCAN_POSITION_NAME).getByText("필요 1 / 배정 1")).toBeVisible();

    const scanSheetAfterOneRemoved = await openPositionSheet(page, SCAN_POSITION_NAME);
    await expect(
      scanSheetAfterOneRemoved
        .locator("li")
        .filter({ hasText: coWorker.name })
        .getByRole("button", { name: "선택됨", exact: true }),
    ).toBeVisible();
    await expect(
      scanSheetAfterOneRemoved
        .locator("li")
        .filter({ hasText: coWorker.name })
        .getByText(MAIN_POSITION_NAME, { exact: true }),
    ).toHaveCount(0);
    await toggleCandidateAndSave(page, scanSheetAfterOneRemoved, coWorker.name, "선택됨");
    await expect(scanSheetAfterOneRemoved.getByText("필요 1 / 배정 0")).toBeVisible();
    await closeSheet(page, scanSheetAfterOneRemoved);

    const { data: coWorkerAssignmentAfterLastRemoved } = await admin
      .from("assignments")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", coWorker.id)
      .maybeSingle();
    expect(coWorkerAssignmentAfterLastRemoved).toBeNull();

    const mainSheetForCoWorker2 = await openPositionSheet(page, MAIN_POSITION_NAME);
    await toggleCandidateAndSave(page, mainSheetForCoWorker2, coWorker2.name, "선택");
    await expect(mainSheetForCoWorker2.getByText("필요 1 / 배정 1")).toBeVisible();
    await closeSheet(page, mainSheetForCoWorker2);

    const env = loadSupabaseTestEnv();
    const authenticatedAdminClient = createClient(env.supabaseUrl, env.anonKey);
    const { error: signInError } = await authenticatedAdminClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      throw signInError;
    }

    const { data: rejectedRpcData, error: rejectedRpcError } = await authenticatedAdminClient.rpc(
      "replace_position_assignments",
      {
        target_schedule_id: scheduleId,
        target_position_id: dressPositionId,
        profile_ids: [coWorker2.id],
      },
    );
    expect(rejectedRpcData).toBeNull();
    expect(rejectedRpcError?.code).toBe("LB023");
    expect(rejectedRpcError?.message).toBe("포지션 성별 조건에 맞지 않습니다");

    const {
      data: rejectedByEligibilityRpcData,
      error: rejectedByEligibilityRpcError,
    } = await authenticatedAdminClient.rpc("replace_position_assignments", {
      target_schedule_id: scheduleId,
      target_position_id: dressPositionId,
      profile_ids: [dressNotEligibleWorker.id],
    });
    expect(rejectedByEligibilityRpcData).toBeNull();
    expect(rejectedByEligibilityRpcError?.code).toBe("LB023");
    expect(rejectedByEligibilityRpcError?.message).toBe("가능 포지션으로 등록되지 않았습니다");
    expect(rejectedByEligibilityRpcError?.message).not.toBe(rejectedRpcError?.message);

    const { data: coWorker2DressAssignment } = await admin
      .from("assignment_positions")
      .select("position_id, assignments!inner(profile_id, schedule_id)")
      .eq("position_id", dressPositionId)
      .eq("assignments.schedule_id", scheduleId)
      .eq("assignments.profile_id", coWorker2.id);
    expect(coWorker2DressAssignment).toHaveLength(0);

    const { data: coWorker2MainAssignment } = await admin
      .from("assignment_positions")
      .select("position_id, assignments!inner(profile_id, schedule_id)")
      .eq("position_id", mainPositionId)
      .eq("assignments.schedule_id", scheduleId)
      .eq("assignments.profile_id", coWorker2.id);
    expect(coWorker2MainAssignment).toHaveLength(1);

    const { data: dressNotEligibleWorkerAssignment } = await admin
      .from("assignment_positions")
      .select("position_id, assignments!inner(profile_id, schedule_id)")
      .eq("position_id", dressPositionId)
      .eq("assignments.schedule_id", scheduleId)
      .eq("assignments.profile_id", dressNotEligibleWorker.id);
    expect(dressNotEligibleWorkerAssignment).toHaveLength(0);

    await page.goto(`/admin/schedule/${scheduleId}`);
    const dressSheetForCoWorker2 = await openPositionSheet(page, DRESS_POSITION_NAME);
    const dressIneligibleSummary = dressSheetForCoWorker2.getByText(/조건에 맞지 않는 \d+명 보기/);
    await expect(dressIneligibleSummary).toBeVisible();
    await waitForDrawerOpenTransitionToSettle(page);
    await dressIneligibleSummary.click({ force: true });
    const coWorker2DressRow = dressSheetForCoWorker2.locator("li").filter({ hasText: coWorker2.name });
    await expect(coWorker2DressRow).toBeVisible();
    await expect(coWorker2DressRow.getByText("포지션 성별 조건과 맞지 않아요")).toBeVisible();
    await closeSheet(page, dressSheetForCoWorker2);
    } finally {
      await context.close();
    }
  });
});
