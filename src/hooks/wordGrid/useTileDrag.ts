import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { type PanInfo, useDragControls } from "framer-motion";
import type { DragSettleSnapshot } from "../../game/dragTypes";

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

export type TileDragParams = {
  cardId: string;
  dragEnabled: boolean;
  disabled: boolean;
  isDragLocked: boolean;
  draggingWordId: string | null;
  dragTargetWordId: string | null;
  onWordDragStart?: (wordId: string) => void;
  onWordDragMove?: (targetWordId: string | null) => void;
  onWordDragEnd?: () => void;
  reportDragSettle: (snapshot: DragSettleSnapshot | null) => void;
};

export type TileDragHandlers = {
  itemRef: RefObject<HTMLDivElement | null>;
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

export const useTileDrag = ({
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
      onWordDragMove?.(nextTarget);
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
      onWordDragStart?.(cardId);
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
      onWordDragEnd?.();
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
