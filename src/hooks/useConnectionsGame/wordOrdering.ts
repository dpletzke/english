import type { WordCard } from "../../game/types";

export const reorderWordsWithSolvedFirst = (
  words: WordCard[],
  solvedWordIds: string[],
): WordCard[] => {
  if (solvedWordIds.length === 0) {
    return [...words];
  }
  const solvedSet = new Set(solvedWordIds);
  return [...words].sort((a, b) => {
    const aSolved = solvedSet.has(a.id);
    const bSolved = solvedSet.has(b.id);
    if (aSolved === bSolved) {
      return 0;
    }
    return aSolved ? -1 : 1;
  });
};
