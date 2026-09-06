import { expect, test } from "@playwright/test";

test("로그인 화면에 브랜드 요소와 구글 로그인 버튼이 보인다", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page.getByText("라", { exact: true })).toBeVisible();
  await expect(page.getByText("라비에벨")).toBeVisible();
  await expect(page.getByText("근무표와 급여를 한곳에서 봐요")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Google 계정으로 로그인" }),
  ).toBeVisible();
  await expect(
    page.getByText(/가입하면\s+관리자가\s+확인한\s+뒤에\s+근무표가\s+보여요/),
  ).toBeVisible();
});

test("로그인하지 않은 채 홈에 가면 로그인 화면으로 밀려난다", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: "Google 계정으로 로그인" }),
  ).toBeVisible();
});
