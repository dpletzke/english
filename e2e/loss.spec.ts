import { expect, test } from "@playwright/test";
import { gotoGame, selectWords } from "./helpers";

const wrongGuesses = [
  ["INCH", "MATH", "EXACT", "CREDIT"],
  ["MILE", "HISTORY", "PRECISE", "SCORE"],
  ["LITER", "CHEMISTRY", "ACCURATE", "POST"],
  ["POUND", "ART", "CORRECT", "ID"],
];

test("shows loss dialog and reveals all groups after final mistake", async ({ page }) => {
  await gotoGame(page);

  for (const guess of wrongGuesses) {
    await selectWords(page, guess);
    await page.getByRole("button", { name: /^submit$/i }).click();
  }

  await expect(page.getByRole("dialog", { name: /puzzle over/i })).toBeVisible();
  await expect(page.locator('[data-testid="revealed-category-group"]')).toHaveCount(4);
});
