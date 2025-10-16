# English Learning Connections

English Learning Connections is a Connections-style vocabulary puzzler that helps learners and instructors reinforce themed word groups. Each day’s puzzle challenges players to spot four sets of related terms, mirroring the mechanics of the New York Times game while staying focused on language-learning goals.

## Features
- Date-driven puzzle rotation with automatic fallback to the latest available puzzle.
- Guided game flow that tracks selections, mistakes, and solved categories.
- Styled-components presentation with difficulty-ordered reveal of completed groups.
- Type-safe React 19 + TypeScript + Vite architecture for fast iteration.

## Getting Started
```bash
npm install
npm run dev
```

### Quality checks
- `npm run build` – type check + production bundle
- `npm run test` / `npm run test:watch` – Vitest suite with @testing-library
- `npm run lint` and `npm run format` – code style enforcement

## Project Structure
```
src/
  data/                 // Puzzle data accessors and formatting helpers
  game/                 // Pure logic (constants, utils, types)
  hooks/                // Game state hooks
  components/           // Presentational building blocks
  styles/               // Global theme and shared CSS primitives
```

Puzzles live in `src/data/puzzles.json` and must contain four categories of four words. Update `agents.md` when major goals, conventions, or subsystems change so future contributors stay aligned.
