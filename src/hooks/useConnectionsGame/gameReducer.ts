import { DEFAULT_MISTAKES_ALLOWED } from "../../game/constants";
import { orderedCategories, prepareWordCards } from "../../game/utils";
import type { ConnectionsPuzzle } from "../../data/puzzles";
import type { GameStatus, WordCard } from "../../game/types";
import type { PuzzleResult } from "../../game/puzzleProgress";

interface PendingSolve {
  categoryId: string;
  wordIds: string[];
}

export interface GameState {
  availableWords: WordCard[];
  selectedIds: Set<string>;
  solvedCategoryIds: string[];
  revealedCategoryIds: string[];
  mistakesRemaining: number;
  status: GameStatus;
  pendingSolve: PendingSolve | null;
}

interface HydratePuzzleAction {
  type: "hydratePuzzle";
  puzzle: ConnectionsPuzzle;
  persistedResult?: PuzzleResult | null;
}

interface ToggleWordAction {
  type: "toggleWord";
  wordId: string;
}

interface SetWordOrderAction {
  type: "setWordOrder";
  words: WordCard[];
}

interface MarkSolvePendingAction {
  type: "markSolvePending";
  payload: PendingSolve;
}

interface CompleteSolveAction {
  type: "completeSolve";
  categoryId: string;
  wordIds: string[];
  totalCategoryCount: number;
}

interface CompleteRevealAction {
  type: "completeReveal";
  categoryId: string;
  wordIds: string[];
}

interface RecordMistakeAction {
  type: "recordMistake";
}

interface ClearSelectionAction {
  type: "clearSelection";
}

type GameAction =
  | HydratePuzzleAction
  | ToggleWordAction
  | SetWordOrderAction
  | MarkSolvePendingAction
  | CompleteSolveAction
  | CompleteRevealAction
  | RecordMistakeAction
  | ClearSelectionAction;

export const buildInitialState = (
  puzzle: ConnectionsPuzzle,
  persistedResult?: PuzzleResult | null,
): GameState => {
  if (persistedResult === "won" || persistedResult === "lost") {
    const orderedCategoryIds = orderedCategories(puzzle.categories).map(
      (category) => category.id,
    );
    const solvedCategoryIds =
      persistedResult === "won" ? orderedCategoryIds : [];
    return {
      availableWords: [],
      selectedIds: new Set(),
      solvedCategoryIds,
      revealedCategoryIds:
        persistedResult === "lost" ? orderedCategoryIds : [],
      mistakesRemaining:
        persistedResult === "lost" ? 0 : DEFAULT_MISTAKES_ALLOWED,
      status: persistedResult,
      pendingSolve: null,
    };
  }

  return {
    availableWords: prepareWordCards(puzzle),
    selectedIds: new Set(),
    solvedCategoryIds: [],
    revealedCategoryIds: [],
    mistakesRemaining: DEFAULT_MISTAKES_ALLOWED,
    status: "playing",
    pendingSolve: null,
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "hydratePuzzle":
      return buildInitialState(action.puzzle, action.persistedResult);

    case "toggleWord": {
      const nextSelected = new Set(state.selectedIds);
      if (nextSelected.has(action.wordId)) {
        nextSelected.delete(action.wordId);
        return {
          ...state,
          selectedIds: nextSelected,
        };
      }
      if (nextSelected.size >= 4) {
        return state;
      }
      nextSelected.add(action.wordId);
      return {
        ...state,
        selectedIds: nextSelected,
      };
    }

    case "setWordOrder":
      return {
        ...state,
        availableWords: action.words,
      };

    case "markSolvePending":
      return {
        ...state,
        pendingSolve: action.payload,
      };

    case "completeSolve": {
      const solvedCategoryIds = state.solvedCategoryIds.includes(action.categoryId)
        ? state.solvedCategoryIds
        : [...state.solvedCategoryIds, action.categoryId];
      const revealedCategoryIds = state.revealedCategoryIds.filter(
        (id) => id !== action.categoryId,
      );
      const remainingWords = state.availableWords.filter(
        (card) => !action.wordIds.includes(card.id),
      );
      const status =
        state.status === "playing" &&
        solvedCategoryIds.length === action.totalCategoryCount
          ? "won"
          : state.status;
      return {
        ...state,
        availableWords: remainingWords,
        solvedCategoryIds,
        revealedCategoryIds,
        pendingSolve: null,
        status,
      };
    }

    case "completeReveal": {
      const revealedCategoryIds = state.revealedCategoryIds.includes(
        action.categoryId,
      )
        ? state.revealedCategoryIds
        : [...state.revealedCategoryIds, action.categoryId];
      const solvedCategoryIds = state.solvedCategoryIds.filter(
        (id) => id !== action.categoryId,
      );
      const remainingWords = state.availableWords.filter(
        (card) => !action.wordIds.includes(card.id),
      );
      return {
        ...state,
        availableWords: remainingWords,
        solvedCategoryIds,
        revealedCategoryIds,
        status: state.status,
        pendingSolve: null,
      };
    }

    case "recordMistake": {
      const nextMistakes = Math.max(state.mistakesRemaining - 1, 0);
      const status = nextMistakes === 0 ? "lost" : state.status;
      return {
        ...state,
        mistakesRemaining: nextMistakes,
        status,
      };
    }

    case "clearSelection":
      return {
        ...state,
        selectedIds: new Set(),
      };

    default:
      return state;
  }
};

export type { PendingSolve };
