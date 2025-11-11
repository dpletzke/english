import { useCallback, useRef, useState } from "react";
import type {
  WordCard,
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../../game/types";
import { runHopSequence } from "./hopSequence";
import { HOP_TIMING, computeRevealDelay } from "./timing";
import {
  clearTimeoutCollection,
  clearTimeoutRef,
  scheduleManagedTimeout,
} from "./timeouts";
import type { PendingSolve } from "./gameReducer";
import { useManagedWordFeedback } from "./useManagedWordFeedback";
import {
  type DragControllerState,
  useDragController,
} from "./useDragController";

interface UseAnimationControllerOptions {
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

interface PlaySolveAnimationArgs {
  categoryId: string;
  wordIds: string[];
  totalCategoryCount: number;
}

interface PlayMistakeAnimationArgs {
  wordIds: string[];
  recordMistake?: boolean;
  onAfterMistake?: () => void;
}

interface ShuffleWordsArgs {
  shuffleFn: (words: WordCard[]) => WordCard[];
  selectedWordIds: string[];
}

interface AnimationControllerResult {
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

interface FailRevealBatch {
  categoryId: string;
  wordIds: string[];
}

const FAIL_REVEAL_REORDER_DELAY_MS = 600;
const FAIL_REVEAL_NEXT_BATCH_DELAY_MS = 200;

export const useAnimationController = (
  options: UseAnimationControllerOptions,
): AnimationControllerResult => {
  const {
    availableWords,
    onSetWordOrder,
    onMarkSolvePending,
    onCompleteSolve,
    onRecordMistake,
  } = options;

  const {
    wordFeedback,
    setFeedbackForIds,
    resetFeedback,
    clearFeedbackForIds,
  } = useManagedWordFeedback();
  const [isMistakeAnimating, setIsMistakeAnimating] = useState(false);
  const revealTimeoutRef = useRef<number | null>(null);
  const solveSortTimeoutRef = useRef<number | null>(null);
  const hopTimeoutsRef = useRef<number[]>([]);
  const settleTimeoutsRef = useRef<number[]>([]);
  const failRevealTimeoutsRef = useRef<number[]>([]);

  const swapWordCards = useCallback(
    (fromWordId: string, toWordId: string) => {
      if (fromWordId === toWordId) {
        return;
      }
      const fromIndex = availableWords.findIndex(
        (card) => card.id === fromWordId,
      );
      const toIndex = availableWords.findIndex((card) => card.id === toWordId);
      if (fromIndex === -1 || toIndex === -1) {
        return;
      }
      const next = [...availableWords];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      onSetWordOrder(next);
    },
    [availableWords, onSetWordOrder],
  );

  const { dragState, resetDragContext } = useDragController({
    swapWordCards,
  });
  const clearRevealTimeout = useCallback(
    () => clearTimeoutRef(revealTimeoutRef),
    [],
  );
  const clearSolveSortTimeout = useCallback(
    () => clearTimeoutRef(solveSortTimeoutRef),
    [],
  );
  const clearHopTimeouts = useCallback(
    () => clearTimeoutCollection(hopTimeoutsRef),
    [],
  );
  const clearSettleTimeouts = useCallback(
    () => clearTimeoutCollection(settleTimeoutsRef),
    [],
  );
  const clearFailRevealTimeouts = useCallback(
    () => clearTimeoutCollection(failRevealTimeoutsRef),
    [],
  );

  const cleanup = useCallback(() => {
    clearRevealTimeout();
    clearSolveSortTimeout();
    clearHopTimeouts();
    clearSettleTimeouts();
    clearFailRevealTimeouts();
  }, [
    clearFailRevealTimeouts,
    clearHopTimeouts,
    clearRevealTimeout,
    clearSettleTimeouts,
    clearSolveSortTimeout,
  ]);

  const resetAnimationState = useCallback(() => {
    cleanup();
    setIsMistakeAnimating(false);
    resetDragContext();
    resetFeedback();
  }, [cleanup, resetDragContext, resetFeedback]);

  const shuffleWords = useCallback(
    ({ shuffleFn, selectedWordIds }: ShuffleWordsArgs) => {
      const shuffled = shuffleFn(availableWords);
      onSetWordOrder(shuffled);
      if (selectedWordIds.length > 0) {
        clearFeedbackForIds(selectedWordIds);
      }
    },
    [availableWords, clearFeedbackForIds, onSetWordOrder],
  );

  const reorderWords = useCallback(
    (nextOrder: WordCard[]) => {
      onSetWordOrder(nextOrder);
    },
    [onSetWordOrder],
  );

  const playSolveAnimation = useCallback(
    ({ categoryId, wordIds, totalCategoryCount }: PlaySolveAnimationArgs) => {
      const { settleDelayMs } = runHopSequence({
        ids: wordIds,
        availableWords,
        setFeedback: setFeedbackForIds,
        hopTimeoutsRef,
        settleTimeoutsRef,
        settlePaddingMs: HOP_TIMING.hopToSolvedPaddingMs,
      });

      onMarkSolvePending({ categoryId, wordIds });

      const applySolvedOrdering = () => {
        const next = [...availableWords];
        next.sort((a, b) => {
          const aSolved = wordIds.includes(a.id);
          const bSolved = wordIds.includes(b.id);
          if (aSolved === bSolved) {
            return 0;
          }
          return aSolved ? -1 : 1;
        });
        onSetWordOrder(next);
      };

      clearSolveSortTimeout();
      solveSortTimeoutRef.current = window.setTimeout(() => {
        applySolvedOrdering();
        solveSortTimeoutRef.current = null;
      }, settleDelayMs);

      clearRevealTimeout();
      const revealDelay = computeRevealDelay(settleDelayMs);
      revealTimeoutRef.current = window.setTimeout(() => {
        clearSolveSortTimeout();
        clearSettleTimeouts();
        clearFeedbackForIds(wordIds);
        onCompleteSolve({
          categoryId,
          wordIds,
          totalCategoryCount,
        });
        revealTimeoutRef.current = null;
      }, revealDelay);
    },
    [
      availableWords,
      clearFeedbackForIds,
      clearRevealTimeout,
      clearSettleTimeouts,
      clearSolveSortTimeout,
      onCompleteSolve,
      onMarkSolvePending,
      onSetWordOrder,
      setFeedbackForIds,
    ],
  );

  const playMistakeAnimation = useCallback(
    ({
      wordIds,
      recordMistake = true,
      onAfterMistake,
    }: PlayMistakeAnimationArgs) => {
      setIsMistakeAnimating(true);
      const { settleDelayMs } = runHopSequence({
        ids: wordIds,
        availableWords,
        setFeedback: setFeedbackForIds,
        hopTimeoutsRef,
        settleTimeoutsRef,
        settlePaddingMs: HOP_TIMING.hopToShakePaddingMs,
        settleStatus: "shake",
      });
      scheduleManagedTimeout(
        settleTimeoutsRef,
        () => {
          clearFeedbackForIds(wordIds);
          setIsMistakeAnimating(false);
          onAfterMistake?.();
        },
        settleDelayMs + HOP_TIMING.shakeDurationMs,
      );
      if (recordMistake) {
        onRecordMistake();
      }
    },
    [
      availableWords,
      clearFeedbackForIds,
      onRecordMistake,
      setFeedbackForIds,
    ],
  );
  const playFailRevealSequence = useCallback(
    ({
      batches,
      totalCategoryCount,
    }: {
      batches: FailRevealBatch[];
      totalCategoryCount: number;
    }) => {
      if (batches.length === 0) {
        onRecordMistake();
        return;
      }

      resetDragContext();
      setIsMistakeAnimating(true);
      let workingWords = [...availableWords];

      const playBatch = (index: number) => {
        if (index >= batches.length) {
          setIsMistakeAnimating(false);
          onRecordMistake();
          return;
        }

        const batch = batches[index];
        if (batch.wordIds.length === 0) {
          playBatch(index + 1);
          return;
        }

        onMarkSolvePending({
          categoryId: batch.categoryId,
          wordIds: batch.wordIds,
        });

        const sortedWords = [...workingWords].sort((a, b) => {
          const aSolved = batch.wordIds.includes(a.id);
          const bSolved = batch.wordIds.includes(b.id);
          if (aSolved === bSolved) {
            return 0;
          }
          return aSolved ? -1 : 1;
        });

        workingWords = sortedWords.filter(
          (card) => !batch.wordIds.includes(card.id),
        );

        onSetWordOrder(sortedWords);

        const revealTimeout = window.setTimeout(() => {
          clearFeedbackForIds(batch.wordIds);
          onCompleteSolve({
            categoryId: batch.categoryId,
            wordIds: batch.wordIds,
            totalCategoryCount,
          });
          const nextTimeout = window.setTimeout(
            () => playBatch(index + 1),
            FAIL_REVEAL_NEXT_BATCH_DELAY_MS,
          );
          failRevealTimeoutsRef.current.push(nextTimeout);
        }, FAIL_REVEAL_REORDER_DELAY_MS);

        failRevealTimeoutsRef.current.push(revealTimeout);
      };

      playBatch(0);
    },
    [
      availableWords,
      clearFeedbackForIds,
      onCompleteSolve,
      onMarkSolvePending,
      onRecordMistake,
      onSetWordOrder,
      resetDragContext,
    ],
  );
  return {
    wordFeedback,
    setFeedbackForIds,
    clearFeedbackForIds,
    resetFeedback,
    isMistakeAnimating,
    dragState,
  shuffleWords,
  reorderWords,
  playSolveAnimation,
  playMistakeAnimation,
  playFailRevealSequence,
  swapWordCards,
  resetAnimationState,
  cleanup,
  };
};
