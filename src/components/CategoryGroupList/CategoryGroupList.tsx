import styled from "styled-components";
import type { CategoryColor, CategoryDefinition } from "../../data/puzzles";
import { colorSwatches, colorTextOverrides } from "../../data/puzzles";

interface CategoryGroupListProps {
  categories: CategoryDefinition[];
  revealed?: boolean;
}

const Container = styled.section`
  display: grid;
  gap: 10px;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
`;

const GroupCard = styled.article<{ $color: CategoryColor; $revealed?: boolean }>`
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  background: ${({ $color }) => colorSwatches[$color]};
  color: ${({ $color }) => colorTextOverrides[$color] ?? "#1f1f1f"};
  opacity: ${({ $revealed }) => ($revealed ? 0.8 : 1)};
`;

const GroupTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
`;

const GroupWords = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const GroupWord = styled.span``;

const CategoryGroupList = ({
  categories,
  revealed = false,
}: CategoryGroupListProps) => (
  <Container>
    {categories.map((category) => (
      <GroupCard key={category.id} $color={category.color} $revealed={revealed}>
        <GroupTitle>{category.title}</GroupTitle>
        <GroupWords>
          {category.words.map((word) => (
            <GroupWord key={word}>{word}</GroupWord>
          ))}
        </GroupWords>
      </GroupCard>
    ))}
  </Container>
);

export default CategoryGroupList;
