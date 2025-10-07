import { useMemo, useState } from 'react'
import styled, { createGlobalStyle } from 'styled-components'
import {
  type CategoryColor,
  type CategoryDefinition,
  type ConnectionsPuzzle,
  colorSwatches,
  colorTextOverrides,
  formatPuzzleDateLabel,
  selectPuzzleForDate,
} from './data/puzzles'

type GameStatus = 'playing' | 'won' | 'lost'

type WordCard = {
  id: string
  label: string
  categoryId: string
  color: CategoryColor
}

type GuessFeedback =
  | { type: 'correct'; category: CategoryDefinition }
  | { type: 'incorrect'; remaining: number }

const GlobalStyle = createGlobalStyle`
  :root {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1f1f1f;
    background-color: #f7f5f0;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
  }

  #root {
    min-height: 100vh;
  }
`

const colorOrder: CategoryColor[] = ['yellow', 'green', 'blue', 'purple']

const prepareWordCards = (puzzle: ConnectionsPuzzle): WordCard[] =>
  puzzle.categories.flatMap((category) =>
    category.words.map((word, index) => ({
      id: `${category.id}-${index}`,
      label: word,
      categoryId: category.id,
      color: category.color,
    })),
  )

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const App = () => {
  const puzzleSelection = useMemo(() => selectPuzzleForDate(new Date()), [])
  const { puzzle, key: puzzleKey } = puzzleSelection
  const mistakesAllowed = puzzle.mistakesAllowed ?? 4

  const [availableWords, setAvailableWords] = useState<WordCard[]>(() =>
    shuffle(prepareWordCards(puzzle)),
  )
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([])
  const [solvedCategoryIds, setSolvedCategoryIds] = useState<string[]>([])
  const [mistakesRemaining, setMistakesRemaining] = useState(mistakesAllowed)
  const [status, setStatus] = useState<GameStatus>('playing')
  const [feedback, setFeedback] = useState<GuessFeedback | null>(null)

  const solvedSet = useMemo(() => new Set(solvedCategoryIds), [solvedCategoryIds])
  const solvedCategories = puzzle.categories.filter((category) =>
    solvedSet.has(category.id),
  )
  const unsolvedCategories = puzzle.categories.filter(
    (category) => !solvedSet.has(category.id),
  )

  const onToggleWord = (wordId: string) => {
    if (status !== 'playing') {
      return
    }

    setSelectedWordIds((prev) => {
      if (prev.includes(wordId)) {
        return prev.filter((id) => id !== wordId)
      }
      if (prev.length === 4) {
        return prev
      }
      return [...prev, wordId]
    })
  }

  const handleShuffle = () => {
    if (status !== 'playing') {
      return
    }

    setAvailableWords((prev) => shuffle(prev))
    setSelectedWordIds([])
    setFeedback(null)
  }

  const clearSelection = () => {
    setSelectedWordIds([])
  }

  const handleSubmit = () => {
    if (status !== 'playing' || selectedWordIds.length !== 4) {
      return
    }

    const selectedCards = availableWords.filter((card) =>
      selectedWordIds.includes(card.id),
    )

    if (selectedCards.length !== 4) {
      // Should not happen, but guard just in case.
      return
    }

    const targetCategoryId = selectedCards[0].categoryId
    const allSameCategory = selectedCards.every(
      (card) => card.categoryId === targetCategoryId,
    )

    const category = puzzle.categories.find((item) => item.id === targetCategoryId)

    if (category && allSameCategory) {
      setAvailableWords((prev) =>
        prev.filter((card) => card.categoryId !== targetCategoryId),
      )
      setSolvedCategoryIds((prev) => [...prev, targetCategoryId])
      setSelectedWordIds([])
      setFeedback({ type: 'correct', category })

      if (solvedCategoryIds.length + 1 === puzzle.categories.length) {
        setStatus('won')
      }
      return
    }

    setMistakesRemaining((prev) => {
      const next = prev - 1
      const normalized = next < 0 ? 0 : next
      if (normalized === 0) {
        setStatus('lost')
      }
      return normalized
    })
    setSelectedWordIds([])
    setFeedback({ type: 'incorrect', remaining: mistakesRemaining - 1 })
  }

  const activeWords = availableWords.filter(
    (card) => !solvedSet.has(card.categoryId),
  )

  const remainingWords = status === 'lost' ? [] : activeWords

  const revealCategories = status === 'lost' ? unsolvedCategories : []

  return (
    <>
      <GlobalStyle />
      <Page>
        <Header>
          <Title>Connections</Title>
          <Subtitle>{formatPuzzleDateLabel(puzzleKey)}</Subtitle>
        </Header>

        <StatusBar>
          <MistakeLabel>Mistakes remaining</MistakeLabel>
          <MistakeTrack>
            {Array.from({ length: mistakesAllowed }).map((_, index) => {
              const pipActive = index < mistakesRemaining
              return <MistakePip key={index} $active={pipActive} />
            })}
          </MistakeTrack>
          <ProgressText>
            {solvedCategoryIds.length} / {puzzle.categories.length} solved
          </ProgressText>
        </StatusBar>

        {feedback ? (
          <FeedbackBanner $type={feedback.type}>
            {feedback.type === 'correct' ? (
              <>
                <strong>Nice!</strong> {feedback.category.title}
              </>
            ) : (
              <>
                <strong>Not quite.</strong> {feedback.remaining} left.
              </>
            )}
          </FeedbackBanner>
        ) : null}

        {status !== 'playing' ? (
          <GameResult $status={status}>
            {status === 'won' ? 'You solved today\'s puzzle!' : 'You\'re out of mistakes. Here\'s the solution.'}
          </GameResult>
        ) : null}

        <SolvedGroups>
          {orderedCategories(solvedCategories).map((category) => (
            <GroupCard key={category.id} $color={category.color}>
              <GroupTitle>{category.title}</GroupTitle>
              <GroupWords>
                {category.words.map((word) => (
                  <GroupWord key={word}>{word}</GroupWord>
                ))}
              </GroupWords>
            </GroupCard>
          ))}
        </SolvedGroups>

        {remainingWords.length > 0 ? (
          <WordSection>
            <WordGrid>
              {remainingWords.map((card) => (
                <WordButton
                  key={card.id}
                  type="button"
                  onClick={() => onToggleWord(card.id)}
                  $selected={selectedWordIds.includes(card.id)}
                  disabled={status !== 'playing'}
                >
                  {card.label}
                </WordButton>
              ))}
            </WordGrid>

            <Controls>
              <PrimaryButton
                type="button"
                onClick={handleSubmit}
                disabled={status !== 'playing' || selectedWordIds.length !== 4}
              >
                Submit
              </PrimaryButton>
              <SecondaryButton type="button" onClick={handleShuffle} disabled={status !== 'playing'}>
                Shuffle
              </SecondaryButton>
              <TertiaryButton
                type="button"
                onClick={clearSelection}
                disabled={status !== 'playing' || selectedWordIds.length === 0}
              >
                Deselect
              </TertiaryButton>
            </Controls>
          </WordSection>
        ) : null}

        {revealCategories.length > 0 ? (
          <SolvedGroups>
            {orderedCategories(revealCategories).map((category) => (
              <GroupCard key={category.id} $color={category.color} $revealed>
                <GroupTitle>{category.title}</GroupTitle>
                <GroupWords>
                  {category.words.map((word) => (
                    <GroupWord key={word}>{word}</GroupWord>
                  ))}
                </GroupWords>
              </GroupCard>
            ))}
          </SolvedGroups>
        ) : null}
      </Page>
    </>
  )
}

