import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Reorder, useMotionValue, animate } from "framer-motion";
import styled, { css } from "styled-components";
import type { WordCard } from "../../game/types";
import type { DragSettleDelta, DragSettleSnapshot } from "./WordGrid.types";
import { WordButton } from "./WordButton";
import type { CardFeedbackAnimation } from "./animations";
import { useTileDrag } from "./useTileDrag";

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
