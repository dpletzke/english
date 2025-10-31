import { motion } from "framer-motion";
import styled from "styled-components";
import type { CategoryDefinition } from "../../data/puzzles";
import { colorSwatches, colorTextOverrides } from "../../data/puzzles";

interface SolvedCategoryTileProps {
  category: CategoryDefinition;
}

const Tile = styled(motion.article)<{ $color: CategoryDefinition["color"] }>`
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

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
`;

const WordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

export const SolvedCategoryTile = ({ category }: SolvedCategoryTileProps) => (
  <Tile
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
    <Title>{category.title.toUpperCase()}</Title>
    <WordList>
      {category.words.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </WordList>
  </Tile>
);
