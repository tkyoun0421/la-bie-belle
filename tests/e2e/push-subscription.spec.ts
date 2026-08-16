import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { createWorkerSession, deleteWorkerSessions } from "./support/worker-session";
import { WORK_DATE_BANDS, workDatesInSameMonth } from "./support/work-date-band";

const SETTINGS_HEADING = "알림 설정";
const PERMISSION_DENIED_TEXT =
  "브라우저 알림 권한이 꺼져 있어요. 브라우저 설정에서 알림을 허용한 뒤 다시 시도해 주세요.";
const PRIMING_TITLE = "알림을 받아보세요";
const PRIMING_ENABLE_LABEL = "알림 받기";
const PRIMING_LATER_LABEL = "나중에";
const SCHEDULE_HEADING = "일정";
const SAVE_LABEL = "신청하기";
const SAVED_SNACKBAR_TEXT = "근무 가능일을 변경했어요";
const PERMISSION_REQUEST_COUNT_KEY = "pushPermissionRequestCount";

type WindowWithPermissionStub = typeof window & Record<string, number | undefined>;

async function stubNotDeniedPermission(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    Object.defineProperty(Notification, "permission", {
      value: "default",
      configurable: true,
    });
    (window as WindowWithPermissionStub)[key] = 0;
    Notification.requestPermission = () => {
      const current = (window as WindowWithPermissionStub)[key] ?? 0;
      (window as WindowWithPermissionStub)[key] = current + 1;
      return Promise.resolve("granted");
    };
  }, PERMISSION_REQUEST_COUNT_KEY);
}

async function readPermissionRequestCount(page: Page): Promise<number> {
  return page.evaluate(
    (key) => (window as WindowWithPermissionStub)[key] ?? 0,
    PERMISSION_REQUEST_COUNT_KEY,
  );
}

test.describe("알림 설정 화면", () => {
  test("headless 환경의 알림 권한 거부 상태에서 진입하면 거부 안내를 보여준다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await createWorkerSession(context, baseURL, "e2e-push-settings-worker");
    const page = await context.newPage();

    try {
      await page.goto("/more/notification-settings");
      await expect(page.getByRole("heading", { level: 1, name: SETTINGS_HEADING })).toBeVisible();
      await expect(page.getByText(PERMISSION_DENIED_TEXT)).toBeVisible();
    } finally {
      await deleteWorkerSessions([worker]);
      await context.close();
    }
  });
});

test.describe("첫 신청 성공 후 사전 안내", () => {
  test("신청 저장 성공 후 사전 안내 시트가 뜨고, 알림 받기를 누르면 권한 요청으로 이어진다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await createWorkerSession(context, baseURL, "e2e-push-priming-enable-worker");
    const page = await context.newPage();
    await stubNotDeniedPermission(page);

    const dateA = workDatesInSameMonth(WORK_DATE_BANDS.pushSubscription, 1)[0] as string;
    const monthKey = dateA.slice(0, 7);
    const month = Number(dateA.slice(5, 7));
    const dayA = Number(dateA.slice(8, 10));

    const { error: scheduleError } = await worker.admin
      .from("schedules")
      .insert([{ work_date: dateA, application_deadline: dateA }]);
    if (scheduleError) {
      throw scheduleError;
    }

    try {
      await page.goto(`/schedule?month=${monthKey}`);
      await expect(page.getByRole("heading", { name: SCHEDULE_HEADING })).toBeVisible();

      await page.getByRole("button", { name: `${month}월 ${dayA}일 신청 가능` }).click();
      await page.getByRole("button", { name: SAVE_LABEL }).click();
      await expect(page.getByText(SAVED_SNACKBAR_TEXT)).toBeVisible();

      const sheet = page.getByRole("dialog", { name: PRIMING_TITLE });
      await expect(sheet).toBeVisible();

      await sheet.getByRole("button", { name: PRIMING_ENABLE_LABEL }).click();

      await expect
        .poll(() => readPermissionRequestCount(page))
        .toBe(1);
    } finally {
      await context.close();
    }
  });

  test("사전 안내 시트에서 나중에를 누르면 재노출 없이 닫힌다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const worker = await createWorkerSession(context, baseURL, "e2e-push-priming-later-worker");
    const page = await context.newPage();
    await stubNotDeniedPermission(page);

    const [dateA, dateB] = workDatesInSameMonth(WORK_DATE_BANDS.pushSubscription, 2) as [
      string,
      string,
    ];
    const monthKey = dateA.slice(0, 7);
    const month = Number(dateA.slice(5, 7));
    const dayA = Number(dateA.slice(8, 10));
    const dayB = Number(dateB.slice(8, 10));

    const { error: scheduleError } = await worker.admin.from("schedules").insert([
      { work_date: dateA, application_deadline: dateA },
      { work_date: dateB, application_deadline: dateB },
    ]);
    if (scheduleError) {
      throw scheduleError;
    }

    try {
      await page.goto(`/schedule?month=${monthKey}`);
      await expect(page.getByRole("heading", { name: SCHEDULE_HEADING })).toBeVisible();

      await page.getByRole("button", { name: `${month}월 ${dayA}일 신청 가능` }).click();
      await page.getByRole("button", { name: SAVE_LABEL }).click();
      await expect(page.getByText(SAVED_SNACKBAR_TEXT)).toBeVisible();

      const sheet = page.getByRole("dialog", { name: PRIMING_TITLE });
      await expect(sheet).toBeVisible();
      await expect(sheet.getByRole("button", { name: PRIMING_ENABLE_LABEL })).toBeVisible();

      await sheet.getByRole("button", { name: PRIMING_LATER_LABEL }).click();
      await expect(sheet).not.toBeVisible();

      await page.getByRole("button", { name: `${month}월 ${dayB}일 신청 가능` }).click();
      await page.getByRole("button", { name: SAVE_LABEL }).click();
      await expect(page.getByText(SAVED_SNACKBAR_TEXT)).toBeVisible();

      await expect(page.getByRole("dialog", { name: PRIMING_TITLE })).not.toBeVisible();
    } finally {
      await context.close();
    }
  });
});
