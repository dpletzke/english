import styled from 'styled-components'

interface StatusBarProps {
  mistakesAllowed: number
  mistakesRemaining: number
  solvedCount: number
  totalCategories: number
}

const StatusBar = ({
  mistakesAllowed,
  mistakesRemaining,
  solvedCount,
  totalCategories,
}: StatusBarProps) => (
  <Container>
    <MistakeLabel>Mistakes remaining</MistakeLabel>
    <MistakeTrack>
      {Array.from({ length: mistakesAllowed }).map((_, index) => {
        const pipActive = index < mistakesRemaining
        return <MistakePip key={index} $active={pipActive} />
      })}
    </MistakeTrack>
    <ProgressText>
      {solvedCount} / {totalCategories} solved
    </ProgressText>
  </Container>
)

const Container = styled.section`
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

export default StatusBar
