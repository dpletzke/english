import { useMemo } from "react";
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
    remainingWords,
    orderedSolvedCategories,
    revealCategories,
    status,
    mistakesAllowed,
    mistakesRemaining,
    selectedWordIds,
    solvedCategoryIds,
    shuffleWords,
    onToggleWord,
    clearSelection,
    submitSelection,
  } = useConnectionsGame(puzzle);

  const isPlaying = status === "playing";
  const showWordSection = remainingWords.length > 0;
  const showGameResult = status !== "playing";
  const showRevealGroups = revealCategories.length > 0;

  return (
    <>
      <GlobalStyle />
      <Page>
        <GameHeader
          title="Connections"
          subtitle={formatPuzzleDateLabel(puzzleKey)}
        />

        <StatusBar
          mistakesAllowed={mistakesAllowed}
          mistakesRemaining={mistakesRemaining}
          solvedCount={solvedCategoryIds.length}
          totalCategories={puzzle.categories.length}
        />

        {showGameResult ? <GameResult status={status} /> : null}

        <CategoryGroupList categories={orderedSolvedCategories} />

        {showWordSection ? (
          <WordSection>
            <WordGrid
              words={remainingWords}
              selectedWordIds={selectedWordIds}
              onToggleWord={onToggleWord}
              disabled={!isPlaying}
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
