import { AnimatePresence, Reorder } from "framer-motion";
import styled from "styled-components";
import type { CategoryDefinition } from "../../data/puzzles";
import type {
  WordCard,
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../../game/types";
import { SolvedCategoryTile } from "./SolvedCategoryTile";
import { WordTile } from "./WordTile";
import { CARD_FEEDBACK_ANIMATIONS } from "./animations";
import type { WordGridDragConfig } from "./WordGrid.types";
import { useWordSettle } from "./useWordSettle";

interface WordGridProps {
  words: WordCard[];
  selectedWordIds: string[];
  onToggleWord: (wordId: string) => void;
  onReorderWords?: (nextOrder: WordCard[]) => void;
  wordFeedback?: WordCardFeedbackMap;
  solvedCategories: CategoryDefinition[];
  disabled?: boolean;
  dragConfig?: WordGridDragConfig;
}

const Grid = styled.div`
  --grid-max-size: max(0px, min(520px, calc(100vh - 320px)));
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  width: min(100%, var(--grid-max-size));
  max-width: 520px;
  aspect-ratio: 1;
  margin: 0 auto;
`;

const WordList = styled(Reorder.Group)`
  display: contents;
`;

const WordGrid = ({
  words,
  selectedWordIds,
  onToggleWord,
  onReorderWords,
  solvedCategories,
  disabled = false,
  wordFeedback,
  dragConfig,
}: WordGridProps) => {
  const draggingWordId = dragConfig?.draggingWordId ?? null;
  const dragTargetWordId = dragConfig?.dragTargetWordId ?? null;
  const isDragLocked = dragConfig?.isDragLocked ?? false;
  const feedbackMap = wordFeedback ?? {};
  const dragEnabled = Boolean(dragConfig);
  const {
    reportDragSettle,
    consumeSettleDelta,
    isCardLayoutLocked,
    settleDeltaFor,
  } = useWordSettle(dragConfig);

  const handleReorder = (order: unknown[]) => {
    if (onReorderWords) {
      onReorderWords(order as WordCard[]);
    }
  };

  return (
    <Grid>
      <AnimatePresence>
        {solvedCategories.map((category) => (
          <SolvedCategoryTile
            key={`solved-${category.id}`}
            category={category}
          />
        ))}
      </AnimatePresence>
      <WordList
        axis="y"
        values={words}
        onReorder={handleReorder}
        layoutScroll
      >
        {words.map((card) => {
          const feedbackStatus: WordCardFeedbackStatus =
            feedbackMap[card.id] ?? "idle";
          const animation = CARD_FEEDBACK_ANIMATIONS[feedbackStatus];

          return (
            <WordTile
              key={card.id}
              card={card}
              isSelected={selectedWordIds.includes(card.id)}
              disabled={disabled}
              feedbackAnimation={animation}
              draggingWordId={draggingWordId}
              dragTargetWordId={dragTargetWordId}
              isDragLocked={isDragLocked}
              dragEnabled={dragEnabled}
              onToggleWord={onToggleWord}
              onWordDragStart={dragConfig?.onWordDragStart}
              onWordDragMove={dragConfig?.onWordDragMove}
              onWordDragEnd={dragConfig?.onWordDragEnd}
              reportDragSettle={reportDragSettle}
              settleDelta={settleDeltaFor(card.id)}
              isLayoutLocked={isCardLayoutLocked(card.id)}
              onSettleDeltaConsumed={consumeSettleDelta}
            />
          );
        })}
      </WordList>
    </Grid>
  );
};

export default WordGrid;
