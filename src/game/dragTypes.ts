export type DragSettleRequest = {
  fromWordId: string;
  toWordId: string;
  requestId: number;
};

export type DragSettleSnapshot = {
  fromWordId: string;
  toWordId: string;
  fromRect: DOMRect;
  toRect: DOMRect;
  recordedAt: number;
};

export type DragSettleDelta = {
  wordId: string;
  deltaX: number;
  deltaY: number;
  requestId: number;
  recordedAt: number;
};

export interface WordGridDragConfig {
  draggingWordId: string | null;
  dragTargetWordId: string | null;
  isDragLocked: boolean;
  onWordDragStart: (wordId: string) => void;
  onWordDragMove: (targetWordId: string | null) => void;
  onWordDragEnd: () => void;
  pendingDragSettle: DragSettleRequest | null;
  clearPendingDragSettle: () => void;
  onSettleDeltaConsumed?: (requestId: number) => void;
  layoutLockedWordId: string | null;
  clearLayoutLockedWord: () => void;
}
