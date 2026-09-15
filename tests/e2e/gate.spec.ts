import { expect, test } from "@playwright/test";
import { seedSessionForUser } from "@tests/e2e/support/session";
import { createApprovedUser } from "@tests/integration/postgres";
import { createSignedInUserWithoutProfile } from "@tests/integration/supabase";

test("승인된 사용자가 승인 대기 화면을 열면 홈으로 간다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createApprovedUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/pending");

  await expect(page).toHaveURL(/\/$/);
});

test("프로필 없는 새 사용자가 앱을 열면 승인 대기로 가고 프로필 행이 생긴다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createSignedInUserWithoutProfile();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/");

  await expect(page).toHaveURL(/\/pending$/);

  const { data, error } = await user.client
    .from("profiles")
    .select("id")
    .eq("user_id", user.userId)
    .maybeSingle();

  expect(error).toBeNull();
  expect(data).not.toBeNull();
});
