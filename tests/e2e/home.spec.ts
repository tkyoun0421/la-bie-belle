import { expect, test } from "@playwright/test";
import { countGetUserCalls } from "@tests/e2e/support/auth-calls";
import {
  seedSessionForUser,
  seedSignedInSession,
} from "@tests/e2e/support/session";
import { createApprovedUser } from "@tests/integration/postgres";

test("승인된 사용자로 접속하면 리다이렉트 없이 홈에 머문다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createApprovedUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("button", { name: "시작하기" }),
  ).not.toBeVisible();
  await expect(
    page.getByText("프로젝트 스캐폴드가 준비되었습니다"),
  ).not.toBeVisible();
});

test("body가 라이트와 다크에서 서로 다른 배경색과 글자색을 명시로 받는다", async ({
  page,
}) => {
  const readBodyColors = () =>
    page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return { backgroundColor: style.backgroundColor, color: style.color };
    });

  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const light = await readBodyColors();

  await page.emulateMedia({ colorScheme: "dark" });
  const dark = await readBodyColors();

  expect(light.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(light.color).not.toBe("rgba(0, 0, 0, 0)");
  expect(dark.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(dark.color).not.toBe("rgba(0, 0, 0, 0)");

  expect(dark.backgroundColor).not.toBe(light.backgroundColor);
});

test("Wanted Sans가 CDN에서 로드되어 실제 렌더 텍스트에 걸린다", async ({
  page,
}) => {
  const requestedUrls: string[] = [];
  const jsdelivrWoff2Statuses: number[] = [];

  page.on("request", (request) => {
    requestedUrls.push(request.url());
  });
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("cdn.jsdelivr.net") && url.includes(".woff2")) {
      jsdelivrWoff2Statuses.push(response.status());
    }
  });

  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const heading = page.getByText("라비에벨");
  const fontFamily = await heading.evaluate(
    (element) => getComputedStyle(element).fontFamily,
  );
  expect(fontFamily.trim().toLowerCase()).toMatch(/^["']?wanted sans/);

  const googleFontRequests = requestedUrls.filter(
    (url) =>
      url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com"),
  );
  expect(googleFontRequests).toHaveLength(0);

  const geistSansVariable = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-geist-sans")
      .trim(),
  );
  expect(geistSansVariable).toBe("");

  expect(jsdelivrWoff2Statuses).toContain(200);
});

test("이미지 같은 정적 자원을 요청해도 인증 갱신 호출이 안 딸려 온다", async ({
  page,
  context,
  baseURL,
}) => {
  await seedSignedInSession(context, baseURL ?? "http://localhost:3000");

  const beforeStatic = countGetUserCalls();
  const staticResponse = await page.goto("/favicon.ico");
  expect(staticResponse?.ok()).toBe(true);
  const afterStatic = countGetUserCalls();

  expect(afterStatic).toBe(beforeStatic);

  const homeResponse = await page.goto("/");
  expect(homeResponse?.ok()).toBe(true);
  const afterHome = countGetUserCalls();

  expect(afterHome).toBeGreaterThan(afterStatic);
});
