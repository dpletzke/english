import { useCallback, useRef, useState } from "react";
import type { WordCard } from "../../game/types";
import {
  type AnimationControllerResult,
  type PlayMistakeAnimationArgs,
  type PlaySolveAnimationArgs,
  type ShuffleWordsArgs,
  type UseAnimationControllerOptions,
} from "./animationTypes";
import { runHopSequence } from "./hopSequence";
import { HOP_TIMING } from "./timing";
import {
  clearTimeoutCollection,
  clearTimeoutRef,
  scheduleManagedTimeout,
} from "./timeouts";
import { useManagedWordFeedback } from "./useManagedWordFeedback";
import { useDragController } from "./useDragController";
import { useFailRevealAnimator } from "./useFailRevealAnimator";
import { useSolveAnimator } from "./useSolveAnimator";

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

  const finalizeSolve = useCallback(
    ({ categoryId, wordIds, totalCategoryCount }: PlaySolveAnimationArgs) => {
      clearFeedbackForIds(wordIds);
      onCompleteSolve({ categoryId, wordIds, totalCategoryCount });
    },
    [clearFeedbackForIds, onCompleteSolve],
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

  const playSolveAnimation = useSolveAnimator({
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
  });

  const playFailRevealSequence = useFailRevealAnimator({
    availableWords,
    failRevealTimeoutsRef,
    finalizeSolve,
    onMarkSolvePending,
    onRecordMistake,
    onSetWordOrder,
    resetDragContext,
    setIsMistakeAnimating,
  });

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
