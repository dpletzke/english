import { expect, test } from "@playwright/test";
import { clearStorageOnNextNavigation, gotoGame } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearStorageOnNextNavigation(page);
});

test("@core switches puzzle date from the date picker", async ({ page }) => {
  await gotoGame(page, { date: null });

  await expect(page.getByRole("button", { name: /^SCORE$/ })).toBeVisible();
  await page.getByRole("button", { name: /choose puzzle date/i }).click();

  const dialog = page.getByRole("dialog", { name: /select puzzle/i });
  await expect(dialog).toBeVisible();

  await dialog.locator('button[data-date-key="2025-10-30"]').first().click();

  await expect(page.getByRole("button", { name: /^SCORE$/ })).not.toBeVisible();
  await expect(page.getByRole("button", { name: /^DRESSER$/ })).toBeVisible();
});
