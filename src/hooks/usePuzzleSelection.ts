import { useEffect, useMemo, useState } from "react";
import {
  formatPuzzleDateShortLabel,
  getPuzzleDateKey,
} from "../data/puzzles";
import {
  getPuzzleResultsByDateKey,
  PUZZLE_PROGRESS_UPDATED_EVENT,
} from "../game/puzzleProgress";

export type DateStatus = "won" | "lost" | "pending";

export interface UsePuzzleSelectionArgs {
  manifestStatus: "loading" | "loaded" | "error";
  availableDates: string[];
  latestAvailable?: string;
}

interface UsePuzzleSelectionResult {
  todayDateKey: string;
  selectedDateKey: string;
  activeDateKey: string | null;
  availableDates: string[];
  dateStatuses: Record<string, DateStatus>;
  dateLabelShort: string;
  handleSelectDate: (dateKey: string) => void;
}

const SELECTED_PUZZLE_DATE_STORAGE_KEY = "selectedPuzzleDate";

export const usePuzzleSelection = ({
  manifestStatus,
  availableDates,
  latestAvailable,
}: UsePuzzleSelectionArgs): UsePuzzleSelectionResult => {
  const todayDateKey = useMemo(() => getPuzzleDateKey(new Date()), []);
  const storedDateKey = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(SELECTED_PUZZLE_DATE_STORAGE_KEY);
  }, []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    storedDateKey || todayDateKey,
  );
  const [activeDateKey, setActiveDateKey] = useState<string | null>(null);
  const [progressRevision, setProgressRevision] = useState(0);

  const dateLabelKey =
    activeDateKey ?? selectedDateKey ?? latestAvailable ?? todayDateKey;
  const dateLabelShort = formatPuzzleDateShortLabel(dateLabelKey);

  const dateStatuses = useMemo<Record<string, DateStatus>>(() => {
    const resultsByDateKey = getPuzzleResultsByDateKey();
    return Object.fromEntries(
      availableDates.map((dateKey) => [
        dateKey,
        resultsByDateKey[dateKey] ?? "pending",
      ]),
    );
  }, [availableDates, progressRevision]);

  const handleSelectDate = (dateKey: string) => {
    if (!availableDates.includes(dateKey)) {
      return;
    }
    setSelectedDateKey(dateKey);
    setActiveDateKey(dateKey);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !selectedDateKey) {
      return;
    }

    window.localStorage.setItem(
      SELECTED_PUZZLE_DATE_STORAGE_KEY,
      selectedDateKey,
    );
  }, [selectedDateKey]);

  useEffect(() => {
    if (manifestStatus === "loaded") {
      if (!latestAvailable) {
        setActiveDateKey(null);
        return;
      }

      const isSelectedAvailable = availableDates.includes(selectedDateKey);
      const isTodayAvailable = availableDates.includes(todayDateKey);

      const nextDateKey = isSelectedAvailable
        ? selectedDateKey
        : isTodayAvailable
          ? todayDateKey
          : latestAvailable;

      setActiveDateKey(nextDateKey);
      if (nextDateKey !== selectedDateKey) {
        setSelectedDateKey(nextDateKey);
      }
      return;
    }

    if (manifestStatus === "error") {
      setActiveDateKey((current) => current ?? selectedDateKey ?? todayDateKey);
    }
  }, [
    manifestStatus,
    availableDates,
    latestAvailable,
    selectedDateKey,
    todayDateKey,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleProgressUpdated = () => {
      setProgressRevision((value) => value + 1);
    };

    window.addEventListener(PUZZLE_PROGRESS_UPDATED_EVENT, handleProgressUpdated);
    return () => {
      window.removeEventListener(
        PUZZLE_PROGRESS_UPDATED_EVENT,
        handleProgressUpdated,
      );
    };
  }, []);

  return {
    todayDateKey,
    selectedDateKey,
    activeDateKey,
    availableDates,
    dateStatuses,
    dateLabelShort,
    handleSelectDate,
  };
};
