import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import { primeRealAuthCallback } from "./support/real-auth-code";
import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./support/supabase-test-auth";

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

test.describe("미인증 접근", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("보호 라우트 접근이 로그인 화면으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/schedule");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "라비에벨" })).toBeVisible();
    await expect(page.getByText("근무 신청부터 출퇴근, 예상 급여까지 한곳에서 관리해요")).toBeVisible();
    await expect(page.getByRole("button", { name: "Google로 계속하기" })).toBeVisible();
  });

  test("Google로 계속하기를 누르면 Supabase authorize URL로 이동을 시작한다", async ({ page }) => {
    await page.goto("/login");

    const [authorizeRequest] = await Promise.all([
      page.waitForRequest((request) => request.url().includes("/auth/v1/authorize"), {
        timeout: 10_000,
      }),
      page.getByRole("button", { name: "Google로 계속하기" }).click(),
    ]);

    expect(authorizeRequest.url()).toContain("/auth/v1/authorize");
    expect(authorizeRequest.url()).toContain("provider=google");
  });
});

test.describe("세션 주입 후", () => {
  test("탭 화면에 인증 상태로 바로 진입한다", async ({ page }) => {
    await page.goto("/schedule");

    await expect(page).toHaveURL(/\/schedule$/);
    const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
    await expect(tabBar).toBeVisible();
  });
});

test.describe("로그아웃", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("로그아웃하면 /login으로 이동하고 보호 라우트가 다시 차단된다", async ({ page, context, baseURL }) => {
    const env = loadSupabaseTestEnv();
    const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
    const email = `e2e-logout-${randomUUID()}@labiebelle.test`;
    const password = "e2e-logout-password-Aa1!";

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw error ?? new Error("테스트 사용자 생성에 실패했습니다.");
    }
    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      name: "이바비",
      phone: randomPhone(),
      gender: "female",
      birth_date: "1990-01-01",
      status: "active",
    });
    if (profileError) {
      throw profileError;
    }

    const cookies = await signInWithPasswordCookies(env, { email, password });
    const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
    await context.addCookies(toPlaywrightCookies(cookies, domain));

    await page.goto("/more");
    await page.getByRole("button", { name: "로그아웃" }).click();

    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/schedule");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("콜백 실제 코드 교환과 온보딩 분기", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("profile이 있으면 실제 코드 교환으로 세션 쿠키가 설정되고 홈으로 이동한다", async ({
    page,
    context,
    baseURL,
  }) => {
    const env = loadSupabaseTestEnv();
    const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
    const email = `e2e-callback-with-profile-${randomUUID()}@labiebelle.test`;

    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error || !data.user) {
      throw error ?? new Error("테스트 사용자 생성에 실패했습니다.");
    }
    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      name: "이바비",
      phone: randomPhone(),
      gender: "male",
      birth_date: "1990-01-01",
      status: "active",
    });
    if (profileError) {
      throw profileError;
    }

    const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
    const verifyUrl = await primeRealAuthCallback(context, env, {
      email,
      redirectTo: `${baseURL}/auth/callback`,
      domain,
    });

    await page.goto(verifyUrl);

    await expect(page).toHaveURL(`${baseURL}/`);
    const cookies = await context.cookies();
    expect(cookies.some((cookie) => /^sb-.*-auth-token$/.test(cookie.name))).toBe(true);
  });

  test("profile이 없으면 실제 코드 교환 후 /onboarding으로 이동한다", async ({
    page,
    context,
    baseURL,
  }) => {
    const env = loadSupabaseTestEnv();
    const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
    const email = `e2e-callback-no-profile-${randomUUID()}@labiebelle.test`;

    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error || !data.user) {
      throw error ?? new Error("테스트 사용자 생성에 실패했습니다.");
    }

    const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
    const verifyUrl = await primeRealAuthCallback(context, env, {
      email,
      redirectTo: `${baseURL}/auth/callback`,
      domain,
    });

    await page.goto(verifyUrl);

    await expect(page).toHaveURL(/\/onboarding$/);
  });
});
