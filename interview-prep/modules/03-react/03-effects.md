# 03. ★ Effects: synchronising, cleanup, dependencies, and when not to use one

Effects and the component lifecycle come up in almost every React interview, so this topic is starred.

**Sources (react.dev; the first two read in full, the next three read through headings, bold statements, lists and their key code — see the module README):**
[Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) ·
[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) ·
[Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects) ·
[Separating Events from Effects](https://react.dev/learn/separating-events-from-effects) ·
[Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies) ·
[`useEffect` reference](https://react.dev/reference/react/useEffect) (caveats) ·
[`useEffectEvent` reference](https://react.dev/reference/react/useEffectEvent) (via the Separating Events page)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/03-effects.tsx`)

**Replaces:** old guide R2 (lifecycle), R7 (side effects), and the React parts of J3 (stale closures) and J4 (cleanup). Class lifecycle methods are topic 11.

## Explain

### Three kinds of logic
- **Rendering code:** pure; calculates JSX.
- **Event handlers:** side effects caused by a **specific interaction** (a click sends the message).
- **Effects:** side effects caused **by rendering itself**: the component is on screen, so it should be connected. They run at the end of the commit, after the screen updates. They're for synchronising with an **external system**: network, browser APIs, timers, non-React widgets.

### Writing one: declare, dependencies, cleanup
```js
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();                    // start synchronising
  return () => connection.disconnect();    // stop synchronising
}, [roomId]);                              // re-sync when roomId changes
```
- No array → after every render. `[]` → only on mount. `[a, b]` → on mount and when `a` or `b` changes (compared with `Object.is`).
- Setting state in an Effect with no dependencies → **infinite loop**.
- **You can't choose your dependencies.** Every reactive value the Effect reads (props, state, anything declared in the component body) must be listed. The lint rule enforces it.
- `ref` objects and `set` functions are stable, so leaving them out is fine.
- Effects don't run during server rendering.
- Timing (from the `useEffect` caveats): an Effect not caused by an interaction usually runs **after the browser paints**. For visual work that would flicker, use `useLayoutEffect`.

### Strict Mode's extra cycle
- In development, React mounts each component, unmounts it, and mounts it again. So you see setup → cleanup → setup (checked: connect → disconnect → connect). Production runs setup once (checked by running React's production build).
- react.dev: the right question isn't "how do I run it once" but "**how do I fix my Effect so it works after remounting**". The answer is almost always a cleanup that mirrors the setup.
- Don't use a ref to skip the second run: the connection still leaks when the user navigates away and back.
- Patterns: subscribe/unsubscribe; `showModal()`/`close()`; animate in/reset; fetch → ignore or abort; analytics → leave it (two logs in development don't matter).

### Think per Effect, not per component lifecycle
- Components mount, update and unmount. An Effect only **starts and stops synchronising**, possibly many times while the component stays mounted.
- When `roomId` goes from `"general"` to `"travel"`, React runs the **old cleanup first** (disconnect general), then the new setup (connect travel) (checked).
- Each Effect should be **one independent synchronisation process**. Don't put unrelated work (logging a visit) in the same Effect as connecting.

### Races when fetching
```js
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((r) => { if (!ignore) setResults(r); });
  return () => { ignore = true; };
}, [query]);
```
Type "hell" then "hello": if "hell" answers last, it would overwrite the results. The cleanup marks it stale (checked both ways). `AbortController` also works (module 01, topic 06).
react.dev lists the costs of fetching in Effects: no server rendering, network waterfalls, no caching, boilerplate. It recommends your framework's data loading, or a client cache (TanStack Query, useSWR, React Router).

### Stale closures
Each render's Effect closes over **that render's** values. An interval set up with `[]` and `setCount(count + 1)` always sees `count = 0`, so it sticks at 1 (checked). Fixes:
- the updater form, `setCount(c => c + 1)`, so the Effect doesn't need `count`;
- list the dependency;
- **don't suppress the linter**. react.dev: "If you never suppress the linter, you will never see problems with stale values."

### `useEffectEvent`: read the latest value without re-syncing
```js
const onConnected = useEffectEvent(() => showNotification("Connected!", theme));
useEffect(() => {
  const c = createConnection(roomId);
  c.on("connected", () => onConnected());
  c.connect();
  return () => c.disconnect();
}, [roomId]); // theme isn't a dependency
```
Changing `theme` doesn't reconnect, but the notification still uses the latest theme (checked). Only call Effect Events from inside Effects, and never pass them to other components or Hooks.

### Removing dependencies: change the code, not the list
- The logic belongs in an event handler.
- Split unrelated syncs into separate Effects.
- Use an updater instead of reading state.
- Use an Effect Event for "latest value, don't react".
- Objects and functions created during render are new every time. Move static ones outside the component and dynamic ones inside the Effect, or depend on primitive values.

### You might not need an Effect
| Situation | Instead of an Effect |
|---|---|
| Value derived from props/state | Calculate during render (the Effect version renders twice, once with a stale value; checked) |
| Expensive calculation | `useMemo` (or let React Compiler do it, topic 06) |
| Reset all state when a prop changes | A `key` |
| Adjust some state on a prop change | Set it during render with a "previous value" check, or better, store an ID and derive |
| Logic caused by a click/submit (POST, notification) | The event handler (checked: Strict Mode doesn't "buy twice") |
| Chains of Effects setting state | Calculate in render; update in the handler |
| Notify the parent of a change | Call `onChange` in the same handler, or lift state up |
| Pass fetched data to the parent | The parent fetches and passes it down |
| Subscribe to an external store | `useSyncExternalStore` (topic 09) |
| Run once per app load | Module-level code, or a top-level `didInit` flag |

react.dev's test: is this code running **because the component was displayed**? Then it's an Effect. Because the user did something? Then it's an event handler.

## Traps
- An Effect that sets state derived from other state.
- A POST (buy, book, pay) in an Effect.
- Missing cleanup (listeners, intervals, sockets).
- Fetch without race protection.
- `// eslint-disable-next-line react-hooks/exhaustive-deps` → stale values later.
- Object or function dependencies created in render → Effect runs every render.
- Using a ref to "stop the double run".

## Practice questions

**Q1. When should code go in an Effect rather than an event handler?** When it runs because the component is on screen and must stay in sync with something outside React (a connection, a subscription, a widget). If a specific interaction causes it, it goes in the handler.

**Q2. Why does my Effect run twice in development?** Strict Mode mounts, unmounts and remounts to check the cleanup. Fix the cleanup so setup → cleanup → setup looks the same to the user as one setup. Production runs it once.

**Q3. Predict the logs when `roomId` changes from "general" to "travel".** "disconnect general", then "connect travel". The previous render's cleanup runs before the next render's Effect.

**Q4. Why does this counter stick at 1?** `useEffect(() => { const id = setInterval(() => setCount(count + 1), 1000); return () => clearInterval(id); }, []);`
The interval's closure is from the first render, where `count` is 0. Use `setCount(c => c + 1)`.

**Q5. How do you avoid a race when fetching in an Effect?** Use a cleanup that sets an `ignore` flag (or aborts the request), so only the latest response updates state. Better, use the framework's data loading or a caching library.

**Q6. `fullName` is kept in state and updated in an Effect. What's wrong?** It's redundant state with an extra render using a stale value. Calculate it during render.

**Q7. What does `useEffectEvent` solve?** Reading the latest props or state inside an Effect without adding them as dependencies, so the Effect doesn't re-synchronise when they change.

## Say it (about 50 seconds)
"Effects are for synchronising with something outside React while the component is on screen: a connection, a subscription, a widget. I think of each Effect as start and stop: the setup starts synchronising, the cleanup stops it, and React re-runs them when a dependency changes, old cleanup first. In development Strict Mode mounts twice to check the cleanup mirrors the setup, so I fix the cleanup rather than fighting it. The dependencies must list every reactive value; I never suppress the linter, because that's where stale closures come from, and I use updaters or `useEffectEvent` instead. And I try not to need Effects: derived values are calculated during render, user actions like paying go in the event handler, resets use a key, and data fetching goes through the framework or a cache, with race protection if I must fetch in an Effect."
