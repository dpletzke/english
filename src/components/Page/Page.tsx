import styled from "styled-components";

const Page = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 100dvh;
  padding: 48px clamp(4px, 2vw, 24px);
  gap: 24px;
`;

export default Page;
