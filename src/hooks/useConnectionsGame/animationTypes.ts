import type {
  WordCard,
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../../game/types";
import type { PendingSolve } from "./gameReducer";
import type { DragControllerState } from "./useDragController";

export interface UseAnimationControllerOptions {
  availableWords: WordCard[];
  onSetWordOrder: (words: WordCard[]) => void;
  onMarkSolvePending: (payload: PendingSolve) => void;
  onCompleteSolve: (payload: {
    categoryId: string;
    wordIds: string[];
    totalCategoryCount: number;
  }) => void;
  onRecordMistake: () => void;
}

export interface PlaySolveAnimationArgs {
  categoryId: string;
  wordIds: string[];
  totalCategoryCount: number;
}

export interface PlayMistakeAnimationArgs {
  wordIds: string[];
  recordMistake?: boolean;
  onAfterMistake?: () => void;
}

export interface ShuffleWordsArgs {
  shuffleFn: (words: WordCard[]) => WordCard[];
  selectedWordIds: string[];
}

export interface FailRevealBatch {
  categoryId: string;
  wordIds: string[];
}

export interface AnimationControllerResult {
  wordFeedback: WordCardFeedbackMap;
  setFeedbackForIds: (ids: string[], status: WordCardFeedbackStatus) => void;
  clearFeedbackForIds: (ids: string[]) => void;
  resetFeedback: () => void;
  isMistakeAnimating: boolean;
  dragState: DragControllerState;
  shuffleWords: (args: ShuffleWordsArgs) => void;
  reorderWords: (nextOrder: WordCard[]) => void;
  playSolveAnimation: (args: PlaySolveAnimationArgs) => void;
  playMistakeAnimation: (args: PlayMistakeAnimationArgs) => void;
  playFailRevealSequence: (args: {
    batches: FailRevealBatch[];
    totalCategoryCount: number;
  }) => void;
  swapWordCards: (fromWordId: string, toWordId: string) => void;
  resetAnimationState: () => void;
  cleanup: () => void;
}
