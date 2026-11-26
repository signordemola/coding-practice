# Module 03: React / frontend

**Why this module third:** React is on most of the roles I apply for after JavaScript and TypeScript (see `../../roles/`). Gaps from past interviews are marked ★: Redux Toolkit (micro1 Senior Frontend, 24 Nov 2026) and the standard questions on effects, re-rendering and forms.

**How it was built (26 Nov 2026):**
- **react.dev**, read from its source repository (`reactjs/react.dev`, commit `15653c0`, 24 Nov 2026). The pages don't carry their own dates, so that commit is the date.
  - "Learn" pages were read in full.
  - Long reference pages were read in full for their reference, caveats and the usage sections used here; each topic lists exactly what was read.
  - Live demo code (sandbox CSS, long demo files) was skimmed, not studied line by line.
- **React versions (npm, 26 Nov 2026):** `react`/`react-dom` 19.3.1 (19.3.0 released 9 Sep 2026). The React 19, React 19.3 and React Compiler 1.0 release posts were read for what's new.
- **Redux:** redux-toolkit.js.org (`reduxjs/redux-toolkit`, commit `b87a80f`, 25 Nov 2026) and redux.js.org (`reduxjs/redux`, commit `ce8d836`, 23 Nov 2026). Versions: `@reduxjs/toolkit` 2.15.0, `react-redux` 9.3.1.
- **One older source:** the React 17 RC post on legacy.reactjs.org, for event delegation, read through the web fetcher.
- **Every behaviour is checked by running real React.** `examples/` has one `.tsx` file per topic (except 13). Each renders components into a jsdom document with React's own `act()`, clicks, types and submits, and asserts what happens: render counts, logs, DOM, warnings.
  - Development-only behaviour (Strict Mode) runs on React's development build.
  - One check runs React's production build in a separate process to show the difference.
- The examples are type-checked with strict TypeScript (tsc 7.0.2) and compiled before running, because Node can't run JSX directly.
- Run on **Node 22.23.4** (my build workspace). jsdom 31 supports Node 22.22+ and 26, so it should also run on your Mac.
- Anything that's my own reasoning, or a library I name without having read its docs, is marked.

## How to use it
1. Read a topic page.
2. Open its example file and predict each `assert` before reading it.
3. Close both; answer the practice questions out loud, then check.
4. Say the "Say it" answer in your own words, timed.
5. Before an interview, do the mock round.

**Run every check:**
```bash
cd interview-prep/modules/03-react/examples
pnpm install          # its own dependencies and lockfile, separate from the lessons
node run-all.js
```

## Topics

| # | Topic | Main sources | Example file |
|---|---|---|---|
| 01 | [Rendering model: purity, render/commit, snapshots, batching, position and keys](01-rendering-model.md) | Keeping Components Pure; Render and Commit; State as a Snapshot; Queueing Updates; Preserving and Resetting State; Rendering Lists | `01-rendering-model.tsx` |
| 02 | [Updating state immutably; structuring state](02-state-updates.md) | Updating Objects/Arrays; Choosing the State Structure; Sharing State | `02-state-updates.tsx` |
| 03 | [★ Effects: sync, cleanup, dependencies, races, stale closures, when not to use one](03-effects.md) | Synchronizing with Effects; You Might Not Need an Effect; Lifecycle of Reactive Effects; Separating Events; Removing Dependencies | `03-effects.tsx` |
| 04 | [Refs and the DOM](04-refs-dom.md) | Referencing Values with Refs; Manipulating the DOM; React 19 post | `04-refs-dom.tsx` |
| 05 | [useReducer, context, where state lives](05-reducer-context.md) | Reducer; Context; Reducer + Context; Redux FAQ | `05-reducer-context.tsx` |
| 06 | [★ Re-rendering and performance: memo, useMemo, useCallback, React Compiler](06-performance.md) | `memo`; `useMemo`; `useCallback`; React Compiler | `06-performance.tsx` |
| 07 | [★ Forms: controlled vs uncontrolled, Actions, useActionState, useFormStatus](07-forms.md) | `<input>`; `<form>`; `useActionState`; `useFormStatus`; `useOptimistic` | `07-forms.tsx` |
| 08 | [Events and delegation at the root](08-events.md) | Responding to Events; React 17 RC post | `08-events.tsx` |
| 09 | [Rules of Hooks, custom Hooks, `use`, useSyncExternalStore](09-hooks-rules-custom.md) | Rules of Hooks; Custom Hooks; `use`; `useSyncExternalStore` | `09-hooks-rules-custom.tsx` |
| 10 | [Suspense, lazy, Transitions, useDeferredValue, Error Boundaries](10-suspense-transitions-errors.md) | `Suspense`; `lazy`; `useTransition`; `useDeferredValue`; `Component` | `10-suspense-transitions-errors.tsx` |
| 11 | [Class components and the lifecycle](11-class-components.md) | `Component`; `StrictMode` | `11-class-components.tsx` |
| 12 | [★ Redux Toolkit and RTK Query](12-redux-toolkit.md) | RTK docs; Redux FAQ and style guide | `12-redux-toolkit.tsx` |
| 13 | [Server Components and `'use client'`](13-server-components.md) | Server Components; `'use client'`; React 19.3 post | none (needs a framework) |

