import { useEffect, useState } from "react";
import styled from "styled-components";
import type { ConnectionsPuzzle } from "./data/puzzles";
import { useConnectionsGame } from "./hooks/useConnectionsGame";
import { useDailyPuzzle } from "./hooks/useDailyPuzzle";
import { usePuzzleManifest } from "./hooks/usePuzzleManifest";
import { usePuzzleSelection } from "./hooks/usePuzzleSelection";
import { GlobalStyle } from "./styles/GlobalStyle";
import { getWordMotionTracer, isWordMotionTracerEnabled } from "./game/tracing";
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
  ErrorStateSection,
  LoadingStateSection,
  ManifestWarningNotice,
  NoPuzzlesStateSection,
} from "./components";

declare global {
  interface Window {
    __wordMotionTracer?: ReturnType<typeof getWordMotionTracer>;
  }
}

const DATE_SHEET_ID = "puzzle-date-picker";

const GamePrompt = styled.p`
  margin: 0;
  width: 100%;
  max-width: 560px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.15;
  color: #1f1f1f;
`;

const App = () => {
  const manifest = usePuzzleManifest();
  const availableDates =
    manifest.status === "loaded" ? manifest.availableDates : [];
  const {
    todayDateKey,
    selectedDateKey,
    activeDateKey,
    isDatePickerOpen,
    dateStatuses,
    dateLabelShort,
    openDatePicker,
    closeDatePicker,
    handleSelectDate,
  } = usePuzzleSelection({
    manifestStatus: manifest.status,
    availableDates,
    latestAvailable: manifest.latestAvailable,
  });
  const puzzleState = useDailyPuzzle(activeDateKey);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const noPuzzlesAvailable =
    manifest.status === "loaded" && manifest.availableDates.length === 0;
  const shouldShowLoading =
    !noPuzzlesAvailable &&
    (manifest.status === "loading" ||
      puzzleState.status === "idle" ||
      puzzleState.status === "loading");
  const shouldShowError = puzzleState.status === "error";
  const shouldShowManifestError = manifest.status === "error";

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
          disabled={
            availableDates.length === 0 || manifest.status === "loading"
          }
        />
        <GamePrompt>Create four groups of 4!</GamePrompt>

        {shouldShowManifestError ? (
          <ManifestWarningNotice onRetry={manifest.retry} />
        ) : null}

        {shouldShowLoading ? (
          <LoadingStateSection showIndicator={showLoadingIndicator} />
        ) : null}

        {shouldShowError && puzzleState.status === "error" ? (
          <ErrorStateSection />
        ) : null}

        {noPuzzlesAvailable ? (
          <NoPuzzlesStateSection onRetry={manifest.retry} />
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
          dateStatuses={dateStatuses}
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

export default App;
