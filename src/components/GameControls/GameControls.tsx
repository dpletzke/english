import styled from 'styled-components'

interface GameControlsProps {
  onSubmit: () => void
  onShuffle: () => void
  onClear: () => void
  canSubmit: boolean
  canShuffle: boolean
  canClear: boolean
}

const GameControls = ({
  onSubmit,
  onShuffle,
  onClear,
  canSubmit,
  canShuffle,
  canClear,
}: GameControlsProps) => (
  <Container>
    <PrimaryButton type="button" onClick={onSubmit} disabled={!canSubmit}>
      Submit
    </PrimaryButton>
    <SecondaryButton type="button" onClick={onShuffle} disabled={!canShuffle}>
      Shuffle
    </SecondaryButton>
    <TertiaryButton type="button" onClick={onClear} disabled={!canClear}>
      Deselect
    </TertiaryButton>
  </Container>
)

const Container = styled.div`
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

export default GameControls
