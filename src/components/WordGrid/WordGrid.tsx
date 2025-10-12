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

export default WordGrid
