import {
  AnimatePresence,
  Reorder,
  motion,
  type Transition,
} from "framer-motion";
import styled from "styled-components";
import type { CategoryDefinition } from "../../data/puzzles";
import { colorSwatches, colorTextOverrides } from "../../data/puzzles";
import type {
  WordCard,
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../../game/types";
import { WordButton } from "./WordButton";

interface WordGridProps {
  words: WordCard[];
  selectedWordIds: string[];
  onToggleWord: (wordId: string) => void;
  onReorderWords?: (nextOrder: WordCard[]) => void;
  wordFeedback?: WordCardFeedbackMap;
  solvedCategories: CategoryDefinition[];
  disabled?: boolean;
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

const SolvedCategoryTile = styled(motion.article)<{
  $color: CategoryDefinition["color"];
}>`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  height: 100%;
  border-radius: 12px;
  border: 3px solid rgba(0, 0, 0, 0.08);
  background: ${({ $color }) => colorSwatches[$color]};
  color: ${({ $color }) => colorTextOverrides[$color] ?? "#1f1f1f"};
  padding: 12px 16px;
  text-align: center;
`;

const SolvedCategoryTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
`;

const SolvedCategoryWords = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const WordList = styled(Reorder.Group)`
  display: contents;
`;

const WordItem = styled(Reorder.Item)`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
`;

const getLengthCategory = (label: string): "short" | "medium" | "long" => {
  const condensedLength = label.replace(/\s+/g, "").length;
  if (condensedLength >= 11) {
    return "long";
  }
  if (condensedLength >= 7) {
    return "medium";
  }
  return "short";
};

const getLayoutCategory = (label: string): "single" | "double" =>
  label.trim().split(/\s+/).length === 2 ? "double" : "single";

const noopReorder: (nextOrder: WordCard[]) => void = () => {
  /* no-op */
};

type CardFeedbackAnimation = {
  animate: {
    x?: number | number[];
    y?: number | number[];
    scale: number | number[];
  };
  transition: Transition;
};

const hopKeyframes: number[] = [0, -18, 0];
const hopTransition: Transition = {
  duration: 0.24,
  ease: [0.33, 1, 0.68, 1],
  times: [0, 0.5, 1],
};

const idleTransition: Transition = { duration: 0.18 };

const shakeKeyframes: number[] = [0, -21, 21, -14, 14, -7, 7, 0];
const shakeTransition: Transition = {
  duration: 0.22,
  ease: "easeInOut",
  times: [0, 0.18, 0.36, 0.54, 0.72, 0.86, 0.93, 1],
};

const cardFeedbackAnimations: Record<
  WordCardFeedbackStatus,
  CardFeedbackAnimation
> = {
  idle: {
    animate: { x: 0, y: 0, scale: 1 },
    transition: idleTransition,
  },
  hop: {
    animate: { x: 0, y: hopKeyframes, scale: 1 },
    transition: hopTransition,
  },
  shake: {
    animate: { x: shakeKeyframes, y: 0, scale: 1 },
    transition: shakeTransition,
  },
};

const WordGrid = ({
  words,
  selectedWordIds,
  onToggleWord,
  onReorderWords,
  wordFeedback,
  solvedCategories,
  disabled = false,
}: WordGridProps) => {
  const handleReorder = onReorderWords ?? noopReorder;
  const feedbackMap = wordFeedback ?? {};

  return (
    <Grid>
      <AnimatePresence>
        {solvedCategories.map((category) => (
          <SolvedCategoryTile
            key={`solved-${category.id}`}
            $color={category.color}
            layout
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: [0.95, 1.15, 1] }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{
              delay: 0.08,
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
              scale: { times: [0, 0.55, 1] },
            }}
          >
            <SolvedCategoryTitle>{category.title}</SolvedCategoryTitle>
            <SolvedCategoryWords>
              {category.words.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </SolvedCategoryWords>
          </SolvedCategoryTile>
        ))}
      </AnimatePresence>
      <WordList
        axis="y"
        values={words}
        onReorder={(order) => handleReorder(order as WordCard[])}
        layoutScroll
      >
        {words.map((card) => {
          const feedbackStatus: WordCardFeedbackStatus =
            feedbackMap[card.id] ?? "idle";
          const animation = cardFeedbackAnimations[feedbackStatus];

          return (
            <WordItem
              key={card.id}
              value={card}
              layoutId={card.id}
              transition={{
                layout: { duration: 0.4, ease: "easeInOut" },
                opacity: { duration: 0.18 },
                scale: { duration: 0.18 },
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              drag={false}
            >
              <WordButton
                type="button"
                onClick={() => onToggleWord(card.id)}
                $selected={selectedWordIds.includes(card.id)}
                $length={getLengthCategory(card.label)}
                $layout={getLayoutCategory(card.label)}
                disabled={disabled}
                layout
                initial={false}
                animate={animation.animate}
                transition={animation.transition}
              >
                {card.label}
              </WordButton>
            </WordItem>
          );
        })}
      </WordList>
    </Grid>
  );
};

export default WordGrid;
