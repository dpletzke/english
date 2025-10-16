import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";
import GameControls from "./GameControls";

describe("GameControls", () => {
  it("disables buttons according to the provided flags", () => {
    renderWithProviders(
      <GameControls
        onSubmit={vi.fn()}
        onShuffle={vi.fn()}
        onClear={vi.fn()}
        canSubmit={false}
        canShuffle={false}
        canClear={false}
      />,
    );

    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /shuffle/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /deselect/i })).toBeDisabled();
  });

  it("calls the appropriate handlers when buttons are clicked", async () => {
    const handlers = {
      onSubmit: vi.fn(),
      onShuffle: vi.fn(),
      onClear: vi.fn(),
    };
    const user = userEvent.setup();

    renderWithProviders(
      <GameControls
        {...handlers}
        canSubmit
        canShuffle
        canClear
      />,
    );

    await user.click(screen.getByRole("button", { name: /shuffle/i }));
    await user.click(screen.getByRole("button", { name: /deselect/i }));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(handlers.onShuffle).toHaveBeenCalledTimes(1);
    expect(handlers.onClear).toHaveBeenCalledTimes(1);
    expect(handlers.onSubmit).toHaveBeenCalledTimes(1);
  });
});
