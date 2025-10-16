import { screen } from "@testing-library/react";

import { renderWithProviders } from "../../test/renderWithProviders";
import StatusBar from "./StatusBar";

describe("StatusBar", () => {
  it("renders the correct number of active and spent mistake pips", () => {
    renderWithProviders(
      <StatusBar mistakesAllowed={4} mistakesRemaining={2} />,
    );

    const pips = screen.getAllByLabelText(/mistake/i);
    const active = pips.filter((pip) => pip.getAttribute("aria-label") === "mistake remaining");
    const spent = pips.filter((pip) => pip.getAttribute("aria-label") === "mistake used");

    expect(pips).toHaveLength(4);
    expect(active).toHaveLength(2);
    expect(spent).toHaveLength(2);
  });
});
