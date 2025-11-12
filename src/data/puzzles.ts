import localPuzzlesJson from "./puzzles.json" assert { type: "json" };

export type CategoryColor = "yellow" | "green" | "blue" | "purple";

export interface CategoryDefinition {
  id: string;
  title: string;
  words: string[];
  color: CategoryColor;
}

export interface ConnectionsPuzzle {
  date: string;
  categories: CategoryDefinition[];
  startGrid?: string[];
}

const ensureDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sanitizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const getPuzzlesBaseUrl = (): string => {
  const { MODE, VITE_PUZZLES_URL_DEV, VITE_PUZZLES_URL_PROD } = import.meta.env;
  const baseUrl: string =
    {
      production: VITE_PUZZLES_URL_PROD,
      development: VITE_PUZZLES_URL_DEV,
    }[MODE] || "";

  if (!baseUrl) {
    throw new Error(
      "Missing puzzle bucket URL. Set VITE_PUZZLES_URL_DEV/PROD.",
    );
  }

  return sanitizeBaseUrl(baseUrl);
};

const localPuzzlesByDate = localPuzzlesJson as Record<
  string,
  ConnectionsPuzzle
>;
const localPuzzleKeys = Object.keys(localPuzzlesByDate).sort();

const selectFallbackPuzzle = (
  dateKey: string,
): ConnectionsPuzzle | undefined => {
  if (localPuzzlesByDate[dateKey]) {
    return localPuzzlesByDate[dateKey];
  }

  let chosenKey: string | undefined;
  for (const key of localPuzzleKeys) {
    if (key <= dateKey) {
      chosenKey = key;
    }
  }

  return chosenKey ? localPuzzlesByDate[chosenKey] : undefined;
};

const puzzleRequestCache = new Map<string, Promise<ConnectionsPuzzle>>();

const requestPuzzle = async (dateKey: string): Promise<ConnectionsPuzzle> => {
  try {
    const baseUrl = getPuzzlesBaseUrl();
    const response = await fetch(`${baseUrl}/puzzles/${dateKey}.json`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch puzzle for ${dateKey} (${response.status})`,
      );
    }

    const puzzle = (await response.json()) as ConnectionsPuzzle;
    if (!Array.isArray(puzzle.categories)) {
      throw new Error("Invalid puzzle payload: missing categories");
    }

    return { ...puzzle, date: puzzle.date ?? dateKey };
  } catch (error) {
    if (import.meta.env.MODE !== "production") {
      console.warn("Cloud puzzle not reached, loading local fallback", error);
      const fallbackPuzzle = selectFallbackPuzzle(dateKey);
      if (fallbackPuzzle) {
        return { ...fallbackPuzzle, date: fallbackPuzzle.date ?? dateKey };
      }
    }

    throw error;
  }
};

const getPuzzlePromise = (dateKey: string): Promise<ConnectionsPuzzle> => {
  if (!puzzleRequestCache.has(dateKey)) {
    const request = requestPuzzle(dateKey).catch((error) => {
      puzzleRequestCache.delete(dateKey);
      throw error;
    });
    puzzleRequestCache.set(dateKey, request);
  }

  return puzzleRequestCache.get(dateKey)!;
};

export const fetchPuzzleByDateKey = (
  dateKey: string,
): Promise<ConnectionsPuzzle> => getPuzzlePromise(dateKey);

export const fetchPuzzleForDate = (date: Date): Promise<ConnectionsPuzzle> =>
  getPuzzlePromise(ensureDateKey(date));

export const getPuzzleDateKey = ensureDateKey;

export const formatPuzzleDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey
    .split("-")
    .map((segment) => Number(segment));
  const parsed = new Date(year, month - 1, day);
  return parsed.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const colorSwatches: Record<CategoryColor, string> = {
  yellow: "#eee288",
  green: "#afc472",
  blue: "#bcc6ec",
  purple: "#af8ec3",
};

export const colorTextOverrides: Partial<Record<CategoryColor, string>> = {
  yellow: "#332500",
  green: "#173000",
};
