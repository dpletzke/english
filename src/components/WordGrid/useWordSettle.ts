import { useCallback, useEffect, useState } from "react";
import type {
  DragSettleDelta,
  DragSettleRequest,
  DragSettleSnapshot,
} from "./WordGrid.types";

interface UseWordSettleParams {
  pendingDragSettle: DragSettleRequest | null;
  clearPendingDragSettle: () => void;
  clearLayoutLockedWord: () => void;
  onSettleDeltaConsumed: (requestId: number) => void;
}

interface UseWordSettleResult {
  activeSettleDelta: DragSettleDelta | null;
  reportDragSettle: (snapshot: DragSettleSnapshot | null) => void;
  handleTileSettleConsumed: (requestId: number) => void;
}

export const useWordSettle = ({
  pendingDragSettle,
  clearPendingDragSettle,
  clearLayoutLockedWord,
  onSettleDeltaConsumed,
}: UseWordSettleParams): UseWordSettleResult => {
  const [pendingDragSnapshot, setPendingDragSnapshot] =
    useState<DragSettleSnapshot | null>(null);
  const [activeSettleDelta, setActiveSettleDelta] =
    useState<DragSettleDelta | null>(null);

  const reportDragSettle = useCallback(
    (snapshot: DragSettleSnapshot | null) => {
      setPendingDragSnapshot(snapshot);
      if (!snapshot) {
        setActiveSettleDelta(null);
        clearPendingDragSettle();
        clearLayoutLockedWord();
      }
    },
    [clearLayoutLockedWord, clearPendingDragSettle],
  );

  const handleTileSettleConsumed = useCallback(
    (requestId: number) => {
      if (activeSettleDelta && activeSettleDelta.requestId === requestId) {
        setActiveSettleDelta(null);
      }
      onSettleDeltaConsumed(requestId);
      clearLayoutLockedWord();
    },
    [activeSettleDelta, clearLayoutLockedWord, onSettleDeltaConsumed],
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
    clearPendingDragSettle();
  }, [clearPendingDragSettle, pendingDragSettle, pendingDragSnapshot]);

  return {
    activeSettleDelta,
    reportDragSettle,
    handleTileSettleConsumed,
  };
};
