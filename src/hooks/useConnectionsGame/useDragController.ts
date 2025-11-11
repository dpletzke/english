import { useCallback, useMemo, useState } from "react";
import type { DragSettleRequest } from "../../game/dragTypes";

export interface DragControllerState {
  draggingWordId: string | null;
  dragTargetWordId: string | null;
  isDragLockedAnim: boolean;
  pendingDragSettle: DragSettleRequest | null;
  layoutLockedWordId: string | null;
  startDragAnim: (wordId: string) => void;
  moveDragAnim: (targetWordId: string | null) => void;
  endDragAnim: () => void;
  clearPendingDragSettle: () => void;
  clearLayoutLockedWord: () => void;
}

interface UseDragControllerArgs {
  swapWordCards: (fromWordId: string, toWordId: string) => void;
}

export const useDragController = ({
  swapWordCards,
}: UseDragControllerArgs) => {
  const [draggingWordId, setDraggingWordId] = useState<string | null>(null);
  const [dragTargetWordId, setDragTargetWordId] = useState<string | null>(null);
  const [pendingDragSettle, setPendingDragSettle] =
    useState<DragSettleRequest | null>(null);
  const [layoutLockedWordId, setLayoutLockedWordId] =
    useState<string | null>(null);

  const startDragAnim = useCallback((wordId: string) => {
    setDraggingWordId(wordId);
    setDragTargetWordId(null);
  }, []);

  const moveDragAnim = useCallback(
    (targetWordId: string | null) => {
      if (!draggingWordId) {
        return;
      }
      if (!targetWordId || draggingWordId === targetWordId) {
        setDragTargetWordId(null);
        setLayoutLockedWordId(null);
        return;
      }
      setLayoutLockedWordId((prev) => {
        if (prev === draggingWordId) {
          return prev;
        }
        return draggingWordId;
      });
      setDragTargetWordId(targetWordId);
    },
    [draggingWordId],
  );

  const endDragAnim = useCallback(() => {
    if (draggingWordId && dragTargetWordId) {
      const settleRequest: DragSettleRequest = {
        fromWordId: draggingWordId,
        toWordId: dragTargetWordId,
      };
      setLayoutLockedWordId(draggingWordId);
      setPendingDragSettle(settleRequest);
      swapWordCards(draggingWordId, dragTargetWordId);
    }
    setDraggingWordId(null);
    setDragTargetWordId(null);
  }, [dragTargetWordId, draggingWordId, swapWordCards]);

  const clearPendingDragSettle = useCallback(
    () => setPendingDragSettle(null),
    [],
  );
  const clearLayoutLockedWord = useCallback(
    () => setLayoutLockedWordId(null),
    [],
  );

  const dragState = useMemo<DragControllerState>(
    () => ({
      draggingWordId,
      dragTargetWordId,
      isDragLockedAnim: Boolean(
        draggingWordId || layoutLockedWordId || pendingDragSettle,
      ),
      pendingDragSettle,
      layoutLockedWordId,
      startDragAnim,
      moveDragAnim,
      endDragAnim,
      clearPendingDragSettle,
      clearLayoutLockedWord,
    }),
    [
      clearLayoutLockedWord,
      clearPendingDragSettle,
      dragTargetWordId,
      draggingWordId,
      endDragAnim,
      layoutLockedWordId,
      moveDragAnim,
      pendingDragSettle,
      startDragAnim,
    ],
  );

  const resetDragContext = useCallback(() => {
    setDraggingWordId(null);
    setDragTargetWordId(null);
    setPendingDragSettle(null);
    setLayoutLockedWordId(null);
  }, []);

  return {
    dragState,
    resetDragContext,
  };
};
