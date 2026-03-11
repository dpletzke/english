import styled from "styled-components";
import { CalendarDays, CircleHelp, Lightbulb } from "lucide-react";

interface GameHeaderProps {
  dateLabel: string;
  onOpenDatePicker: () => void;
  disabled?: boolean;
}

const Header = styled.header`
  display: block;
  width: 100%;
  max-width: 560px;
  min-height: 56px;
  padding: 8px 0;
  border-bottom: 1px solid #e3d5c5;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const DateText = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #594e3e;
  line-height: 1.2;
`;

const Actions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  padding: 0;
  border-radius: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #3c2a1f;
  transition: color 100ms ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    color: #2f1f15;
  }

  &:focus-visible {
    outline: 3px solid #3f6fd1;
    outline-offset: 3px;
  }

  @media (min-width: 768px) {
    width: 44px;
    height: 44px;
    min-width: 44px;
  }
`;

const IconBase = `
  width: 24px;
  height: 24px;
  color: #3c2a1f;

  @media (min-width: 768px) {
    width: 26px;
    height: 26px;
  }
`;

const CalendarIcon = styled(CalendarDays)`
  ${IconBase}
`;

const HintIcon = styled(Lightbulb)`
  ${IconBase}
`;

const HelpIcon = styled(CircleHelp)`
  ${IconBase}
`;

const GameHeader = ({
  dateLabel,
  onOpenDatePicker,
  disabled,
}: GameHeaderProps) => (
  <Header>
    <TopRow>
      <DateText>{dateLabel}</DateText>
      <Actions>
        <IconButton type="button" aria-label="Hint options coming soon">
          <HintIcon aria-hidden strokeWidth={2.25} />
        </IconButton>
        <IconButton type="button" aria-label="Help options coming soon">
          <HelpIcon aria-hidden strokeWidth={2.25} />
        </IconButton>
        <IconButton
          type="button"
          onClick={onOpenDatePicker}
          aria-label={`Choose puzzle date, currently ${dateLabel}`}
          disabled={disabled}
        >
          <CalendarIcon aria-hidden strokeWidth={2.25} />
        </IconButton>
      </Actions>
    </TopRow>
  </Header>
);

export default GameHeader;
