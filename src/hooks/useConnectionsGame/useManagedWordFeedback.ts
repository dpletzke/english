import { useCallback, useState } from "react";
import type {
  WordCardFeedbackMap,
  WordCardFeedbackStatus,
} from "../../game/types";

export const useManagedWordFeedback = () => {
  const [wordFeedback, setWordFeedback] = useState<WordCardFeedbackMap>({});

  const setFeedbackForIds = useCallback(
    (ids: string[], status: WordCardFeedbackStatus) => {
      if (ids.length === 0) {
        return;
      }
      setWordFeedback((prev) => {
        const next: WordCardFeedbackMap = { ...prev };
        ids.forEach((id) => {
          next[id] = status;
        });
        return next;
      });
    },
    [],
  );

  const resetFeedback = useCallback(() => {
    setWordFeedback({});
  }, []);

  const clearFeedbackForIds = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      return;
    }
    setWordFeedback((prev) => {
      const next: WordCardFeedbackMap = { ...prev };
      ids.forEach((id) => {
        delete next[id];
      });
      return next;
    });
  }, []);

  return {
    wordFeedback,
    setFeedbackForIds,
    resetFeedback,
    clearFeedbackForIds,
  };
};
