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
