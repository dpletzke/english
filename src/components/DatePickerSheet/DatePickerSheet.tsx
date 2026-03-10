import { useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import { Check, Minus, X } from "lucide-react";
import { formatPuzzleDateShortLabel } from "../../data/puzzles";

type DatePlayStatus = "won" | "lost" | "pending";

interface DatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  availableDates: string[];
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
  dateStatuses?: Partial<Record<string, DatePlayStatus>>;
  todayDateKey?: string;
  dialogId?: string;
}

const getFirstFocusable = (container: HTMLElement | null) =>
  container?.querySelector<HTMLElement>(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
  );

const trapFocus = (event: KeyboardEvent, container: HTMLElement | null) => {
  if (!container || event.key !== "Tab") {
    return;
  }

  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    ),
  ).filter((el) => !el.hasAttribute("disabled"));

  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const isShift = event.shiftKey;
  const active = document.activeElement as HTMLElement | null;

  if (!isShift && active === last) {
    event.preventDefault();
    first.focus();
  } else if (isShift && active === first) {
    event.preventDefault();
    last.focus();
  }
};

export const DatePickerSheet = ({
  isOpen,
  onClose,
  availableDates,
  selectedDateKey,
  onSelect,
  dateStatuses,
  todayDateKey,
  dialogId,
}: DatePickerSheetProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const displayDates = useMemo(() => {
    const hasToday =
      todayDateKey && availableDates.includes(todayDateKey)
        ? todayDateKey
        : null;
    const rest = availableDates.filter((key) => key !== hasToday);
    return { hasToday, rest };
  }, [availableDates, todayDateKey]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      trapFocus(event, dialogRef.current);
    };

    document.addEventListener("keydown", handleKeydown);

    const firstFocusable = getFirstFocusable(dialogRef.current);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      if (previousFocus) {
        previousFocus.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (dateKey: string) => {
    onSelect(dateKey);
    onClose();
  };

  const getStatus = (dateKey: string): DatePlayStatus =>
    dateStatuses?.[dateKey] ?? "pending";

  return (
    <Overlay ref={overlayRef}>
      <Backdrop onClick={onClose} aria-label="Close date picker overlay" />
      <Sheet
        ref={dialogRef}
        role="dialog"
        aria-modal
        aria-labelledby="date-sheet-title"
        id={dialogId}
      >
        <Header>
          <Title id="date-sheet-title">Select puzzle</Title>
          <CloseButton type="button" onClick={onClose} aria-label="Close date picker">
            ✕
          </CloseButton>
        </Header>

        <Content>
          {displayDates.hasToday ? (
            <QuickAction>
              <QuickActionLabel>Today</QuickActionLabel>
              <DateButton
                type="button"
                onClick={() => handleSelect(displayDates.hasToday!)}
                $selected={selectedDateKey === displayDates.hasToday}
              >
                    <DateText>{formatPuzzleDateShortLabel(displayDates.hasToday)}</DateText>
                <StatusIcon
                  $status={getStatus(displayDates.hasToday)}
                  role="img"
                  aria-label={STATUS_META[getStatus(displayDates.hasToday)].ariaLabel}
                >
                  {getStatus(displayDates.hasToday) === "won" ? (
                    <Check aria-hidden strokeWidth={2.6} />
                  ) : null}
                  {getStatus(displayDates.hasToday) === "lost" ? (
                    <X aria-hidden strokeWidth={2.6} />
                  ) : null}
                  {getStatus(displayDates.hasToday) === "pending" ? (
                    <Minus aria-hidden strokeWidth={2.6} />
                  ) : null}
                </StatusIcon>
              </DateButton>
            </QuickAction>
          ) : null}

          {displayDates.rest.length > 0 ? (
            <DateList role="list">
              {displayDates.rest.map((dateKey) => (
                <li key={dateKey}>
                  <DateButton
                    type="button"
                    onClick={() => handleSelect(dateKey)}
                    $selected={selectedDateKey === dateKey}
                  >
                    <DateText>{formatPuzzleDateShortLabel(dateKey)}</DateText>
                    <StatusIcon
                      $status={getStatus(dateKey)}
                      role="img"
                      aria-label={STATUS_META[getStatus(dateKey)].ariaLabel}
                    >
                      {getStatus(dateKey) === "won" ? (
                        <Check aria-hidden strokeWidth={2.6} />
                      ) : null}
                      {getStatus(dateKey) === "lost" ? (
                        <X aria-hidden strokeWidth={2.6} />
                      ) : null}
                      {getStatus(dateKey) === "pending" ? (
                        <Minus aria-hidden strokeWidth={2.6} />
                      ) : null}
                    </StatusIcon>
                  </DateButton>
                </li>
              ))}
            </DateList>
          ) : (
            <EmptyState>No other available puzzles.</EmptyState>
          )}
        </Content>
      </Sheet>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: grid;
  place-items: end center;
  z-index: 20;
`;

const Backdrop = styled.button`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  border: none;
  padding: 0;
`;

const Sheet = styled.div`
  position: relative;
  width: min(540px, 100%);
  border-radius: 18px 18px 0 0;
  background: #fffaf3;
  box-shadow: 0 -18px 60px rgba(0, 0, 0, 0.15);
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #3c2a1f;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #3c2a1f;
  padding: 8px;
  line-height: 1;
`;

const Content = styled.div`
  display: grid;
  gap: 10px;
`;

const QuickAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff2da;
  border: 1px solid #edd6af;
`;

const QuickActionLabel = styled.span`
  font-weight: 600;
  color: #3c2a1f;
`;

const DateList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  max-height: min(60vh, 520px);
  overflow: auto;
`;

const EmptyState = styled.div`
  padding: 12px 6px;
  font-size: 14px;
  color: #5d5d5d;
`;

const STATUS_META: Record<DatePlayStatus, { color: string; ariaLabel: string }> = {
  won: { color: "#68a663", ariaLabel: "Solved" },
  lost: { color: "#c26b6b", ariaLabel: "Missed" },
  pending: { color: "#b6b6b6", ariaLabel: "Not played" },
};

const DateButton = styled.button<{ $selected: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid ${(props) => (props.$selected ? "#3f6fd1" : "#e2d5c5")};
  background: ${(props) => (props.$selected ? "#e9f1ff" : "#ffffff")};
  color: #3c2a1f;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    border-color: #3f6fd1;
  }
`;

const DateText = styled.span`
  text-align: left;
`;

const StatusIcon = styled.span<{ $status: DatePlayStatus }>`
  width: 14px;
  height: 14px;
  min-width: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $status }) => STATUS_META[$status].color};
  opacity: 0.72;

  svg {
    width: 14px;
    height: 14px;
  }
`;
