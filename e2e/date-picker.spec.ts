import { expect, test } from "@playwright/test";
import { gotoGame } from "./helpers";

test("switches puzzle date from the date picker", async ({ page }) => {
  await gotoGame(page, "e2eSeed=connections-seed&e2eNoMotion=1&e2eLocal=1");

  await expect(page.getByRole("button", { name: /^SCORE$/ })).toBeVisible();
  await page.getByRole("button", { name: /choose puzzle date/i }).click();

  const dialog = page.getByRole("dialog", { name: /select puzzle/i });
  await expect(dialog).toBeVisible();

  await dialog.locator('button[data-date-key="2025-10-30"]').first().click();

  await expect(page.getByRole("button", { name: /^SCORE$/ })).not.toBeVisible();
  await expect(page.getByRole("button", { name: /^DRESSER$/ })).toBeVisible();
});
