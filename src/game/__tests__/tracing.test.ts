import { beforeEach, describe, expect, it } from "vitest";
import { getWordMotionTracer, isWordMotionTracerEnabled } from "../tracing";

const tracer = getWordMotionTracer();

describe("word motion tracer", () => {
  beforeEach(() => {
    tracer.clear();
  });

  it("aligns enabled flag with exported helper", () => {
    expect(tracer.isEnabled()).toBe(isWordMotionTracerEnabled());
  });

  it("records samples when enabled and remains inert otherwise", () => {
    tracer.start("alpha");
    tracer.record("alpha", { x: 5, y: 10 });
    tracer.stop("alpha");

    const samples = tracer.getSamplesByWord("alpha");
    if (tracer.isEnabled()) {
      expect(samples).toHaveLength(1);
      expect(samples[0]).toMatchObject({ wordId: "alpha", x: 5, y: 10 });
    } else {
      expect(samples).toHaveLength(0);
    }
  });

  it("clears stored samples", () => {
    tracer.start("beta");
    tracer.record("beta", { x: 1, y: 1 });
    tracer.stop("beta");
    tracer.clear();
    expect(tracer.getSamples()).toHaveLength(0);
    expect(tracer.getSamplesByWord("beta")).toHaveLength(0);
  });
});
