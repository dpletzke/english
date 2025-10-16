import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
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
`;
