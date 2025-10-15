import styled from "styled-components";

interface StatusBarProps {
  mistakesAllowed: number;
  mistakesRemaining: number;
  solvedCount: number;
  totalCategories: number;
}

const StatusBar = ({ mistakesAllowed, mistakesRemaining }: StatusBarProps) => (
  <Container>
    <MistakeTrack>
      {Array.from({ length: mistakesAllowed }).map((_, index) => {
        const pipActive = index < mistakesRemaining;
        return <MistakePip key={index} $active={pipActive} />;
      })}
    </MistakeTrack>
  </Container>
);

const Container = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
`;

const MistakeTrack = styled.div`
  display: flex;
  gap: 8px;
`;

const MistakePip = styled.span<{ $active: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #1f1f1f;
  background: ${({ $active }) => ($active ? "#f15c5c" : "#e4dfd3")};
`;

export default StatusBar;
