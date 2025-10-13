import type { CategoryColor } from "../data/puzzles";

export type GameStatus = "playing" | "won" | "lost";

export interface WordCard {
  id: string;
  label: string;
  categoryId: string;
  color: CategoryColor;
}
