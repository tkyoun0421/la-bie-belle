import { readFile } from "node:fs/promises";

import type { Browser, BrowserContext } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { WORK_DATE_BANDS, monthAnchorInBand } from "./support/work-date-band";
import {
  type WorkerSession,
  createWorkerSession,
  deleteWorkerSessions,
} from "./support/worker-session";

const DIALOG_CONTENT_CLASS =
  "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-5 shadow-floating data-[state=closed]:motion-dialog-out data-[state=open]:motion-dialog-in";

const sessions: WorkerSession[] = [];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

test.afterAll(async () => {
  await deleteWorkerSessions(sessions.splice(0));
});

async function signInWorker(context: BrowserContext, baseURL: string | undefined) {
  const session = await createWorkerSession(context, baseURL, "e2e-motion-worker");
  sessions.push(session);
  return session;
}

async function openClosedScheduleDetail(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext();
  const worker = await signInWorker(context, baseURL);

  const { year, month } = monthAnchorInBand(WORK_DATE_BANDS.motionComputedStyle);
  const day = 1 + Math.floor(Math.random() * 27);
  const workDate = `${year}-${pad(month)}-${pad(day)}`;

  const { error } = await worker.admin
    .from("schedules")
    .insert({ work_date: workDate, application_deadline: workDate, status: "CLOSED" });
  if (error && error.code !== "23505") {
    throw error;
  }

  const page = await context.newPage();
  await page.goto(`/schedule/${workDate}`);
  await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

  return { context, page };
}

test.describe("적용된 모션", () => {
  test("probe가 쓰는 다이얼로그 클래스가 실제 컴포넌트와 같다", async () => {
    const source = await readFile("src/shared/ui/dialog.tsx", "utf8");
    const declared = /<DialogPrimitive\.Content\s+className="([^"]+)"/.exec(source)?.[1];

    expect(declared, "Content의 className 선언을 찾지 못했습니다").toBeDefined();
    expect(declared).toBe(DIALOG_CONTENT_CLASS);
  });

  test("바텀시트와 스낵바가 함께 떠도 두 전이 시간이 같은 토큰이다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL);
    const page = await context.newPage();

    await page.goto("/pay");
    await page.getByRole("button", { name: /^2026-08-11 · 13:00-15:00/ }).click();
    await page.getByRole("button", { name: "삭제하기" }).click();
    await expect(page.getByText("리허설 기록을 삭제했어요")).toBeVisible();

    await page.getByRole("button", { name: "리허설 기록 추가" }).click();
    await expect(page.getByRole("dialog", { name: "리허설 기록 추가" })).toBeVisible();

    const durations = await page.evaluate(() => {
      const unique = (element: Element) => [
        ...new Set(
          getComputedStyle(element)
            .transitionDuration.split(",")
            .map((value) => value.trim()),
        ),
      ];
      const sheet = document.querySelector('[data-vaul-drawer][data-state="open"]');
      const toast = document.querySelector("[data-sonner-toast]");
      return sheet && toast ? { sheet: unique(sheet), toast: unique(toast) } : null;
    });

    expect(durations, "시트와 스낵바가 함께 떠 있지 않습니다").not.toBeNull();
    expect(durations?.sheet).toEqual(["0.25s"]);
    expect(durations?.toast).toEqual(["0.25s"]);

    await context.close();
  });

  test("버튼이 색과 눌림을 한 전이 목록으로 함께 움직인다", async ({ browser, baseURL }) => {
    const { context, page } = await openClosedScheduleDetail(browser, baseURL);

    const back = page.getByRole("link", { name: "뒤로 가기" });
    const applied = await back.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        property: style.transitionProperty,
        duration: style.transitionDuration,
      };
    });

    expect(applied.property).toContain("color");
    expect(applied.property).toContain("scale");
    expect(applied.duration).toBe("0.15s");

    await context.close();
  });

  for (const state of ["open", "closed"] as const) {
    test(`다이얼로그 ${state === "open" ? "진입" : "이탈"} 애니메이션이 도는 중에도 화면 중앙을 유지한다`, async ({
      browser,
      baseURL,
    }) => {
      const { context, page } = await openClosedScheduleDetail(browser, baseURL);

      const offsets = await page.evaluate(
        ({ className, dialogState }) => {
          const probe = document.createElement("div");
          probe.className = className;
          probe.dataset.state = dialogState;
          probe.style.height = "160px";
          document.body.append(probe);

          const animation = probe.getAnimations()[0];
          if (!animation) {
            probe.remove();
            return null;
          }
          animation.pause();

          const samples = [0, 60, 125, 200, 250].map((time) => {
            animation.currentTime = time;
            const box = probe.getBoundingClientRect();
            return {
              horizontal: box.left + box.width / 2 - window.innerWidth / 2,
              vertical: box.top + box.height / 2 - window.innerHeight / 2,
            };
          });

          probe.remove();
          return samples;
        },
        { className: DIALOG_CONTENT_CLASS, dialogState: state },
      );

      expect(offsets, "다이얼로그 유틸에 애니메이션이 붙지 않았습니다").not.toBeNull();
      for (const offset of offsets ?? []) {
        expect(Math.abs(offset.horizontal)).toBeLessThan(1);
        expect(Math.abs(offset.vertical)).toBeLessThan(1);
      }

      await context.close();
    });
  }
});
