export const HOP_TIMING = {
  staggerMs: 70,
  hopDurationMs: 260,
  hopToIdlePaddingMs: 120,
  hopToSolvedPaddingMs: 140,
  solvedRevealPaddingMs: 420 + 160,
} as const;

export const computeRevealDelay = (hopCompletionMs: number) =>
  hopCompletionMs + HOP_TIMING.solvedRevealPaddingMs;
