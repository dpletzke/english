import { useEffect, useRef } from "react";
import styled from "styled-components";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  const active = document.activeElement as HTMLElement | null;

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  }
};

export const HelpModal = ({ isOpen, onClose, dialogId }: HelpModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

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
    getFirstFocusable(dialogRef.current)?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <Overlay>
      <Backdrop type="button" onClick={onClose} aria-label="Close help overlay" />
      <Modal
        ref={dialogRef}
        role="dialog"
        aria-modal
        aria-labelledby="help-modal-title"
        id={dialogId}
      >
        <Header>
          <Title id="help-modal-title">How to play</Title>
          <CloseButton type="button" onClick={onClose} aria-label="Close help modal">
            ✕
          </CloseButton>
        </Header>

        <Body>
          <RuleList>
            <li>Select 4 words that share a common connection.</li>
            <li>Press Submit to check if the group is correct.</li>
            <li>Find all 4 categories before you run out of mistakes.</li>
            <li>Categories are revealed from easiest to hardest as you solve them.</li>
          </RuleList>
          <Tip>
            Tip: If you are close, try swapping one word at a time to isolate the pattern.
          </Tip>
        </Body>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 18px;
`;

const Backdrop = styled.button`
  position: fixed;
  inset: 0;
  border: none;
  padding: 0;
  background: rgba(0, 0, 0, 0.32);
`;

const Modal = styled.div`
  position: relative;
  width: min(540px, 100%);
  border-radius: 18px;
  background: #fffaf3;
  border: 1px solid #e2d5c5;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.18);
  padding: 18px;
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
  font-size: 20px;
  color: #3c2a1f;
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: #3c2a1f;
  font-size: 20px;
  line-height: 1;
  padding: 8px;
  cursor: pointer;
`;

const Body = styled.div`
  display: grid;
  gap: 12px;
`;

const RuleList = styled.ul`
  margin: 0;
  padding-left: 22px;
  display: grid;
  gap: 8px;
  color: #3c2a1f;
  line-height: 1.5;
`;

const Tip = styled.p`
  margin: 0;
  color: #594e3e;
  background: #fff2da;
  border: 1px solid #edd6af;
  border-radius: 12px;
  padding: 10px 12px;
  line-height: 1.4;
`;
