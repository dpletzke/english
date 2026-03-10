const PUZZLE_PROGRESS_STORAGE_KEY = "connectionsPuzzleProgress.v1";
export const PUZZLE_PROGRESS_UPDATED_EVENT = "connections-puzzle-progress-updated";

export type PuzzleResult = "won" | "lost";

interface PuzzleProgressSnapshot {
  resultsByDateKey: Record<string, PuzzleResult>;
}

const isBrowser = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeResultsByDateKey = (
  input: unknown,
): Record<string, PuzzleResult> => {
  if (!input || typeof input !== "object") {
    return {};
  }

  return Object.entries(input as Record<string, unknown>).reduce<
    Record<string, PuzzleResult>
  >((acc, [dateKey, result]) => {
    if (result === "won" || result === "lost") {
      acc[dateKey] = result;
    }
    return acc;
  }, {});
};

const normalizeDateKeys = (dateKeys: unknown): string[] => {
  if (!Array.isArray(dateKeys)) {
    return [];
  }
  return [...new Set(dateKeys.filter((entry) => typeof entry === "string"))];
};

const readSnapshot = (): PuzzleProgressSnapshot => {
  if (!isBrowser()) {
    return { resultsByDateKey: {} };
  }

  const raw = window.localStorage.getItem(PUZZLE_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return { resultsByDateKey: {} };
  }

  try {
    const parsed = JSON.parse(raw) as {
      solvedDateKeys?: unknown;
      resultsByDateKey?: unknown;
    };
    const resultsByDateKey = normalizeResultsByDateKey(parsed.resultsByDateKey);
    const solvedDateKeys = normalizeDateKeys(parsed.solvedDateKeys);
    solvedDateKeys.forEach((dateKey) => {
      if (!resultsByDateKey[dateKey]) {
        resultsByDateKey[dateKey] = "won";
      }
    });

    return {
      resultsByDateKey,
    };
  } catch {
    return { resultsByDateKey: {} };
  }
};

const writeSnapshot = (snapshot: PuzzleProgressSnapshot): void => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    PUZZLE_PROGRESS_STORAGE_KEY,
    JSON.stringify(snapshot),
  );
  window.dispatchEvent(new Event(PUZZLE_PROGRESS_UPDATED_EVENT));
};

export const hasPuzzleBeenSolved = (dateKey: string): boolean => {
  if (!dateKey) {
    return false;
  }
  return readSnapshot().resultsByDateKey[dateKey] === "won";
};

export const hasPuzzleBeenLost = (dateKey: string): boolean => {
  if (!dateKey) {
    return false;
  }
  return readSnapshot().resultsByDateKey[dateKey] === "lost";
};

export const getPuzzleResult = (dateKey: string): PuzzleResult | null => {
  if (!dateKey) {
    return null;
  }
  return readSnapshot().resultsByDateKey[dateKey] ?? null;
};

const markPuzzleResult = (dateKey: string, result: PuzzleResult): void => {
  if (!dateKey) {
    return;
  }
  const snapshot = readSnapshot();
  const existingResult = snapshot.resultsByDateKey[dateKey];

  if (existingResult === "won") {
    return;
  }
  if (existingResult === result) {
    return;
  }

  writeSnapshot({
    resultsByDateKey: {
      ...snapshot.resultsByDateKey,
      [dateKey]: result,
    },
  });
};

export const markPuzzleSolved = (dateKey: string): void => {
  markPuzzleResult(dateKey, "won");
};

export const markPuzzleLost = (dateKey: string): void => {
  markPuzzleResult(dateKey, "lost");
};

export const getSolvedPuzzleDateKeys = (): string[] =>
  Object.entries(readSnapshot().resultsByDateKey)
    .filter(([, result]) => result === "won")
    .map(([dateKey]) => dateKey)
    .sort();
