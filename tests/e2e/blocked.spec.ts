import { expect, test } from "@playwright/test";
import { seedSessionForUser } from "@tests/e2e/support/session";
import { createBlockedUser } from "@tests/integration/postgres";

test("차단된 사용자가 홈을 열면 차단 화면으로 간다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createBlockedUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/");

  await expect(page).toHaveURL(/\/blocked$/);
});
