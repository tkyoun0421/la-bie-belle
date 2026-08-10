import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { evaluateRenderBudget } from "../../harness/lib/motion-render-budget";
import {
  createWorkerSession,
  deleteWorkerSessions,
  type WorkerSession,
} from "./support/worker-session";

const WARMUP_TRIAL_COUNT = 2;
const SAMPLE_TRIAL_COUNT = 5;

const sessions: WorkerSession[] = [];

test.afterAll(async () => {
  await deleteWorkerSessions(sessions.splice(0));
});

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0);
}

function buildMountProbe(markup: string): string {
  return `(async () => {
    document.body.innerHTML = ${JSON.stringify(markup)};
    const start = performance.now();
    document.body.offsetHeight;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return performance.now() - start;
  })()`;
}

const RESET_BODY_PROBE = 'document.body.innerHTML = ""';

async function captureNotificationListMarkup(page: Page): Promise<string> {
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "알림" })).toBeVisible();

  const markup = await page.locator("main").evaluate((element) => element.outerHTML);
  expect(markup, "알림 행에 motion-stagger-item이 없으면 렌더 시간을 잴 대상이 없습니다").toContain(
    "motion-stagger-item",
  );
  return markup;
}

async function measureMountMs(page: Page, markup: string): Promise<number> {
  const samples: number[] = [];
  for (let trial = 0; trial < WARMUP_TRIAL_COUNT + SAMPLE_TRIAL_COUNT; trial += 1) {
    const elapsedMs = await page.evaluate<number>(buildMountProbe(markup));
    await page.evaluate(RESET_BODY_PROBE);
    if (trial >= WARMUP_TRIAL_COUNT) {
      samples.push(elapsedMs);
    }
  }
  return median(samples);
}

test.describe("렌더 시간 예산", () => {
  test("실제 알림 목록 화면의 순차 등장이 reduced-motion 대비 16ms 이내로 더 걸린다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await createWorkerSession(context, baseURL, "e2e-render-budget-worker");
    sessions.push(worker);
    const page = await context.newPage();

    await page.emulateMedia({ reducedMotion: "no-preference" });
    const fullMotionMarkup = await captureNotificationListMarkup(page);
    const fullMotionMs = await measureMountMs(page, fullMotionMarkup);

    await page.emulateMedia({ reducedMotion: "reduce" });
    const reducedMotionMarkup = await captureNotificationListMarkup(page);
    const reducedMotionMs = await measureMountMs(page, reducedMotionMarkup);

    const violations = evaluateRenderBudget({ fullMotionMs, reducedMotionMs });
    expect(violations.map((violation) => violation.message)).toEqual([]);

    await context.close();
  });
});
