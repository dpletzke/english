import puzzlesJson from "./puzzles.json" assert { type: "json" };

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
}

const puzzlesByDate = puzzlesJson as Record<string, ConnectionsPuzzle>;

const puzzleKeys = Object.keys(puzzlesByDate).sort();

export interface PuzzleSelection {
  key: string;
  puzzle: ConnectionsPuzzle;
}

const ensureDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const selectPuzzleForDate = (date: Date): PuzzleSelection => {
  const targetKey = ensureDateKey(date);
  if (puzzlesByDate[targetKey]) {
    return { key: targetKey, puzzle: puzzlesByDate[targetKey] };
  }

  let chosenKey = puzzleKeys[0];
  for (const key of puzzleKeys) {
    if (key <= targetKey) {
      chosenKey = key;
    }
  }

  return { key: chosenKey, puzzle: puzzlesByDate[chosenKey] };
};

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

export const getPuzzlesIndex = () => puzzleKeys.slice();
