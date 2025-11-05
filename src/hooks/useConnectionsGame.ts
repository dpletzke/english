import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { CategoryDefinition, ConnectionsPuzzle } from "../data/puzzles";
import type {
  GameStatus,
  WordCard,
  WordCardFeedbackMap,
} from "../game/types";
import { DEFAULT_MISTAKES_ALLOWED } from "../game/constants";
import { orderedCategories, shuffle } from "../game/utils";
import type { WordGridDragConfig } from "../game/dragTypes";
import {
  buildInitialState,
  gameReducer,
} from "./useConnectionsGame/gameReducer";
import type { PendingSolve } from "./useConnectionsGame/gameReducer";
import { useAnimationController } from "./useConnectionsGame/animationController";

interface UseConnectionsGameResult {
  availableWords: WordCard[];
  wordFeedback: WordCardFeedbackMap;
  orderedSolvedCategories: CategoryDefinition[];
  revealCategories: CategoryDefinition[];
  selectedWordIds: string[];
  dragConfig: WordGridDragConfig;
  mistakesAllowed: number;
  mistakesRemaining: number;
  status: GameStatus;
  isInteractionLocked: boolean;
  onToggleWord: (wordId: string) => void;
  reorderWords: (nextOrder: WordCard[]) => void;
  shuffleWords: () => void;
  clearSelection: () => void;
  submitSelection: () => void;
}

export const useConnectionsGame = (
  puzzle: ConnectionsPuzzle,
): UseConnectionsGameResult => {
  const mistakesAllowed = DEFAULT_MISTAKES_ALLOWED;
  const [gameState, dispatch] = useReducer(
    gameReducer,
    puzzle,
    buildInitialState,
  );
  const {
    availableWords,
    selectedIds,
    solvedCategoryIds,
    mistakesRemaining,
    status,
    pendingSolve,
  } = gameState;
  const selectedWordIds = useMemo(
    () => Array.from(selectedIds),
    [selectedIds],
  );
  const setWordOrder = useCallback(
    (words: WordCard[]) => dispatch({ type: "setWordOrder", words }),
    [dispatch],
  );
  const markSolvePending = useCallback(
    (payload: PendingSolve) =>
      dispatch({ type: "markSolvePending", payload }),
    [dispatch],
  );
  const completeSolve = useCallback(
    ({
      categoryId,
      wordIds,
      totalCategoryCount,
    }: {
      categoryId: string;
      wordIds: string[];
      totalCategoryCount: number;
    }) =>
      dispatch({
        type: "completeSolve",
        categoryId,
        wordIds,
        totalCategoryCount,
      }),
    [dispatch],
  );
  const recordMistake = useCallback(
    () => dispatch({ type: "recordMistake" }),
    [dispatch],
  );

  const {
    wordFeedback,
    setFeedbackForIds,
    resetAnimationState,
    cleanup: cleanupAnimations,
    isMistakeAnimating,
    dragState,
    shuffleWords: shuffleWithAnimation,
    reorderWords: reorderWithAnimation,
    clearSelectionFeedback,
    playSolveAnimation,
    playMistakeAnimation,
  } = useAnimationController({
    availableWords,
    onSetWordOrder: setWordOrder,
    onMarkSolvePending: markSolvePending,
    onCompleteSolve: completeSolve,
    onRecordMistake: recordMistake,
  });
  const {
    draggingWordId,
    dragTargetWordId,
    isDragLocked: isDragLockedInternal,
    pendingDragSettle,
    layoutLockedWordId,
    onWordDragStart: internalDragStart,
    onWordDragMove: internalDragMove,
    onWordDragEnd: internalDragEnd,
    clearPendingDragSettle,
    clearLayoutLockedWord,
  } = dragState;

  useEffect(() => {
    dispatch({ type: "hydratePuzzle", puzzle });
    resetAnimationState();
  }, [puzzle, resetAnimationState]);

  useEffect(
    () => () => {
      cleanupAnimations();
    },
    [cleanupAnimations],
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

  const isActionLocked = useCallback(
    (options?: { ignoreDragLock?: boolean; requireSolveIdle?: boolean }) => {
      if (status !== "playing" || isMistakeAnimating) {
        return true;
      }
      if (!options?.ignoreDragLock && isDragLockedInternal) {
        return true;
      }
      if (options?.requireSolveIdle && pendingSolve) {
        return true;
      }
      return false;
    },
    [status, isMistakeAnimating, isDragLockedInternal, pendingSolve],
  );

  const isInteractionLocked = isActionLocked();

  const onToggleWord = (wordId: string) => {
    if (isActionLocked()) {
      return;
    }

    setFeedbackForIds([wordId], "idle");
    dispatch({ type: "toggleWord", wordId });
  };

  const shuffleWords = () => {
    if (isActionLocked()) {
      return;
    }
    shuffleWithAnimation({
      shuffleFn: shuffle,
      selectedWordIds,
    });
  };

  const reorderWords = (nextOrder: WordCard[]) => {
    if (isActionLocked({ requireSolveIdle: true })) {
      return;
    }
    reorderWithAnimation(nextOrder);
  };

  const clearSelection = () => {
    if (isActionLocked()) {
      return;
    }

    clearSelectionFeedback(selectedWordIds);
    dispatch({ type: "clearSelection" });
  };

  const submitSelection = () => {
    if (selectedWordIds.length !== 4) {
      return;
    }
    if (isActionLocked({ requireSolveIdle: true })) {
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
      playSolveAnimation({
        categoryId: targetCategoryId,
        wordIds: solvedWordIds,
        totalCategoryCount: puzzle.categories.length,
      });
      dispatch({ type: "clearSelection" });
      return;
    }

    playMistakeAnimation({ wordIds: candidateWordIds });
    dispatch({ type: "clearSelection" });
  };

  const onWordDragStart = (wordId: string) => {
    if (isActionLocked({ requireSolveIdle: true })) {
      return;
    }
    internalDragStart(wordId);
  };

  const onWordDragMove = (targetWordId: string | null) => {
    internalDragMove(targetWordId);
  };

  const onWordDragEnd = () => {
    internalDragEnd();
  };

  const dragConfig: WordGridDragConfig = useMemo(
    () => ({
      draggingWordId,
      dragTargetWordId,
      isDragLocked: isDragLockedInternal,
      onWordDragStart,
      onWordDragMove,
      onWordDragEnd,
      pendingDragSettle,
      clearPendingDragSettle,
      layoutLockedWordId,
      clearLayoutLockedWord,
    }),
    [
      clearLayoutLockedWord,
      clearPendingDragSettle,
      dragTargetWordId,
      draggingWordId,
      isDragLockedInternal,
      layoutLockedWordId,
      onWordDragEnd,
      onWordDragMove,
      onWordDragStart,
      pendingDragSettle,
    ],
  );

  const result: UseConnectionsGameResult = {
    availableWords,
    wordFeedback,
    orderedSolvedCategories,
    revealCategories,
    selectedWordIds,
    dragConfig,
    mistakesAllowed,
    mistakesRemaining,
    status,
    isInteractionLocked,
    onToggleWord,
    reorderWords,
    shuffleWords,
    clearSelection,
    submitSelection,
  };

  return result;
};
