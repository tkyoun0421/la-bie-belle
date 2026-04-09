import { expect, test } from "@playwright/test";

test("renders the root dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: "Operational dashboard bootstrap" })
  ).toBeVisible();
});
