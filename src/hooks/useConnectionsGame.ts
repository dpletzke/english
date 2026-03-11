import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { CategoryDefinition, ConnectionsPuzzle } from "../data/puzzles";
import type { GameStatus, WordCard, WordCardFeedbackMap } from "../game/types";
import { DEFAULT_MISTAKES_ALLOWED } from "../game/constants";
import { orderedCategories, shuffle } from "../game/utils";
import {
  getPuzzleResult,
  markPuzzleLost,
  markPuzzleSolved,
} from "../game/puzzleProgress";
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
    (initialPuzzle) =>
      buildInitialState(initialPuzzle, getPuzzleResult(initialPuzzle.date)),
  );
  const {
    availableWords,
    selectedIds,
    solvedCategoryIds,
    revealedCategoryIds,
    mistakesRemaining,
    status,
    pendingSolve,
  } = gameState;
  const selectedWordIds = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const setWordOrder = useCallback(
    (words: WordCard[]) => dispatch({ type: "setWordOrder", words }),
    [dispatch],
  );
  const markSolvePending = useCallback(
    (payload: PendingSolve) => dispatch({ type: "markSolvePending", payload }),
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
  const completeReveal = useCallback(
    ({ categoryId, wordIds }: { categoryId: string; wordIds: string[] }) =>
      dispatch({
        type: "completeReveal",
        categoryId,
        wordIds,
      }),
    [dispatch],
  );
  const recordMistake = useCallback(
    () => dispatch({ type: "recordMistake" }),
    [dispatch],
  );

  const {
    wordFeedback,
    clearFeedbackForIds,
    resetAnimationState,
    cleanup: cleanupAnimations,
    isMistakeAnimating,
    dragState,
    shuffleWords: shuffleWithAnimation,
    playSolveAnimation,
    playMistakeAnimation,
    playFailRevealSequence,
  } = useAnimationController({
    availableWords,
    onSetWordOrder: setWordOrder,
    onMarkSolvePending: markSolvePending,
    onCompleteSolve: completeSolve,
    onCompleteReveal: completeReveal,
    onRecordMistake: recordMistake,
  });
  const {
    draggingWordId,
    dragTargetWordId,
    isDragLockedAnim,
    pendingDragSettle,
    layoutLockedWordId,
    startDragAnim,
    moveDragAnim,
    endDragAnim,
    clearPendingDragSettle,
    clearLayoutLockedWord,
  } = dragState;

  useEffect(() => {
    dispatch({
      type: "hydratePuzzle",
      puzzle,
      persistedResult: getPuzzleResult(puzzle.date),
    });
    resetAnimationState();
  }, [puzzle, resetAnimationState]);

  useEffect(() => {
    if (status === "won") {
      markPuzzleSolved(puzzle.date);
      return;
    }

    if (status === "lost") {
      markPuzzleLost(puzzle.date);
    }
  }, [status, puzzle.date]);

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
  const revealedSet = useMemo(
    () => new Set(revealedCategoryIds),
    [revealedCategoryIds],
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
        puzzle.categories.filter(
          (category) =>
            !solvedSet.has(category.id) && !revealedSet.has(category.id),
        ),
      ),
    [puzzle.categories, revealedSet, solvedSet],
  );

  const revealCategories = useMemo(
    () =>
      status === "lost"
        ? revealedCategoryIds
            .map((id) => puzzle.categories.find((category) => category.id === id))
            .filter(
              (category): category is CategoryDefinition =>
                category !== undefined,
            )
        : [],
    [status, puzzle.categories, revealedCategoryIds],
  );

  const isActionLocked = useCallback(
    (options?: { ignoreDragLock?: boolean; requireSolveIdle?: boolean }) => {
      if (status !== "playing" || isMistakeAnimating) {
        return true;
      }
      if (!options?.ignoreDragLock && isDragLockedAnim) {
        return true;
      }
      if (options?.requireSolveIdle && pendingSolve) {
        return true;
      }
      return false;
    },
    [status, isMistakeAnimating, isDragLockedAnim, pendingSolve],
  );

  const isInteractionLocked = isActionLocked();

  const onToggleWord = (wordId: string) => {
    if (isActionLocked()) {
      return;
    }

    clearFeedbackForIds([wordId]);
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

  const clearSelection = () => {
    if (isActionLocked()) {
      return;
    }

    clearFeedbackForIds(selectedWordIds);
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
      !solvedSet.has(targetCategoryId) &&
      !revealedSet.has(targetCategoryId)
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

    if (mistakesRemaining === 1) {
      const failRevealBatches = orderedUnsolvedCategories
        .map((category) => {
          const wordIds = availableWords
            .filter((card) => card.categoryId === category.id)
            .map((card) => card.id);
          return {
            categoryId: category.id,
            wordIds,
          };
        })
        .filter((batch) => batch.wordIds.length > 0);

      playMistakeAnimation({
        wordIds: candidateWordIds,
        recordMistake: false,
        onAfterMistake: () => {
          playFailRevealSequence({
            batches: failRevealBatches,
          });
        },
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
    startDragAnim(wordId);
  };

  const onWordDragMove = (targetWordId: string | null) => {
    moveDragAnim(targetWordId);
  };

  const onWordDragEnd = () => {
    endDragAnim();
  };

  const dragConfig: WordGridDragConfig = useMemo(
    () => ({
      draggingWordId,
      dragTargetWordId,
      isDragLocked: isDragLockedAnim,
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
      isDragLockedAnim,
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
    shuffleWords,
    clearSelection,
    submitSelection,
  };

  return result;
};
