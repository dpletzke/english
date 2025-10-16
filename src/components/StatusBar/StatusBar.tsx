import styled from "styled-components";

interface StatusBarProps {
  mistakesAllowed: number;
  mistakesRemaining: number;
}

const Container = styled.section`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Label = styled.p`
  display: flex;
  align-items: center;
  font-size: 15px;
`;

const MistakeTrack = styled.div`
  display: inline-flex;
  gap: 8px;
  transform: translateY(1px);
`;

const MistakePip = styled.span.attrs<{ $active: boolean }>(({ $active }) => ({
  role: "img",
  "aria-label": $active ? "mistake remaining" : "mistake used",
}))<{ $active: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(46, 39, 27, 0.4);
  background: ${({ $active }) => ($active ? "#e36363" : "rgba(255, 255, 255, 0.7)")};
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
