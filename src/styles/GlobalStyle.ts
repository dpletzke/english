import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  :root {
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #1f1f1f;
    background-color: #f7f5f0;
    --accent-color: #1f1f1f;
    --status-pip-active: #e36363;
    --status-pip-spent: #f2d7b6;
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

  html[data-e2e-no-motion="1"] *,
  html[data-e2e-no-motion="1"] *::before,
  html[data-e2e-no-motion="1"] *::after {
    animation: none !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
`;
