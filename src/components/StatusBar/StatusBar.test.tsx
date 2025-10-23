import { screen } from "@testing-library/react";
import { vi } from "vitest";

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

  it("annotates animation state on each pip", () => {
    renderWithProviders(
      <StatusBar mistakesAllowed={4} mistakesRemaining={2} />,
    );

    const pips = screen.getAllByLabelText(/mistake/i);
    const [first, second, third, fourth] = pips;

    expect(first).toHaveAttribute("data-state", "active");
    expect(second).toHaveAttribute("data-state", "active");
    expect(third).toHaveAttribute("data-state", "spent");
    expect(fourth).toHaveAttribute("data-state", "spent");
  });

  it("respects the prefers-reduced-motion media query", () => {
    const originalMatchMedia = window.matchMedia;

    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: mockMatchMedia,
    });

    renderWithProviders(
      <StatusBar mistakesAllowed={4} mistakesRemaining={4} />,
    );

    const pip = screen.getAllByLabelText(/mistake/i)[0];
    expect(pip).toHaveAttribute("data-motion", "reduced");

    if (originalMatchMedia) {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: originalMatchMedia,
      });
    } else {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        configurable: true,
        value: undefined,
      });
    }
  });
});
