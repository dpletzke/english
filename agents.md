## Project Context

- **Name**: English Learning Connections
- **Stack**: React 19 + TypeScript + Vite, styled-components for styling.
- **Purpose**: Deliver a Connections-style word grouping game tailored to language-learning themes. Each puzzle reinforces vocabulary by asking players to find sets of four related words.
- **Primary Audience**: Learners seeking engaging vocabulary practice and instructors who want a ready-to-play warm-up activity.

## Product Goals

1. Provide a clean, frustration-free play experience that mirrors the mechanics of the New York Times “Connections” game.
2. Highlight learning progress by revealing solved categories in an order that communicates difficulty.
3. Encourage replayability through daily (date-driven) puzzle rotation.
4. Support quick iteration on both puzzles and UX improvements via a lightweight, modular codebase.

## Game Flow Overview

1. **Puzzle Selection**: `selectPuzzleForDate` chooses the puzzle keyed to today’s date, falling back to the latest past puzzle if needed.
2. **State Management**: `useConnectionsGame` hook orchestrates shuffled word cards, selection state, solved categories, mistake tracking, and win/lose transitions.
3. **Rendering**:
   - `App.tsx` composes the page layout and wires the hook to UI components.
   - `WordGrid` displays remaining cards and relays selection events.
   - `StatusBar` shows mistake pips (red active, beige spent).
   - `GameControls` exposes submit/shuffle/clear actions with guardrails.
   - `CategoryGroupList` renders solved categories (in difficulty order) and, on loss, the reveal list.
4. **Styling**: `GlobalStyle` applies base typography/colors; individual components use styled-components with small, focused style blocks.

## Repository Structure

```
src/
  App.tsx                // Root page assembly
  main.tsx               // React bootstrap with Vite entry
  data/puzzles.ts        // Puzzle data loading + helpers
  game/                  // Pure logic helpers (constants, utils, types)
  hooks/useConnectionsGame.ts // Central game state hook
  hooks/wordGrid/        // Drag + reorder hooks shared across WordGrid UI
  components/            // Presentational and layout components
  styles/GlobalStyle.ts  // Global CSS reset + theme primitives
public/                  // Static assets
```

### Key Modules

- `src/data/puzzles.ts`: Loads JSON puzzle definitions; formats date labels; exposes palette data.
- `src/game/utils.ts`: Pure helpers to normalize categories, order groups by difficulty, shuffle cards, and build `WordCard` entries.
- `src/hooks/useConnectionsGame.ts`: Encapsulates all runtime state. Any new game mechanic should route through this hook to keep the UI declarative.
- `src/hooks/wordGrid/`: Shared drag-and-drop hooks (`useWordSettle`, `useTileDrag`) exported via a barrel for the WordGrid UI.
- `src/components/index.ts`: Barrel export for UI building blocks; keep it in sync when adding new components.

## Coding Principles

- **Type Safety First**: Prefer deriving types from data (e.g., `CategoryDefinition`) and surface them through props. Avoid `any`.
- **Pure Logic vs UI**: Keep business rules in `/game` and `/hooks`. Components should stay presentational and read values via props.
- **Declarative State**: Let derived state (e.g., `revealCategories`) live in memoized selectors inside the hook instead of recomputing in components.
- **Minimal Side Effects**: Side effects should be isolated (e.g., the `useEffect` that resets state on puzzle change). New effects must reset all dependent state slices.
- **Styling**: Stick to styled-components with theme-friendly values. Favor functional class names and small reusable primitives.

## Extension Guidelines

1. **New Puzzle Sources**: Update `puzzles.json` (or future data adapters) and ensure the shape matches `ConnectionsPuzzle`. Add validation when ingesting external data.
2. **UX Enhancements**: Extend existing components rather than inlining logic in `App.tsx`. Example: add a `MistakeSummary` component if richer feedback is needed.
3. **State Changes**: Modify `useConnectionsGame` to introduce new gameplay (e.g., hints). Keep tests or stories nearby to lock in behavior.
4. **Theming**: Adjust global tokens in `GlobalStyle` and keep color definitions centralized in `colorSwatches`.

## Operational Notes for AI Assistants

- **Primary Objective**: Maintain an intuitive, accessible learning game while adding features that deepen vocabulary practice.
- **When Uncertain**: Default to reinforcing pedagogy—word clarity, consistent difficulty tiers, gentle error feedback.
- **Testing Expectations**: Run `npm run build` for type checks; add targeted unit tests when modifying `/game` logic. For UI tweaks, rely on component-level testing or storybook snapshots once they exist.
- **Instrumentation**: Dev/test builds no longer surface Playwright hooks; rely on component-level tests or manual QA when validating motion.
- **Guardrails**:
  - Do not introduce server dependencies; this app is client-only.
  - Avoid bloating the hook with UI responsibilities—create helper functions instead.
  - When editing puzzles, ensure four categories of four words each, with escalating difficulty.
- **Documentation**: Update `agents.md` whenever core goals shift, new subsystems appear, or coding conventions change.

## Roadmap Ideas

1. Hint system that highlights one correct pairing after several mistakes.
2. Progress tracking across days with local storage.
3. Audio pronunciation support for each word to aid language learners.
4. Admin puzzle builder UI for educators to create custom sets.

## Pending Refactors

- Monitor drag UX after the hook relocation. Any new motion or drag helpers should live alongside `useWordSettle` in `src/hooks/wordGrid/` so components stay presentation-only.

Keeping this document current lets any AI or human collaborator stay aligned with the project’s direction and structure.
