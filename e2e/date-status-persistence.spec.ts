import { expect, test } from "@playwright/test";
import { gotoGame, solveCategory } from "./helpers";

test.describe.serial("@core date picker persistence", () => {
  test("persists solved status and shows it in the date picker", async ({ page }) => {
    await gotoGame(page, { date: null });
    await expect(page.getByRole("button", { name: /^SCORE$/ })).toBeVisible();

    await solveCategory(page, ["INCH", "MILE", "LITER", "POUND"]);
    await solveCategory(page, ["MATH", "HISTORY", "CHEMISTRY", "ART"]);
    await solveCategory(page, ["EXACT", "PRECISE", "ACCURATE", "CORRECT"]);
    await solveCategory(page, ["CREDIT", "SCORE", "POST", "ID"]);

    await page.getByRole("button", { name: /return to puzzle/i }).click();
    await page.reload();
    const persistedWinDialog = page.getByRole("dialog", { name: /puzzle solved/i });
    await expect(persistedWinDialog).toBeVisible();
    await persistedWinDialog.getByRole("button", { name: /return to puzzle/i }).click();
    await expect(persistedWinDialog).not.toBeVisible();

    await page.getByRole("button", { name: /choose puzzle date/i }).click();
    const solvedIcon = page
      .locator('button[data-date-key="2025-10-31"]')
      .getByRole("img", { name: /^solved$/i });
    await expect(solvedIcon).toBeVisible();

    await page
      .locator('button[data-date-key="2025-10-30"]')
      .first()
      .click();

    await expect(page.getByRole("button", { name: /^DRESSER$/ })).toBeVisible();
    await page.getByRole("button", { name: /choose puzzle date/i }).click();

    const solvedIconAfterSwitch = page
      .locator('button[data-date-key="2025-10-31"]')
      .getByRole("img", { name: /^solved$/i });
    await expect(solvedIconAfterSwitch).toBeVisible();
  });
});
