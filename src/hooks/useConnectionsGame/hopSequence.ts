import type { RefObject } from "react";
import type {
  WordCard,
  WordCardFeedbackStatus,
} from "../../game/types";
import { HOP_TIMING } from "./timing";
import {
  clearTimeoutCollection,
  scheduleManagedTimeout,
} from "./timeouts";

export interface HopSequenceResult {
  orderedIds: string[];
  hopDurationMs: number;
  settleDelayMs: number;
}

interface HopSequenceParams {
  ids: string[];
  availableWords: WordCard[];
  setFeedback: (ids: string[], status: WordCardFeedbackStatus) => void;
  hopTimeoutsRef: RefObject<number[]>;
  settleTimeoutsRef: RefObject<number[]>;
  settlePaddingMs: number;
  settleStatus?: WordCardFeedbackStatus;
}

const orderIdsByGridPosition = (ids: string[], availableWords: WordCard[]) =>
  [...ids].sort((a, b) => {
    const aIndex = availableWords.findIndex((card) => card.id === a);
    const bIndex = availableWords.findIndex((card) => card.id === b);
    return aIndex - bIndex;
  });

const hopDurationForCount = (count: number) =>
  count <= 0
    ? 0
    : (count - 1) * HOP_TIMING.staggerMs + HOP_TIMING.hopDurationMs;

export const runHopSequence = ({
  ids,
  availableWords,
  setFeedback,
  hopTimeoutsRef,
  settleTimeoutsRef,
  settlePaddingMs,
  settleStatus = "idle",
}: HopSequenceParams): HopSequenceResult => {
  clearTimeoutCollection(hopTimeoutsRef);
  clearTimeoutCollection(settleTimeoutsRef);

  if (ids.length === 0) {
    return {
      orderedIds: [],
      hopDurationMs: 0,
      settleDelayMs: settlePaddingMs,
    };
  }

  const orderedIds = orderIdsByGridPosition(ids, availableWords);

  orderedIds.forEach((id, index) => {
    const hopDelay = index * HOP_TIMING.staggerMs;
    scheduleManagedTimeout(hopTimeoutsRef, () => {
      setFeedback([id], "hop");
    }, hopDelay);
  });

  const hopDurationMs = hopDurationForCount(orderedIds.length);
  const settleDelayMs = hopDurationMs + settlePaddingMs;

  scheduleManagedTimeout(settleTimeoutsRef, () => {
    setFeedback(orderedIds, settleStatus);
  }, settleDelayMs);

  return { orderedIds, hopDurationMs, settleDelayMs };
};
