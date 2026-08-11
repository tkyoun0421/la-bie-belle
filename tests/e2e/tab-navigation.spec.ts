import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { WORK_DATE_BANDS, monthAnchorInBand, workDatesInBand } from "./support/work-date-band";
import {
  type WorkerSession,
  createWorkerSession,
  deleteWorkerSessions,
} from "./support/worker-session";

const TAB_SEQUENCE = [
  { link: "일정", heading: "일정" },
  { link: "알림", heading: "알림" },
  { link: "전체", heading: "전체" },
  { link: "홈", heading: "홈" },
] as const;

const sessions: WorkerSession[] = [];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseWorkDate(workDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = workDate.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

async function signInWorker(context: BrowserContext, baseURL: string | undefined) {
  const session = await createWorkerSession(context, baseURL, "e2e-tab-worker");
  sessions.push(session);
  return session;
}

async function walkTabs(page: Page) {
  const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });

  for (const tab of TAB_SEQUENCE) {
    await tabBar.getByRole("link", { name: tab.link }).click();
    await expect(page.getByRole("heading", { level: 1, name: tab.heading })).toBeVisible();
  }
}

type NamedAnimationDuration = { name: string; durationMs: number };

async function installViewTransitionSpy(page: Page) {
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __viewTransitionCallCount: number;
      __lastTransitionAnimations: NamedAnimationDuration[];
    };
    target.__viewTransitionCallCount = 0;
    target.__lastTransitionAnimations = [];
    const native = document.startViewTransition?.bind(document);
    if (native === undefined) {
      return;
    }
    document.startViewTransition = ((...args: Parameters<typeof native>) => {
      target.__viewTransitionCallCount += 1;
      const transition = native(...args);
      transition.ready
        .then(() => {
          target.__lastTransitionAnimations = document
            .getAnimations()
            .map((animation) => {
              const name = (animation as CSSAnimation).animationName;
              const timing = animation.effect?.getComputedTiming();
              const durationMs = typeof timing?.duration === "number" ? timing.duration : 0;
              return { name, durationMs };
            })
            .filter(
              (entry): entry is NamedAnimationDuration =>
                typeof entry.name === "string" && entry.name.length > 0,
            );
        })
        .catch(() => undefined);
      return transition;
    }) as typeof document.startViewTransition;
  });
}

async function readViewTransitionCallCount(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as typeof window & { __viewTransitionCallCount?: number }).__viewTransitionCallCount ?? 0,
  );
}

async function readLastTransitionAnimations(page: Page): Promise<NamedAnimationDuration[]> {
  return page.evaluate(
    () =>
      (window as typeof window & { __lastTransitionAnimations?: NamedAnimationDuration[] })
        .__lastTransitionAnimations ?? [],
  );
}

function durationOf(animations: NamedAnimationDuration[], name: string): number {
  return animations.find((animation) => animation.name === name)?.durationMs ?? 0;
}

async function seedClosedSchedule(worker: WorkerSession, workDate: string): Promise<void> {
  const { error } = await worker.admin
    .from("schedules")
    .insert({ work_date: workDate, application_deadline: workDate, status: "CLOSED" });
  if (error && error.code !== "23505") {
    throw error;
  }
}

test.afterAll(async () => {
  await deleteWorkerSessions(sessions.splice(0));
});

