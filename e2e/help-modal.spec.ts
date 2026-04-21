import { expect, test } from "@playwright/test";
import { clearStorageOnNextNavigation, gotoGame } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearStorageOnNextNavigation(page);
});

test("@core opens and closes help modal with keyboard", async ({ page }) => {
  await gotoGame(page);

  await page.getByRole("button", { name: /how to play/i }).click();
  const helpDialog = page.getByRole("dialog", { name: /how to play/i });
  await expect(helpDialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(helpDialog).not.toBeVisible();
});

test("@core toggles help modal language", async ({ page }) => {
  await gotoGame(page);

  await page.getByRole("button", { name: /how to play/i }).click();
  const helpDialog = page.getByRole("dialog", { name: /how to play/i });
  await expect(helpDialog).toBeVisible();

  await helpDialog
    .getByRole("button", { name: /translate help text to spanish/i })
    .click();

  await expect(page.getByRole("dialog", { name: /como jugar/i })).toBeVisible();
  await expect(page.getByText(/encuentra grupos de cuatro elementos/i)).toBeVisible();
});
