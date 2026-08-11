import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

const DRAWER_OPEN_TRANSITION_MS = 700;

export async function waitForDrawerOpenTransitionToSettle(page: Page): Promise<void> {
  await page.waitForTimeout(DRAWER_OPEN_TRANSITION_MS);
}

export function positionButton(page: Page, positionName: string): Locator {
  return page.getByRole("button", { name: new RegExp(`^${positionName} 필요`) });
}

export function positionRow(page: Page, positionName: string): Locator {
  return page.locator("li").filter({ has: positionButton(page, positionName) });
}

export async function openPositionSheet(page: Page, positionName: string): Promise<Locator> {
  const button = positionButton(page, positionName);
  await expect(button).toHaveCount(1);
  await button.click();
  const sheet = page.getByRole("dialog", { name: positionName, exact: true });
  await expect(sheet).toBeVisible();
  return sheet;
}

export async function closeSheet(page: Page, sheet: Locator): Promise<void> {
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
}

export async function toggleCandidateAndSave(
  page: Page,
  sheet: Locator,
  workerName: string,
  fromLabel: "선택" | "선택됨" | "교육" | "교육됨",
): Promise<void> {
  const row = sheet.locator("li").filter({ hasText: workerName });
  await row.getByRole("button", { name: fromLabel, exact: true }).click({ force: true });
  await sheet.getByRole("button", { name: "저장", exact: true }).click({ force: true });
  await expect(page.getByText("배정을 변경했어요")).toBeVisible();
}
