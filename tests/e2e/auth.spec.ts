import { expect, test } from "@playwright/test";

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
