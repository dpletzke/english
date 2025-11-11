import { useCallback, useMemo, useRef, useState } from "react";
import type {
  WordCard,
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../../game/types";
import type { DragSettleRequest } from "../../game/dragTypes";
import { runHopSequence } from "./hopSequence";
import { HOP_TIMING, computeRevealDelay } from "./timing";
import {
  clearTimeoutCollection,
  clearTimeoutRef,
  scheduleManagedTimeout,
} from "./timeouts";
import type { PendingSolve } from "./gameReducer";

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
}

interface ShuffleWordsArgs {
  shuffleFn: (words: WordCard[]) => WordCard[];
  selectedWordIds: string[];
}

interface DragControllerState {
  draggingWordId: string | null;
  dragTargetWordId: string | null;
  isDragLocked: boolean;
  pendingDragSettle: DragSettleRequest | null;
  layoutLockedWordId: string | null;
  onWordDragStart: (wordId: string) => void;
  onWordDragMove: (targetWordId: string | null) => void;
  onWordDragEnd: () => void;
  clearPendingDragSettle: () => void;
  clearLayoutLockedWord: () => void;
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
  swapWordCards: (fromWordId: string, toWordId: string) => void;
  resetAnimationState: () => void;
  cleanup: () => void;
}

const useManagedWordFeedback = () => {
  const [wordFeedback, setWordFeedback] = useState<WordCardFeedbackMap>({});

  const setFeedbackForIds = useCallback(
    (ids: string[], status: WordCardFeedbackStatus) => {
      if (ids.length === 0) {
        return;
      }
      setWordFeedback((prev) => {
        const next: WordCardFeedbackMap = { ...prev };
        ids.forEach((id) => {
          next[id] = status;
        });
        return next;
      });
    },
    [],
  );

  const resetFeedback = useCallback(() => {
    setWordFeedback({});
  }, []);

  const clearFeedbackForIds = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      return;
    }
    setWordFeedback((prev) => {
      const next: WordCardFeedbackMap = { ...prev };
      ids.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  }, []);

  return {
    wordFeedback,
    setFeedbackForIds,
    resetFeedback,
    clearFeedbackForIds,
  };
};

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
  const [draggingWordId, setDraggingWordId] = useState<string | null>(null);
  const [dragTargetWordId, setDragTargetWordId] = useState<string | null>(null);
  const [pendingDragSettle, setPendingDragSettle] =
    useState<DragSettleRequest | null>(null);
  const [layoutLockedWordId, setLayoutLockedWordId] =
    useState<string | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const solveSortTimeoutRef = useRef<number | null>(null);
  const hopTimeoutsRef = useRef<number[]>([]);
  const settleTimeoutsRef = useRef<number[]>([]);

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

  const clearAnimationTimers = useCallback(() => {
    clearRevealTimeout();
    clearSolveSortTimeout();
    clearHopTimeouts();
    clearSettleTimeouts();
  }, [
    clearHopTimeouts,
    clearRevealTimeout,
    clearSettleTimeouts,
    clearSolveSortTimeout,
  ]);

  const resetAnimationState = useCallback(() => {
    clearAnimationTimers();
    setIsMistakeAnimating(false);
    setDraggingWordId(null);
    setDragTargetWordId(null);
    setPendingDragSettle(null);
    setLayoutLockedWordId(null);
    resetFeedback();
  }, [
    clearAnimationTimers,
    resetFeedback,
  ]);

  const cleanup = clearAnimationTimers;

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
    ({ wordIds }: PlayMistakeAnimationArgs) => {
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
        },
        settleDelayMs + HOP_TIMING.shakeDurationMs,
      );
      onRecordMistake();
    },
    [availableWords, onRecordMistake, setFeedbackForIds],
  );

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

  const onWordDragStart = useCallback((wordId: string) => {
    setDraggingWordId(wordId);
    setDragTargetWordId(null);
  }, []);

  const onWordDragMove = useCallback(
    (targetWordId: string | null) => {
      if (!draggingWordId) {
        return;
      }
      if (!targetWordId || draggingWordId === targetWordId) {
        setDragTargetWordId(null);
        setLayoutLockedWordId(null);
        return;
      }
      setLayoutLockedWordId((prev) => {
        if (prev === draggingWordId) {
          return prev;
        }
        return draggingWordId;
      });
      setDragTargetWordId(targetWordId);
    },
    [draggingWordId],
  );

  const onWordDragEnd = useCallback(() => {
    if (draggingWordId && dragTargetWordId) {
      const settleRequest: DragSettleRequest = {
        fromWordId: draggingWordId,
        toWordId: dragTargetWordId,
        requestId: Date.now(),
      };
      setLayoutLockedWordId(draggingWordId);
      setPendingDragSettle(settleRequest);
      swapWordCards(draggingWordId, dragTargetWordId);
    }
    setDraggingWordId(null);
    setDragTargetWordId(null);
  }, [dragTargetWordId, draggingWordId, swapWordCards]);

  const dragState = useMemo<DragControllerState>(
    () => ({
      draggingWordId,
      dragTargetWordId,
      isDragLocked: Boolean(draggingWordId),
      pendingDragSettle,
      layoutLockedWordId,
      onWordDragStart,
      onWordDragMove,
      onWordDragEnd,
      clearPendingDragSettle: () => setPendingDragSettle(null),
      clearLayoutLockedWord: () => setLayoutLockedWordId(null),
    }),
    [
      dragTargetWordId,
      draggingWordId,
      layoutLockedWordId,
      onWordDragEnd,
      onWordDragMove,
      onWordDragStart,
      pendingDragSettle,
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
    swapWordCards,
    resetAnimationState,
    cleanup,
  };
};
