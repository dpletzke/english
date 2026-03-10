import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import type { ConnectionsPuzzle } from "./data/puzzles";
import {
  formatPuzzleDateShortLabel,
  getPuzzleDateKey,
} from "./data/puzzles";
import { useConnectionsGame } from "./hooks/useConnectionsGame";
import { useDailyPuzzle } from "./hooks/useDailyPuzzle";
import { usePuzzleManifest } from "./hooks/usePuzzleManifest";
import { GlobalStyle } from "./styles/GlobalStyle";
import {
  getWordMotionTracer,
  isWordMotionTracerEnabled,
} from "./game/tracing";
import {
  CategoryGroupList,
  GameControls,
  GameHeader,
  DatePickerSheet,
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

const SELECTED_PUZZLE_DATE_STORAGE_KEY = "selectedPuzzleDate";
const DATE_SHEET_ID = "puzzle-date-picker";

const App = () => {
  const todayDateKey = useMemo(() => getPuzzleDateKey(new Date()), []);
  const manifest = usePuzzleManifest();
  const storedDateKey = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(SELECTED_PUZZLE_DATE_STORAGE_KEY);
  }, []);

  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    storedDateKey || todayDateKey,
  );
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const puzzleState = useDailyPuzzle(activeDateKey);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const noPuzzlesAvailable =
    manifest.status === "loaded" && manifest.availableDates.length === 0;
  const availableDates = manifest.status === "loaded" ? manifest.availableDates : [];
  const shouldShowLoading =
    !noPuzzlesAvailable &&
    (manifest.status === "loading" ||
      puzzleState.status === "idle" ||
      puzzleState.status === "loading");
  const shouldShowError = puzzleState.status === "error";
  const shouldShowManifestError = manifest.status === "error";

  const dateLabelKey =
    activeDateKey ?? selectedDateKey ?? manifest.latestAvailable ?? todayDateKey;
  const dateLabelShort = formatPuzzleDateShortLabel(dateLabelKey);

  const openDatePicker = () => setIsDatePickerOpen(true);
  const closeDatePicker = () => setIsDatePickerOpen(false);
  const handleSelectDate = (dateKey: string) => {
    if (!availableDates.includes(dateKey)) {
      return;
    }
    setSelectedDateKey(dateKey);
    setActiveDateKey(dateKey);
    closeDatePicker();
  };

  useEffect(() => {
    if (typeof window === "undefined" || !selectedDateKey) {
      return;
    }

    window.localStorage.setItem(
      SELECTED_PUZZLE_DATE_STORAGE_KEY,
      selectedDateKey,
    );
  }, [selectedDateKey]);

  useEffect(() => {
    if (manifest.status === "loaded") {
      if (!manifest.latestAvailable) {
        setActiveDateKey(null);
        return;
      }

      const isSelectedAvailable = manifest.availableDates.includes(selectedDateKey);
      const isTodayAvailable = manifest.availableDates.includes(todayDateKey);

      const nextDateKey = isSelectedAvailable
        ? selectedDateKey
        : isTodayAvailable
          ? todayDateKey
          : manifest.latestAvailable;

      setActiveDateKey(nextDateKey);
      if (nextDateKey !== selectedDateKey) {
        setSelectedDateKey(nextDateKey);
      }
      return;
    }

    if (manifest.status === "error") {
      setActiveDateKey((current) => current ?? selectedDateKey ?? todayDateKey);
    }
  }, [
    manifest.status,
    manifest.availableDates,
    manifest.latestAvailable,
    selectedDateKey,
    todayDateKey,
  ]);

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
          dateLabel={dateLabelShort}
          onOpenDatePicker={openDatePicker}
          disabled={availableDates.length === 0 || manifest.status === "loading"}
        />

        {shouldShowManifestError ? (
          <InlineNotice role="status">
            <NoticeHeading>Couldn't refresh puzzle list</NoticeHeading>
            <NoticeBody>
              We'll use your saved puzzle while you retry loading the latest
              list.
            </NoticeBody>
            <NoticeActions>
              <RetryButton type="button" onClick={manifest.retry}>
                Retry
              </RetryButton>
            </NoticeActions>
          </InlineNotice>
        ) : null}

        {shouldShowLoading ? (
          <LoadingSection>
            <LoadingOverlay aria-live="polite">
              <Spinner $visible={showLoadingIndicator} />
              <LoadingMessage $visible={showLoadingIndicator}>
                Loading puzzle...
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

        {noPuzzlesAvailable ? (
          <ErrorSection>
            <ErrorCard>
              <ErrorHeading>No puzzles available</ErrorHeading>
              <ErrorBody>
                We couldn't find any puzzles to load. Please try again later
                or retry fetching the puzzle list.
              </ErrorBody>
              <ErrorActions>
                <RetryButton type="button" onClick={manifest.retry}>
                  Retry
                </RetryButton>
              </ErrorActions>
            </ErrorCard>
          </ErrorSection>
        ) : null}

        {puzzleState.status === "loaded" && puzzleState.puzzle ? (
          <PuzzleExperience puzzle={puzzleState.puzzle} />
        ) : null}

        <DatePickerSheet
          isOpen={isDatePickerOpen}
          onClose={closeDatePicker}
          availableDates={availableDates}
          selectedDateKey={selectedDateKey}
          onSelect={handleSelectDate}
          todayDateKey={todayDateKey}
          dialogId={DATE_SHEET_ID}
        />
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

export default App;
