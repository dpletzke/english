import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithProviders } from "../../test/renderWithProviders";
import GameResult from "./GameResult";

describe("GameResult", () => {
  it("announces a win with the success message", () => {
    renderWithProviders(<GameResult status="won" onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/puzzle solved/i);
    expect(screen.getByText(/you solved today's puzzle/i)).toBeInTheDocument();
  });

  it("announces a loss with the review message", () => {
    renderWithProviders(<GameResult status="lost" onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/puzzle over/i);
    expect(screen.getByText(/you're out of mistakes/i)).toBeInTheDocument();
  });

  it("invokes onClose when the button is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<GameResult status="won" onClose={handleClose} />);

    await user.click(screen.getByRole("button", { name: /return to puzzle/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
