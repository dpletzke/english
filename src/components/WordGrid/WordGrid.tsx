import styled from 'styled-components'
import type { WordCard } from '../../game/types'

interface WordGridProps {
  words: WordCard[]
  selectedWordIds: string[]
  onToggleWord: (wordId: string) => void
  disabled?: boolean
}

const WordGrid = ({
  words,
  selectedWordIds,
  onToggleWord,
  disabled = false,
}: WordGridProps) => (
  <Grid>
    {words.map((card) => (
      <WordButton
        key={card.id}
        type="button"
        onClick={() => onToggleWord(card.id)}
        $selected={selectedWordIds.includes(card.id)}
        disabled={disabled}
      >
        {card.label}
      </WordButton>
    ))}
  </Grid>
)

const Grid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
`

const WordButton = styled.button<{ $selected: boolean }>`
  aspect-ratio: 1;
  border-radius: 12px;
  border: 3px solid ${({ $selected }) => ($selected ? '#1f1f1f' : '#c7c2b7')};
  background: ${({ $selected }) => ($selected ? '#1f1f1f' : '#e2dfcf')};
  color: ${({ $selected }) => ($selected ? '#fff' : '#1f1f1f')};
  font-size: clamp(14px, 2vw, 18px);
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
  text-transform: uppercase;
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 12px;
  line-height: 1.1;

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
    border-color: ${({ $selected }) => ($selected ? '#1f1f1f' : '#a9a393')};
  }
`

export default WordGrid
