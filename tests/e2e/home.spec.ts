import { expect, test } from "@playwright/test";

test("홈 화면이 모바일 뷰포트에서 렌더되고 하단 탭 4종을 보여준다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("홈");

  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThan(500);

  const main = page.getByRole("main");
  const box = await main.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(viewport?.width ?? 0);

  const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(tabBar.getByRole("link", { name: "홈" })).toBeVisible();
  await expect(tabBar.getByRole("link", { name: "일정" })).toBeVisible();
  await expect(tabBar.getByRole("link", { name: "알림" })).toBeVisible();
  await expect(tabBar.getByRole("link", { name: "전체" })).toBeVisible();
});
