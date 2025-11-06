import { DEFAULT_MISTAKES_ALLOWED } from "../../game/constants";
import { prepareWordCards } from "../../game/utils";
import type { ConnectionsPuzzle } from "../../data/puzzles";
import type { GameStatus, WordCard } from "../../game/types";

interface PendingSolve {
  categoryId: string;
  wordIds: string[];
}

export interface GameState {
  availableWords: WordCard[];
  selectedIds: Set<string>;
  solvedCategoryIds: string[];
  mistakesRemaining: number;
  status: GameStatus;
  pendingSolve: PendingSolve | null;
}

interface HydratePuzzleAction {
  type: "hydratePuzzle";
  puzzle: ConnectionsPuzzle;
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
  | RecordMistakeAction
  | ClearSelectionAction;

export const buildInitialState = (puzzle: ConnectionsPuzzle): GameState => ({
  availableWords: prepareWordCards(puzzle),
  selectedIds: new Set(),
  solvedCategoryIds: [],
  mistakesRemaining: DEFAULT_MISTAKES_ALLOWED,
  status: "playing",
  pendingSolve: null,
});

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "hydratePuzzle":
      return buildInitialState(action.puzzle);

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
      const solvedCategoryIds = [...state.solvedCategoryIds, action.categoryId];
      const remainingWords = state.availableWords.filter(
        (card) => !action.wordIds.includes(card.id),
      );
      const status =
        solvedCategoryIds.length === action.totalCategoryCount
          ? "won"
          : state.status;
      return {
        ...state,
        availableWords: remainingWords,
        solvedCategoryIds,
        status,
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
