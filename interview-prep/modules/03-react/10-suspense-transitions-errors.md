# 10. Suspense, `lazy`, Transitions, `useDeferredValue`, and Error Boundaries

**Sources (react.dev, read in full unless marked):**
[`<Suspense>`](https://react.dev/reference/react/Suspense) (reference, caveats, "what activates a boundary", usage headings) ·
[`lazy`](https://react.dev/reference/react/lazy) ·
[`useTransition`](https://react.dev/reference/react/useTransition) (reference and caveats) ·
[`useDeferredValue`](https://react.dev/reference/react/useDeferredValue) (reference, caveats, "different from debouncing") ·
[`Component`: Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) ·
[React 19 post: better error reporting](https://react.dev/blog/2024/12/05/react-19#error-handling) ·
[React 19.3 post: changelog](https://react.dev/blog/2026/09/09/react-19-3#changelog)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/10-suspense-transitions-errors.tsx`)

**Replaces:** the code-splitting follow-up in old guide R6 (the React part; `next/dynamic` is module 08a).

## Explain

### `<Suspense>`
- `<Suspense fallback={<Spinner />}>children</Suspense>` shows the fallback while something inside **suspends**, then the content.
- **What activates it:** lazy-loaded code (`lazy`); reading a promise with `use` (including data from Server Components or a Suspense-enabled framework); stylesheets with `precedence`; large boundaries while HTML streams; fonts and images only when a `<ViewTransition>` animates the reveal.
- **Not** activated by data fetched in an Effect or event handler.
- Without a framework, `use(promise)` works if the **same promise instance** is reused across renders (create it outside render or cache it) (checked).
- Caveats: no state is kept for a tree that suspended before it first mounted (it retries from scratch). If shown content suspends again, the fallback comes back **unless the update was a Transition or `useDeferredValue`** (checked). React reveals content at most every 300 ms, batching boundaries that are ready together.

### `lazy` (code splitting)
- `const Calendar = lazy(() => import("./Calendar.js"))` **at module top level**. Declaring it inside a component resets state on every re-render.
- `load` is called the first time the component renders (checked) and must resolve to a module whose `.default` is a component. Rendering suspends until then, so wrap it in `<Suspense>`.
- When to split is in the old guide: heavy things not needed straight away, not small components or above-the-fold content. That advice is my practice, not from this page.

### Transitions
- `const [isPending, startTransition] = useTransition()`. `startTransition(() => setTab("tue"))` marks the update as **non-blocking**. The function passed is called an **Action**.
- A Transition update can be interrupted by urgent updates (typing). It **keeps already-shown content** instead of a fallback, and `isPending` tells you it's running (checked).
- Caveats: you need the `set` function (otherwise use `useDeferredValue`); updates inside a `setTimeout` aren't marked; state set **after an `await`** needs another `startTransition` (known limitation); Transitions can't control text inputs.
- **Source conflict:** the `useTransition` page says React "currently batches" multiple ongoing Transitions together, but the React 19.3 changelog (9 Sep 2026) says Transitions now render independently. The changelog is newer, so I'd go with it, and the reference page should be updated.

### `useDeferredValue`
- `const deferredQuery = useDeferredValue(query)`. On an update React first re-renders with the **old** value, then renders again in the background with the new one (checked: `ab/a` then `ab/ab`). The background render is interruptible and doesn't fire Effects until it commits.
- With Suspense, the user sees the old results instead of a fallback while the new ones load.
- **vs debounce/throttle:** no fixed delay; it adapts to the device and is interruptible. Debounce and throttle still help for work outside rendering, like reducing network requests (module 01, topic 12).
- Pass primitives or objects created outside render, or it re-renders in the background every time.

### Error Boundaries
- By default, an error during rendering removes the app's UI. An Error Boundary shows a fallback for its part of the tree instead (checked).
- Still a **class component**: `static getDerivedStateFromError(error)` (pure: return state that shows the fallback) and optionally `componentDidCatch(error, info)` to log it, with `info.componentStack` (checked). There's no function-component version yet; `react-error-boundary` packages one.
- **Not caught:** errors in **event handlers** (checked: the button's error escapes to `window`), server rendering, the boundary itself, and async code like `setTimeout`. Exception: errors thrown inside `startTransition` are caught.
- So for event handlers, use `try`/`catch` and set error state (my addition; the page only lists what isn't caught).
- Place boundaries where an error message makes sense (around a chat list, not every component).
- **React 19 error reporting:** each caught error is logged once, and `createRoot` has `onCaughtError`, `onUncaughtError` and `onRecoverableError` options for reporting (the checks use them to keep output quiet).

## Traps
- `lazy()` inside a component.
- Creating the promise for `use()` during render (a new promise every render).
- Expecting Suspense to work with fetching in `useEffect`.
- Expecting an Error Boundary to catch a failed payment in an `onClick`.
- `startTransition` around a `setTimeout`.

## Practice questions

**Q1. How do you code-split a heavy component in plain React?** `lazy(() => import("./Heavy.js"))` at the top of the module, rendered inside `<Suspense fallback={...}>`.

**Q2. Why does my content flash back to the spinner when I switch tabs, and how do you stop it?** The new tab suspended and the update was urgent. Wrap the state update in `startTransition` (or use `useDeferredValue`), so React keeps the current content and shows `isPending`.

**Q3. `useTransition` vs `useDeferredValue`?** `useTransition` wraps a state update you control; `useDeferredValue` defers a value you receive (a prop or a Hook's result).

**Q4. What doesn't an Error Boundary catch?** Event handlers, async callbacks like `setTimeout`, server rendering, and errors in the boundary itself.

**Q5. Can I write an Error Boundary as a function component?** Not yet; use a class with `getDerivedStateFromError`, or the `react-error-boundary` package.

## Say it (about 40 seconds)
"Suspense lets a part of the tree show a fallback while it waits, for lazy-loaded code or a promise read with `use`, usually from a framework; it doesn't work with fetching in Effects. For code splitting I declare `lazy` components at module level inside a Suspense boundary. Transitions mark updates as non-urgent, so React keeps the current screen with a pending flag instead of flashing a spinner, and `useDeferredValue` does the same for a value I receive, without a fixed delay like debouncing. Error Boundaries are still classes; they catch rendering errors and show a fallback, but not errors in event handlers or timers, so those need their own try/catch."
