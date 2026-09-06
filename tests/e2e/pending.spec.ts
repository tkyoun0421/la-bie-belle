import { expect, test } from "@playwright/test";
import { seedSignedInSession } from "@tests/e2e/support/session";

test("세션은 있지만 승인 전이면 승인 대기 화면으로 간다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await seedSignedInSession(
    context,
    baseURL ?? "http://localhost:3000",
  );

  await page.goto("/");

  await expect(page).toHaveURL(/\/pending$/);
  await expect(page.getByText("승인 기다리는 중")).toBeVisible();
  await expect(page.getByText(user.email)).toBeVisible();
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
});

test("「알림 켜기」를 누르면 켠 뒤 모습으로 바뀐다", async ({
  page,
  context,
  baseURL,
}) => {
  const resolvedBaseURL = baseURL ?? "http://localhost:3000";
  await context.grantPermissions(["notifications"], {
    origin: resolvedBaseURL,
  });
  await seedSignedInSession(context, resolvedBaseURL);

  await page.goto("/");
  await expect(page).toHaveURL(/\/pending$/);

  await page.getByRole("button", { name: "알림 켜기" }).click();

  await expect(page.getByText("승인되면 알려드릴게요")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "알림 켜기" }),
  ).not.toBeVisible();
});

test("Notification API가 없는 기기에서 「알림 켜기」를 누르면 아이폰 안내가 뜬다", async ({
  page,
  context,
  baseURL,
}) => {
  await page.addInitScript(() => {
    // @ts-expect-error - 테스트에서 의도적으로 API를 지운다
    delete window.Notification;
  });
  await seedSignedInSession(context, baseURL ?? "http://localhost:3000");

  await page.goto("/");
  await expect(page).toHaveURL(/\/pending$/);

  await page.getByRole("button", { name: "알림 켜기" }).click();

  await expect(
    page.getByText("홈 화면에 추가하면 알림을 받아요"),
  ).toBeVisible();
  await expect(page.getByText("아래 공유 버튼을 눌러요")).toBeVisible();
});
