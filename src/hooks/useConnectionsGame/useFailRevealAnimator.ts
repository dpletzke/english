import { useCallback } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { WordCard } from "../../game/types";
import type { PendingSolve } from "./gameReducer";
import { scheduleManagedTimeout } from "./timeouts";
import { reorderWordsWithSolvedFirst } from "./wordOrdering";
import type { FailRevealBatch, PlaySolveAnimationArgs } from "./animationTypes";

const FAIL_REVEAL_REORDER_DELAY_MS = 600;
const FAIL_REVEAL_NEXT_BATCH_DELAY_MS = 200;

interface UseFailRevealAnimatorArgs {
  availableWords: WordCard[];
  failRevealTimeoutsRef: MutableRefObject<number[]>;
  finalizeSolve: (args: PlaySolveAnimationArgs) => void;
  onMarkSolvePending: (payload: PendingSolve) => void;
  onRecordMistake: () => void;
  onSetWordOrder: (words: WordCard[]) => void;
  resetDragContext: () => void;
  setIsMistakeAnimating: Dispatch<SetStateAction<boolean>>;
}

export const useFailRevealAnimator = ({
  availableWords,
  failRevealTimeoutsRef,
  finalizeSolve,
  onMarkSolvePending,
  onRecordMistake,
  onSetWordOrder,
  resetDragContext,
  setIsMistakeAnimating,
}: UseFailRevealAnimatorArgs) => {
  return useCallback(
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

      const playBatch = (index: number, words: WordCard[]) => {
        if (index >= batches.length) {
          setIsMistakeAnimating(false);
          onRecordMistake();
          return;
        }

        const batch = batches[index];
        if (batch.wordIds.length === 0) {
          playBatch(index + 1, words);
          return;
        }

        onMarkSolvePending({
          categoryId: batch.categoryId,
          wordIds: batch.wordIds,
        });

        const sortedWords = reorderWordsWithSolvedFirst(words, batch.wordIds);
        const remainingWords = sortedWords.filter(
          (card) => !batch.wordIds.includes(card.id),
        );

        onSetWordOrder(sortedWords);

        scheduleManagedTimeout(
          failRevealTimeoutsRef,
          () => {
            finalizeSolve({
              categoryId: batch.categoryId,
              wordIds: batch.wordIds,
              totalCategoryCount,
            });
            scheduleManagedTimeout(
              failRevealTimeoutsRef,
              () => playBatch(index + 1, remainingWords),
              FAIL_REVEAL_NEXT_BATCH_DELAY_MS,
            );
          },
          FAIL_REVEAL_REORDER_DELAY_MS,
        );
      };

      playBatch(0, [...availableWords]);
    },
    [
      availableWords,
      failRevealTimeoutsRef,
      finalizeSolve,
      onMarkSolvePending,
      onRecordMistake,
      onSetWordOrder,
      resetDragContext,
      setIsMistakeAnimating,
    ],
  );
};
