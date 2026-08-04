import { expect, test } from "@playwright/test";

test("부트스트랩 화면이 모바일 뷰포트에서 렌더된다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("프로젝트 기반이 준비됐습니다");
  await expect(page.getByText("서버 경계: 정상")).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport?.width).toBeLessThan(500);

  const main = page.getByRole("main");
  const box = await main.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(viewport?.width ?? 0);
});
