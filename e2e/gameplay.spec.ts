import { expect, test } from "@playwright/test";
import { getGridWords, gotoGame } from "./helpers";

test("loads fixed date puzzle with 16 tiles", async ({ page }) => {
  await gotoGame(page);

  await expect(page.locator('[data-testid="word-grid-tile"]')).toHaveCount(16);
  await expect(page.getByRole("button", { name: /^shuffle$/i })).toBeEnabled();
  await expect(page.getByRole("button", { name: /^submit$/i })).toBeDisabled();
});

test("seeded shuffle is deterministic across page reloads", async ({ page }) => {
  await gotoGame(page);

  const initialOrder = await getGridWords(page);
  await page.getByRole("button", { name: /^shuffle$/i }).click();
  const shuffledOrder = await getGridWords(page);

  await page.reload();
  await expect(page.getByText("Create four groups of 4!")).toBeVisible();

  const reloadedInitialOrder = await getGridWords(page);
  await page.getByRole("button", { name: /^shuffle$/i }).click();
  const reloadedShuffledOrder = await getGridWords(page);

  expect(reloadedInitialOrder).toEqual(initialOrder);
  expect(reloadedShuffledOrder).toEqual(shuffledOrder);
});
