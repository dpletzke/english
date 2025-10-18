import type { RefObject } from "react";

export const clearTimeoutRef = (ref: RefObject<number | null>) => {
  if (ref.current !== null) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
};

export const clearTimeoutCollection = (
  ref: RefObject<number[]>,
) => {
  if (ref.current.length === 0) {
    return;
  }
  ref.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
  ref.current = [];
};

export const scheduleManagedTimeout = (
  ref: RefObject<number[]>,
  handler: () => void,
  delayMs: number,
) => {
  const timeoutId = window.setTimeout(() => {
    ref.current = ref.current.filter((stored) => stored !== timeoutId);
    handler();
  }, delayMs);

  ref.current.push(timeoutId);
  return timeoutId;
};
