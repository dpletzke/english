import styled from 'styled-components'

interface GameHeaderProps {
  title: string
  subtitle: string
}

const GameHeader = ({ title, subtitle }: GameHeaderProps) => (
  <Header>
    <Title>{title}</Title>
    <Subtitle>{subtitle}</Subtitle>
  </Header>
)

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

export default GameHeader
