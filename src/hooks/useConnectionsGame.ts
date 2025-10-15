import { useEffect, useMemo, useState } from "react";
import type { CategoryDefinition, ConnectionsPuzzle } from "../data/puzzles";
import type { GameStatus, WordCard } from "../game/types";
import { DEFAULT_MISTAKES_ALLOWED } from "../game/constants";
import { orderedCategories, prepareWordCards, shuffle } from "../game/utils";

interface UseConnectionsGameResult {
  availableWords: WordCard[];
  remainingWords: WordCard[];
  solvedCategories: CategoryDefinition[];
  orderedSolvedCategories: CategoryDefinition[];
  unsolvedCategories: CategoryDefinition[];
  orderedUnsolvedCategories: CategoryDefinition[];
  revealCategories: CategoryDefinition[];
  selectedWordIds: string[];
  solvedCategoryIds: string[];
  mistakesAllowed: number;
  mistakesRemaining: number;
  status: GameStatus;
  onToggleWord: (wordId: string) => void;
  shuffleWords: () => void;
  clearSelection: () => void;
  submitSelection: () => void;
}

export const useConnectionsGame = (
  puzzle: ConnectionsPuzzle,
): UseConnectionsGameResult => {
  const mistakesAllowed = DEFAULT_MISTAKES_ALLOWED;

  const [availableWords, setAvailableWords] = useState<WordCard[]>(() =>
    shuffle(prepareWordCards(puzzle)),
  );
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [solvedCategoryIds, setSolvedCategoryIds] = useState<string[]>([]);
  const [mistakesRemaining, setMistakesRemaining] =
    useState<number>(mistakesAllowed);
  const [status, setStatus] = useState<GameStatus>("playing");

  useEffect(() => {
    setAvailableWords(shuffle(prepareWordCards(puzzle)));
    setSelectedWordIds([]);
    setSolvedCategoryIds([]);
    setMistakesRemaining(mistakesAllowed);
    setStatus("playing");
  }, [puzzle, mistakesAllowed]);

  const solvedSet = useMemo(
    () => new Set(solvedCategoryIds),
    [solvedCategoryIds],
  );

  const solvedCategories = useMemo(
    () => puzzle.categories.filter((category) => solvedSet.has(category.id)),
    [puzzle.categories, solvedSet],
  );

  const unsolvedCategories = useMemo(
    () => puzzle.categories.filter((category) => !solvedSet.has(category.id)),
    [puzzle.categories, solvedSet],
  );

  const orderedSolvedCategories = useMemo(
    () =>
      solvedCategoryIds
        .map((id) =>
          puzzle.categories.find((category) => category.id === id),
        )
        .filter(
          (category): category is CategoryDefinition =>
            category !== undefined,
        ),
    [solvedCategoryIds, puzzle.categories],
  );

  const orderedUnsolvedCategories = useMemo(
    () => orderedCategories(unsolvedCategories),
    [unsolvedCategories],
  );

  const activeWords = useMemo(
    () => availableWords.filter((card) => !solvedSet.has(card.categoryId)),
    [availableWords, solvedSet],
  );

  const remainingWords = useMemo(
    () => (status === "lost" ? [] : activeWords),
    [status, activeWords],
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
    setSelectedWordIds([]);
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
      setAvailableWords((prev) =>
        prev.filter((card) => card.categoryId !== targetCategoryId),
      );
      setSolvedCategoryIds((prev) => {
        const next = [...prev, targetCategoryId];
        if (next.length === puzzle.categories.length) {
          setStatus("won");
        }
        return next;
      });
      setSelectedWordIds([]);
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
    remainingWords,
    solvedCategories,
    orderedSolvedCategories,
    unsolvedCategories,
    orderedUnsolvedCategories,
    revealCategories,
    selectedWordIds,
    solvedCategoryIds,
    mistakesAllowed,
    mistakesRemaining,
    status,
    onToggleWord,
    shuffleWords,
    clearSelection,
    submitSelection,
  };
};
