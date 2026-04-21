import { expect, test } from "@playwright/test";
import { clearStorageOnNextNavigation, gotoGame, solveCategory } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearStorageOnNextNavigation(page);
});

test("@core completes the win lifecycle and keeps solved groups visible", async ({ page }) => {
  await gotoGame(page);

  await solveCategory(page, ["INCH", "MILE", "LITER", "POUND"]);
  await solveCategory(page, ["MATH", "HISTORY", "CHEMISTRY", "ART"]);
  await solveCategory(page, ["EXACT", "PRECISE", "ACCURATE", "CORRECT"]);
  await solveCategory(page, ["CREDIT", "SCORE", "POST", "ID"]);

  const resultDialog = page.getByRole("dialog", { name: /puzzle solved/i });
  await expect(resultDialog).toBeVisible();
  await expect(resultDialog.getByText(/you solved today's puzzle/i)).toBeVisible();

  await resultDialog.getByRole("button", { name: /return to puzzle/i }).click();
  await expect(resultDialog).not.toBeVisible();

  await expect(page.locator('[data-testid="word-grid-tile"]')).toHaveCount(0);

  const solvedTitles = await page.locator("article h2").allTextContents();
  expect(solvedTitles).toEqual([
    "UNITS",
    "SCHOOL SUBJECTS",
    "DEFINITE",
    "_____ CARD",
  ]);
});
