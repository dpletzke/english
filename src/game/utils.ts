import type {
  CategoryColor,
  CategoryDefinition,
  ConnectionsPuzzle,
} from "../data/puzzles";
import type { WordCard } from "./types";

export const colorOrder: CategoryColor[] = [
  "yellow",
  "green",
  "blue",
  "purple",
];

export const prepareWordCards = (puzzle: ConnectionsPuzzle): WordCard[] => {
  const cards = puzzle.categories.flatMap((category) =>
    category.words.map((word, index) => ({
      id: `${category.id}-${index}`,
      label: word,
      categoryId: category.id,
      color: category.color,
    })),
  );

  const startingOrder = puzzle.startGrid;
  if (!startingOrder?.length) {
    return cards;
  }

  const cardByLabel = new Map(cards.map((card) => [card.label, card]));
  const orderedCards: WordCard[] = [];

  startingOrder.forEach((word) => {
    const card = cardByLabel.get(word);
    if (card) {
      orderedCards.push(card);
      cardByLabel.delete(word);
    }
  });

  if (cardByLabel.size > 0) {
    orderedCards.push(...cardByLabel.values());
  }

  return orderedCards;
};

export const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const orderedCategories = (categories: CategoryDefinition[]) =>
  [...categories].sort((a, b) => {
    const colorRank = colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color);
    if (colorRank !== 0) {
      return colorRank;
    }
    return a.title.localeCompare(b.title);
  });
