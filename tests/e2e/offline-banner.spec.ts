import { expect, test } from "@playwright/test";

import {
  type WorkerSession,
  createWorkerSession,
  deleteWorkerSessions,
} from "./support/worker-session";

const sessions: WorkerSession[] = [];

test.afterAll(async () => {
  await deleteWorkerSessions(sessions);
});

test("셸 화면(홈)에서는 오프라인 배너가 헤더 셋째 줄로 한 벌만 뜬다", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const session = await createWorkerSession(context, baseURL, "e2e-offline-shell");
  sessions.push(session);
  const page = await context.newPage();

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "홈" })).toBeVisible();

  await context.setOffline(true);

  const banners = page.getByRole("status");
  await expect(banners).toHaveCount(1);
  await expect(banners).toHaveText(/인터넷 연결이 끊겼어요 · 지금은 보기만 할 수 있어요/);

  await context.setOffline(false);
  await context.close();
});

test("셸 밖 화면(내 정보)에서는 전역 오프라인 배너가 한 벌만 뜬다", async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  const session = await createWorkerSession(context, baseURL, "e2e-offline-noshell");
  sessions.push(session);
  const page = await context.newPage();

  await page.goto("/my-profile");
  await expect(page.getByRole("heading", { level: 1, name: "내 정보" })).toBeVisible();

  await context.setOffline(true);

  const banners = page.getByRole("status");
  await expect(banners).toHaveCount(1);
  await expect(banners).toHaveText("인터넷 연결이 끊겼어요");

  await context.setOffline(false);
  await context.close();
});
