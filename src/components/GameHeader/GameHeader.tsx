import styled from "styled-components";
import { CalendarDays } from "lucide-react";

interface GameHeaderProps {
  dateLabel: string;
  onOpenDatePicker: () => void;
  disabled?: boolean;
}

const Header = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 560px;
  min-height: 60px;
  padding: 8px 0;
  border-bottom: 1px solid #e3d5c5;
`;

const HeaderText = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
  text-align: center;
  justify-items: center;
`;

const Prompt = styled.p`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1f1f1f;
  line-height: 1.15;
`;

const DateText = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #594e3e;
  line-height: 1.2;
`;

const DateButton = styled.button`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  min-width: 48px;
  padding: 0;
  border-radius: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #3c2a1f;
  transition:
    transform 100ms ease,
    color 100ms ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(calc(-50% - 1px));
    color: #2f1f15;
  }

  &:focus-visible {
    outline: 3px solid #3f6fd1;
    outline-offset: 3px;
  }

  @media (min-width: 768px) {
    width: 56px;
    height: 56px;
    min-width: 56px;
  }
`;

const CalendarIcon = styled(CalendarDays)`
  width: 24px;
  height: 24px;
  color: #3c2a1f;

  @media (min-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const GameHeader = ({
  dateLabel,
  onOpenDatePicker,
  disabled,
}: GameHeaderProps) => (
  <Header>
    <HeaderText>
      <Prompt>Create four groups of four!</Prompt>
      <DateText>{dateLabel}</DateText>
    </HeaderText>
    <DateButton
      type="button"
      onClick={onOpenDatePicker}
      aria-label={`Choose puzzle date, currently ${dateLabel}`}
      disabled={disabled}
    >
      <CalendarIcon aria-hidden strokeWidth={2.25} />
    </DateButton>
  </Header>
);

export default GameHeader;
