import { expect, test } from "@playwright/test";
import { seedSessionForUser } from "@tests/e2e/support/session";
import { createLeftUser } from "@tests/integration/postgres";

test("퇴사한 사용자가 홈을 열면 퇴사 화면으로 간다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createLeftUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/");

  await expect(page).toHaveURL(/\/left$/);
});
