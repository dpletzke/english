import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CategoryDefinition } from "../../data/puzzles";
import type { WordCard } from "../../game/types";
import { renderWithProviders } from "../../test/renderWithProviders";
import WordGrid from "./WordGrid";
import type { WordGridDragConfig } from "./WordGrid.types";

const buildWordCard = (overrides: Partial<WordCard>): WordCard => ({
  id: "alpha-0",
  label: "Alpha",
  categoryId: "alpha",
  color: "yellow",
  ...overrides,
});

const sampleWords: WordCard[] = [
  buildWordCard({ id: "alpha-0", label: "Alpha", categoryId: "alpha" }),
  buildWordCard({ id: "alpha-1", label: "Beta", categoryId: "alpha" }),
  buildWordCard({ id: "bravo-0", label: "Gamma", categoryId: "bravo", color: "green" }),
  buildWordCard({ id: "charlie-1", label: "Delta", categoryId: "charlie", color: "blue" }),
];

const solved: CategoryDefinition[] = [
  {
    id: "solved-1",
    title: "Solved Group",
    color: "purple",
    words: ["One", "Two", "Three", "Four"],
  },
];

describe("WordGrid", () => {
  it("renders solved categories above remaining word cards", () => {
    renderWithProviders(
      <WordGrid
        words={sampleWords}
        selectedWordIds={[]}
        onToggleWord={vi.fn()}
        solvedCategories={solved}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: /solved group/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(sampleWords.length);
  });

  it("invokes onToggleWord when a word tile is clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <WordGrid
        words={sampleWords}
        selectedWordIds={[]}
        onToggleWord={onToggle}
        solvedCategories={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Alpha" }));

    expect(onToggle).toHaveBeenCalledWith("alpha-0");
  });

  it("disables all tiles when the grid is disabled", () => {
    renderWithProviders(
      <WordGrid
        words={sampleWords}
        selectedWordIds={[]}
        onToggleWord={vi.fn()}
        solvedCategories={[]}
        disabled
      />,
    );

    screen.getAllByRole("button").forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("marks the dragging tile when drag configuration is provided", () => {
    const dragConfig: WordGridDragConfig = {
      draggingWordId: "alpha-0",
      dragTargetWordId: null,
      isDragLocked: false,
      onWordDragStart: vi.fn(),
      onWordDragMove: vi.fn(),
      onWordDragEnd: vi.fn(),
      pendingDragSettle: null,
      clearPendingDragSettle: vi.fn(),
      layoutLockedWordId: null,
      clearLayoutLockedWord: vi.fn(),
    };

    renderWithProviders(
      <WordGrid
        words={sampleWords}
        selectedWordIds={[]}
        onToggleWord={vi.fn()}
        solvedCategories={[]}
        dragConfig={dragConfig}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Alpha" }),
    ).toHaveAttribute("data-dragging", "true");
    expect(
      screen.getByRole("button", { name: "Beta" }),
    ).not.toHaveAttribute("data-dragging");
  });
});
