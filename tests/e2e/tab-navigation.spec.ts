import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./support/supabase-test-auth";
import { WORK_DATE_BANDS, workDateInBand, workDatesInBand } from "./support/work-date-band";
import {
  type WorkerSession,
  createWorkerSession,
  deleteWorkerSessions,
} from "./support/worker-session";

const TAB_SEQUENCE = [
  { link: "일정", heading: "일정" },
  { link: "급여", heading: "예상 급여" },
  { link: "전체", heading: "전체" },
  { link: "홈", heading: "홈" },
] as const;

const MORE_DESTINATIONS = [
  { link: "예상 급여", heading: "예상 급여" },
  { link: "내 정보", heading: "내 정보" },
  { link: "관리자", heading: "관리자" },
] as const;

const sessions: WorkerSession[] = [];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function parseWorkDate(workDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = workDate.split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

async function signInWorker(context: BrowserContext, baseURL: string | undefined) {
  const session = await createWorkerSession(context, baseURL, "e2e-tab-worker");
  sessions.push(session);
  return session;
}

async function signInAdminWorker(
  context: BrowserContext,
  baseURL: string | undefined,
): Promise<WorkerSession> {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-tab-admin-${randomUUID()}@labiebelle.test`;
  const password = "e2e-tab-admin-password-Aa1!";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("관리자 테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name: `탭관리자-${randomUUID().slice(0, 8)}`,
    phone: randomPhone(),
    gender: "male",
    birth_date: "1985-01-01",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  const { error: roleError } = await admin
    .from("profile_roles")
    .insert({ profile_id: data.user.id, role: "admin" });
  if (roleError) {
    throw roleError;
  }

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  const session: WorkerSession = { admin, id: data.user.id };
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

type TransitionSide = "old" | "new" | "other";

type TransitionAnimation = { name: string; durationMs: number; side: TransitionSide };

async function installViewTransitionSpy(page: Page) {
  await page.addInitScript(() => {
    type Record_ = { done: boolean; animations: TransitionAnimation[] };
    const target = window as typeof window & { __transitionRecords: Record_[] };
    target.__transitionRecords = [];
    const native = document.startViewTransition?.bind(document);
    if (native === undefined) {
      return;
    }
    document.startViewTransition = ((...args: Parameters<typeof native>) => {
      const index = target.__transitionRecords.length;
      target.__transitionRecords.push({ done: false, animations: [] });
      const transition = native(...args);
      transition.ready
        .then(() => {
          const animations = document
            .getAnimations()
            .map((animation) => {
              const name = (animation as CSSAnimation).animationName;
              const timing = animation.effect?.getComputedTiming();
              const durationMs = typeof timing?.duration === "number" ? timing.duration : 0;
              const pseudoElement = (animation.effect as KeyframeEffect | null)?.pseudoElement ?? null;
              const side: TransitionSide = pseudoElement?.startsWith("::view-transition-old(")
                ? "old"
                : pseudoElement?.startsWith("::view-transition-new(")
                  ? "new"
                  : "other";
              return { name, durationMs, side };
            })
            .filter(
              (entry): entry is TransitionAnimation =>
                typeof entry.name === "string" && entry.name.length > 0,
            );
          target.__transitionRecords[index] = { done: true, animations };
        })
        .catch(() => {
          target.__transitionRecords[index] = { done: true, animations: [] };
        });
      return transition;
    }) as typeof document.startViewTransition;
  });
}

async function readViewTransitionCallCount(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      (window as typeof window & { __transitionRecords?: unknown[] }).__transitionRecords
        ?.length ?? 0,
  );
}

async function readTransitionAnimations(page: Page, index: number): Promise<TransitionAnimation[]> {
  await page.waitForFunction((i) => {
    const records = (
      window as typeof window & {
        __transitionRecords?: { done: boolean; animations: TransitionAnimation[] }[];
      }
    ).__transitionRecords;
    return records?.[i]?.done === true;
  }, index);

  return page.evaluate((i) => {
    const records = (
      window as typeof window & {
        __transitionRecords: { done: boolean; animations: TransitionAnimation[] }[];
      }
    ).__transitionRecords;
    return records[i]!.animations;
  }, index);
}

function durationOf(
  animations: TransitionAnimation[],
  name: string,
  side?: TransitionSide,
): number {
  return (
    animations.find(
      (animation) => animation.name === name && (side === undefined || animation.side === side),
    )?.durationMs ?? 0
  );
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

    const workDate = workDateInBand(WORK_DATE_BANDS.viewTransition);
    const { year, month, day } = parseWorkDate(workDate);

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

  test("View Transitions 미지원 환경에서도 탭 이동과 상세 진입이 정상 동작한다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();

    await page.addInitScript(() => {
      Reflect.deleteProperty(Document.prototype, "startViewTransition");
    });

    await page.goto("/");
    expect(await page.evaluate(() => "startViewTransition" in document)).toBe(false);

    await walkTabs(page);

    const [workDate] = workDatesInBand(WORK_DATE_BANDS.viewTransition, 1);
    const { year, month, day } = parseWorkDate(workDate!);
    await seedClosedSchedule(worker, workDate!);

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

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

    const workDate = workDateInBand(WORK_DATE_BANDS.viewTransition);
    const { year, month, day } = parseWorkDate(workDate);

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

  test("탭 이동은 인접한 네 쌍 모두에서 페이드만 걸리고 슬라이드는 걸리지 않는다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInWorker(context, baseURL);
    const page = await context.newPage();
    await installViewTransitionSpy(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();

    const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });

    for (const tab of TAB_SEQUENCE) {
      const index = await readViewTransitionCallCount(page);
      await tabBar.getByRole("link", { name: tab.link }).click();
      await expect(page.getByRole("heading", { level: 1, name: tab.heading })).toBeVisible();

      const animations = await readTransitionAnimations(page, index);
      expect(durationOf(animations, "route-fade")).toBeGreaterThan(0);
      expect(durationOf(animations, "route-slide-y")).toBe(0);
    }

    await context.close();
  });

  test("전체 화면의 목적지 셋으로 이동하면 새 화면에 슬라이드가 걸린다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    await signInAdminWorker(context, baseURL);
    const page = await context.newPage();
    await installViewTransitionSpy(page);

    for (const destination of MORE_DESTINATIONS) {
      await page.goto("/more");
      await expect(page.getByRole("heading", { level: 1, name: "전체" })).toBeVisible();

      const index = await readViewTransitionCallCount(page);
      await page.getByRole("link", { name: destination.link }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: destination.heading }),
      ).toBeVisible();

      const animations = await readTransitionAnimations(page, index);
      expect(durationOf(animations, "route-fade", "new")).toBeGreaterThan(0);
      expect(durationOf(animations, "route-slide-y", "new")).toBeGreaterThan(0);
    }

    await context.close();
  });

  test("알림 목록에서 예상 급여 알림을 누르면 슬라이드가 걸리며 이동한다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();
    await installViewTransitionSpy(page);

    const { data: notificationRow, error: notificationError } = await worker.admin
      .from("notifications")
      .insert({
        recipient_id: worker.id,
        event_type: "pay_snapshot_updated",
        aggregate_id: randomUUID(),
        revision: 1,
        title: "예상 급여가 갱신됐어요",
        body: "이번 달 예상 급여를 확인하세요",
        target: { screen: "pay" },
      })
      .select("id")
      .single();
    if (notificationError || !notificationRow) {
      throw notificationError ?? new Error("알림 픽스처 생성에 실패했습니다.");
    }

    try {
      await page.goto("/notifications");
      await expect(page.getByRole("heading", { level: 1, name: "알림" })).toBeVisible();

      const index = await readViewTransitionCallCount(page);
      await page.getByRole("button", { name: /예상 급여가 갱신됐어요/ }).click();
      await expect(page).toHaveURL(/\/pay$/);
      await expect(page.getByRole("heading", { level: 1, name: "예상 급여" })).toBeVisible();

      const animations = await readTransitionAnimations(page, index);
      expect(durationOf(animations, "route-fade", "new")).toBeGreaterThan(0);
      expect(durationOf(animations, "route-slide-y", "new")).toBeGreaterThan(0);
    } finally {
      await worker.admin
        .from("notifications")
        .delete()
        .eq("id", (notificationRow as { id: string }).id);
      await context.close();
    }
  });

  test("상세 진입은 새 화면이 올라오고 뒤로 가기는 옛 화면이 내려간다", async ({
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

    const forwardIndex = await readViewTransitionCallCount(page);
    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

    const forwardAnimations = await readTransitionAnimations(page, forwardIndex);
    expect(durationOf(forwardAnimations, "route-slide-y", "new")).toBeGreaterThan(0);
    expect(durationOf(forwardAnimations, "route-slide-y", "old")).toBe(0);
    expect(durationOf(forwardAnimations, "route-fade", "old")).toBeGreaterThan(0);

    const backwardIndex = await readViewTransitionCallCount(page);
    await page.getByRole("link", { name: "뒤로 가기" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    const backwardAnimations = await readTransitionAnimations(page, backwardIndex);
    expect(durationOf(backwardAnimations, "route-slide-y", "old")).toBeGreaterThan(0);
    expect(durationOf(backwardAnimations, "route-slide-y", "new")).toBe(0);
    expect(durationOf(backwardAnimations, "route-fade", "new")).toBeGreaterThan(0);

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

    const index = await readViewTransitionCallCount(page);
    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

    const animations = await readTransitionAnimations(page, index);
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
    await page.getByRole("link", { name: /알림/ }).click();

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

  test("브라우저 뒤로 가기는 새로 전환을 만들지 않고 원래 화면으로 되돌아간다", async ({
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
    await page.waitForTimeout(400);

    const beforeBack = await readViewTransitionCallCount(page);
    await page.goBack();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    await expect(page).toHaveURL(/\/schedule(\?|$)/);

    expect(await readViewTransitionCallCount(page)).toBe(beforeBack);

    await context.close();
  });

  test("전환이 끝나기 전에 뒤로 가기를 눌러도 화면이 안착한다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();

    const [workDate] = workDatesInBand(WORK_DATE_BANDS.viewTransition, 1);
    const { year, month, day } = parseWorkDate(workDate!);
    await seedClosedSchedule(worker, workDate!);

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await page.waitForURL(new RegExp(`/schedule/${workDate}$`));
    await page.goBack();

    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).not.toBeVisible();
    await expect(page).toHaveURL(/\/schedule(\?|$)/);

    await context.close();
  });

  test("상세 화면에 진입한 직후 곧바로 뒤로 가기를 눌러도 화면이 정상 렌더된다", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();

    const [workDate] = workDatesInBand(WORK_DATE_BANDS.viewTransition, 1);
    const { year, month, day } = parseWorkDate(workDate!);
    await seedClosedSchedule(worker, workDate!);

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

    await page.goBack();

    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    await expect(page).toHaveURL(/\/schedule(\?|$)/);

    await context.close();
  });

  test("뒤로 가기를 두 번 연달아 눌러도 화면이 정상 렌더된다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    const worker = await signInWorker(context, baseURL);
    const page = await context.newPage();

    const [workDate] = workDatesInBand(WORK_DATE_BANDS.viewTransition, 1);
    const { year, month, day } = parseWorkDate(workDate!);
    await seedClosedSchedule(worker, workDate!);

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();

    const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
    await tabBar.getByRole("link", { name: "일정" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();
    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).toBeVisible();

    await page.evaluate(() => {
      history.back();
      history.back();
    });

    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "모집 마감" })).not.toBeVisible();

    await context.close();
  });
});
