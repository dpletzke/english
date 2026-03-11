import styled, { keyframes } from "styled-components";
import { WordSection } from "../WordSection";

interface ManifestWarningNoticeProps {
  onRetry: () => void;
}

export const ManifestWarningNotice = ({
  onRetry,
}: ManifestWarningNoticeProps) => (
  <InlineNotice role="status">
    <NoticeHeading>Couldn't refresh puzzle list</NoticeHeading>
    <NoticeBody>
      We'll use your saved puzzle while you retry loading the latest list.
    </NoticeBody>
    <NoticeActions>
      <RetryButton type="button" onClick={onRetry}>
        Retry
      </RetryButton>
    </NoticeActions>
  </InlineNotice>
);

interface LoadingStateSectionProps {
  showIndicator: boolean;
}

export const LoadingStateSection = ({
  showIndicator,
}: LoadingStateSectionProps) => (
  <LoadingSection>
    <LoadingOverlay aria-live="polite">
      <Spinner $visible={showIndicator} />
      <LoadingMessage $visible={showIndicator}>Loading puzzle...</LoadingMessage>
    </LoadingOverlay>
  </LoadingSection>
);

export const ErrorStateSection = () => (
  <ErrorSection>
    <ErrorCard>
      <ErrorHeading>Something went wrong</ErrorHeading>
      <ErrorBody>
        We're having trouble loading the latest puzzle. Refresh the page or
        visit dpletzke.dev for updates.
      </ErrorBody>
      <ErrorActions>
        <SupportLink
          href="https://dpletzke.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          dpletzke.dev
        </SupportLink>
      </ErrorActions>
    </ErrorCard>
  </ErrorSection>
);

interface NoPuzzlesStateSectionProps {
  onRetry: () => void;
}

export const NoPuzzlesStateSection = ({
  onRetry,
}: NoPuzzlesStateSectionProps) => (
  <ErrorSection>
    <ErrorCard>
      <ErrorHeading>No puzzles available</ErrorHeading>
      <ErrorBody>
        We couldn't find any puzzles to load. Please try again later or retry
        fetching the puzzle list.
      </ErrorBody>
      <ErrorActions>
        <RetryButton type="button" onClick={onRetry}>
          Retry
        </RetryButton>
      </ErrorActions>
    </ErrorCard>
  </ErrorSection>
);

const LoadingSection = styled(WordSection)`
  justify-items: center;
  align-content: center;
  width: 100%;
  min-height: 360px;
`;

const LoadingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div<{ $visible: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 4px solid rgba(89, 78, 62, 0.2);
  border-top-color: #594e3e;
  animation: ${spin} 0.8s linear infinite;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 120ms ease-in;
`;

const LoadingMessage = styled.span<{ $visible: boolean }>`
  font-size: 16px;
  color: #594e3e;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transition: opacity 120ms ease-in;
`;

const ErrorSection = styled(WordSection)`
  justify-items: center;
  align-content: center;
  width: 100%;
  min-height: 360px;
`;

const ErrorCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  text-align: center;
  padding: 32px;
  border-radius: 20px;
  background: #fff7ec;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12);
  max-width: 420px;
`;

const ErrorHeading = styled.h2`
  margin: 0;
  font-size: 22px;
  color: #3c2a1f;
`;

const ErrorBody = styled.p`
  margin: 0;
  font-size: 16px;
  color: #534437;
`;

const ErrorActions = styled.div`
  display: flex;
  justify-content: center;
`;

const InlineNotice = styled.div`
  display: grid;
  gap: 6px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff7ec;
  color: #3c2a1f;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
`;

const NoticeHeading = styled.h3`
  margin: 0;
  font-size: 17px;
`;

const NoticeBody = styled.p`
  margin: 0;
  font-size: 15px;
  color: #534437;
`;

const NoticeActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const RetryButton = styled.button`
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 15px;
  font-weight: 600;
  color: #3f6fd1;
  border: 2px solid #3f6fd1;
  background: white;
  cursor: pointer;

  &:hover {
    color: #2c4c92;
    border-color: #2c4c92;
  }
`;

const SupportLink = styled.a`
  border-radius: 999px;
  padding: 9px 18px;
  font-size: 15px;
  font-weight: 600;
  color: #3f6fd1;
  border: 2px solid #3f6fd1;
  text-decoration: none;

  &:hover {
    color: #2c4c92;
    border-color: #2c4c92;
  }
`;
