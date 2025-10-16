import type { ReactElement } from "react";
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";

import { GlobalStyle } from "../styles/GlobalStyle";

export const renderWithProviders = (
  ui: ReactElement,
  options?: RenderOptions,
) =>
  render(
    <>
      <GlobalStyle />
      {ui}
    </>,
    options,
  );
