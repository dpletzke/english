import styled from "styled-components";

const WordSection = styled.section`
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  gap: 20px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding-inline: clamp(2px, 1.8vw, 10px);
  justify-items: center;
  align-items: center;
`;

export default WordSection;
