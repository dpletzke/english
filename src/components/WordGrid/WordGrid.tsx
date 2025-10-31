import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, Reorder, type Transition } from "framer-motion";
import styled from "styled-components";
import type { CategoryDefinition } from "../../data/puzzles";
import type {
  WordCard,
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../../game/types";
import { SolvedCategoryTile } from "./SolvedCategoryTile";
import { WordTile, type CardFeedbackAnimation } from "./WordTile";
import type {
  DragSettleDelta,
  DragSettleRequest,
  DragSettleSnapshot,
} from "./WordGrid.types";

interface WordGridProps {
  words: WordCard[];
  selectedWordIds: string[];
  onToggleWord: (wordId: string) => void;
  onReorderWords?: (nextOrder: WordCard[]) => void;
  wordFeedback?: WordCardFeedbackMap;
  solvedCategories: CategoryDefinition[];
  disabled?: boolean;
  draggingWordId?: string | null;
  dragTargetWordId?: string | null;
  isDragLocked?: boolean;
  onWordDragStart?: (wordId: string) => void;
  onWordDragMove?: (targetWordId: string | null) => void;
  onWordDragEnd?: () => void;
  pendingDragSettle?: DragSettleRequest | null;
  clearPendingDragSettle?: () => void;
  onSettleDeltaConsumed?: (requestId: number) => void;
  layoutLockedWordId?: string | null;
  clearLayoutLockedWord?: () => void;
}

const Grid = styled.div`
  --grid-max-size: max(0px, min(520px, calc(100vh - 320px)));
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  width: min(100%, var(--grid-max-size));
  max-width: 520px;
  aspect-ratio: 1;
  margin: 0 auto;
`;

const WordList = styled(Reorder.Group)`
  display: contents;
`;

const noopReorder: (nextOrder: WordCard[]) => void = () => {
  /* no-op */
};

const noopWordDragStart = () => {
  /* no-op */
};

const noopWordDragMove = (_target: string | null) => {
  /* no-op */
};

const noopWordDragEnd = () => {
  /* no-op */
};

const noopClearPendingSettle = () => {
  /* no-op */
};

const noopSettleConsumed = (_requestId: number) => {
  /* no-op */
};

const noopClearLayoutLock = () => {
  /* no-op */
};

const hopKeyframes: number[] = [0, -18, 0];
const hopTransition: Transition = {
  duration: 0.24,
  ease: [0.33, 1, 0.68, 1],
  times: [0, 0.5, 1],
};

const idleTransition: Transition = { duration: 0.18 };

const shakeKeyframes: number[] = [0, -21, 21, -14, 14, -7, 7, 0];
const shakeTransition: Transition = {
  duration: 0.22,
  ease: "easeInOut",
  times: [0, 0.18, 0.36, 0.54, 0.72, 0.86, 0.93, 1],
};

const cardFeedbackAnimations: Record<
  WordCardFeedbackStatus,
  CardFeedbackAnimation
> = {
  idle: {
    animate: { x: 0, y: 0, scale: 1 },
    transition: idleTransition,
  },
  hop: {
    animate: { x: 0, y: hopKeyframes, scale: 1 },
    transition: hopTransition,
  },
  shake: {
    animate: { x: shakeKeyframes, y: 0, scale: 1 },
    transition: shakeTransition,
  },
};
const WordGrid = ({
  words,
  selectedWordIds,
  onToggleWord,
  onReorderWords,
  solvedCategories,
  disabled = false,
  draggingWordId = null,
  dragTargetWordId = null,
  isDragLocked = false,
  onWordDragStart,
  onWordDragMove,
  onWordDragEnd,
  pendingDragSettle = null,
  clearPendingDragSettle,
  onSettleDeltaConsumed,
  layoutLockedWordId = null,
  clearLayoutLockedWord,
  wordFeedback,
}: WordGridProps) => {
  const handleReorder = onReorderWords ?? noopReorder;
  const feedbackMap = wordFeedback ?? {};
  const dragEnabled =
    typeof onWordDragStart === "function" &&
    typeof onWordDragMove === "function" &&
    typeof onWordDragEnd === "function";
  const handleDragStart = onWordDragStart ?? noopWordDragStart;
  const handleDragMove = onWordDragMove ?? noopWordDragMove;
  const handleDragEnd = onWordDragEnd ?? noopWordDragEnd;
  const handleClearPendingSettle =
    clearPendingDragSettle ?? noopClearPendingSettle;
  const handleSettleConsumed = onSettleDeltaConsumed ?? noopSettleConsumed;
  const handleClearLayoutLock = clearLayoutLockedWord ?? noopClearLayoutLock;
  const [pendingDragSnapshot, setPendingDragSnapshot] =
    useState<DragSettleSnapshot | null>(null);
  const [activeSettleDelta, setActiveSettleDelta] =
    useState<DragSettleDelta | null>(null);

  const handleReportDragSettle = useCallback(
    (snapshot: DragSettleSnapshot | null) => {
      setPendingDragSnapshot(snapshot);
      if (!snapshot) {
        setActiveSettleDelta(null);
        handleClearPendingSettle();
        handleClearLayoutLock();
      }
    },
    [handleClearLayoutLock, handleClearPendingSettle],
  );

  const handleTileSettleConsumed = useCallback(
    (requestId: number) => {
      if (activeSettleDelta && activeSettleDelta.requestId === requestId) {
        setActiveSettleDelta(null);
      }
      handleSettleConsumed(requestId);
      handleClearLayoutLock();
    },
    [activeSettleDelta, handleClearLayoutLock, handleSettleConsumed],
  );

  useEffect(() => {
    if (!pendingDragSettle) {
      return;
    }
    if (!pendingDragSnapshot) {
      return;
    }
    if (
      pendingDragSnapshot.fromWordId !== pendingDragSettle.fromWordId ||
      pendingDragSnapshot.toWordId !== pendingDragSettle.toWordId
    ) {
      return;
    }
    const deltaX =
      pendingDragSnapshot.fromRect.left - pendingDragSnapshot.toRect.left;
    const deltaY =
      pendingDragSnapshot.fromRect.top - pendingDragSnapshot.toRect.top;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const settleDelta: DragSettleDelta = {
      wordId: pendingDragSnapshot.fromWordId,
      deltaX,
      deltaY,
      requestId: pendingDragSettle.requestId,
      recordedAt: now,
    };
    setActiveSettleDelta(settleDelta);
    setPendingDragSnapshot(null);
    handleClearPendingSettle();
  }, [handleClearPendingSettle, pendingDragSettle, pendingDragSnapshot]);

  return (
    <Grid>
      <AnimatePresence>
        {solvedCategories.map((category) => (
          <SolvedCategoryTile
            key={`solved-${category.id}`}
            category={category}
          />
        ))}
      </AnimatePresence>
      <WordList
        axis="y"
        values={words}
        onReorder={(order) => handleReorder(order as WordCard[])}
        layoutScroll
      >
        {words.map((card) => {
          const feedbackStatus: WordCardFeedbackStatus =
            feedbackMap[card.id] ?? "idle";
          const animation = cardFeedbackAnimations[feedbackStatus];
          const layoutLocked = Boolean(
            (layoutLockedWordId && layoutLockedWordId === card.id) ||
              (pendingDragSettle && pendingDragSettle.fromWordId === card.id) ||
              (activeSettleDelta && activeSettleDelta.wordId === card.id),
          );

          return (
            <WordTile
              key={card.id}
              card={card}
              isSelected={selectedWordIds.includes(card.id)}
              disabled={disabled}
              feedbackAnimation={animation}
              draggingWordId={draggingWordId}
              dragTargetWordId={dragTargetWordId}
              isDragLocked={isDragLocked}
              dragEnabled={dragEnabled}
              onToggleWord={onToggleWord}
              onWordDragStart={handleDragStart}
              onWordDragMove={handleDragMove}
              onWordDragEnd={handleDragEnd}
              reportDragSettle={handleReportDragSettle}
              settleDelta={
                activeSettleDelta && activeSettleDelta.wordId === card.id
                  ? activeSettleDelta
                  : null
              }
              isLayoutLocked={layoutLocked}
              onSettleDeltaConsumed={handleTileSettleConsumed}
            />
          );
        })}
      </WordList>
    </Grid>
  );
};

export default WordGrid;
