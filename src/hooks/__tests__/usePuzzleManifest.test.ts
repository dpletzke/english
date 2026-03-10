import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import localPuzzlesJson from "../../data/puzzles.json" assert { type: "json" };

const originalFetch = global.fetch;

const resetModulesAndEnv = () => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  global.fetch = originalFetch;
};

const stubDevEnv = () => {
  vi.stubEnv("MODE", "development");
  vi.stubEnv("VITE_PUZZLES_URL_DEV", "https://example.com");
};

const stubProdEnv = () => {
  vi.stubEnv("MODE", "production");
  vi.stubEnv("VITE_PUZZLES_URL_PROD", "https://example.com");
};

const createResponse = <T,>(body: T, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(body),
});

describe("usePuzzleManifest", () => {
  afterEach(() => {
    resetModulesAndEnv();
  });

  it("loads S3-style manifest dates in descending order and exposes latest", async () => {
    resetModulesAndEnv();
    stubDevEnv();

    const fetchMock = vi.fn().mockResolvedValue(
      createResponse({
        puzzles: [
          { date: "2024-01-01", path: "puzzles/2024-01-01.json" },
          { date: "2024-01-03", path: "puzzles/2024-01-03.json" },
          { date: "2024-01-02", path: "puzzles/2024-01-02.json" },
          { date: "2024-01-03", path: "puzzles/2024-01-03.json" },
        ],
      }),
    );
    global.fetch = fetchMock as typeof global.fetch;

    const { usePuzzleManifest } = await import("../usePuzzleManifest");
    const { result } = renderHook(() => usePuzzleManifest());

    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("loaded"));

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/manifest.json");
    expect(result.current.availableDates).toEqual([
      "2024-01-03",
      "2024-01-02",
      "2024-01-01",
    ]);
    expect(result.current.latestAvailable).toBe("2024-01-03");
  });

  it("falls back to local puzzles when manifest cannot be reached in development", async () => {
    resetModulesAndEnv();
    stubDevEnv();

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn().mockRejectedValue(new Error("network failure"));
    global.fetch = fetchMock as typeof global.fetch;

    const { usePuzzleManifest } = await import("../usePuzzleManifest");
    const { result } = renderHook(() => usePuzzleManifest());

    await waitFor(() => expect(result.current.status).toBe("loaded"));

    const fallbackKeys = Object.keys(localPuzzlesJson as Record<string, unknown>)
      .sort()
      .reverse();

    expect(fetchMock).toHaveBeenCalledTimes(2); // tries both manifest paths
    expect(result.current.availableDates).toEqual(fallbackKeys);
    expect(result.current.latestAvailable).toBe(fallbackKeys[0]);

    warnSpy.mockRestore();
  });

  it("surfaces an error and recovers on retry in production mode", async () => {
    resetModulesAndEnv();
    stubProdEnv();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createResponse({}, false, 500))
      .mockResolvedValueOnce(createResponse({}, false, 404))
      .mockResolvedValueOnce(
        createResponse({
          puzzles: [{ date: "2024-03-01", path: "puzzles/2024-03-01.json" }],
        }),
      );
    global.fetch = fetchMock as typeof global.fetch;

    const { usePuzzleManifest } = await import("../usePuzzleManifest");
    const { result } = renderHook(() => usePuzzleManifest());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.availableDates).toEqual([]);
    expect(result.current.latestAvailable).toBeUndefined();

    act(() => {
      result.current.retry();
    });

    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.availableDates).toEqual(["2024-03-01"]);
    expect(result.current.latestAvailable).toBe("2024-03-01");
  });
});
