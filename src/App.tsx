import { useEffect, useMemo, useState } from "react";
import { formatPuzzleDateLabel, selectPuzzleForDate } from "./data/puzzles";
import { useConnectionsGame } from "./hooks/useConnectionsGame";
import { GlobalStyle } from "./styles/GlobalStyle";
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

const App = () => {
  const puzzleSelection = useMemo(() => selectPuzzleForDate(new Date()), []);
  const { puzzle, key: puzzleKey } = puzzleSelection;

  const {
    availableWords,
    orderedSolvedCategories,
    revealCategories,
    status,
    mistakesAllowed,
    mistakesRemaining,
    selectedWordIds,
    reorderWords,
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
      <GlobalStyle />
      <Page>
        <GameHeader
          title="English Learning Connections"
          subtitle={formatPuzzleDateLabel(puzzleKey)}
        />

        {showGameResult ? (
          <GameResult status={status} onClose={handleCloseResult} />
        ) : null}

        {showWordSection ? (
          <WordSection>
            <WordGrid
              words={availableWords}
              selectedWordIds={selectedWordIds}
              onToggleWord={onToggleWord}
              onReorderWords={reorderWords}
              solvedCategories={orderedSolvedCategories}
              disabled={!isPlaying}
            />
            <StatusBar
              mistakesAllowed={mistakesAllowed}
              mistakesRemaining={mistakesRemaining}
            />
            <GameControls
              onSubmit={submitSelection}
              onShuffle={shuffleWords}
              onClear={clearSelection}
              canSubmit={isPlaying && selectedWordIds.length === 4}
              canShuffle={isPlaying}
              canClear={isPlaying && selectedWordIds.length > 0}
            />
          </WordSection>
        ) : null}

        {showRevealGroups ? (
          <CategoryGroupList categories={revealCategories} revealed />
        ) : null}
      </Page>
    </>
  );
};

export default App;
