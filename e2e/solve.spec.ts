import { expect, test } from "@playwright/test";
import { gotoGame, selectWords } from "./helpers";

test("solves one category and reduces remaining tiles", async ({ page }) => {
  await gotoGame(page);

  await selectWords(page, ["INCH", "MILE", "LITER", "POUND"]);
  await page.getByRole("button", { name: /^submit$/i }).click();

  await expect(page.getByRole("heading", { name: /units/i })).toBeVisible();
  await expect(page.locator('[data-testid="word-grid-tile"]')).toHaveCount(12);
});
