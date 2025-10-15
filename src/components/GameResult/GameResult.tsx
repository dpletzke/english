import styled from "styled-components";
import type { GameStatus } from "../../game/types";

interface GameResultProps {
  status: GameStatus;
}

const Container = styled.div<{ $status: GameStatus }>`
  padding: 16px 18px;
  border-radius: 12px;
  background: ${({ $status }) => ($status === "won" ? "#dff8d8" : "#f7dfdf")};
  border: 1px solid ${({ $status }) => ($status === "won" ? "#68a663" : "#c26b6b")};
  font-weight: 600;
  text-align: center;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
`;

const GameResult = ({ status }: GameResultProps) => {
  const message =
    status === "won"
      ? "You solved today's puzzle!"
      : "You're out of mistakes. Here's the solution.";

  return <Container $status={status}>{message}</Container>;
};

export default GameResult;
