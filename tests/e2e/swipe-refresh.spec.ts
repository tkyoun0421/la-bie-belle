import type { BrowserContext, Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { WORK_DATE_BANDS, monthAnchorInBand } from "./support/work-date-band";
import {
  type WorkerSession,
  createWorkerSession,
  deleteWorkerSessions,
} from "./support/worker-session";

const sessions: WorkerSession[] = [];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

test.afterAll(async () => {
  await deleteWorkerSessions(sessions.splice(0));
});

async function signInWorker(
  context: BrowserContext,
  baseURL: string | undefined,
  prefix: string,
) {
  const session = await createWorkerSession(context, baseURL, prefix);
  sessions.push(session);
  return session;
}

async function dragPointer(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 5 });
  await page.mouse.move(to.x, to.y, { steps: 5 });
}

async function dispatchPointerDrag(
  locator: Locator,
  points: readonly { x: number; y: number }[],
) {
  await locator.evaluate((element, pts) => {
    function firePointer(type: string, point: { x: number; y: number }) {
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: "touch",
          clientX: point.x,
          clientY: point.y,
        }),
      );
    }
    const [first, ...rest] = pts;
    if (first === undefined) {
      return;
    }
    firePointer("pointerdown", first);
    for (const point of rest) {
      firePointer("pointermove", point);
    }
    firePointer("pointerup", rest[rest.length - 1] ?? first);
  }, points);
}

test.describe("스와이프와 당겨서 새로고침", () => {
  test("알림 행을 임계값 넘게 밀면 읽음 처리되고, 임계값 전에 놓으면 복귀한다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL, "e2e-swipe-notif-worker");
    const page = await context.newPage();

    await page.goto("/notifications");
    const unreadRow = page.getByRole("button", { name: /근무 배정이 확정됐어요/ });
    await expect(unreadRow.getByText("읽지 않음.")).toHaveCount(1);

    await dispatchPointerDrag(unreadRow, [
      { x: 100, y: 100 },
      { x: 80, y: 100 },
      { x: 60, y: 100 },
    ]);
    await expect(unreadRow.getByText("읽지 않음.")).toHaveCount(1);

    await dispatchPointerDrag(unreadRow, [
      { x: 100, y: 100 },
      { x: 40, y: 100 },
      { x: -50, y: 100 },
    ]);
    await expect(unreadRow.getByText("읽지 않음.")).toHaveCount(0);

    await context.close();
  });

  test("세로로 드래그하면 가로 추적이 시작되지 않아 읽음 처리되지 않는다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL, "e2e-swipe-scroll-worker");
    const page = await context.newPage();

    await page.goto("/notifications");
    const unreadRow = page.getByRole("button", { name: /근무 배정이 확정됐어요/ });

    await dispatchPointerDrag(unreadRow, [
      { x: 100, y: 100 },
      { x: 101, y: 130 },
      { x: 102, y: 160 },
    ]);

    await expect(unreadRow.getByText("읽지 않음.")).toHaveCount(1);

    await context.close();
  });

  test("당겨서 새로고침으로 새로 열린 모집이 반영된다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL, "e2e-pull-refresh-worker");
    const page = await context.newPage();

    const { year, month } = monthAnchorInBand(WORK_DATE_BANDS.swipeRefresh);
    const day = 1 + Math.floor(Math.random() * 27);
    const workDate = `${year}-${pad(month)}-${pad(day)}`;

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { name: "일정" })).toBeVisible();
    await expect(page.getByRole("button", { name: `${month}월 ${day}일 모집 없음` })).toBeVisible();

    const { error } = await worker.admin
      .from("schedules")
      .insert({ work_date: workDate, application_deadline: workDate });
    if (error && error.code !== "23505") {
      throw error;
    }

    const main = page.locator("main").first();
    const box = await main.boundingBox();
    expect(box, "화면 좌표를 찾지 못했습니다").not.toBeNull();
    const x = box!.x + box!.width / 2;
    const topY = box!.y + 4;

    await dragPointer(page, { x, y: topY }, { x, y: topY + 150 });
    await expect(page.getByText("놓으면 새로고침")).toBeVisible();
    await page.mouse.up();

    await expect(
      page.getByRole("button", { name: `${month}월 ${day}일 신청 가능` }),
    ).toBeVisible();

    await context.close();
  });

  test("body에 overscroll-behavior-y: contain이 적용돼 브라우저 기본 당겨서 새로고침이 함께 뜨지 않는다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL, "e2e-overscroll-worker");
    const page = await context.newPage();

    await page.goto("/");
    const overscrollBehavior = await page.evaluate(
      () => getComputedStyle(document.body).overscrollBehaviorY,
    );
    expect(overscrollBehavior).toBe("contain");

    await context.close();
  });
});
