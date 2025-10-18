import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryDefinition, ConnectionsPuzzle } from "../data/puzzles";
import type { GameStatus, WordCard } from "../game/types";
import { DEFAULT_MISTAKES_ALLOWED } from "../game/constants";
import { orderedCategories, prepareWordCards, shuffle } from "../game/utils";

interface UseConnectionsGameResult {
  availableWords: WordCard[];
  orderedSolvedCategories: CategoryDefinition[];
  revealCategories: CategoryDefinition[];
  selectedWordIds: string[];
  mistakesAllowed: number;
  mistakesRemaining: number;
  status: GameStatus;
  onToggleWord: (wordId: string) => void;
  reorderWords: (nextOrder: WordCard[]) => void;
  shuffleWords: () => void;
  clearSelection: () => void;
  submitSelection: () => void;
}

interface PendingSolve {
  categoryId: string;
  wordIds: string[];
}

const SOLVE_REVEAL_DELAY_MS = 600;

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
  const revealTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setAvailableWords(prepareWordCards(puzzle));
    setSelectedWordIds([]);
    setSolvedCategoryIds([]);
    setMistakesRemaining(mistakesAllowed);
    setStatus("playing");
    setPendingSolve(null);
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, [puzzle, mistakesAllowed]);

  useEffect(
    () => () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
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
    if (status !== "playing") {
      return;
    }

    setSelectedWordIds((prev) => {
      if (prev.includes(wordId)) {
        return prev.filter((id) => id !== wordId);
      }

      if (prev.length === 4) {
        return prev;
      }

      return [...prev, wordId];
    });
  };

  const shuffleWords = () => {
    if (status !== "playing") {
      return;
    }

    setAvailableWords((prev) => shuffle(prev));
  };

  const reorderWords = (nextOrder: WordCard[]) => {
    if (status !== "playing") {
      return;
    }
    if (pendingSolve) {
      return;
    }
    setAvailableWords(nextOrder);
  };

  const clearSelection = () => {
    if (status !== "playing") {
      return;
    }

    setSelectedWordIds([]);
  };

  const submitSelection = () => {
    if (status !== "playing" || selectedWordIds.length !== 4) {
      return;
    }
    if (pendingSolve) {
      return;
    }

    const selectedCards = availableWords.filter((card) =>
      selectedWordIds.includes(card.id),
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
      setPendingSolve({ categoryId: targetCategoryId, wordIds: solvedWordIds });
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
      setSelectedWordIds([]);
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
      revealTimeoutRef.current = window.setTimeout(() => {
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
      }, SOLVE_REVEAL_DELAY_MS);
      return;
    }

    setMistakesRemaining((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) {
        setStatus("lost");
      }
      return next;
    });
    setSelectedWordIds([]);
  };

  return {
    availableWords,
    orderedSolvedCategories,
    revealCategories,
    selectedWordIds,
    mistakesAllowed,
    mistakesRemaining,
    status,
    onToggleWord,
    reorderWords,
    shuffleWords,
    clearSelection,
    submitSelection,
  };
};
