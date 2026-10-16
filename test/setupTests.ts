import '@testing-library/jest-dom'

// ensure localStorage.clear exists in environments where it may be a plain object
if (typeof window !== 'undefined') {
  try {
    const ls = window.localStorage as Partial<Storage> | undefined;
    if (!ls || typeof ls.clear !== 'function') {
      const store: Record<string,string> = {};
      const fallback: Storage = {
        getItem(key: string) { return store[key] ?? null },
        setItem(key: string, value: string) { store[key] = String(value) },
        removeItem(key: string) { delete store[key] },
        clear() { for (const k in store) delete store[k] },
        key(i: number) { return Object.keys(store)[i] ?? null },
        get length() { return Object.keys(store).length }
      };
      globalThis.localStorage = fallback;
    }
  } catch {
    // ignore
  }
}
