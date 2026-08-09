import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./support/supabase-test-auth";
import { WORK_DATE_BANDS, monthAnchorInBand } from "./support/work-date-band";

const TAB_SEQUENCE = [
  { link: "일정", heading: "일정" },
  { link: "알림", heading: "알림" },
  { link: "전체", heading: "전체" },
  { link: "홈", heading: "홈" },
] as const;

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

async function createWorkerSession(context: BrowserContext, baseURL: string | undefined) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `e2e-transition-worker-${randomUUID()}@labiebelle.test`;
  const password = "e2e-transition-worker-password-Aa1!";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("근무자 테스트 사용자 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    name: `근무자-${randomUUID().slice(0, 8)}`,
    phone: randomPhone(),
    gender: "female",
    birth_date: "1993-03-03",
    status: "active",
    inactivity_anchor_at: new Date().toISOString(),
  });
  if (profileError) {
    throw profileError;
  }

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  return { admin, id: data.user.id };
}

async function walkTabs(page: Page) {
  const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });

  for (const tab of TAB_SEQUENCE) {
    await tabBar.getByRole("link", { name: tab.link }).click();
    await expect(page.getByRole("heading", { level: 1, name: tab.heading })).toBeVisible();
  }
}

test.describe("탭 이동과 상세 진입", () => {
  test("하단 탭 4개를 오가며 각 화면이 정상 렌더된다", async ({ browser, baseURL }) => {
    const context = await browser.newContext();
    await createWorkerSession(context, baseURL);
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
    await createWorkerSession(context, baseURL);
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
    await createWorkerSession(context, baseURL);
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
    const worker = await createWorkerSession(context, baseURL);
    const page = await context.newPage();

    const { year, month } = monthAnchorInBand(WORK_DATE_BANDS.viewTransition);
    const day = 1 + Math.floor(Math.random() * 27);
    const workDate = `${year}-${pad(month)}-${pad(day)}`;

    const { error: scheduleError } = await worker.admin
      .from("schedules")
      .insert({ work_date: workDate, application_deadline: workDate, status: "CLOSED" });
    if (scheduleError) {
      throw scheduleError;
    }

    await page.goto(`/schedule?month=${year}-${pad(month)}`);
    await expect(page.getByRole("heading", { level: 1, name: "일정" })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`^${month}월 ${day}일`) }).click();

    await expect(page).toHaveURL(new RegExp(`/schedule/${workDate}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await context.close();
  });
});
