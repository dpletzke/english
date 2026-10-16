import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useTileDrag } from "../useTileDrag";

vi.mock("framer-motion", () => ({
  useDragControls: () => ({ start: vi.fn() }),
}));

const createTouchPointerDown = () => {
  const nativeEvent = {
    pointerType: "touch",
    clientX: 10,
    clientY: 10,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
  return {
    clientX: 10,
    clientY: 10,
    nativeEvent,
  } as unknown as ReactPointerEvent<HTMLButtonElement>;
};

const renderTileDrag = (onWordDragStart = vi.fn()) => {
  const hook = renderHook(() =>
    useTileDrag({
      cardId: "card-1",
      dragEnabled: true,
      disabled: false,
      isDragLocked: false,
      draggingWordId: null,
      dragTargetWordId: null,
      onWordDragStart,
      reportDragSettle: vi.fn(),
    }),
  );
  return { ...hook, onWordDragStart };
};

describe("useTileDrag touch long-press", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    vi.stubGlobal("requestAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts a drag once the long-press delay elapses", () => {
    const { result, onWordDragStart } = renderTileDrag();

    act(() => {
      result.current.handlePointerDown(createTouchPointerDown());
    });
    expect(onWordDragStart).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onWordDragStart).toHaveBeenCalledWith("card-1");
  });

  it("does not start a drag when the pointer ends before the delay", () => {
    const { result, onWordDragStart } = renderTileDrag();

    act(() => {
      result.current.handlePointerDown(createTouchPointerDown());
      result.current.handlePointerEnd();
      vi.advanceTimersByTime(250);
    });

    expect(onWordDragStart).not.toHaveBeenCalled();
  });
});
