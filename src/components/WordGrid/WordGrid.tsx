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

type LengthCategory = "short" | "medium" | "long";
type WordLayoutCategory = "single" | "double";

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

const WordButton = styled(motion.button)<{
  $selected: boolean;
  $length: LengthCategory;
  $layout: WordLayoutCategory;
}>`
  width: 100%;
  height: 100%;
  border-radius: 12px;
  border: 3px solid ${({ $selected }) => ($selected ? "#1f1f1f" : "#c7c2b7")};
  background: ${({ $selected }) => ($selected ? "#1f1f1f" : "#e2dfcf")};
  color: ${({ $selected }) => ($selected ? "#fff" : "#1f1f1f")};
  font-size: ${({ $length, $layout }) => {
    if ($layout === "double") {
      return "clamp(11px, 1.9vh, 16px)";
    }
    switch ($length) {
      case "long":
        return "clamp(10px, 1.6vh, 14px)";
      case "medium":
        return "clamp(11px, 1.85vh, 15px)";
      default:
        return "clamp(12px, 2.2vh, 17px)";
    }
  }};
  font-weight: 700;
  letter-spacing: ${({ $length }) =>
    $length === "long" ? "0.18px" : "0.32px"};
  cursor: pointer;
  text-transform: uppercase;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    border-color 120ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-block: clamp(7px, 1.6vh, 12px);
  padding-inline: clamp(12px, 2.6vw, 22px);
  line-height: ${({ $layout }) => ($layout === "double" ? 1.15 : 1.08)};
  white-space: ${({ $layout }) => ($layout === "double" ? "normal" : "nowrap")};
  flex-wrap: ${({ $layout }) => ($layout === "double" ? "wrap" : "nowrap")};
  word-break: ${({ $layout }) =>
    $layout === "double" ? "break-word" : "normal"};
  overflow-wrap: ${({ $layout }) =>
    $layout === "double" ? "anywhere" : "normal"};
  hyphens: ${({ $layout }) => ($layout === "double" ? "auto" : "none")};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:not(:disabled):active {
    transform: translateY(1px);
  }

  &:not(:disabled):hover {
    box-shadow: ${({ $selected }) =>
      $selected
        ? "0 4px 8px rgba(0, 0, 0, 0.2)"
        : "0 4px 12px rgba(0, 0, 0, 0.1)"};
    border-color: ${({ $selected }) => ($selected ? "#1f1f1f" : "#a9a393")};
  }
`;

const getLengthCategory = (label: string): LengthCategory => {
  const condensedLength = label.replace(/\s+/g, "").length;
  if (condensedLength >= 11) {
    return "long";
  }
  if (condensedLength >= 7) {
    return "medium";
  }
  return "short";
};

const getLayoutCategory = (label: string): WordLayoutCategory => {
  return label.trim().split(/\s+/).length === 2 ? "double" : "single";
};

const noopReorder: (nextOrder: WordCard[]) => void = () => {
  /* no-op */
};

type FeedbackAnimation = {
  animate: { y: number | number[]; scale: number | number[] };
  transition: Transition;
};

const hopKeyframes: number[] = [0, -18, 0];
const hopTransition: Transition = {
  duration: 0.24,
  ease: [0.33, 1, 0.68, 1],
  times: [0, 0.5, 1],
};

const liftKeyframes: number[] = [0, -6, -26, -26];
const liftTransition: Transition = {
  duration: 0.6,
  ease: [0.18, 0.84, 0.26, 0.98],
  times: [0, 0.25, 0.7, 1],
};

const idleTransition: Transition = { duration: 0.18 };

const feedbackAnimations: Record<WordCardFeedbackStatus, FeedbackAnimation> = {
  idle: {
    animate: { y: 0, scale: 1 },
    transition: idleTransition,
  },
  hop: {
    animate: { y: hopKeyframes, scale: 1 },
    transition: hopTransition,
  },
  lift: {
    animate: { y: liftKeyframes, scale: 1 },
    transition: liftTransition,
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
          const animation = feedbackAnimations[feedbackStatus];

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
