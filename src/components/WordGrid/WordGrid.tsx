import styled from "styled-components";
import type { CategoryDefinition } from "../../data/puzzles";
import { colorSwatches, colorTextOverrides } from "../../data/puzzles";
import type { WordCard } from "../../game/types";

type LengthCategory = "short" | "medium" | "long";
type WordLayoutCategory = "single" | "double";

interface WordGridProps {
  words: WordCard[];
  selectedWordIds: string[];
  onToggleWord: (wordId: string) => void;
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

const SolvedCategoryTile = styled.article<{
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

const WordButton = styled.button<{
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
  letter-spacing: ${({ $length }) => ($length === "long" ? "0.18px" : "0.32px")};
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
  word-break: ${({ $layout }) => ($layout === "double" ? "break-word" : "normal")};
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

const WordGrid = ({
  words,
  selectedWordIds,
  onToggleWord,
  solvedCategories,
  disabled = false,
}: WordGridProps) => (
  <Grid>
    {solvedCategories.map((category) => (
      <SolvedCategoryTile key={`solved-${category.id}`} $color={category.color}>
        <SolvedCategoryTitle>{category.title}</SolvedCategoryTitle>
        <SolvedCategoryWords>
          {category.words.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </SolvedCategoryWords>
      </SolvedCategoryTile>
    ))}
    {words.map((card) => (
      <WordButton
        key={card.id}
        type="button"
        onClick={() => onToggleWord(card.id)}
        $selected={selectedWordIds.includes(card.id)}
        $length={getLengthCategory(card.label)}
        $layout={getLayoutCategory(card.label)}
        disabled={disabled}
      >
        {card.label}
      </WordButton>
    ))}
  </Grid>
);

export default WordGrid;
