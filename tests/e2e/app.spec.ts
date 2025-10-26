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

  test("swaps word tiles when dragging one onto another", async ({ page }) => {
    await page.goto("/");

    const wordButtons = page.locator("[data-word-id] button");
    await expect(wordButtons).toHaveCount(16);

    const initialWords = (await wordButtons.allTextContents()).map((text) =>
      text.trim(),
    );
    const [firstWord, secondWord] = initialWords;

    const firstButton = wordButtons.nth(0);
    const secondButton = wordButtons.nth(1);

    const firstBox = await firstButton.boundingBox();
    const secondBox = await secondButton.boundingBox();

    if (!firstBox || !secondBox) {
      throw new Error("Unable to determine word tile positions for drag action");
    }

    const firstCenter = {
      x: firstBox.x + firstBox.width / 2,
      y: firstBox.y + firstBox.height / 2,
    };
    const secondCenter = {
      x: secondBox.x + secondBox.width / 2,
      y: secondBox.y + secondBox.height / 2,
    };

    await page.mouse.move(firstCenter.x, firstCenter.y);
    await page.mouse.down();
    await page.mouse.move(secondCenter.x, secondCenter.y, { steps: 10 });
    await page.mouse.up();

    const expectedWords = [...initialWords];
    expectedWords[0] = secondWord;
    expectedWords[1] = firstWord;

    await expect(wordButtons).toHaveText(expectedWords);
  });
});
