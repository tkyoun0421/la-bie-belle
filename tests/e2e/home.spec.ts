import { expect, test } from "@playwright/test";

test("기본 페이지가 뜨고 핵심 텍스트가 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("La Bie Belle")).toBeVisible();
  await expect(page.getByRole("button", { name: "시작하기" })).toBeVisible();
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

  const heading = page.getByText("La Bie Belle");
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
