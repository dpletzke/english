import { useCallback, useEffect, useState } from "react";
import type {
  DragSettleDelta,
  DragSettleSnapshot,
  WordGridDragConfig,
} from "../../game/dragTypes";

interface UseWordSettleResult {
  reportDragSettle: (snapshot: DragSettleSnapshot | null) => void;
  consumeSettleDelta: () => void;
  isCardLayoutLocked: (cardId: string) => boolean;
  settleDeltaFor: (cardId: string) => DragSettleDelta | null;
}

export const useWordSettle = (
  dragConfig: WordGridDragConfig | null | undefined,
): UseWordSettleResult => {
  const [pendingDragSnapshot, setPendingDragSnapshot] =
    useState<DragSettleSnapshot | null>(null);
  const [activeSettleDelta, setActiveSettleDelta] =
    useState<DragSettleDelta | null>(null);

  const pendingDragSettle = dragConfig?.pendingDragSettle ?? null;
  const clearPendingDragSettle = dragConfig?.clearPendingDragSettle;
  const clearLayoutLockedWord = dragConfig?.clearLayoutLockedWord;

  const reportDragSettle = useCallback(
    (snapshot: DragSettleSnapshot | null) => {
      if (!clearPendingDragSettle || !clearLayoutLockedWord) {
        setPendingDragSnapshot(null);
        setActiveSettleDelta(null);
        return;
      }
      setPendingDragSnapshot(snapshot);
      if (!snapshot) {
        setActiveSettleDelta(null);
        clearPendingDragSettle();
        clearLayoutLockedWord();
      }
    },
    [clearLayoutLockedWord, clearPendingDragSettle],
  );

  const consumeSettleDelta = useCallback(() => {
    if (!clearLayoutLockedWord) {
      return;
    }
    if (activeSettleDelta) {
      setActiveSettleDelta(null);
    }
    clearLayoutLockedWord();
  }, [activeSettleDelta, clearLayoutLockedWord]);

  useEffect(() => {
    if (!dragConfig) {
      if (pendingDragSnapshot !== null) {
        setPendingDragSnapshot(null);
      }
      if (activeSettleDelta !== null) {
        setActiveSettleDelta(null);
      }
    }
  }, [dragConfig, pendingDragSnapshot, activeSettleDelta]);

  useEffect(() => {
    if (!pendingDragSettle || !clearPendingDragSettle) {
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
      recordedAt: now,
    };
    setActiveSettleDelta(settleDelta);
    setPendingDragSnapshot(null);
    clearPendingDragSettle();
  }, [
    clearPendingDragSettle,
    pendingDragSettle,
    pendingDragSnapshot,
  ]);

  const isCardLayoutLocked = useCallback(
    (cardId: string) => {
      if (!dragConfig) {
        return false;
      }
      if (dragConfig.layoutLockedWordId === cardId) {
        return true;
      }
      if (
        dragConfig.pendingDragSettle &&
        dragConfig.pendingDragSettle.fromWordId === cardId
      ) {
        return true;
      }
      if (activeSettleDelta && activeSettleDelta.wordId === cardId) {
        return true;
      }
      return false;
    },
    [activeSettleDelta, dragConfig],
  );

  const settleDeltaFor = useCallback(
    (cardId: string) => {
      if (!dragConfig || !activeSettleDelta) {
        return null;
      }
      return activeSettleDelta.wordId === cardId ? activeSettleDelta : null;
    },
    [activeSettleDelta, dragConfig],
  );

  return {
    reportDragSettle,
    consumeSettleDelta,
    isCardLayoutLocked,
    settleDeltaFor,
  };
};
