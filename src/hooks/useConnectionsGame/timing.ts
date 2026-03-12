import { isE2ENoMotionEnabled } from "../../game/e2eRuntime";

const withMotionScale = (value: number) =>
  isE2ENoMotionEnabled() ? 0 : value;

export const HOP_TIMING = {
  staggerMs: withMotionScale(70),
  hopDurationMs: withMotionScale(260),
  hopToShakePaddingMs: withMotionScale(120),
  hopToSolvedPaddingMs: withMotionScale(140),
  shakeDurationMs: withMotionScale(220),
  solvedRevealPaddingMs: withMotionScale(420 + 160),
} as const;

export const computeRevealDelay = (hopCompletionMs: number) =>
  hopCompletionMs + HOP_TIMING.solvedRevealPaddingMs;
