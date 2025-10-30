import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  AnimatePresence,
  Reorder,
  motion,
  type PanInfo,
  type Transition,
  useDragControls,
  useMotionValue,
  animate,
} from "framer-motion";
import styled, { css } from "styled-components";
import type { CategoryDefinition } from "../../data/puzzles";
import { colorSwatches, colorTextOverrides } from "../../data/puzzles";
import type {
  WordCard,
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../../game/types";
import { WordButton } from "./WordButton";

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

const SolvedCategoryTile = styled(motion.article)<{
  $color: CategoryDefinition["color"];
}>`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  height: 100%;
  border-radius: 12px;
  border: 3px solid rgba(0, 0, 0, 0.08);
  background: ${({ $color }) => colorSwatches[$color]};
  color: ${({ $color }) => colorTextOverrides[$color] ?? "#1f1f1f"};
  padding: 12px 16px;
  text-align: center;
`;

const SolvedCategoryTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
`;

const SolvedCategoryWords = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const WordList = styled(Reorder.Group)`
  display: contents;
`;

const WordItem = styled(Reorder.Item)<{
  $isDropTarget: boolean;
  $isLockedOut: boolean;
  $isDragging: boolean;
  $dragEnabled: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  touch-action: none;
  user-select: none;
  ${({ $isDragging }) =>
    $isDragging &&
    css`
      pointer-events: none;
    `}
  ${({ $isDropTarget }) =>
    $isDropTarget &&
    css`
      outline: 2px solid var(--accent-color);
      outline-offset: 4px;
    `}
  ${({ $dragEnabled, $isLockedOut, $isDragging }) =>
    $dragEnabled &&
    !$isLockedOut &&
    css`
      cursor: ${$isDragging ? "grabbing" : "grab"};
    `}
`;

const getLengthCategory = (label: string): "short" | "medium" | "long" => {
  const condensedLength = label.replace(/\s+/g, "").length;
  if (condensedLength >= 11) {
    return "long";
  }
  if (condensedLength >= 7) {
    return "medium";
  }
  return "short";
};

const getLayoutCategory = (label: string): "single" | "double" =>
  label.trim().split(/\s+/).length === 2 ? "double" : "single";

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

type CardFeedbackAnimation = {
  animate: {
    x?: number | number[];
    y?: number | number[];
    scale: number | number[];
  };
  transition: Transition;
};

type DragSettleRequest = {
  fromWordId: string;
  toWordId: string;
  requestId: number;
};

type DragSettleSnapshot = {
  fromWordId: string;
  toWordId: string;
  fromRect: DOMRect;
  toRect: DOMRect;
  recordedAt: number;
};

type DragSettleDelta = {
  wordId: string;
  deltaX: number;
  deltaY: number;
  requestId: number;
  recordedAt: number;
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

const LONG_PRESS_DELAY_MS = 200;
const POINTER_DRAG_THRESHOLD_PX = 6;

const findWordIdAtPoint = (
  point: { x: number; y: number },
  excludeId: string,
): string | null => {
  if (typeof document === "undefined") {
    return null;
  }
  const element = document.elementFromPoint(point.x, point.y);
  if (!element) {
    return null;
  }
  const wordElement = element.closest<HTMLElement>("[data-word-id]");
  if (!wordElement) {
    return null;
  }
  const candidateId =
    wordElement.dataset.wordId ?? wordElement.getAttribute("data-word-id");
  if (!candidateId || candidateId === excludeId) {
    return null;
  }
  return candidateId;
};

interface DraggableWordTileProps {
  card: WordCard;
  isSelected: boolean;
  disabled: boolean;
  feedbackAnimation: CardFeedbackAnimation;
  draggingWordId: string | null;
  dragTargetWordId: string | null;
  isDragLocked: boolean;
  dragEnabled: boolean;
  onToggleWord: (wordId: string) => void;
  onWordDragStart: (wordId: string) => void;
  onWordDragMove: (targetWordId: string | null) => void;
  onWordDragEnd: () => void;
  reportDragSettle: (snapshot: DragSettleSnapshot | null) => void;
  settleDelta: DragSettleDelta | null;
  onSettleDeltaConsumed: (requestId: number) => void;
  isLayoutLocked: boolean;
}

const DraggableWordTile = ({
  card,
  isSelected,
  disabled,
  feedbackAnimation,
  draggingWordId,
  dragTargetWordId,
  isDragLocked,
  dragEnabled,
  onToggleWord,
  onWordDragStart,
  onWordDragMove,
  onWordDragEnd,
  reportDragSettle,
  settleDelta,
  onSettleDeltaConsumed,
}: DraggableWordTileProps) => {
  const dragControls = useDragControls();
  const itemRef = useRef<HTMLDivElement | null>(null);
  const settleX = useMotionValue(0);
  const settleY = useMotionValue(0);
  const lastAnimatedRequestIdRef = useRef<number | null>(null);
  const activeAnimationXRef = useRef<ReturnType<typeof animate> | null>(null);
  const activeAnimationYRef = useRef<ReturnType<typeof animate> | null>(null);
  const isDragging = draggingWordId === card.id && dragEnabled;
  const isDropTarget = dragTargetWordId === card.id && dragEnabled;
  const isLockedOut =
    dragEnabled &&
    isDragLocked &&
    draggingWordId !== null &&
    draggingWordId !== card.id;
  const buttonCursor = dragEnabled
    ? isDragging
      ? "grabbing"
      : isLockedOut
        ? "default"
        : "grab"
    : undefined;
  useEffect(() => {
    if (!settleDelta) {
      return;
    }
    if (settleDelta.wordId !== card.id) {
      return;
    }
    if (lastAnimatedRequestIdRef.current === settleDelta.requestId) {
      return;
    }
    if (isDragging) {
      return;
    }
    activeAnimationXRef.current?.stop();
    activeAnimationYRef.current?.stop();
    activeAnimationXRef.current = null;
    activeAnimationYRef.current = null;
    lastAnimatedRequestIdRef.current = settleDelta.requestId;
    settleX.set(settleDelta.deltaX);
    settleY.set(settleDelta.deltaY);
    const animationX = animate(settleX, 0, {
      type: "spring",
      stiffness: 340,
      damping: 36,
    });
    const animationY = animate(settleY, 0, {
      type: "spring",
      stiffness: 340,
      damping: 36,
    });
    activeAnimationXRef.current = animationX;
    activeAnimationYRef.current = animationY;
    animationY.then(() => {
      activeAnimationXRef.current = null;
      activeAnimationYRef.current = null;
      onSettleDeltaConsumed(settleDelta.requestId);
    });
  }, [
    card.id,
    isDragging,
    onSettleDeltaConsumed,
    settleDelta,
    settleX,
    settleY,
  ]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }
    activeAnimationXRef.current?.stop();
    activeAnimationYRef.current?.stop();
    activeAnimationXRef.current = null;
    activeAnimationYRef.current = null;
    settleX.set(0);
    settleY.set(0);
  }, [isDragging, settleX, settleY]);
  const logWordAnimation = useCallback(
    (_phase?: "start" | "complete") => {},
    [],
  );
  const logLayoutAnimation = useCallback(
    (_phase?: "start" | "complete") => {},
    [],
  );
  const longPressTimeoutRef = useRef<number | null>(null);
  const pendingPointerEventRef = useRef<PointerEvent | null>(null);
  const isDraggingRef = useRef(false);
  const lastTargetRef = useRef<string | null>(null);
  const initialPointerRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pendingPointerEventRef.current = null;
  }, []);

  const reportDragMove = useCallback(
    (nextTarget: string | null) => {
      if (!dragEnabled) {
        return;
      }
      if (lastTargetRef.current === nextTarget) {
        return;
      }
      lastTargetRef.current = nextTarget;
      onWordDragMove(nextTarget);
    },
    [dragEnabled, onWordDragMove],
  );

  const beginDrag = useCallback(
    (pointerEvent: PointerEvent) => {
      if (!dragEnabled) {
        return;
      }
      if (disabled) {
        return;
      }
      if (isDragLocked && draggingWordId !== card.id) {
        return;
      }
      clearLongPressTimer();
      onWordDragStart(card.id);
      isDraggingRef.current = true;
      pointerEvent.preventDefault();
      pointerEvent.stopPropagation();
      pendingPointerEventRef.current = null;
      requestAnimationFrame(() => {
        dragControls.start(pointerEvent, { snapToCursor: false });
      });
    },
    [
      card.id,
      clearLongPressTimer,
      dragControls,
      dragEnabled,
      disabled,
      draggingWordId,
      isDragLocked,
      onWordDragStart,
    ],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }
      initialPointerRef.current = { x: event.clientX, y: event.clientY };
      if (!dragEnabled) {
        return;
      }
      if (isDragLocked && draggingWordId && draggingWordId !== card.id) {
        return;
      }
      const pointerEvent = event.nativeEvent;
      if (pointerEvent.pointerType === "touch") {
        pendingPointerEventRef.current = pointerEvent;
        clearLongPressTimer();
        longPressTimeoutRef.current = window.setTimeout(() => {
          const pendingEvent = pendingPointerEventRef.current;
          if (pendingEvent) {
            beginDrag(pendingEvent);
          }
        }, LONG_PRESS_DELAY_MS);
      } else {
        pendingPointerEventRef.current = pointerEvent;
      }
    },
    [
      beginDrag,
      card.id,
      clearLongPressTimer,
      disabled,
      dragEnabled,
      draggingWordId,
      isDragLocked,
    ],
  );

  const handlePointerEnd = useCallback(() => {
    clearLongPressTimer();
    pendingPointerEventRef.current = null;
    initialPointerRef.current = null;
  }, [clearLongPressTimer]);

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!dragEnabled || disabled) {
        return;
      }
      if (isDraggingRef.current) {
        return;
      }
      const pointerEvent = event.nativeEvent;
      const startPoint = initialPointerRef.current;
      if (!startPoint) {
        return;
      }
      const deltaX = Math.abs(pointerEvent.clientX - startPoint.x);
      const deltaY = Math.abs(pointerEvent.clientY - startPoint.y);

      if (pointerEvent.pointerType === "touch") {
        if (
          deltaX > POINTER_DRAG_THRESHOLD_PX ||
          deltaY > POINTER_DRAG_THRESHOLD_PX
        ) {
          clearLongPressTimer();
        }
        return;
      }

      if (
        deltaX > POINTER_DRAG_THRESHOLD_PX ||
        deltaY > POINTER_DRAG_THRESHOLD_PX
      ) {
        beginDrag(pointerEvent);
      }
    },
    [beginDrag, clearLongPressTimer, disabled, dragEnabled],
  );

  const handleDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!dragEnabled || !isDraggingRef.current) {
        return;
      }
      const nextTarget = findWordIdAtPoint(info.point, card.id);
      reportDragMove(nextTarget);
    },
    [card.id, dragEnabled, reportDragMove],
  );

  const handleDragEnd = useCallback(() => {
    const targetId = lastTargetRef.current;
    if (isDraggingRef.current && dragEnabled) {
      if (targetId && itemRef.current && typeof document !== "undefined") {
        const fromRect = itemRef.current.getBoundingClientRect();
        const targetElement = document.querySelector<HTMLElement>(
          `[data-word-id="${targetId}"]`,
        );
        const toRect = targetElement?.getBoundingClientRect();
        if (fromRect && toRect) {
          const now =
            typeof performance !== "undefined" ? performance.now() : Date.now();
          const snapshot: DragSettleSnapshot = {
            fromWordId: card.id,
            toWordId: targetId,
            fromRect,
            toRect,
            recordedAt: now,
          };
          reportDragSettle(snapshot);
        } else {
          reportDragSettle(null);
        }
      } else {
        reportDragSettle(null);
      }
      onWordDragEnd();
    } else {
      reportDragSettle(null);
    }
    lastTargetRef.current = null;
    isDraggingRef.current = false;
    clearLongPressTimer();
  }, [
    card.id,
    clearLongPressTimer,
    dragEnabled,
    onWordDragEnd,
    reportDragSettle,
  ]);

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (isDraggingRef.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onToggleWord(card.id);
    },
    [card.id, onToggleWord],
  );

  const lengthCategory = getLengthCategory(card.label);
  const layoutCategory = getLayoutCategory(card.label);

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    [clearLongPressTimer],
  );

  return (
    <WordItem
      ref={itemRef}
      data-word-id={card.id}
      value={card}
      layout
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        layout: { duration: 0.4, ease: "easeInOut" },
        opacity: { duration: 0.18 },
        scale: { duration: 0.18 },
      }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragTransition={
        !dragTargetWordId
          ? undefined
          : {
              bounceDamping: 1,
              bounceStiffness: 0,
            }
      }
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onLayoutAnimationStart={() => logLayoutAnimation("start")}
      onLayoutAnimationComplete={() => logLayoutAnimation("complete")}
      $isDropTarget={isDropTarget}
      $isLockedOut={isLockedOut}
      $isDragging={isDragging}
      $dragEnabled={dragEnabled}
      style={{ x: settleX, y: settleY }}
    >
      <WordButton
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={handleClick}
        $selected={isSelected}
        $length={lengthCategory}
        $layout={layoutCategory}
        $isDragging={isDragging}
        disabled={disabled}
        layout={false}
        initial={false}
        animate={feedbackAnimation.animate}
        transition={feedbackAnimation.transition}
        onAnimationStart={() => logWordAnimation("start")}
        onAnimationComplete={() => logWordAnimation("complete")}
        data-dragging={isDragging ? "true" : undefined}
        style={buttonCursor ? { cursor: buttonCursor } : undefined}
      >
        {card.label}
      </WordButton>
    </WordItem>
  );
};
const WordGrid = ({
  words,
  selectedWordIds,
  onToggleWord,
  onReorderWords,
  wordFeedback,
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
    [handleClearLayoutLock, handleClearPendingSettle, pendingDragSettle],
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
            $color={category.color}
            layout
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: [0.95, 1.15, 1] }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{
              delay: 0.08,
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              scale: { times: [0, 0.55, 1] },
            }}
          >
            <SolvedCategoryTitle>{category.title}</SolvedCategoryTitle>
            <SolvedCategoryWords>
              {category.words.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </SolvedCategoryWords>
          </SolvedCategoryTile>
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
          const isLayoutLocked = Boolean(
            (layoutLockedWordId && layoutLockedWordId === card.id) ||
              (pendingDragSettle && pendingDragSettle.fromWordId === card.id) ||
              (activeSettleDelta && activeSettleDelta.wordId === card.id),
          );

          return (
            <DraggableWordTile
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
              isLayoutLocked={isLayoutLocked}
              onSettleDeltaConsumed={handleTileSettleConsumed}
            />
          );
        })}
      </WordList>
    </Grid>
  );
};

export default WordGrid;
