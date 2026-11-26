# 09. The Rules of Hooks, custom Hooks, `use`, and `useSyncExternalStore`

**Sources (react.dev, read in full unless marked):**
[Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) ·
[State: A Component's Memory: "How does React know which state to return?"](https://react.dev/learn/state-a-components-memory#how-does-react-know-which-state-to-return) (that section) ·
[Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) ·
[`use`](https://react.dev/reference/react/use) (the parts on calling it conditionally) ·
[`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) (reference and caveats)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/09-hooks-rules-custom.tsx`)

## Explain

### The Rules of Hooks
- Functions starting with `use` are Hooks. **Call them only at the top level** of a function component or a custom Hook, **before any early return**.
- Not inside conditions or loops, after a conditional `return`, in event handlers, in class components, inside functions passed to `useMemo`/`useReducer`/`useEffect`, or inside `try`/`catch`/`finally`.
- Only call Hooks from React functions (components and custom Hooks), never from plain JavaScript functions.
- `eslint-plugin-react-hooks` catches these mistakes.
- **Why:** Hooks have no names or IDs. React keeps an array of Hook state per component and an index reset to 0 before each render; each Hook call takes the next slot. That only works if the **call order is the same every render**. A conditional Hook shifts everything: React warns "React has detected a change in the order of Hooks" and throws "Rendered more hooks than during the previous render" (both checked).

### `use` is the exception
`use(context)` and `use(promise)` **can** be called inside conditions and loops (react.dev). With a promise, the component suspends until it resolves (topic 10) (checked with context).

### Custom Hooks
- A function whose name starts with `use` + a capital letter that calls other Hooks. Components start with a capital letter and return JSX; Hooks may return anything.
- If a function doesn't call any Hooks, don't prefix it with `use` (`getSorted`, not `useSorted`), so it can be called anywhere, even conditionally. React doesn't enforce this.
- **They share stateful logic, not state.** Each call has its own independent state (checked: two `useCounter` calls).
- They re-run on every render, like the component, so their code must be pure. Reactive values passed between Hooks stay up to date.
- Wrap event handlers a custom Hook receives in Effect Events (topic 03).
- **Good custom Hooks are concrete:** `useData(url)`, `useChatRoom(options)`, `useOnlineStatus()`, `useMediaQuery(query)`.
- **Avoid "lifecycle" Hooks** like `useMount(fn)`, `useEffectOnce`, `useUpdateEffect`: the lint rule only checks direct `useEffect` calls, so a `useMount` that should react to `roomId` silently never reconnects (checked).
- They also help migrate later (e.g. from an Effect to `useSyncExternalStore`) without changing the components.

### `useSyncExternalStore`
For subscribing to data outside React (a browser API, a third-party store):
```js
const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);
```
- `subscribe(callback)` subscribes and returns an unsubscribe. Declare it **outside** the component, or React re-subscribes on every render.
- `getSnapshot()` must return the same value while the store hasn't changed (compared with `Object.is`), as an immutable snapshot.
- `getServerSnapshot` is needed for server rendering and hydration (otherwise rendering on the server throws).
- react.dev prefers it to "Effect + state" for external stores (topic 03's table). The check subscribes, updates on a store change and unsubscribes on unmount.

### Organising components (old guide R6)
react.dev doesn't prescribe a folder structure in the pages I read. What I can source:
- Extract repeated logic into custom Hooks so components describe *what* they want, not *how* (this page).
- Keep components pure and declared at the top level of a module, not nested (topic 01).
- The Redux style guide recommends **feature folders** (topic 12).
- Next.js App Router conventions are module 08a.
Everything else in the old R6 (`app/` thin, `features/`, `components/`, `lib/` with tests beside them, barrel files) is **my practice**, not from these docs.

## Traps
- `if (x) useState(...)` or an early `return` before a Hook.
- A Hook-like name for a plain function (or a plain name for a function that calls Hooks).
- Expecting two components using the same custom Hook to share state (use context or lift state for that).
- Generic lifecycle Hooks that hide dependencies from the linter.
- A `subscribe` function created inside the component.

## Practice questions

**Q1. Why can't Hooks go inside an `if`?** React identifies each Hook by its call order. A conditional call changes the order between renders, so state gets attached to the wrong Hook; React warns and throws.

**Q2. Is there any Hook-like API you can call conditionally?** `use`, for context and promises.

**Q3. Do two components using `useForm()` share the form state?** No. Custom Hooks share logic; each call has its own state.

**Q4. What's wrong with a `useMount(fn)` helper?** It hides an Effect with `[]` dependencies from the linter, so values the callback uses never trigger a re-sync. react.dev recommends concrete Hooks instead.

**Q5. How do you read a browser value like `navigator.onLine` that changes outside React?** `useSyncExternalStore` with a `subscribe` that listens to `online`/`offline` events and a `getSnapshot` that returns `navigator.onLine`, wrapped in a `useOnlineStatus()` Hook.

## Say it (about 30 seconds)
"Hooks must be called at the top level of components or custom Hooks, never in conditions or loops, because React matches each Hook to its state by call order; break the order and React warns and throws. The `use` API is the one exception. Custom Hooks are how I reuse stateful logic: each call gets its own state, and I keep them concrete, like `useOnlineStatus` or `useChatRoom`, rather than generic lifecycle wrappers that hide dependencies from the linter. For data that lives outside React, I use `useSyncExternalStore` with a subscribe function defined outside the component."
