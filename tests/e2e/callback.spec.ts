import { expect, test } from "@playwright/test";

test("콜백 라우트에 code 없이 접근해도 죽지 않고 로그인 화면으로 돌아간다", async ({
  page,
}) => {
  const response = await page.goto("/auth/callback");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Google 계정으로 로그인" }),
  ).toBeVisible();
});
