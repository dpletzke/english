import styled from "styled-components";

interface StatusBarProps {
  mistakesAllowed: number;
  mistakesRemaining: number;
  solvedCount: number;
  totalCategories: number;
}

const Container = styled.section`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Label = styled.p`
  display: flex;
  align-items: center;
  line-height: 1;
  font-size: 14px;
`;

const MistakeTrack = styled.div`
  display: inline-flex;
  gap: 8px;
  transform: translateY(1px);
`;

const MistakePip = styled.span<{ $active: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #1f1f1f;
  background: ${({ $active }) => ($active ? "#f15c5c" : "#e4dfd3")};
`;

const StatusBar = ({ mistakesAllowed, mistakesRemaining }: StatusBarProps) => (
  <Container>
    <Label>Mistakes Remaining: </Label>
    <MistakeTrack>
      {Array.from({ length: mistakesAllowed }).map((_, index) => {
        const pipActive = index < mistakesRemaining;
        return <MistakePip key={index} $active={pipActive} />;
      })}
    </MistakeTrack>
  </Container>
);

export default StatusBar;
