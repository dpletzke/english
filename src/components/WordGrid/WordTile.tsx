import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Reorder,
  type PanInfo,
  type Transition,
  useDragControls,
  useMotionValue,
  animate,
} from "framer-motion";
import styled, { css } from "styled-components";
import type { WordCard } from "../../game/types";
import type {
  DragSettleDelta,
  DragSettleSnapshot,
} from "./WordGrid.types";
import { WordButton } from "./WordButton";

export type CardFeedbackAnimation = {
  animate: {
    x?: number | number[];
    y?: number | number[];
    scale: number | number[];
  };
  transition: Transition;
};

const LONG_PRESS_DELAY_MS = 200;
const POINTER_DRAG_THRESHOLD_PX = 6;

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
      cursor: ${$isDragging ? "grabbing" : "pointer"};
    `}
`;

type TileDragParams = {
  cardId: string;
  dragEnabled: boolean;
  disabled: boolean;
  isDragLocked: boolean;
  draggingWordId: string | null;
  dragTargetWordId: string | null;
  onWordDragStart: (wordId: string) => void;
  onWordDragMove: (targetWordId: string | null) => void;
  onWordDragEnd: () => void;
  reportDragSettle: (snapshot: DragSettleSnapshot | null) => void;
};

type TileDragHandlers = {
  itemRef: MutableRefObject<HTMLDivElement | null>;
  dragControls: ReturnType<typeof useDragControls>;
  handlePointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  handlePointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  handlePointerEnd: () => void;
  handleDrag: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => void;
  handleDragEnd: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
  isLockedOut: boolean;
  buttonCursor: string | undefined;
};

const useTileDrag = ({
  cardId,
  dragEnabled,
  disabled,
  isDragLocked,
  draggingWordId,
  dragTargetWordId,
  onWordDragStart,
  onWordDragMove,
  onWordDragEnd,
  reportDragSettle,
}: TileDragParams): TileDragHandlers => {
  const dragControls = useDragControls();
  const itemRef = useRef<HTMLDivElement | null>(null);
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

  const isDragging = draggingWordId === cardId && dragEnabled;
  const isDropTarget = dragTargetWordId === cardId && dragEnabled;
  const isLockedOut =
    dragEnabled &&
    isDragLocked &&
    draggingWordId !== null &&
    draggingWordId !== cardId;
  const buttonCursor = dragEnabled
    ? isDragging
      ? "grabbing"
      : isLockedOut
        ? "default"
        : "grab"
    : undefined;

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
      if (!dragEnabled || disabled) {
        return;
      }
      if (isDragLocked && draggingWordId !== cardId) {
        return;
      }
      clearLongPressTimer();
      onWordDragStart(cardId);
      isDraggingRef.current = true;
      pointerEvent.preventDefault();
      pointerEvent.stopPropagation();
      pendingPointerEventRef.current = null;
      requestAnimationFrame(() => {
        dragControls.start(pointerEvent, { snapToCursor: false });
      });
    },
    [
      cardId,
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
      if (isDragLocked && draggingWordId && draggingWordId !== cardId) {
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
      cardId,
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
      if (!dragEnabled || disabled || isDraggingRef.current) {
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
      const nextTarget = findWordIdAtPoint(info.point, cardId);
      reportDragMove(nextTarget);
    },
    [cardId, dragEnabled, reportDragMove],
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
            fromWordId: cardId,
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
    cardId,
    clearLongPressTimer,
    dragEnabled,
    onWordDragEnd,
    reportDragSettle,
  ]);

  useEffect(
    () => () => {
      clearLongPressTimer();
    },
    [clearLongPressTimer],
  );

  return {
    itemRef,
    dragControls,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleDrag,
    handleDragEnd,
    isDragging,
    isDropTarget,
    isLockedOut,
    buttonCursor,
  };
};

interface WordTileProps {
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

export const WordTile = ({
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
  isLayoutLocked,
}: WordTileProps) => {
  const {
    itemRef,
    dragControls,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleDrag,
    handleDragEnd,
    isDragging,
    isDropTarget,
    isLockedOut,
    buttonCursor,
  } = useTileDrag({
    cardId: card.id,
    dragEnabled,
    disabled,
    isDragLocked,
    draggingWordId,
    dragTargetWordId,
    onWordDragStart,
    onWordDragMove,
    onWordDragEnd,
    reportDragSettle,
  });

  const settleX = useMotionValue(0);
  const settleY = useMotionValue(0);
  const lastAnimatedRequestIdRef = useRef<number | null>(null);
  const activeAnimationXRef = useRef<ReturnType<typeof animate> | null>(null);
  const activeAnimationYRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    if (!settleDelta || settleDelta.wordId !== card.id) {
      return;
    }
    if (
      lastAnimatedRequestIdRef.current === settleDelta.requestId ||
      isDragging
    ) {
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

  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (isDragging) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      onToggleWord(card.id);
    },
    [card.id, isDragging, onToggleWord],
  );

  const lengthCategory = getLengthCategory(card.label);
  const layoutCategory = getLayoutCategory(card.label);
  const layoutProps = isLayoutLocked
    ? ({ layout: undefined } as const)
    : ({ layout: "position" as const, layoutId: card.id } as const);
  const dragMomentumEnabled = !isLayoutLocked;
  const dragTransition = isLayoutLocked
    ? { bounceDamping: 1, bounceStiffness: 0 }
    : undefined;

  return (
    <WordItem
      ref={itemRef}
      data-word-id={card.id}
      value={card}
      {...layoutProps}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        layout: { duration: 0.4, ease: "easeInOut" },
        opacity: { duration: 0.18 },
        scale: { duration: 0.18 },
      }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={dragMomentumEnabled}
      dragTransition={dragTransition}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
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
        data-dragging={isDragging ? "true" : undefined}
        style={buttonCursor ? { cursor: buttonCursor } : undefined}
      >
        {card.label}
      </WordButton>
    </WordItem>
  );
};
