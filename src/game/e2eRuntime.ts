const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface E2ERuntimeConfig {
  dateOverrideKey: string | null;
  seed: string | null;
  noMotion: boolean;
  localOnly: boolean;
}

const isNonProduction =
  typeof import.meta !== "undefined" ? !import.meta.env.PROD : false;

const canReadWindow = () => typeof window !== "undefined";

const readSearchParams = (): URLSearchParams | null => {
  if (!canReadWindow()) {
    return null;
  }

  return new URLSearchParams(window.location.search);
};

const normalizeDateOverride = (value: string | null): string | null => {
  if (!value || !DATE_KEY_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map((segment) => Number(segment));
  const parsed = new Date(year, month - 1, day);
  const isValid =
    parsed.getFullYear() === year &&
    parsed.getMonth() + 1 === month &&
    parsed.getDate() === day;

  return isValid ? value : null;
};

export const getE2ERuntimeConfig = (): E2ERuntimeConfig => {
  if (!isNonProduction) {
    return {
      dateOverrideKey: null,
      seed: null,
      noMotion: false,
      localOnly: false,
    };
  }

  const searchParams = readSearchParams();
  const rawDateOverride = searchParams?.get("e2eDate") ?? null;
  const rawSeed = searchParams?.get("e2eSeed") ?? null;
  const rawNoMotion = searchParams?.get("e2eNoMotion") ?? null;
  const rawLocalOnly = searchParams?.get("e2eLocal") ?? null;

  return {
    dateOverrideKey: normalizeDateOverride(rawDateOverride),
    seed: rawSeed && rawSeed.length > 0 ? rawSeed : null,
    noMotion: rawNoMotion === "1",
    localOnly: rawLocalOnly === "1",
  };
};

const hashStringToUint32 = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createMulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const getE2ESeededRandom = (): (() => number) | null => {
  const { seed } = getE2ERuntimeConfig();
  if (!seed) {
    return null;
  }

  const numericSeed = hashStringToUint32(seed);
  return createMulberry32(numericSeed);
};

export const isE2ENoMotionEnabled = () => getE2ERuntimeConfig().noMotion;

export const isE2ELocalDataEnabled = () => getE2ERuntimeConfig().localOnly;
