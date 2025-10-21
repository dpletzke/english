export const HOP_TIMING = {
  staggerMs: 70,
  hopDurationMs: 260,
  hopToShakePaddingMs: 120,
  hopToSolvedPaddingMs: 140,
  shakeDurationMs: 220,
  solvedRevealPaddingMs: 420 + 160,
} as const;

export const computeRevealDelay = (hopCompletionMs: number) =>
  hopCompletionMs + HOP_TIMING.solvedRevealPaddingMs;
