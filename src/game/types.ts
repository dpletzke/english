import type { CategoryColor, CategoryDefinition } from '../data/puzzles'

export type GameStatus = 'playing' | 'won' | 'lost'

export interface WordCard {
  id: string
  label: string
  categoryId: string
  color: CategoryColor
}

export type GuessFeedback =
  | { type: 'correct'; category: CategoryDefinition }
  | { type: 'incorrect'; remaining: number }
