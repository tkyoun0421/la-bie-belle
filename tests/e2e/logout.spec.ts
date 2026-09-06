import { expect, test } from "@playwright/test";
import { seedSignedInSession } from "@tests/e2e/support/session";

test("승인 대기에서 로그아웃하면 로그인 화면으로 돌아간다", async ({
  page,
  context,
  baseURL,
}) => {
  await seedSignedInSession(context, baseURL ?? "http://localhost:3000");

  await page.goto("/");
  await expect(page).toHaveURL(/\/pending$/);
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();

  const logoutResponse = await page.request.post("/auth/logout");
  expect(logoutResponse.ok()).toBe(true);

  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Google 계정으로 로그인" }),
  ).toBeVisible();
});
