export const HOP_TIMING = {
  staggerMs: 70,
  hopDurationMs: 260,
  hopToIdlePaddingMs: 120,
  hopToLiftPaddingMs: 140,
  liftDurationMs: 420,
  liftToRevealPaddingMs: 160,
} as const;

export const computeRevealDelay = (hopCompletionMs: number) =>
  hopCompletionMs +
  HOP_TIMING.liftDurationMs +
  HOP_TIMING.liftToRevealPaddingMs;

