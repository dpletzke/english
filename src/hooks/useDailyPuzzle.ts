import { useEffect, useMemo, useState } from "react";
import type { ConnectionsPuzzle } from "../data/puzzles";
import { fetchPuzzleByDateKey, getPuzzleDateKey } from "../data/puzzles";

type LoadingState = { status: "loading"; puzzle?: undefined; error?: undefined };
type LoadedState = {
  status: "loaded";
  puzzle: ConnectionsPuzzle;
  error?: undefined;
};
type ErrorState = { status: "error"; puzzle?: undefined; error: Error };

type PuzzleState = (LoadingState | LoadedState | ErrorState) & {
  dateKey: string;
};

export const useDailyPuzzle = (date: Date) => {
  const dateKey = useMemo(() => getPuzzleDateKey(date), [date]);
  const [state, setState] = useState<PuzzleState>(() => ({
    status: "loading",
    dateKey,
  }));

  useEffect(() => {
    let isSubscribed = true;
    setState({ status: "loading", dateKey });

    fetchPuzzleByDateKey(dateKey)
      .then((puzzle) => {
        if (!isSubscribed) {
          return;
        }
        setState({ status: "loaded", dateKey, puzzle });
      })
      .catch((error: unknown) => {
        if (!isSubscribed) {
          return;
        }
        setState({
          status: "error",
          dateKey,
          error: error instanceof Error ? error : new Error("Puzzle request failed"),
        });
      });

    return () => {
      isSubscribed = false;
    };
  }, [dateKey]);

  return state;
};
