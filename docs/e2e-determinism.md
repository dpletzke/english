# E2E Determinism Preconditions

Use this as the contract before adding Playwright tests.

## Required controls

1. Fixed puzzle date in test runs
- Provide a test-only date override (query param or env-driven hook).
- All E2E runs must resolve the same puzzle date regardless of wall clock time.

2. Deterministic shuffle in test runs
- Replace `Math.random` behavior with a seeded shuffle source in test mode.
- The same seed must produce the same tile order across runs/machines.

3. Stable interaction targets
- Prefer semantic selectors and add `data-testid` only where semantics are not stable.
- Avoid selectors tied to animation timing or DOM position.

4. Controlled animation behavior
- Reduce or disable non-essential motion in E2E mode to avoid timing flakes.
- Assertions should wait for stable UI states, not fixed delays.

## Verification checklist

- Running the same E2E spec twice produces the same selected puzzle and initial grid order.
- Shuffle assertions pass identically for the same seed.
- Tests pass in headless mode without manual waits.
