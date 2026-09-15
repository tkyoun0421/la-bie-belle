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

test("퇴사한 뒤 화면은 급여를 안내하고 계정 정보를 보여준다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createLeftUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/");

  await expect(page).toHaveURL(/\/left$/);
  await expect(page.getByText("근무를 마치셨어요")).toBeVisible();
  await expect(page.getByText("지난 급여는 계속 볼 수 있어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "급여 보기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
  await expect(page.getByText(user.email)).toBeVisible();
});