## Mock round (20 questions, about 15 minutes)
Answer each out loud in under a minute. The topic number is where the answer lives.

1. What does "rendering" mean, and how is it different from committing? (01)
2. Predict: three `setCount(count + 1)` calls in one click. How do you add 3? (01)
3. Why does Strict Mode run things twice, and what should you do about it? (01, 03)
4. When is a component's state kept or reset? Why not index keys? (01)
5. Why doesn't `obj.x = 1; setObj(obj)` re-render? Update a nested field correctly. (02)
6. What's redundant or duplicated state? Give an example and the fix. (02)
7. ★ What's an Effect for? Effect vs event handler. (03)
8. ★ Walk through the cleanup order when a dependency changes. (03)
9. ★ How do you avoid a race condition when fetching in an Effect? (03)
10. ★ What's a stale closure in an Effect, and two ways to fix it? (03)
11. Name four things you don't need an Effect for. (03)
12. Ref vs state. Why is a DOM ref `null` during render? (04)
13. useState vs useReducer. Why must a reducer be pure? (05)
14. When would you use context, and what should you try first? (05)
15. ★ Why does a child re-render when its props didn't change? How do `memo`, `useMemo` and `useCallback` help, and what does React Compiler change? (06)
16. ★ Controlled vs uncontrolled inputs; fix "changing an uncontrolled input to be controlled". (07)
17. ★ Walk through a form using `useActionState` and `useFormStatus`. (07)
18. How does React attach event handlers, and what changed in React 17? (08)
19. Why can't Hooks be called conditionally? What's the exception? (09)
20. ★ Redux Toolkit: what do `configureStore`, `createSlice` and `createAsyncThunk` give you? When would you use RTK Query? (12)

Bonus: what doesn't an Error Boundary catch (10)? Server vs Client Components (13)?

## What moved here from the old guide (`interview-bank/study-guide.md`, Part A, and the React bits of Part B)

| Old | New | Changes after checking against the docs |
|---|---|---|
| R1 advanced JS for React | 02 (state), module 01 | The JS parts are module 01. Kept the immutability examples; added react.dev's reasons not to mutate and the shared-item array bug. |
| R2 lifecycle | 03, 11 | Lifecycle now per Effect (start/stop), with cleanup order checked. `useEffectEvent` explained from the docs. Class methods in 11. |
| R3 state in large apps | 05 | The table is kept with a source per row. URL state is marked as my practice. Zustand and Jotai removed (docs not read). |
| R4 re-rendering | 06, 01 | Added react.dev's five principles and the children pattern. React Compiler guidance quoted precisely. Virtualisation kept as a pointer only. The reconciliation follow-up moved to 01. |
| R5 controlled vs uncontrolled | 07 | `useActionState` uses the current signature `(reducerAction, initialState, permalink?)`. Added the read-only warning, `useFormStatus` placement, and keeping values after errors. Server validation marked as standard practice. |
| R6 organising components | 09, 10, 13, module 08a | react.dev prescribes no folder structure; the old layout is kept as my practice. Code splitting with `lazy` is in 10, `next/dynamic` in 08a, server vs client in 13. Testing moves to module 05. |
| R7 side effects | 03, 13, module 08a | "Effect caused by an action → handler" is now sourced and checked. Next.js data fetching is in 08a; React's side is in 13. |
| R8 Redux pros and cons | 12 | Now quotes the Redux FAQ's "not all apps need Redux" and its criteria. |
| R9 ES6+ | module 01 | Nothing React-specific; the `??` vs `||` point is in module 01. |
| R10 bad state management | 02, 06 | "Most performance problems come from Effect chains" is now quoted from react.dev. |
| R11 Redux Toolkit | 12 | Every claim checked by running RTK 2.15. Added: dispatched thunks always resolve (use `.unwrap()`), `rejectWithValue`, Immer freezing state, the selector warning, RTK Query tags. |
| J1 (React part) delegation | 08 | Sourced from the React 17 post; behaviour checked. |
| J3/J4 (React parts) stale closures, cleanup | 03 | Checked with real timers and listeners. |

Once modules 04 (Node/REST) and 05 (testing) take the remaining parts, Part A of the old guide can be deleted.

## Not covered (yet)
- `useLayoutEffect` in depth, `useImperativeHandle`, `useId`, portals, `<Activity>`, `<ViewTransition>` (React 19.3), Fragment refs in practice, resource preloading APIs.
- Server Functions and `'use server'` in depth; streaming SSR and hydration details.
- React DevTools Profiler, virtualisation libraries, TanStack Query, Zustand/Jotai.
- Testing React components (module 05).

These need pages I haven't read; add them if an interview asks.
