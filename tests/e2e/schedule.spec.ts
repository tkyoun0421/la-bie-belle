import { expect, test } from "@playwright/test";

test("일정 화면의 하단 신청하기 버튼이 탭바에 가려지지 않고 보인다", async ({ page }) => {
  await page.goto("/schedule");

  const tabBar = page.getByRole("navigation", { name: "주요 메뉴" });
  await expect(tabBar).toBeVisible();

  const applyButton = page.getByRole("button", { name: "신청하기" });
  await expect(applyButton).toBeVisible();

  const tabBarBox = await tabBar.boundingBox();
  const buttonBox = await applyButton.boundingBox();
  expect(tabBarBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();

  expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(tabBarBox!.y + 1);

  await page.getByRole("button", { name: /신청 가능/ }).first().click();
  await applyButton.click();

  await expect(page.getByText("근무 가능일을 변경했어요")).toBeVisible();
});
