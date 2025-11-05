import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface LayoutLockContext {
  wordId: string;
  requestId: number;
}

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
  resetFeedback: () => void;
  isMistakeAnimating: boolean;
  dragState: DragControllerState;
  shuffleWords: (args: ShuffleWordsArgs) => void;
  reorderWords: (nextOrder: WordCard[]) => void;
  clearSelectionFeedback: (selectedWordIds: string[]) => void;
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

  const availableWordsRef = useRef<WordCard[]>(availableWords);
  useEffect(() => {
    availableWordsRef.current = availableWords;
  }, [availableWords]);

  const {
    wordFeedback,
    setFeedbackForIds,
    resetFeedback,
    clearFeedbackForIds,
  } = useManagedWordFeedback();
  const [isMistakeAnimating, setIsMistakeAnimating] = useState(false);
  const [draggingWordId, setDraggingWordId] = useState<string | null>(null);
  const [dragTargetWordId, setDragTargetWordId] = useState<string | null>(null);
  const [isDragLocked, setIsDragLocked] = useState(false);
  const [pendingDragSettle, setPendingDragSettle] =
    useState<DragSettleRequest | null>(null);
  const [layoutLockContext, setLayoutLockContext] =
    useState<LayoutLockContext | null>(null);
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

  const resetAnimationState = useCallback(() => {
    clearRevealTimeout();
    clearSolveSortTimeout();
    clearHopTimeouts();
    clearSettleTimeouts();
    setIsMistakeAnimating(false);
    setDraggingWordId(null);
    setDragTargetWordId(null);
    setIsDragLocked(false);
    setPendingDragSettle(null);
    setLayoutLockContext(null);
    resetFeedback();
  }, [
    clearHopTimeouts,
    clearRevealTimeout,
    clearSettleTimeouts,
    clearSolveSortTimeout,
    resetFeedback,
  ]);

  const cleanup = useCallback(() => {
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

  const shuffleWords = useCallback(
    ({ shuffleFn, selectedWordIds }: ShuffleWordsArgs) => {
      const shuffled = shuffleFn(availableWordsRef.current);
      onSetWordOrder(shuffled);
      if (selectedWordIds.length > 0) {
        setFeedbackForIds(selectedWordIds, "idle");
      }
    },
    [onSetWordOrder, setFeedbackForIds],
  );

  const reorderWords = useCallback(
    (nextOrder: WordCard[]) => {
      onSetWordOrder(nextOrder);
    },
    [onSetWordOrder],
  );

  const clearSelectionFeedback = useCallback(
    (selectedWordIds: string[]) => {
      if (selectedWordIds.length > 0) {
        setFeedbackForIds(selectedWordIds, "idle");
      }
    },
    [setFeedbackForIds],
  );

  const playSolveAnimation = useCallback(
    ({ categoryId, wordIds, totalCategoryCount }: PlaySolveAnimationArgs) => {
      const wordsSnapshot = availableWordsRef.current;
      const { settleDelayMs } = runHopSequence({
        ids: wordIds,
        availableWords: wordsSnapshot,
        setFeedback: setFeedbackForIds,
        hopTimeoutsRef,
        settleTimeoutsRef,
        settlePaddingMs: HOP_TIMING.hopToSolvedPaddingMs,
      });

      onMarkSolvePending({ categoryId, wordIds });

      const applySolvedOrdering = () => {
        const next = [...availableWordsRef.current];
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
      const wordsSnapshot = availableWordsRef.current;
      const { settleDelayMs } = runHopSequence({
        ids: wordIds,
        availableWords: wordsSnapshot,
        setFeedback: setFeedbackForIds,
        hopTimeoutsRef,
        settleTimeoutsRef,
        settlePaddingMs: HOP_TIMING.hopToShakePaddingMs,
        settleStatus: "shake",
      });
      scheduleManagedTimeout(
        settleTimeoutsRef,
        () => {
          setFeedbackForIds(wordIds, "idle");
          setIsMistakeAnimating(false);
        },
        settleDelayMs + HOP_TIMING.shakeDurationMs,
      );
      onRecordMistake();
    },
    [onRecordMistake, setFeedbackForIds],
  );

  const swapWordCards = useCallback(
    (fromWordId: string, toWordId: string) => {
      if (fromWordId === toWordId) {
        return;
      }
      const wordsSnapshot = availableWordsRef.current;
      const fromIndex = wordsSnapshot.findIndex(
        (card) => card.id === fromWordId,
      );
      const toIndex = wordsSnapshot.findIndex((card) => card.id === toWordId);
      if (fromIndex === -1 || toIndex === -1) {
        return;
      }
      const next = [...wordsSnapshot];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      onSetWordOrder(next);
    },
    [onSetWordOrder],
  );

  const onWordDragStart = useCallback((wordId: string) => {
    setDraggingWordId(wordId);
    setDragTargetWordId(null);
    setIsDragLocked(true);
  }, []);

  const onWordDragMove = useCallback(
    (targetWordId: string | null) => {
      if (!draggingWordId) {
        return;
      }
      if (!targetWordId || draggingWordId === targetWordId) {
        setDragTargetWordId(null);
        setLayoutLockContext(null);
        return;
      }
      setLayoutLockContext((prev) => {
        if (prev && prev.wordId === draggingWordId) {
          return prev;
        }
        return {
          wordId: draggingWordId,
          requestId: Date.now(),
        };
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
      setLayoutLockContext({
        wordId: draggingWordId,
        requestId: settleRequest.requestId,
      });
      setPendingDragSettle(settleRequest);
      swapWordCards(draggingWordId, dragTargetWordId);
    }
    setDraggingWordId(null);
    setDragTargetWordId(null);
    setIsDragLocked(false);
  }, [dragTargetWordId, draggingWordId, swapWordCards]);

  const dragState = useMemo<DragControllerState>(
    () => ({
      draggingWordId,
      dragTargetWordId,
      isDragLocked,
      pendingDragSettle,
      layoutLockedWordId: layoutLockContext?.wordId ?? null,
      onWordDragStart,
      onWordDragMove,
      onWordDragEnd,
      clearPendingDragSettle: () => setPendingDragSettle(null),
      clearLayoutLockedWord: () => setLayoutLockContext(null),
    }),
    [
      dragTargetWordId,
      draggingWordId,
      isDragLocked,
      layoutLockContext,
      onWordDragEnd,
      onWordDragMove,
      onWordDragStart,
      pendingDragSettle,
    ],
  );

  return {
    wordFeedback,
    setFeedbackForIds,
    resetFeedback,
    isMistakeAnimating,
    dragState,
    shuffleWords,
    reorderWords,
    clearSelectionFeedback,
    playSolveAnimation,
    playMistakeAnimation,
    swapWordCards,
    resetAnimationState,
    cleanup,
  };
};
