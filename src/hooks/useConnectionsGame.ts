import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryDefinition, ConnectionsPuzzle } from "../data/puzzles";
import type {
  GameStatus,
  WordCard,
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../game/types";
import { DEFAULT_MISTAKES_ALLOWED } from "../game/constants";
import { orderedCategories, prepareWordCards, shuffle } from "../game/utils";
import { HOP_TIMING, computeRevealDelay } from "./useConnectionsGame/timing";
import {
  clearTimeoutCollection,
  clearTimeoutRef,
  scheduleManagedTimeout,
} from "./useConnectionsGame/timeouts";
import { runHopSequence } from "./useConnectionsGame/hopSequence";

interface UseConnectionsGameResult {
  availableWords: WordCard[];
  wordFeedback: WordCardFeedbackMap;
  orderedSolvedCategories: CategoryDefinition[];
  revealCategories: CategoryDefinition[];
  selectedWordIds: string[];
  draggingWordId: string | null;
  isDragLocked: boolean;
  mistakesAllowed: number;
  mistakesRemaining: number;
  status: GameStatus;
  onToggleWord: (wordId: string) => void;
  reorderWords: (nextOrder: WordCard[]) => void;
  swapWordCards: (fromWordId: string, toWordId: string) => void;
  shuffleWords: () => void;
  clearSelection: () => void;
  submitSelection: () => void;
  onWordDragStart: (wordId: string) => void;
  onWordDragMove: (targetWordId: string) => void;
  onWordDragEnd: () => void;
}

interface PendingSolve {
  categoryId: string;
  wordIds: string[];
}

export const useConnectionsGame = (
  puzzle: ConnectionsPuzzle,
): UseConnectionsGameResult => {
  const mistakesAllowed = DEFAULT_MISTAKES_ALLOWED;

  const [availableWords, setAvailableWords] = useState<WordCard[]>(() =>
    prepareWordCards(puzzle),
  );
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [solvedCategoryIds, setSolvedCategoryIds] = useState<string[]>([]);
  const [mistakesRemaining, setMistakesRemaining] =
    useState<number>(mistakesAllowed);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [pendingSolve, setPendingSolve] = useState<PendingSolve | null>(null);
  const [isMistakeAnimating, setIsMistakeAnimating] = useState(false);
  const [draggingWordId, setDraggingWordId] = useState<string | null>(null);
  const [isDragLocked, setIsDragLocked] = useState(false);
  const revealTimeoutRef = useRef<number | null>(null);
  const solveSortTimeoutRef = useRef<number | null>(null);
  const hopTimeoutsRef = useRef<number[]>([]);
  const settleTimeoutsRef = useRef<number[]>([]);
  const [wordFeedback, setWordFeedback] = useState<WordCardFeedbackMap>({});

  const clearRevealTimeout = () => clearTimeoutRef(revealTimeoutRef);
  const clearSolveSortTimeout = () => clearTimeoutRef(solveSortTimeoutRef);
  const clearHopTimeouts = () => clearTimeoutCollection(hopTimeoutsRef);
  const clearSettleTimeouts = () => clearTimeoutCollection(settleTimeoutsRef);

  const setFeedbackForIds = (ids: string[], status: WordCardFeedbackStatus) => {
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
  };

  useEffect(() => {
    setAvailableWords(prepareWordCards(puzzle));
    setSelectedWordIds([]);
    setSolvedCategoryIds([]);
    setMistakesRemaining(mistakesAllowed);
    setStatus("playing");
    setPendingSolve(null);
    setIsMistakeAnimating(false);
    setDraggingWordId(null);
    setIsDragLocked(false);
    setWordFeedback({});
    clearRevealTimeout();
    clearSolveSortTimeout();
    clearSettleTimeouts();
    clearHopTimeouts();
  }, [puzzle, mistakesAllowed]);

  useEffect(
    () => () => {
      clearRevealTimeout();
      clearSolveSortTimeout();
      clearSettleTimeouts();
      clearHopTimeouts();
        },
    [],
  );

  const solvedSet = useMemo(
    () => new Set(solvedCategoryIds),
    [solvedCategoryIds],
  );

  const orderedSolvedCategories = useMemo(
    () =>
      solvedCategoryIds
        .map((id) => puzzle.categories.find((category) => category.id === id))
        .filter(
          (category): category is CategoryDefinition => category !== undefined,
        ),
    [solvedCategoryIds, puzzle.categories],
  );

  const orderedUnsolvedCategories = useMemo(
    () =>
      orderedCategories(
        puzzle.categories.filter((category) => !solvedSet.has(category.id)),
      ),
    [puzzle.categories, solvedSet],
  );

  const revealCategories = useMemo(
    () => (status === "lost" ? orderedUnsolvedCategories : []),
    [status, orderedUnsolvedCategories],
  );

  const onToggleWord = (wordId: string) => {
    if (status !== "playing" || isMistakeAnimating || isDragLocked) {
      return;
    }

    setSelectedWordIds((prev) => {
      if (prev.includes(wordId)) {
        setFeedbackForIds([wordId], "idle");
        return prev.filter((id) => id !== wordId);
      }

      if (prev.length === 4) {
        return prev;
      }

      setFeedbackForIds([wordId], "idle");
      return [...prev, wordId];
    });
  };

  const shuffleWords = () => {
    if (status !== "playing" || isMistakeAnimating || isDragLocked) {
      return;
    }

    setAvailableWords((prev) => shuffle(prev));
    setFeedbackForIds(selectedWordIds, "idle");
  };

  const reorderWords = (nextOrder: WordCard[]) => {
    if (status !== "playing" || isMistakeAnimating || isDragLocked) {
      return;
    }
    if (pendingSolve) {
      return;
    }
    setAvailableWords(nextOrder);
  };

  const clearSelection = () => {
    if (status !== "playing" || isMistakeAnimating || isDragLocked) {
      return;
    }

    if (selectedWordIds.length > 0) {
      setFeedbackForIds(selectedWordIds, "idle");
    }
    setSelectedWordIds([]);
  };

  const submitSelection = () => {
    if (
      status !== "playing" ||
      selectedWordIds.length !== 4 ||
      isMistakeAnimating ||
      isDragLocked
    ) {
      return;
    }
    if (pendingSolve) {
      return;
    }
    const candidateWordIds = [...selectedWordIds];
    const selectedCards = availableWords.filter((card) =>
      candidateWordIds.includes(card.id),
    );

    if (selectedCards.length !== 4) {
      return;
    }

    const targetCategoryId = selectedCards[0]?.categoryId;
    const allSameCategory = selectedCards.every(
      (card) => card.categoryId === targetCategoryId,
    );

    const category = puzzle.categories.find(
      (item) => item.id === targetCategoryId,
    );

    if (
      category &&
      allSameCategory &&
      targetCategoryId &&
      !solvedSet.has(targetCategoryId)
    ) {
      const solvedWordIds = selectedCards.map((card) => card.id);
      const { settleDelayMs } = runHopSequence({
        ids: solvedWordIds,
        availableWords,
        setFeedback: setFeedbackForIds,
        hopTimeoutsRef,
        settleTimeoutsRef,
        settlePaddingMs: HOP_TIMING.hopToSolvedPaddingMs,
      });
      setPendingSolve({ categoryId: targetCategoryId, wordIds: solvedWordIds });
      const applySolvedOrdering = () => {
        setAvailableWords((prev) => {
          const next = [...prev];
          next.sort((a, b) => {
            const aSolved = solvedWordIds.includes(a.id);
            const bSolved = solvedWordIds.includes(b.id);
            if (aSolved === bSolved) {
              return 0;
            }
            return aSolved ? -1 : 1;
          });
          return next;
        });
      };
      clearSolveSortTimeout();
      solveSortTimeoutRef.current = window.setTimeout(() => {
        applySolvedOrdering();
        solveSortTimeoutRef.current = null;
      }, settleDelayMs);
      setSelectedWordIds([]);
      clearRevealTimeout();
      const revealDelay = computeRevealDelay(settleDelayMs);
      revealTimeoutRef.current = window.setTimeout(() => {
        clearSolveSortTimeout();
        clearSettleTimeouts();
        setWordFeedback((prev) => {
          const next: WordCardFeedbackMap = { ...prev };
          solvedWordIds.forEach((id) => {
            delete next[id];
          });
          return next;
        });
        setAvailableWords((prev) =>
          prev.filter((card) => !solvedWordIds.includes(card.id)),
        );
        setSolvedCategoryIds((prev) => {
          const next = [...prev, targetCategoryId];
          if (next.length === puzzle.categories.length) {
            setStatus("won");
          }
          return next;
        });
        setPendingSolve(null);
        revealTimeoutRef.current = null;
      }, revealDelay);
      return;
    }

    setIsMistakeAnimating(true);
    const { settleDelayMs } = runHopSequence({
      ids: candidateWordIds,
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
        setFeedbackForIds(candidateWordIds, "idle");
        setIsMistakeAnimating(false);
      },
      settleDelayMs + HOP_TIMING.shakeDurationMs,
    );

    setMistakesRemaining((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) {
        setStatus("lost");
      }
      return next;
    });
    setSelectedWordIds([]);
  };

  const swapWordCards = (fromWordId: string, toWordId: string) => {
    if (
      fromWordId === toWordId ||
      status !== "playing" ||
      isMistakeAnimating
    ) {
      return;
    }
    setAvailableWords((prev) => {
      const fromIndex = prev.findIndex((card) => card.id === fromWordId);
      const toIndex = prev.findIndex((card) => card.id === toWordId);
      if (fromIndex === -1 || toIndex === -1) {
        return prev;
      }
      const next = [...prev];
      const temp = next[fromIndex];
      next[fromIndex] = next[toIndex];
      next[toIndex] = temp;
      return next;
    });
  };

  const onWordDragStart = (wordId: string) => {
    if (
      status !== "playing" ||
      isMistakeAnimating ||
      pendingSolve !== null ||
      isDragLocked
    ) {
      return;
    }
    setDraggingWordId(wordId);
    setIsDragLocked(true);
  };

  const onWordDragMove = (targetWordId: string) => {
    if (!draggingWordId || draggingWordId === targetWordId) {
      return;
    }
    swapWordCards(draggingWordId, targetWordId);
  };

  const onWordDragEnd = () => {
    setDraggingWordId(null);
    setIsDragLocked(false);
  };

  return {
    availableWords,
    wordFeedback,
    orderedSolvedCategories,
    revealCategories,
    selectedWordIds,
    draggingWordId,
    isDragLocked,
    mistakesAllowed,
    mistakesRemaining,
    status,
    onToggleWord,
    reorderWords,
    swapWordCards,
    shuffleWords,
    clearSelection,
    submitSelection,
    onWordDragStart,
    onWordDragMove,
    onWordDragEnd,
  };
};
