import { test, expect } from "@playwright/test";

test.describe("English Learning Connections", () => {
  test("renders the main gameplay surface", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "English Learning Connections" }),
    ).toBeVisible();

    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Shuffle" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Deselect" })).toBeVisible();

    const wordTiles = page.locator("[data-word-id] button");
    await expect(wordTiles).toHaveCount(16);
  });
});
