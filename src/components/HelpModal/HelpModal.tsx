import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Languages } from "lucide-react";

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
  const [isSpanish, setIsSpanish] = useState(false);

  const copy = isSpanish
    ? {
        title: "Como jugar",
        lead: "Encuentra grupos de cuatro elementos que compartan algo en comun.",
        ruleOne:
          "Selecciona cuatro elementos y toca 'Submit' para comprobar si tu suposicion es correcta.",
        ruleTwo: "Encuentra los grupos sin cometer 4 errores!",
        examplesTitle: "Ejemplos de categorias",
        specificity:
          'Las categorias siempre seran mas especificas que "5-LETTER-WORDS," "NAMES" o "VERBS."',
        oneSolution:
          "Cada rompecabezas tiene exactamente una solucion. Cuidado con las palabras que parecen pertenecer a varias categorias!",
        colorIntro:
          "A cada grupo se le asigna un color, que se revelara a medida que resuelves:",
        easy: "Directo",
        hard: "Dificil",
      }
    : {
        title: "How to play",
        lead: "Find groups of four items that share something in common.",
        ruleOne:
          "Select four items and tap 'Submit' to check if your guess is correct.",
        ruleTwo: "Find the groups without making 4 mistakes!",
        examplesTitle: "Category Examples",
        specificity:
          'Categories will always be more specific than "5-LETTER-WORDS," "NAMES" or "VERBS."',
        oneSolution:
          "Each puzzle has exactly one solution. Watch out for words that seem to belong to multiple categories!",
        colorIntro:
          "Each group is assigned a color, which will be revealed as you solve:",
        easy: "Straightforward",
        hard: "Tricky",
      };

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
          <Title id="help-modal-title">{copy.title}</Title>
          <HeaderActions>
            <TranslateButton
              type="button"
              onClick={() => setIsSpanish((current) => !current)}
              aria-label={
                isSpanish ? "Switch help text to English" : "Translate help text to Spanish"
              }
            >
              <LanguageIcon aria-hidden strokeWidth={2.2} />
            </TranslateButton>
            <CloseButton type="button" onClick={onClose} aria-label="Close help modal">
              ✕
            </CloseButton>
          </HeaderActions>
        </Header>

        <Body>
          <Lead>{copy.lead}</Lead>

          <BulletList>
            <li>
              {copy.ruleOne.split("'Submit'")[0]}
              <Strong>'Submit'</Strong>
              {copy.ruleOne.split("'Submit'")[1]}
            </li>
            <li>{copy.ruleTwo}</li>
          </BulletList>

          <SectionTitle>{copy.examplesTitle}</SectionTitle>

          <BulletList>
            <li>FISH: Bass, Flounder, Salmon, Trout</li>
            <li>FIRE___: Ant, Drill, Island, Opal</li>
          </BulletList>

          <Paragraph>{copy.specificity}</Paragraph>

          <Paragraph>{copy.oneSolution}</Paragraph>

          <Paragraph>{copy.colorIntro}</Paragraph>

          <DifficultyLegend>
            <SwatchesColumn aria-hidden>
              <Swatch $color="#f4dc69" />
              <Swatch $color="#a9c65c" />
              <Swatch $color="#a6bde8" />
              <Swatch $color="#b085cc" />
            </SwatchesColumn>
            <LegendText>
              <LegendLabel>{copy.easy}</LegendLabel>
              <LegendArrow aria-hidden>↓</LegendArrow>
              <LegendLabel>{copy.hard}</LegendLabel>
            </LegendText>
          </DifficultyLegend>
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
  max-height: min(88vh, 920px);
  border-radius: 18px;
  background: #fffaf3;
  border: 1px solid #e2d5c5;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.18);
  padding: 18px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
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

const TranslateButton = styled.button`
  border: 1px solid #d6cab9;
  background: #fff;
  color: #3c2a1f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
  cursor: pointer;
`;

const LanguageIcon = styled(Languages)`
  width: 18px;
  height: 18px;
`;

const Body = styled.div`
  display: grid;
  gap: 14px;
  overflow-y: auto;
  padding-right: 6px;
`;

const Lead = styled.p`
  margin: 0;
  color: #1f1f1f;
  line-height: 1.35;
  font-size: 20px;
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: 22px;
  display: grid;
  gap: 8px;
  color: #1f1f1f;
  line-height: 1.5;
  font-size: 18px;
`;

const Strong = styled.strong`
  font-weight: 700;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: #1f1f1f;
  font-size: 20px;
  line-height: 1.3;
`;

const Paragraph = styled.p`
  margin: 0;
  color: #1f1f1f;
  font-size: 18px;
  line-height: 1.35;
`;

const DifficultyLegend = styled.div`
  display: grid;
  grid-template-columns: 44px auto;
  align-items: start;
  gap: 14px;
`;

const SwatchesColumn = styled.div`
  display: grid;
  gap: 8px;
`;

const Swatch = styled.span<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 7px;
  background: ${({ $color }) => $color};
`;

const LegendText = styled.div`
  display: grid;
  gap: 4px;
  align-content: start;
`;

const LegendLabel = styled.p`
  margin: 0;
  color: #1f1f1f;
  font-size: 20px;
  line-height: 1.2;
`;

const LegendArrow = styled.span`
  color: #1f1f1f;
  font-size: 44px;
  line-height: 0.85;
  margin-left: 26px;
`;
