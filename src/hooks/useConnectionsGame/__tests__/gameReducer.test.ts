import { DEFAULT_MISTAKES_ALLOWED } from "../../../game/constants";
import type { ConnectionsPuzzle } from "../../../data/puzzles";
import type { WordCard } from "../../../game/types";
import {
  buildInitialState,
  gameReducer,
} from "../gameReducer";

const createPuzzle = (): ConnectionsPuzzle => ({
  date: "2024-10-01",
  categories: [
    {
      id: "easy",
      title: "Easy",
      words: ["apple", "banana", "citrus", "date"],
      color: "yellow",
    },
    {
      id: "medium",
      title: "Medium",
      words: ["emerald", "garnet", "opal", "topaz"],
      color: "green",
    },
    {
      id: "hard",
      title: "Hard",
      words: ["alpha", "beta", "gamma", "delta"],
      color: "blue",
    },
    {
      id: "spicy",
      title: "Spicy",
      words: ["north", "south", "east", "west"],
      color: "purple",
    },
  ],
});

const buildState = (override?: Partial<ReturnType<typeof buildInitialState>>) => {
  const base = buildInitialState(createPuzzle());
  return { ...base, ...override };
};

const wordIdsForCategory = (words: WordCard[], categoryId: string) =>
  words.filter((card) => card.categoryId === categoryId).map((card) => card.id);

describe("gameReducer", () => {
  it("hydrates puzzle with default values", () => {
    const puzzle = createPuzzle();
    const next = gameReducer(buildInitialState(puzzle), {
      type: "hydratePuzzle",
      puzzle,
    });

    expect(next.availableWords).toHaveLength(16);
    expect(next.selectedIds.size).toBe(0);
    expect(next.solvedCategoryIds).toEqual([]);
    expect(next.mistakesRemaining).toBe(DEFAULT_MISTAKES_ALLOWED);
    expect(next.status).toBe("playing");
    expect(next.pendingSolve).toBeNull();
  });

  it("toggles word selection up to four entries", () => {
    const puzzle = createPuzzle();
    const initial = buildInitialState(puzzle);
    const targetIds = initial.availableWords.slice(0, 5).map((card) => card.id);

    let state = initial;
    targetIds.forEach((id, index) => {
      state = gameReducer(state, { type: "toggleWord", wordId: id });
      if (index < 4) {
        expect(state.selectedIds.has(id)).toBe(true);
      } else {
        // fifth toggle ignored
        expect(state.selectedIds.size).toBe(4);
        expect(state.selectedIds.has(id)).toBe(false);
      }
    });

    const removeTarget = targetIds[0]!;
    state = gameReducer(state, { type: "toggleWord", wordId: removeTarget });
    expect(state.selectedIds.has(removeTarget)).toBe(false);
    expect(state.selectedIds.size).toBe(3);
  });

  it("marks solve pending and then completes solve updating status", () => {
    const puzzle = createPuzzle();
    const initial = buildInitialState(puzzle);
    const easyIds = wordIdsForCategory(initial.availableWords, "easy");

    let state = gameReducer(initial, {
      type: "markSolvePending",
      payload: { categoryId: "easy", wordIds: easyIds },
    });
    expect(state.pendingSolve).toEqual({
      categoryId: "easy",
      wordIds: easyIds,
    });

    state = gameReducer(state, {
      type: "completeSolve",
      categoryId: "easy",
      wordIds: easyIds,
      totalCategoryCount: puzzle.categories.length,
    });

    expect(state.pendingSolve).toBeNull();
    expect(state.solvedCategoryIds).toEqual(["easy"]);
    expect(state.availableWords.every((card) => card.categoryId !== "easy")).toBe(
      true,
    );
    expect(state.status).toBe("playing");
  });

  it("sets status to won when all categories solved", () => {
    const puzzle = createPuzzle();
    const initial = buildInitialState(puzzle);
    const [first, ...rest] = puzzle.categories;

    let state = gameReducer(initial, {
      type: "completeSolve",
      categoryId: first.id,
      wordIds: wordIdsForCategory(initial.availableWords, first.id),
      totalCategoryCount: puzzle.categories.length,
    });

    rest.forEach((category, index) => {
      state = gameReducer(state, {
        type: "completeSolve",
        categoryId: category.id,
        wordIds: wordIdsForCategory(initial.availableWords, category.id),
        totalCategoryCount: puzzle.categories.length,
      });
      if (index < rest.length - 1) {
        expect(state.status).toBe("playing");
      }
    });

    expect(state.status).toBe("won");
  });

  it("records mistake and transitions to lost at zero mistakes remaining", () => {
    const allowed = DEFAULT_MISTAKES_ALLOWED;
    let state = buildState();
    for (let i = 0; i < allowed; i += 1) {
      state = gameReducer(state, { type: "recordMistake" });
      const expectedRemaining = Math.max(allowed - (i + 1), 0);
      expect(state.mistakesRemaining).toBe(expectedRemaining);
      if (expectedRemaining === 0) {
        expect(state.status).toBe("lost");
      } else {
        expect(state.status).toBe("playing");
      }
    }
  });

  it("clears selection", () => {
    const initial = buildInitialState(createPuzzle());
    const picked = initial.availableWords.slice(0, 2).map((card) => card.id);
    let state = initial;
    picked.forEach((id) => {
      state = gameReducer(state, { type: "toggleWord", wordId: id });
    });

    expect(state.selectedIds.size).toBe(2);
    state = gameReducer(state, { type: "clearSelection" });
    expect(state.selectedIds.size).toBe(0);
  });

  it("respects setWordOrder updates", () => {
    const initial = buildInitialState(createPuzzle());
    const reordered = [...initial.availableWords].reverse();
    const state = gameReducer(initial, {
      type: "setWordOrder",
      words: reordered,
    });

    expect(state.availableWords).toEqual(reordered);
  });
});
