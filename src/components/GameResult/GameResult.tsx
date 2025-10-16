import styled from "styled-components";
import type { GameStatus } from "../../game/types";

interface GameResultProps {
  status: GameStatus;
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  z-index: 20;
`;

const Dialog = styled.div<{ $status: GameStatus }>`
  width: min(520px, 100%);
  border-radius: 16px;
  background: ${({ $status }) => ($status === "won" ? "#dff8d8" : "#f7dfdf")};
  border: 1px solid
    ${({ $status }) => ($status === "won" ? "#68a663" : "#c26b6b")};
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.16);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
`;

const Description = styled.p`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
`;

const CloseButton = styled.button`
  align-self: center;
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  background: #1f1f1f;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition:
    opacity 120ms ease,
    transform 120ms ease;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    transform: translateY(1px);
  }
`;

const GameResult = ({ status, onClose }: GameResultProps) => {
  const isWin = status === "won";
  const title = isWin ? "Puzzle Solved!" : "Puzzle Over";
  const message = isWin
    ? "You solved today's puzzle — nice work!"
    : "You're out of mistakes. Here's the solution so you can review.";

  return (
    <Overlay role="presentation" aria-hidden="false">
      <Dialog
        $status={status}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-result-title"
        aria-describedby="game-result-message"
      >
        <Title id="game-result-title">{title}</Title>
        <Description id="game-result-message">{message}</Description>
        <CloseButton type="button" onClick={onClose}>
          Return to Puzzle
        </CloseButton>
      </Dialog>
    </Overlay>
  );
};

export default GameResult;
