import styled from "styled-components";

interface StatusBarProps {
  mistakesAllowed: number;
  mistakesRemaining: number;
}

const Container = styled.section`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Label = styled.p`
  display: flex;
  align-items: center;
  font-size: 0.9375rem;
`;

const MistakeTrack = styled.div`
  display: inline-flex;
  gap: 0.5rem;
  translate: 0 0.0625rem;
`;

const MistakePip = styled.span.attrs<{ $active: boolean }>(
  ({ $active }) => ({
    role: "img",
    "aria-label": $active ? "mistake remaining" : "mistake used",
    "data-state": $active ? "active" : "spent",
  }),
)<{ $active: boolean }>`
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  border: 1px solid rgba(46, 39, 27, 0.4);
  background: ${({ $active }) =>
    $active ? "var(--status-pip-active)" : "var(--status-pip-spent)"};
  transform: ${({ $active }) => ($active ? "scale(1)" : "scale(0.6)")};
  opacity: ${({ $active }) => ($active ? 1 : 0.4)};
  transition: transform 0.18s ease-out, opacity 0.18s ease-out,
    background-color 0.18s ease-out, border-color 0.18s ease-out;
  will-change: transform, opacity;
  transform-origin: center;

  @media (prefers-reduced-motion: reduce) {
    transform: scale(1);
    opacity: 1;
    transition: background-color 0.18s ease-out, border-color 0.18s ease-out;
    will-change: auto;
  }
`;

const StatusBar = ({ mistakesAllowed, mistakesRemaining }: StatusBarProps) => {
  return (
    <Container>
      <Label>Mistakes Remaining: </Label>
      <MistakeTrack>
        {Array.from({ length: mistakesAllowed }).map((_, index) => {
          const pipActive = index < mistakesRemaining;
          return (
            <MistakePip
              key={index}
              $active={pipActive}
            />
          );
        })}
      </MistakeTrack>
    </Container>
  );
};

export default StatusBar;
