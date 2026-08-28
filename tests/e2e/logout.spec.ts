import { expect, test } from "@playwright/test";
import { seedSignedInSession } from "@tests/e2e/support/session";

test("로그아웃을 부르면 다음 방문에서 로그인하지 않은 것으로 보인다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await seedSignedInSession(
    context,
    baseURL ?? "http://localhost:3000",
  );

  await page.goto("/");
  await expect(page.getByText(user.email)).toBeVisible();

  const logoutResponse = await page.request.post("/auth/logout");
  expect(logoutResponse.ok()).toBe(true);

  await page.goto("/");

  await expect(page.getByText("로그인하지 않았습니다")).toBeVisible();
});
