import { expect, test } from "@playwright/test";

test("기본 페이지가 뜨고 핵심 텍스트가 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("La Bie Belle")).toBeVisible();
  await expect(page.getByRole("button", { name: "시작하기" })).toBeVisible();
});
