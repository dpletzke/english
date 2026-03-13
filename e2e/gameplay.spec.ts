import { expect, test } from "@playwright/test";
import {
  assertControlsState,
  clearStorageOnNextNavigation,
  getGridWords,
  gotoGame,
  selectWords,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearStorageOnNextNavigation(page);
});

test("@core loads fixed date puzzle with 16 tiles", async ({ page }) => {
  await gotoGame(page);

  await expect(page.locator('[data-testid="word-grid-tile"]')).toHaveCount(16);
  await assertControlsState(page, {
    submitEnabled: false,
    shuffleEnabled: true,
    deselectEnabled: false,
  });
});

test("@core enforces controls guardrails for selection and shuffle", async ({ page }) => {
  await gotoGame(page);

  const initialWords = await getGridWords(page);

  await selectWords(page, ["INCH", "MILE", "LITER"]);
  await assertControlsState(page, {
    submitEnabled: false,
    shuffleEnabled: true,
    deselectEnabled: true,
  });

  await selectWords(page, ["POUND"]);
  await assertControlsState(page, {
    submitEnabled: true,
    shuffleEnabled: true,
    deselectEnabled: true,
  });

  await page.getByRole("button", { name: /^deselect$/i }).click();
  await assertControlsState(page, {
    submitEnabled: false,
    shuffleEnabled: true,
    deselectEnabled: false,
  });

  await page.getByRole("button", { name: /^shuffle$/i }).click();
  const shuffledWords = await getGridWords(page);

  expect(new Set(shuffledWords).size).toBe(16);
  expect([...shuffledWords].sort()).toEqual([...initialWords].sort());
});

test("@core seeded shuffle is deterministic across page reloads", async ({ page }) => {
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
