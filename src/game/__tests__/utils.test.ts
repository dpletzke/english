import { describe, expect, it } from "vitest";

import type { CategoryDefinition, ConnectionsPuzzle } from "../../data/puzzles";
import { orderedCategories, prepareWordCards } from "../utils";

const buildCategory = (
  overrides: Partial<CategoryDefinition>,
): CategoryDefinition => ({
  id: "baseline",
  title: "Baseline",
  color: "yellow",
  words: ["one", "two", "three", "four"],
  ...overrides,
});

describe("orderedCategories", () => {
  it("sorts categories by color difficulty then alphabetically by title", () => {
    const categories = [
      buildCategory({ id: "purple-1", title: "Zoography", color: "purple" }),
      buildCategory({ id: "yellow-1", title: "Alpha", color: "yellow" }),
      buildCategory({ id: "green-1", title: "Botany", color: "green" }),
      buildCategory({ id: "green-2", title: "Astronomy", color: "green" }),
    ];

    const result = orderedCategories(categories);

    expect(result.map((category) => category.id)).toEqual([
      "yellow-1",
      "green-2",
      "green-1",
      "purple-1",
    ]);
  });
});

describe("prepareWordCards", () => {
  const basePuzzle: ConnectionsPuzzle = {
    date: "2024-01-01",
    categories: [
      buildCategory({ id: "alpha", title: "Alpha", words: ["A1", "A2", "A3", "A4"] }),
      buildCategory({ id: "beta", title: "Beta", words: ["B1", "B2", "B3", "B4"] }),
    ],
  };

  it("returns cards honoring the puzzle starting order when provided", () => {
    const puzzle: ConnectionsPuzzle = {
      ...basePuzzle,
      "starting order": ["B3", "A1", "A4"],
    };

    const cards = prepareWordCards(puzzle);

    expect(cards.slice(0, 3).map((card) => card.label)).toEqual(["B3", "A1", "A4"]);
    expect(cards).toHaveLength(8);
  });

  it("returns sequential cards when no starting order is provided", () => {
    const cards = prepareWordCards(basePuzzle);

    expect(cards[0]).toMatchObject({ id: "alpha-0", label: "A1", categoryId: "alpha" });
    expect(cards).toHaveLength(8);
  });
});
