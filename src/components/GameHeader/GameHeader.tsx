import styled from "styled-components";

interface GameHeaderProps {
  title: string;
  subtitle: string;
}

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: clamp(2px, 1vw, 8px);
  align-items: center;
  text-align: center;
  width: 100%;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(22px, 6vw, 32px);
  letter-spacing: 1px;
`;

const Subtitle = styled.span`
  font-size: clamp(14px, 3.5vw, 16px);
  color: #5d5d5d;
`;

const GameHeader = ({ title, subtitle }: GameHeaderProps) => (
  <Header>
    <Title>{title}</Title>
    <Subtitle>{subtitle}</Subtitle>
  </Header>
);

export default GameHeader;
