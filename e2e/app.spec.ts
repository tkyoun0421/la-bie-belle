import { expect, test } from "@playwright/test";

test("renders the root dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Go to the Previous Month" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Go to the Next Month" })
  ).toBeVisible();
});
