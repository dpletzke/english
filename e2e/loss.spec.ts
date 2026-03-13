import { expect, test } from "@playwright/test";
import {
  clearStorageOnNextNavigation,
  getMistakePipsState,
  gotoGame,
  selectWords,
} from "./helpers";

const wrongGuesses = [
  ["INCH", "MATH", "EXACT", "CREDIT"],
  ["MILE", "HISTORY", "PRECISE", "SCORE"],
  ["LITER", "CHEMISTRY", "ACCURATE", "POST"],
  ["POUND", "ART", "CORRECT", "ID"],
];

test.beforeEach(async ({ page }) => {
  await clearStorageOnNextNavigation(page);
});

test("@core decrements mistake pips and loses on the fourth wrong guess", async ({ page }) => {
  await gotoGame(page);

  await expect(await getMistakePipsState(page)).toEqual({ remaining: 4, spent: 0 });

  for (const [index, guess] of wrongGuesses.slice(0, 3).entries()) {
    await selectWords(page, guess);
    await page.getByRole("button", { name: /^submit$/i }).click();

    await expect
      .poll(() => getMistakePipsState(page))
      .toEqual({ remaining: 3 - index, spent: index + 1 });
  }

  await selectWords(page, wrongGuesses[3]);
  await page.getByRole("button", { name: /^submit$/i }).click();

  await expect(page.getByRole("dialog", { name: /puzzle over/i })).toBeVisible();
  await expect(page.locator('[data-testid="revealed-category-group"]')).toHaveCount(4);
});
