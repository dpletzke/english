import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectionsPuzzle } from "../../data/puzzles";
import type { WordCard } from "../../game/types";
import type { UseAnimationControllerOptions } from "../useConnectionsGame/animationTypes";
import { useConnectionsGame } from "../useConnectionsGame";
import * as puzzleProgress from "../../game/puzzleProgress";

let latestAnimationOptions: UseAnimationControllerOptions | null = null;

const mockUseAnimationController = vi.fn((options: UseAnimationControllerOptions) => {
  latestAnimationOptions = options;
  return mockAnimationControllerResult;
});

const mockAnimationControllerResult = {
  wordFeedback: {},
  setFeedbackForIds: vi.fn(),
  clearFeedbackForIds: vi.fn(),
  resetFeedback: vi.fn(),
  isMistakeAnimating: false,
  dragState: {
    draggingWordId: null,
    dragTargetWordId: null,
    isDragLockedAnim: false,
    pendingDragSettle: null,
    layoutLockedWordId: null,
    startDragAnim: vi.fn(),
    moveDragAnim: vi.fn(),
    endDragAnim: vi.fn(),
    clearPendingDragSettle: vi.fn(),
    clearLayoutLockedWord: vi.fn(),
  },
  shuffleWords: vi.fn(),
  reorderWords: (nextOrder: WordCard[]) => {
    latestAnimationOptions?.onSetWordOrder(nextOrder);
  },
  playSolveAnimation: ({
    categoryId,
    wordIds,
    totalCategoryCount,
  }: {
    categoryId: string;
    wordIds: string[];
    totalCategoryCount: number;
  }) => {
    latestAnimationOptions?.onMarkSolvePending({ categoryId, wordIds });
    latestAnimationOptions?.onCompleteSolve({
      categoryId,
      wordIds,
      totalCategoryCount,
    });
  },
  playMistakeAnimation: ({
    recordMistake = true,
    onAfterMistake,
  }: {
    recordMistake?: boolean;
    onAfterMistake?: () => void;
  }) => {
    if (recordMistake) {
      latestAnimationOptions?.onRecordMistake();
    }
    onAfterMistake?.();
  },
  playFailRevealSequence: ({
    batches,
  }: {
    batches: Array<{ categoryId: string; wordIds: string[] }>;
  }) => {
    batches.forEach((batch) => {
      latestAnimationOptions?.onMarkSolvePending({
        categoryId: batch.categoryId,
        wordIds: batch.wordIds,
      });
      latestAnimationOptions?.onCompleteReveal({
        categoryId: batch.categoryId,
        wordIds: batch.wordIds,
      });
    });
    latestAnimationOptions?.onRecordMistake();
  },
  swapWordCards: vi.fn(),
  resetAnimationState: vi.fn(),
  cleanup: vi.fn(),
};

vi.mock("../useConnectionsGame/animationController", () => ({
  useAnimationController: (options: UseAnimationControllerOptions) =>
    mockUseAnimationController(options),
}));

const testPuzzle: ConnectionsPuzzle = {
  date: "2026-03-10",
  categories: [
    {
      id: "yellow-1",
      title: "Yellow",
      words: ["y1", "y2", "y3", "y4"],
      color: "yellow",
    },
    {
      id: "green-1",
      title: "Green",
      words: ["g1", "g2", "g3", "g4"],
      color: "green",
    },
    {
      id: "blue-1",
      title: "Blue",
      words: ["b1", "b2", "b3", "b4"],
      color: "blue",
    },
    {
      id: "purple-1",
      title: "Purple",
      words: ["p1", "p2", "p3", "p4"],
      color: "purple",
    },
  ],
};

const getWordIdsForCategory = (
  puzzle: ConnectionsPuzzle,
  categoryId: string,
): string[] =>
  puzzle.categories
    .find((category) => category.id === categoryId)!
    .words.map((_, index) => `${categoryId}-${index}`);

describe("useConnectionsGame loss/reveal flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestAnimationOptions = null;
    vi.spyOn(puzzleProgress, "getPuzzleResult").mockReturnValue(null);
    vi.spyOn(puzzleProgress, "hasPuzzleBeenSolved").mockReturnValue(false);
    vi.spyOn(puzzleProgress, "markPuzzleSolved").mockImplementation(() => {});
    vi.spyOn(puzzleProgress, "markPuzzleLost").mockImplementation(() => {});
  });

  it("reveals only remaining unsolved categories on final mistake", () => {
    const { result } = renderHook(() => useConnectionsGame(testPuzzle));

    const solvedIds = getWordIdsForCategory(testPuzzle, "yellow-1");
    act(() => {
      solvedIds.forEach((id) => {
        result.current.onToggleWord(id);
      });
    });
    act(() => {
      result.current.submitSelection();
    });

    expect(result.current.orderedSolvedCategories.map((c) => c.id)).toEqual([
      "yellow-1",
    ]);
    expect(result.current.mistakesRemaining).toBe(4);

    const wrongSelection = ["green-1-0", "green-1-1", "blue-1-0", "purple-1-0"];

    for (let i = 0; i < 3; i += 1) {
      act(() => {
        wrongSelection.forEach((id) => {
          result.current.onToggleWord(id);
        });
      });
      act(() => {
        result.current.submitSelection();
      });
    }

    expect(result.current.mistakesRemaining).toBe(1);
    expect(result.current.status).toBe("playing");
    expect(result.current.revealCategories).toEqual([]);

    act(() => {
      wrongSelection.forEach((id) => {
        result.current.onToggleWord(id);
      });
    });
    act(() => {
      result.current.submitSelection();
    });

    expect(result.current.status).toBe("lost");
    expect(result.current.mistakesRemaining).toBe(0);
    expect(result.current.orderedSolvedCategories.map((c) => c.id)).toEqual([
      "yellow-1",
    ]);
    expect(result.current.revealCategories.map((c) => c.id)).toEqual([
      "green-1",
      "blue-1",
      "purple-1",
    ]);
  });

  it("hydrates persisted loss with revealed categories and no solved categories", () => {
    vi.mocked(puzzleProgress.getPuzzleResult).mockReturnValue("lost");

    const { result } = renderHook(() => useConnectionsGame(testPuzzle));

    expect(result.current.status).toBe("lost");
    expect(result.current.orderedSolvedCategories).toEqual([]);
    expect(result.current.revealCategories.map((c) => c.id)).toEqual([
      "yellow-1",
      "green-1",
      "blue-1",
      "purple-1",
    ]);
  });
});
