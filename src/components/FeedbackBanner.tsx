import styled from "styled-components";
import type { GuessFeedback } from "../game/types";

interface FeedbackBannerProps {
  feedback: GuessFeedback;
}

const Banner = styled.div<{ $type: GuessFeedback["type"] }>`
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid ${({ $type }) => ($type === "correct" ? "#3f8142" : "#a0493c")};
  background: ${({ $type }) => ($type === "correct" ? "#e2f5e3" : "#fbe3df")};
  font-size: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const FeedbackBanner = ({ feedback }: FeedbackBannerProps) => (
  <Banner $type={feedback.type}>
    {feedback.type === "correct" ? (
      <>
        <strong>Nice!</strong> {feedback.category.title}
      </>
    ) : (
      <>
        <strong>Not quite.</strong> {feedback.remaining} left.
      </>
    )}
  </Banner>
);

export default FeedbackBanner;
