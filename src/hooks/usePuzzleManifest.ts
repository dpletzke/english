import { useCallback, useEffect, useState } from "react";
import { fetchPuzzleManifest } from "../data/puzzles";

type LoadingState = {
  status: "loading";
  availableDates: string[];
  latestAvailable?: string;
  error?: undefined;
};

type LoadedState = {
  status: "loaded";
  availableDates: string[];
  latestAvailable?: string;
  error?: undefined;
};

type ErrorState = {
  status: "error";
  availableDates: string[];
  latestAvailable?: string;
  error: Error;
};

type ManifestState = LoadingState | LoadedState | ErrorState;

export const usePuzzleManifest = (): ManifestState & { retry: () => void } => {
  const [requestId, setRequestId] = useState(0);
  const [state, setState] = useState<ManifestState>({
    status: "loading",
    availableDates: [],
    latestAvailable: undefined,
  });

  const retry = useCallback(() => {
    setRequestId((id) => id + 1);
  }, []);

  useEffect(() => {
    let isActive = true;
    setState((previous) => ({
      ...previous,
      status: "loading",
      error: undefined,
    }));

    fetchPuzzleManifest()
      .then((availableDates) => {
        if (!isActive) {
          return;
        }

        setState({
          status: "loaded",
          availableDates,
          latestAvailable: availableDates[0],
        });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setState({
          status: "error",
          availableDates: [],
          latestAvailable: undefined,
          error: error instanceof Error
            ? error
            : new Error("Puzzle manifest request failed"),
        });
      });

    return () => {
      isActive = false;
    };
  }, [requestId]);

  return { ...state, retry };
};
