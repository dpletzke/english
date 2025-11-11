import { useCallback } from "react";
import type { MutableRefObject } from "react";
import type { WordCard, WordCardFeedbackStatus } from "../../game/types";
import type { PendingSolve } from "./gameReducer";
import { runHopSequence } from "./hopSequence";
import { HOP_TIMING, computeRevealDelay } from "./timing";
import { reorderWordsWithSolvedFirst } from "./wordOrdering";
import type { PlaySolveAnimationArgs } from "./animationTypes";

interface UseSolveAnimatorArgs {
  availableWords: WordCard[];
  clearRevealTimeout: () => void;
  clearSettleTimeouts: () => void;
  clearSolveSortTimeout: () => void;
  finalizeSolve: (args: PlaySolveAnimationArgs) => void;
  hopTimeoutsRef: MutableRefObject<number[]>;
  onMarkSolvePending: (payload: PendingSolve) => void;
  onSetWordOrder: (words: WordCard[]) => void;
  revealTimeoutRef: MutableRefObject<number | null>;
  setFeedbackForIds: (ids: string[], status: WordCardFeedbackStatus) => void;
  settleTimeoutsRef: MutableRefObject<number[]>;
  solveSortTimeoutRef: MutableRefObject<number | null>;
}

export const useSolveAnimator = ({
  availableWords,
  clearRevealTimeout,
  clearSettleTimeouts,
  clearSolveSortTimeout,
  finalizeSolve,
  hopTimeoutsRef,
  onMarkSolvePending,
  onSetWordOrder,
  revealTimeoutRef,
  setFeedbackForIds,
  settleTimeoutsRef,
  solveSortTimeoutRef,
}: UseSolveAnimatorArgs) => {
  return useCallback(
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
        onSetWordOrder(reorderWordsWithSolvedFirst(availableWords, wordIds));
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
        finalizeSolve({
          categoryId,
          wordIds,
          totalCategoryCount,
        });
        revealTimeoutRef.current = null;
      }, revealDelay);
    },
    [
      availableWords,
      clearRevealTimeout,
      clearSettleTimeouts,
      clearSolveSortTimeout,
      finalizeSolve,
      onMarkSolvePending,
      onSetWordOrder,
      setFeedbackForIds,
      hopTimeoutsRef,
      revealTimeoutRef,
      settleTimeoutsRef,
      solveSortTimeoutRef,
    ],
  );
};