test.describe("탭 이동과 상세 진입", () => {
  test("탭 이동과 상세 진입에서 document.startViewTransition 호출 계수가 늘어난다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();
    await installViewTransitionSpy(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();
    expect(await readViewTransitionCallCount(page)).toBe(0);

    const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
    await tabBar.getByRole("link", { name: "일정" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    const afterTabMove = await readViewTransitionCallCount(page);
    expect(afterTabMove).toBeGreaterThan(0);

    const { year, month } = monthAnchorInBand(WORK_DATE_BANDS.viewTransition);
    const day = 1 + Math.floor(Math.random() * 27);
    const workDate = `${year}-${pad(month)}-${pad(day)}`;

    const { error: scheduleError } = await worker.admin
      .from("schedules")
      .insert({ work_date: workDate, application_deadline: workDate, status: "CLOSED" });
    if (scheduleError && scheduleError.code !== "23505") {
      throw scheduleError;
    }

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    const afterHardNavigation = await readViewTransitionCallCount(page);

    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();
    const afterDetailEntry = await readViewTransitionCallCount(page);
    expect(afterDetailEntry).toBeGreaterThan(afterHardNavigation);

    await context.close();
  });

  test("하단 탭 4개를 오가며 각 화면이 정상 렌더된다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL);
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();

    await walkTabs(page);

    await context.close();
  });

  test("View Transitions 미지원 환경에서도 탭 이동이 정상 동작한다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL);
    const page = await context.newPage();

    await page.addInitScript(() => {
      Reflect.deleteProperty(Document.prototype, "startViewTransition");
    });

    await page.goto("/");
    expect(await page.evaluate(() => "startViewTransition" in document)).toBe(false);

    await walkTabs(page);

    await context.close();
  });

  test("reduced-motion에서도 탭 이동이 정상 동작한다", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    await signInWorker(context, baseURL);
    const page = await context.newPage();

    await page.goto("/");
    await walkTabs(page);

    await context.close();
  });

  test("달력 셀에서 확정 스케줄 상세로 들어가면 상세 화면이 렌더된다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();

    const { year, month } = monthAnchorInBand(WORK_DATE_BANDS.viewTransition);
    const day = 1 + Math.floor(Math.random() * 27);
    const workDate = `${year}-${pad(month)}-${pad(day)}`;

    const { error: scheduleError } = await worker.admin
      .from("schedules")
      .insert({ work_date: workDate, application_deadline: workDate, status: "CLOSED" });
    if (scheduleError && scheduleError.code !== "23505") {
      throw scheduleError;
    }

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();

    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

    await context.close();
  });

  test("탭 이동은 페이드만 걸리고 슬라이드는 걸리지 않는다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL);
    const page = await context.newPage();
    await installViewTransitionSpy(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();

    const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
    await tabBar.getByRole("link", { name: "일정" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    const animations = await readLastTransitionAnimations(page);
    expect(durationOf(animations, "route-fade")).toBeGreaterThan(0);
    expect(durationOf(animations, "route-slide-y")).toBe(0);

    await context.close();
  });

  test("상세 진입은 아래에서 올라오고 뒤로 가기는 아래로 내려간다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();
    await installViewTransitionSpy(page);

    const [workDate] = workDatesInBand(WORK_DATE_BANDS.viewTransition, 1);
    const { year, month, day } = parseWorkDate(workDate!);
    await seedClosedSchedule(worker, workDate!);

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

    const forwardAnimations = await readLastTransitionAnimations(page);
    expect(durationOf(forwardAnimations, "route-fade")).toBeGreaterThan(0);
    expect(durationOf(forwardAnimations, "route-slide-y")).toBeGreaterThan(0);

    await page.getByRole("link", { name: "뒤로 가기" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    const backwardAnimations = await readLastTransitionAnimations(page);
    expect(durationOf(backwardAnimations, "route-fade")).toBeGreaterThan(0);
    expect(durationOf(backwardAnimations, "route-slide-y")).toBeGreaterThan(0);

    await context.close();
  });

  test("하단 탭 바는 격리 이름을 가지고 전환 중에도 자리를 지킨다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL);
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();

    const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
    const isolationName = await tabBar.evaluate((el) => getComputedStyle(el).viewTransitionName);
    expect(isolationName).toBe("persistent-nav");

    const before = await tabBar.boundingBox();
    await tabBar.getByRole("link", { name: "일정" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    const after = await tabBar.boundingBox();

    expect(after).toEqual(before);

    await context.close();
  });

  test("reduced-motion에서는 슬라이드가 사라지고 페이드만 남는다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();
    await installViewTransitionSpy(page);

    const [workDate] = workDatesInBand(WORK_DATE_BANDS.viewTransition, 1);
    const { year, month, day } = parseWorkDate(workDate!);
    await seedClosedSchedule(worker, workDate!);

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

    const animations = await readLastTransitionAnimations(page);
    expect(durationOf(animations, "route-fade")).toBeGreaterThan(0);
    expect(durationOf(animations, "route-slide-y")).toBe(0);

    await context.close();
  });

  test("전환 도중 다른 탭을 눌러도 마지막 요청 화면으로 안착한다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL);
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();

    const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
    await tabBar.getByRole("link", { name: "일정" }).click();
    await tabBar.getByRole("link", { name: "알림" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "알림" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).not.toBeVisible();

    await context.close();
  });

  test("같은 탭을 다시 눌러도 전환 호출이 늘지 않는다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL);
    const page = await context.newPage();
    await installViewTransitionSpy(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();

    const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
    await tabBar.getByRole("link", { name: "일정" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    const afterFirstClick = await readViewTransitionCallCount(page);

    await tabBar.getByRole("link", { name: "일정" }).click();
    await page.waitForTimeout(300);
    const afterSecondClick = await readViewTransitionCallCount(page);

    expect(afterSecondClick).toBe(afterFirstClick);

    await context.close();
  });
});
