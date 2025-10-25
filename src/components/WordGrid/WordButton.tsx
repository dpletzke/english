import { motion } from "framer-motion";
import styled, { css } from "styled-components";

type LengthCategory = "short" | "medium" | "long";
type WordLayoutCategory = "single" | "double";

const FONT_SIZE_BY_LENGTH: Record<LengthCategory, string> = {
  long: "clamp(10px, 1.6vh, 14px)",
  medium: "clamp(11px, 1.85vh, 15px)",
  short: "clamp(12px, 2.2vh, 17px)",
};

const LETTER_SPACING_BY_LENGTH: Record<LengthCategory, string> = {
  long: "0.18px",
  medium: "0.32px",
  short: "0.32px",
};

const BUTTON_PALETTE = {
  selected: {
    border: "#1f1f1f",
    background: "#1f1f1f",
    text: "#fff",
    hoverShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    hoverBorder: "#1f1f1f",
  },
  idle: {
    border: "#c7c2b7",
    background: "#e2dfcf",
    text: "#1f1f1f",
    hoverShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    hoverBorder: "#a9a393",
  },
} as const;

const getButtonFontSize = (
  layout: WordLayoutCategory,
  length: LengthCategory,
) =>
  layout === "double"
    ? "clamp(11px, 1.9vh, 16px)"
    : FONT_SIZE_BY_LENGTH[length];

const SINGLE_LAYOUT_STYLES = css`
  line-height: 1.08;
  white-space: nowrap;
  flex-wrap: nowrap;
  word-break: normal;
  overflow-wrap: normal;
  hyphens: none;
`;

const DOUBLE_LAYOUT_STYLES = css`
  line-height: 1.15;
  white-space: normal;
  flex-wrap: wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  hyphens: auto;
`;

const applyLayoutStyles = ($layout: WordLayoutCategory) =>
  $layout === "double" ? DOUBLE_LAYOUT_STYLES : SINGLE_LAYOUT_STYLES;

const applyPaletteStyles = ($selected: boolean) => {
  const palette = $selected ? BUTTON_PALETTE.selected : BUTTON_PALETTE.idle;
  return css`
    border: 3px solid ${palette.border};
    background: ${palette.background};
    color: ${palette.text};

    &:not(:disabled):hover {
      box-shadow: ${palette.hoverShadow};
      border-color: ${palette.hoverBorder};
    }
  `;
};

interface WordButtonStyleProps {
  $selected: boolean;
  $length: LengthCategory;
  $layout: WordLayoutCategory;
}

export const WordButton = styled(motion.button)<WordButtonStyleProps>`
  ${({ $selected }) => applyPaletteStyles($selected)}
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 700;
  font-size: ${({ $layout, $length }) => getButtonFontSize($layout, $length)};
  letter-spacing: ${({ $length }) => LETTER_SPACING_BY_LENGTH[$length]};
  cursor: pointer;
  text-transform: uppercase;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    border-color 120ms ease;
  padding-block: clamp(7px, 1.6vh, 12px);
  padding-inline: clamp(12px, 2.6vw, 22px);
  ${({ $layout }) => applyLayoutStyles($layout)}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:not(:disabled):active {
    translate: 0px 1px;
  }
`;
