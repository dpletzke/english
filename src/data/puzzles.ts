export type CategoryColor = 'yellow' | 'green' | 'blue' | 'purple'

export interface CategoryDefinition {
  id: string
  title: string
  words: string[]
  color: CategoryColor
}

export interface ConnectionsPuzzle {
  date: string
  categories: CategoryDefinition[]
  mistakesAllowed?: number
}

const puzzlesByDate: Record<string, ConnectionsPuzzle> = {
  '2024-10-07': {
    date: '2024-10-07',
    mistakesAllowed: 4,
    categories: [
      {
        id: 'cooking-verbs',
        title: 'Cooking actions',
        color: 'yellow',
        words: ['BAKE', 'BOIL', 'CHOP', 'STIR'],
      },
      {
        id: 'kinds-of-house',
        title: 'Words before "house"',
        color: 'green',
        words: ['TREE', 'DOG', 'WARE', 'LIGHT'],
      },
      {
        id: 'social-groups',
        title: 'Assemblies of people',
        color: 'blue',
        words: ['PACK', 'CLUB', 'BAND', 'SET'],
      },
      {
        id: 'things-with-blades',
        title: 'Things with blades',
        color: 'purple',
        words: ['FAN', 'SAW', 'SWORD', 'KNIFE'],
      },
    ],
  },
  '2024-10-08': {
    date: '2024-10-08',
    mistakesAllowed: 4,
    categories: [
      {
        id: 'seasons',
        title: 'Seasons of the year',
        color: 'yellow',
        words: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'],
      },
      {
        id: 'months',
        title: 'Calendar months',
        color: 'green',
        words: ['MARCH', 'MAY', 'AUGUST', 'JUNE'],
      },
      {
        id: 'music-terms',
        title: 'Musical concepts',
        color: 'blue',
        words: ['PITCH', 'TONE', 'KEY', 'SCALE'],
      },
      {
        id: 'classic-toys',
        title: 'Classic toys',
        color: 'purple',
        words: ['SLINKY', 'YOYO', 'TOP', 'KITE'],
      },
    ],
  },
}

const puzzleKeys = Object.keys(puzzlesByDate).sort()

export interface PuzzleSelection {
  key: string
  puzzle: ConnectionsPuzzle
}

const ensureDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const selectPuzzleForDate = (date: Date): PuzzleSelection => {
  const targetKey = ensureDateKey(date)
  if (puzzlesByDate[targetKey]) {
    return { key: targetKey, puzzle: puzzlesByDate[targetKey] }
  }

  let chosenKey = puzzleKeys[0]
  for (const key of puzzleKeys) {
    if (key <= targetKey) {
      chosenKey = key
    }
  }

  return { key: chosenKey, puzzle: puzzlesByDate[chosenKey] }
}

export const formatPuzzleDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-').map((segment) => Number(segment))
  const parsed = new Date(year, month - 1, day)
  return parsed.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export const colorSwatches: Record<CategoryColor, string> = {
  yellow: '#f9df6d',
  green: '#a0cc78',
  blue: '#90b6f8',
  purple: '#d28cf7',
}

export const colorTextOverrides: Partial<Record<CategoryColor, string>> = {
  yellow: '#332500',
  green: '#173000',
}

export const getPuzzlesIndex = () => puzzleKeys.slice()
