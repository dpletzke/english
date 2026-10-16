import {
  getPuzzleResult,
  getPuzzleResultsByDateKey,
  getSolvedPuzzleDateKeys,
  hasPuzzleBeenLost,
  hasPuzzleBeenSolved,
  markPuzzleLost,
  markPuzzleSolved,
} from "../puzzleProgress";

const STORAGE_KEY = "connectionsPuzzleProgress.v1";

describe("puzzleProgress", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns false when no solved data exists", () => {
    expect(hasPuzzleBeenSolved("2026-03-10")).toBe(false);
  });

  it("marks a puzzle date as solved and reads it back", () => {
    markPuzzleSolved("2026-03-10");

    expect(hasPuzzleBeenSolved("2026-03-10")).toBe(true);
    expect(getSolvedPuzzleDateKeys()).toEqual(["2026-03-10"]);
  });

  it("ignores duplicate solves for the same date", () => {
    markPuzzleSolved("2026-03-10");
    markPuzzleSolved("2026-03-10");

    expect(getSolvedPuzzleDateKeys()).toEqual(["2026-03-10"]);
  });

  it("marks a puzzle date as lost and reads it back", () => {
    markPuzzleLost("2026-03-11");

    expect(hasPuzzleBeenLost("2026-03-11")).toBe(true);
    expect(hasPuzzleBeenSolved("2026-03-11")).toBe(false);
    expect(getPuzzleResult("2026-03-11")).toBe("lost");
  });

  it("keeps won when trying to overwrite with lost", () => {
    markPuzzleSolved("2026-03-10");
    markPuzzleLost("2026-03-10");

    expect(getPuzzleResult("2026-03-10")).toBe("won");
    expect(hasPuzzleBeenSolved("2026-03-10")).toBe(true);
    expect(hasPuzzleBeenLost("2026-03-10")).toBe(false);
  });

  it("migrates legacy solvedDateKeys payloads", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ solvedDateKeys: ["2026-03-10"] }),
    );

    expect(getPuzzleResult("2026-03-10")).toBe("won");
    expect(hasPuzzleBeenSolved("2026-03-10")).toBe(true);
  });

  it("handles invalid storage payload by falling back to empty state", () => {
    window.localStorage.setItem(STORAGE_KEY, "{invalid json");

    expect(getSolvedPuzzleDateKeys()).toEqual([]);
    expect(hasPuzzleBeenSolved("2026-03-10")).toBe(false);
  });

  it("returns all puzzle results in one snapshot", () => {
    markPuzzleSolved("2026-03-10");
    markPuzzleLost("2026-03-11");

    expect(getPuzzleResultsByDateKey()).toEqual({
      "2026-03-10": "won",
      "2026-03-11": "lost",
    });
  });

  describe("when browser storage throws", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("reads as empty when getItem throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });

      expect(getPuzzleResult("2026-03-10")).toBeNull();
      expect(getPuzzleResultsByDateKey()).toEqual({});
    });

    it("does not throw when setItem exceeds quota", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

      expect(() => markPuzzleSolved("2026-03-10")).not.toThrow();
      expect(() => markPuzzleLost("2026-03-11")).not.toThrow();
    });

    it("does not throw when accessing window.localStorage throws", () => {
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });

      expect(() => markPuzzleSolved("2026-03-10")).not.toThrow();
      expect(getPuzzleResult("2026-03-10")).toBeNull();
    });
  });
});
