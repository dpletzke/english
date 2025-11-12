import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { ConnectionsPuzzle } from "./data/puzzles";
import { formatPuzzleDateLabel } from "./data/puzzles";
import { useConnectionsGame } from "./hooks/useConnectionsGame";
import { useDailyPuzzle } from "./hooks/useDailyPuzzle";
import { GlobalStyle } from "./styles/GlobalStyle";
import {
  getWordMotionTracer,
  isWordMotionTracerEnabled,
} from "./game/tracing";
import {
  CategoryGroupList,
  GameControls,
  GameHeader,
  GameResult,
  Page,
  StatusBar,
  WordGrid,
  WordSection,
} from "./components";

declare global {
  interface Window {
    __wordMotionTracer?: ReturnType<typeof getWordMotionTracer>;
  }
}

const App = () => {
  const today = useMemo(() => new Date(), []);
  const puzzleState = useDailyPuzzle(today);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const dateLabel = formatPuzzleDateLabel(puzzleState.dateKey);
  const shouldShowLoading = puzzleState.status === "loading";
  const shouldShowError = puzzleState.status === "error";

  useEffect(() => {
    if (!shouldShowLoading) {
      setShowLoadingIndicator(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowLoadingIndicator(true);
    }, 200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [shouldShowLoading]);

  useEffect(() => {
    if (typeof window !== "undefined" && isWordMotionTracerEnabled()) {
      window.__wordMotionTracer = getWordMotionTracer();
      return () => {
        delete window.__wordMotionTracer;
      };
    }

    return undefined;
  }, []);

  return (
    <>
      <GlobalStyle />
      <Page>
        <GameHeader
          title="English Learning Connections"
          subtitle={dateLabel}
        />

        {shouldShowLoading ? (
          <LoadingSection>
            <LoadingOverlay aria-live="polite">
              <Spinner $visible={showLoadingIndicator} />
              <LoadingMessage $visible={showLoadingIndicator}>
                Loading today's puzzle...
              </LoadingMessage>
            </LoadingOverlay>
          </LoadingSection>
        ) : null}

        {shouldShowError && puzzleState.status === "error" ? (
          <ErrorSection>
            <ErrorCard>
              <ErrorHeading>Something went wrong</ErrorHeading>
              <ErrorBody>
                We're having trouble loading the latest puzzle. Refresh the page
                or visit dpletzke.dev for updates.
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
        ) : null}

        {puzzleState.status === "loaded" && puzzleState.puzzle ? (
          <PuzzleExperience puzzle={puzzleState.puzzle} />
        ) : null}
      </Page>
    </>
  );
};

interface PuzzleExperienceProps {
  puzzle: ConnectionsPuzzle;
}

const PuzzleExperience = ({ puzzle }: PuzzleExperienceProps) => {
  const {
    availableWords,
    wordFeedback,
    orderedSolvedCategories,
    revealCategories,
    status,
    mistakesAllowed,
    mistakesRemaining,
    selectedWordIds,
    dragConfig,
    isInteractionLocked,
    shuffleWords,
    onToggleWord,
    clearSelection,
    submitSelection,
  } = useConnectionsGame(puzzle);

  const [isResultOpen, setIsResultOpen] = useState(false);

  useEffect(() => {
    if (status === "playing") {
      setIsResultOpen(false);
      return;
    }

    setIsResultOpen(true);
  }, [status]);

  const isPlaying = status === "playing";
  const hasGridContent =
    availableWords.length > 0 || orderedSolvedCategories.length > 0;
  const showWordSection = hasGridContent;
  const showGameResult = status !== "playing" && isResultOpen;
  const showRevealGroups = revealCategories.length > 0;

  const handleCloseResult = () => {
    setIsResultOpen(false);
  };

  return (
    <>
      {showGameResult ? (
        <GameResult status={status} onClose={handleCloseResult} />
      ) : null}

      {showWordSection ? (
        <WordSection>
          <WordGrid
            words={availableWords}
            selectedWordIds={selectedWordIds}
            onToggleWord={onToggleWord}
            wordFeedback={wordFeedback}
            solvedCategories={orderedSolvedCategories}
            disabled={!isPlaying}
            dragConfig={dragConfig}
          />
          <StatusBar
            mistakesAllowed={mistakesAllowed}
            mistakesRemaining={mistakesRemaining}
          />
          <GameControls
            onSubmit={submitSelection}
            onShuffle={shuffleWords}
            onClear={clearSelection}
            canSubmit={!isInteractionLocked && selectedWordIds.length === 4}
            canShuffle={!isInteractionLocked}
            canClear={!isInteractionLocked && selectedWordIds.length > 0}
          />
        </WordSection>
      ) : null}

      {showRevealGroups ? (
        <CategoryGroupList categories={revealCategories} revealed />
      ) : null}
    </>
  );
};

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

export default App;
