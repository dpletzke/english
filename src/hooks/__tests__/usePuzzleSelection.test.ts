import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPuzzleDateKey } from "../../data/puzzles";
import * as puzzleProgress from "../../game/puzzleProgress";
import { usePuzzleSelection } from "../usePuzzleSelection";

const STORAGE_KEY = "selectedPuzzleDate";

const buildArgs = (overrides?: Partial<Parameters<typeof usePuzzleSelection>[0]>) => ({
  manifestStatus: "loaded" as const,
  availableDates: ["2026-03-10", "2026-03-09", "2026-03-08"],
  latestAvailable: "2026-03-10",
  ...overrides,
});

describe("usePuzzleSelection", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(puzzleProgress, "getPuzzleResultsByDateKey").mockReturnValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes selected date from storage or falls back to today", () => {
    const todayDateKey = getPuzzleDateKey(new Date());
    window.localStorage.setItem(STORAGE_KEY, "2026-03-09");

    const { result, unmount } = renderHook(() => usePuzzleSelection(buildArgs()));

    expect(result.current.selectedDateKey).toBe("2026-03-09");
    expect(result.current.activeDateKey).toBe("2026-03-09");

    unmount();
    window.localStorage.clear();

    const { result: fallbackResult } = renderHook(() =>
      usePuzzleSelection(buildArgs()),
    );

    expect(fallbackResult.current.selectedDateKey).toBe(todayDateKey);
  });

  it("applies manifest fallback order: selected, then today, then latest", async () => {
    const todayDateKey = getPuzzleDateKey(new Date());
    window.localStorage.setItem(STORAGE_KEY, "2026-03-09");
    const { result, rerender } = renderHook(
      ({ args }) => usePuzzleSelection(args),
      { initialProps: { args: buildArgs() } },
    );

    expect(result.current.activeDateKey).toBe("2026-03-09");

    rerender({
      args: buildArgs({
        availableDates: [todayDateKey, "2026-03-08"],
      }),
    });
    await waitFor(() => expect(result.current.activeDateKey).toBe(todayDateKey));

    rerender({
      args: buildArgs({
        availableDates: ["2026-03-08"],
        latestAvailable: "2026-03-08",
      }),
    });
    await waitFor(() => expect(result.current.activeDateKey).toBe("2026-03-08"));
    expect(result.current.selectedDateKey).toBe("2026-03-08");
  });

  it("ignores handleSelectDate calls for unavailable dates", () => {
    const { result } = renderHook(() => usePuzzleSelection(buildArgs()));

    act(() => {
      result.current.handleSelectDate("2030-01-01");
    });

    const todayDateKey = getPuzzleDateKey(new Date());
    expect(result.current.selectedDateKey).toBe(todayDateKey);
    expect(result.current.activeDateKey).toBe(todayDateKey);
  });

  it("recomputes dateStatuses when progress update event fires", async () => {
    let results: Record<string, puzzleProgress.PuzzleResult> = {};
    const getResultsSpy = vi
      .spyOn(puzzleProgress, "getPuzzleResultsByDateKey")
      .mockImplementation(() => results);

    const { result } = renderHook(() => usePuzzleSelection(buildArgs()));

    expect(result.current.dateStatuses["2026-03-10"]).toBe("pending");

    results = { "2026-03-10": "won" };
    act(() => {
      window.dispatchEvent(new Event(puzzleProgress.PUZZLE_PROGRESS_UPDATED_EVENT));
    });

    await waitFor(() =>
      expect(result.current.dateStatuses["2026-03-10"]).toBe("won"),
    );
    expect(getResultsSpy).toHaveBeenCalled();
  });

  it("persists selected date when a valid new date is chosen", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => usePuzzleSelection(buildArgs()));

    act(() => {
      result.current.openDatePicker();
      result.current.handleSelectDate("2026-03-08");
    });

    await waitFor(() =>
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("2026-03-08"),
    );
    expect(result.current.isDatePickerOpen).toBe(false);
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, "2026-03-08");
  });
});
