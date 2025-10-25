import styled from "styled-components";

interface GameControlsProps {
  onSubmit: () => void;
  onShuffle: () => void;
  onClear: () => void;
  canSubmit: boolean;
  canShuffle: boolean;
  canClear: boolean;
}

const Container = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
`;

const BaseButton = styled.button`
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  padding: 16px 24px;
  cursor: pointer;
  border: none;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    opacity 120ms ease;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    box-shadow: none;
  }

  &:not(:disabled):active {
    translate: 0px 1px;
  }
`;

const PrimaryButton = styled(BaseButton)`
  background: #161616;
  color: #fdfbf2;
`;

const SecondaryButton = styled(BaseButton)`
  background: transparent;
  color: #1f1f1f;
  border: 2px solid #1f1f1f;
`;

const TertiaryButton = styled(BaseButton)`
  background: transparent;
  color: #1f1f1f;
  border: 2px solid #bfb8a6;
`;

const GameControls = ({
  onSubmit,
  onShuffle,
  onClear,
  canSubmit,
  canShuffle,
  canClear,
}: GameControlsProps) => (
  <Container>
    <SecondaryButton type="button" onClick={onShuffle} disabled={!canShuffle}>
      Shuffle
    </SecondaryButton>
    <TertiaryButton type="button" onClick={onClear} disabled={!canClear}>
      Deselect
    </TertiaryButton>
    <PrimaryButton type="button" onClick={onSubmit} disabled={!canSubmit}>
      Submit
    </PrimaryButton>
  </Container>
);

export default GameControls;
