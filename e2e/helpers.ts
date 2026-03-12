import { expect, type Page } from "@playwright/test";

const DEFAULT_QUERY =
  "e2eDate=2025-10-31&e2eSeed=connections-seed&e2eNoMotion=1&e2eLocal=1";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const gotoGame = async (page: Page, query: string = DEFAULT_QUERY) => {
  await page.goto(`/?${query}`);
  await expect(page.getByText("Create four groups of 4!")).toBeVisible();
  await expect(page.locator('[data-testid="word-grid-tile"]')).toHaveCount(16);
};

export const getGridWords = async (page: Page): Promise<string[]> =>
  page.locator('[data-testid="word-grid-tile"]').locator("button").allTextContents();

export const selectWords = async (page: Page, words: string[]) => {
  for (const word of words) {
    await page.getByRole("button", { name: new RegExp(`^${escapeRegExp(word)}$`) }).click();
  }
};
