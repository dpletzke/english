export interface WordMotionPoint {
  x: number;
  y: number;
}

export interface WordMotionSample extends WordMotionPoint {
  wordId: string;
  timestamp: number;
}

export interface WordMotionTracer {
  start(wordId: string): void;
  record(wordId: string, point: WordMotionPoint): void;
  stop(wordId: string): void;
  clear(): void;
  getSamples(): WordMotionSample[];
  getSamplesByWord(wordId: string): WordMotionSample[];
  isEnabled(): boolean;
}

const fallbackNow = () => Date.now();

class ActiveWordMotionTracer implements WordMotionTracer {
  private samples: WordMotionSample[] = [];

  private samplesByWord = new Map<string, WordMotionSample[]>();

  private activeWordIds = new Set<string>();

  start(wordId: string) {
    this.activeWordIds.add(wordId);
    this.samplesByWord.set(wordId, []);
  }

  record(wordId: string, point: WordMotionPoint) {
    if (!this.activeWordIds.has(wordId) && !this.samplesByWord.has(wordId)) {
      return;
    }

    const now =
      typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : fallbackNow();

    const sample: WordMotionSample = {
      wordId,
      timestamp: now,
      x: point.x,
      y: point.y,
    };

    this.samples.push(sample);

    const wordSamples = this.samplesByWord.get(wordId);
    if (wordSamples) {
      wordSamples.push(sample);
    } else {
      this.samplesByWord.set(wordId, [sample]);
    }
  }

  stop(wordId: string) {
    this.activeWordIds.delete(wordId);
  }

  clear() {
    this.samples = [];
    this.samplesByWord.clear();
    this.activeWordIds.clear();
  }

  getSamples() {
    return [...this.samples];
  }

  getSamplesByWord(wordId: string) {
    return [...(this.samplesByWord.get(wordId) ?? [])];
  }

  isEnabled() {
    return true;
  }
}

const noopTracer: WordMotionTracer = {
  start() {
    /* no-op */
  },
  record() {
    /* no-op */
  },
  stop() {
    /* no-op */
  },
  clear() {
    /* no-op */
  },
  getSamples() {
    return [];
  },
  getSamplesByWord() {
    return [];
  },
  isEnabled() {
    return false;
  },
};

const isProduction = typeof import.meta !== "undefined" ? import.meta.env.PROD : true;

const tracerInstance: WordMotionTracer = isProduction
  ? noopTracer
  : new ActiveWordMotionTracer();

export const getWordMotionTracer = () => tracerInstance;

export const isWordMotionTracerEnabled = () => tracerInstance.isEnabled();