const orderedCategories = (categories: CategoryDefinition[]) =>
  [...categories].sort((a, b) =>
    colorOrder.indexOf(a.color) - colorOrder.indexOf(b.color) || a.title.localeCompare(b.title),
  )

const Page = styled.main`
  max-width: 780px;
  margin: 0 auto;
  padding: 32px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const Title = styled.h1`
  margin: 0;
  font-size: 32px;
  letter-spacing: 1px;
`

const Subtitle = styled.span`
  font-size: 16px;
  color: #5d5d5d;
`

const StatusBar = styled.section`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`

const MistakeLabel = styled.span`
  font-size: 14px;
  color: #5d5d5d;
`

const MistakeTrack = styled.div`
  display: flex;
  gap: 8px;
`

const MistakePip = styled.span<{ $active: boolean }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #1f1f1f;
  background: ${({ $active }) => ($active ? '#f15c5c' : '#e4dfd3')};
`

const ProgressText = styled.span`
  margin-left: auto;
  font-size: 14px;
  color: #333;
`

const FeedbackBanner = styled.div<{ $type: GuessFeedback['type'] }>`
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid ${({ $type }) => ($type === 'correct' ? '#3f8142' : '#a0493c')};
  background: ${({ $type }) => ($type === 'correct' ? '#e2f5e3' : '#fbe3df')};
  font-size: 14px;
  display: flex;
  gap: 8px;
  align-items: center;
`

const GameResult = styled.div<{ $status: GameStatus }>`
  padding: 16px 18px;
  border-radius: 12px;
  background: ${({ $status }) => ($status === 'won' ? '#dff8d8' : '#f7dfdf')};
  border: 1px solid ${({ $status }) => ($status === 'won' ? '#68a663' : '#c26b6b')};
  font-weight: 600;
  text-align: center;
`

const SolvedGroups = styled.section`
  display: grid;
  gap: 10px;
`

const GroupCard = styled.article<{ $color: CategoryColor; $revealed?: boolean }>`
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  background: ${({ $color }) => colorSwatches[$color]};
  color: ${({ $color }) => colorTextOverrides[$color] ?? '#1f1f1f'};
  opacity: ${({ $revealed }) => ($revealed ? 0.8 : 1)};
`

const GroupTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
`

const GroupWords = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
`

const GroupWord = styled.span``

const WordSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const WordGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
`

const WordButton = styled.button<{ $selected: boolean }>`
  padding: 18px 12px;
  border-radius: 10px;
  border: 2px solid ${({ $selected }) => ($selected ? '#1f1f1f' : '#c7c2b7')};
  background: ${({ $selected }) => ($selected ? '#1f1f1f' : '#fffdf6')};
  color: ${({ $selected }) => ($selected ? '#fff' : '#1f1f1f')};
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.8px;
  cursor: pointer;
  text-transform: uppercase;
  transition: transform 120ms ease, box-shadow 120ms ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:not(:disabled):active {
    transform: translateY(1px);
  }

  &:not(:disabled):hover {
    box-shadow: ${({ $selected }) =>
      $selected ? '0 4px 8px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  }
`

const Controls = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const BaseButton = styled.button`
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 20px;
  cursor: pointer;
  border: none;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }

  &:not(:disabled):active {
    transform: translateY(1px);
  }
`

const PrimaryButton = styled(BaseButton)`
  background: #161616;
  color: #fdfbf2;
`

const SecondaryButton = styled(BaseButton)`
  background: #e4dfd3;
  color: #1f1f1f;
`

const TertiaryButton = styled(BaseButton)`
  background: transparent;
  color: #1f1f1f;
  border: 1px solid #bfb8a6;
`

export default App
