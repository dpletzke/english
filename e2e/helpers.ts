import { expect, type Locator, type Page } from "@playwright/test";

const GAME_PROMPT = "Create four groups of 4!";

export interface GotoGameOptions {
  date?: string | null;
  seed?: string;
  noMotion?: boolean;
  localOnly?: boolean;
}

export interface ControlStateExpectation {
  submitEnabled: boolean;
  shuffleEnabled: boolean;
  deselectEnabled: boolean;
}

const DEFAULT_OPTIONS: Required<GotoGameOptions> = {
  date: "2025-10-31",
  seed: "connections-seed",
  noMotion: true,
  localOnly: true,
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildQueryString = (options?: GotoGameOptions): string => {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const params = new URLSearchParams();

  if (merged.date) {
    params.set("e2eDate", merged.date);
  }
  if (merged.seed) {
    params.set("e2eSeed", merged.seed);
  }
  if (merged.noMotion) {
    params.set("e2eNoMotion", "1");
  }
  if (merged.localOnly) {
    params.set("e2eLocal", "1");
  }

  return params.toString();
};

export const clearStorageOnNextNavigation = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
};

export const gotoGame = async (page: Page, options?: GotoGameOptions) => {
  await page.goto(`/?${buildQueryString(options)}`);
  await expect(page.getByText(GAME_PROMPT)).toBeVisible();
  await expect(page.locator('[data-testid="word-grid-tile"]')).toHaveCount(16);
};

export const getGridWords = async (page: Page): Promise<string[]> =>
  page.locator('[data-testid="word-grid-tile"]').locator("button").allTextContents();

export const selectWords = async (page: Page, words: string[]) => {
  for (const word of words) {
    await page
      .getByRole("button", { name: new RegExp(`^${escapeRegExp(word)}$`) })
      .click();
  }
};

export const solveCategory = async (page: Page, words: string[]) => {
  await selectWords(page, words);
  await page.getByRole("button", { name: /^submit$/i }).click();
};

const submitButton = (page: Page): Locator =>
  page.getByRole("button", { name: /^submit$/i });

const shuffleButton = (page: Page): Locator =>
  page.getByRole("button", { name: /^shuffle$/i });

const deselectButton = (page: Page): Locator =>
  page.getByRole("button", { name: /^deselect$/i });

export const assertControlsState = async (
  page: Page,
  expected: ControlStateExpectation,
) => {
  if (expected.submitEnabled) {
    await expect(submitButton(page)).toBeEnabled();
  } else {
    await expect(submitButton(page)).toBeDisabled();
  }

  if (expected.shuffleEnabled) {
    await expect(shuffleButton(page)).toBeEnabled();
  } else {
    await expect(shuffleButton(page)).toBeDisabled();
  }

  if (expected.deselectEnabled) {
    await expect(deselectButton(page)).toBeEnabled();
  } else {
    await expect(deselectButton(page)).toBeDisabled();
  }
};

export const getMistakePipsState = async (page: Page) => {
  const remaining = await page.getByLabel("mistake remaining").count();
  const spent = await page.getByLabel("mistake used").count();
  return { remaining, spent };
};
