# 06. ★ Re-rendering and performance: `memo`, `useMemo`, `useCallback`, React Compiler

Optimising re-renders is a standard React interview question, so this topic is starred.

**Sources (react.dev, read in full unless marked):**
[`memo`](https://react.dev/reference/react/memo) ·
[`useMemo`](https://react.dev/reference/react/useMemo) (reference and caveats) ·
[`useCallback`](https://react.dev/reference/react/useCallback) ·
[React Compiler: Introduction](https://react.dev/learn/react-compiler/introduction) ·
[React Compiler v1.0 post](https://react.dev/blog/2025/10/07/react-compiler-1) (7 Oct 2025, opening section) ·
[You Might Not Need an Effect: caching expensive calculations](https://react.dev/learn/you-might-not-need-an-effect#caching-expensive-calculations) ·
[`useDeferredValue`](https://react.dev/reference/react/useDeferredValue) · [`<input>`: optimising re-rendering on every keystroke](https://react.dev/reference/react-dom/components/input#optimizing-re-rendering-on-every-keystroke)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/06-performance.tsx`)

**Replaces:** old guide R4 (optimising re-renders) and the performance half of R10.

## Explain

### What re-renders, and is it a problem?
- A component re-renders when **its state changes**, when **its parent re-renders** (by default, every child re-renders recursively, props changed or not; checked), and when **a context it reads changes** (topic 05).
- Re-rendering isn't the same as changing the DOM: React only commits differences (topic 01). react.dev: **don't optimise prematurely**.
- react.dev's guidance on measuring: unless you create or loop over thousands of objects, a calculation probably isn't expensive. Measure with `console.time`; about 1 ms or more might be worth memoising. Test with CPU throttling and a production build, because development and Strict Mode render twice.

### Fix the structure first (react.dev's five principles)
1. A wrapper should **accept JSX as `children`**. Then its own state changes don't re-render those children, because the parent created them (checked: hover state in `HoverBox` doesn't re-render `Expensive`).
2. **Keep state local**; don't lift transient state (hover, form input) higher than needed.
3. **Keep rendering pure.** If re-rendering causes a visible problem, that's a bug, not a reason to memoise.
4. **Avoid Effects that update state.** react.dev: most performance problems come from chains of updates started by Effects.
5. **Remove unnecessary Effect dependencies** (topic 03).

Plus, from the `<input>` page: move fast-changing state (typing) down so only the small component re-renders, and if a big re-render can't be avoided, `useDeferredValue` keeps the input responsive (topic 10).

### `memo`
- `memo(Component, arePropsEqual?)` returns a component that **skips re-rendering when its props are equal** (each prop compared with `Object.is`) (checked).
- It still re-renders for its **own state** and for **context** it reads (checked).
- Worth it when a component re-renders often with the **same props** and rendering is **expensive**. react.dev: coarse interactions (page changes) rarely need it; granular ones (dragging shapes) might.
- **Useless if a prop is always new**: an object literal or inline function created during render (checked: the grid re-renders every time).
- A custom `arePropsEqual` must compare **every** prop, including functions, or the child keeps stale closures (checked: the click handler sees `n = 0` after two updates). Avoid deep equality: it can freeze the app.
- Only a performance optimisation: if the code breaks without it, fix the real problem.

### `useMemo` and `useCallback`
- `useMemo(() => calc(a, b), [a, b])` caches the **result**. It recalculates only when a dependency changes (`Object.is`) (checked). It doesn't make the first render faster. The function must be pure; Strict Mode calls it twice in development (checked).
- `useCallback(fn, deps)` caches **the function itself** (it doesn't call it).
- Two reasons react.dev gives for `useCallback`: you pass the function to a `memo` component, or the function is a dependency of another Hook. Often it's simpler to move the function **inside** the Effect.
- Both Hooks: top level only. React keeps the cache unless it has a reason (e.g. editing the file in development, or the component suspends during its first mount).

### React Compiler
- A **build-time** tool that adds memoisation automatically. **v1.0 stable since 7 Oct 2025**; battle-tested at Meta; works for React and React Native; supports React 17, 18 and 19. Works with Babel, Vite, Metro, Rsbuild; Next.js uses it through swc from v15.3.1.
- It skips cascading re-renders and caches expensive calculations **inside components and hooks**. It handles cases manual memoisation gets wrong, like `<Item onClick={() => handleClick(item)} />`.
- It only memoises components and hooks (not every function), and the cache isn't shared between components. For a truly expensive shared function, memoise it outside React, after profiling.
- **`memo`, `useMemo`, `useCallback` with the compiler** (react.dev): for new code, rely on the compiler and use the Hooks only for precise control (e.g. a value used as an Effect dependency). For existing code, leave existing memoisation in place or test carefully before removing it, because removing it can change the compiled output. With the compiler on, you can remove `React.memo`.
- It relies on your code following the Rules of React (topic 09).
- I read the introduction but didn't run the compiler in this module.

### Long lists
The old guide mentioned virtualisation (render only visible rows). I haven't read a source on it for this module, so it's only a pointer.

## Worked example (checked in `examples/06-performance.tsx`)
```jsx
const SlotGrid = memo(function SlotGrid({ onPick, filter }) { /* expensive */ });

function Page() {
  const [note, setNote] = useState("");
  // 🔴 new every render → memo never skips
  // <SlotGrid onPick={(t) => setPicked(t)} filter={{ day: "Mon" }} />

  // ✅ stable until dependencies change (or let React Compiler do this)
  const onPick = useCallback((t) => setPicked(t), []);
  const filter = useMemo(() => ({ day: "Mon" }), []);
  return <SlotGrid onPick={onPick} filter={filter} />;
}
```

## Traps
- Wrapping everything in `memo`/`useMemo` "just in case" (less readable; one always-new prop breaks it anyway).
- Thinking `memo` blocks context updates or own-state updates.
- A custom comparison that ignores functions.
- Measuring in development mode.
- Removing all `useMemo` from an existing codebase the day the compiler is turned on.

## Practice questions

**Q1. Why does my child re-render when its props didn't change?** By default, a parent re-render re-renders all its children. `memo` (or the compiler) can skip it when props are equal.

**Q2. I wrapped a component in `memo` but it still re-renders. Why?** One of its props is new on every render (an inline function or object), or it reads a context that changed, or its own state changed.

**Q3. `useMemo` vs `useCallback`?** `useMemo` caches the result of calling a function; `useCallback` caches the function itself.

**Q4. When is `useCallback` worth it?** When the function goes to a `memo` component or is a dependency of another Hook. Otherwise it adds nothing.

**Q5. What does React Compiler change about memoisation?** It memoises components and values automatically at build time. For new code, rely on it and use `useMemo`/`useCallback` only for precise control; keep existing memoisation unless you test its removal.

**Q6. Name two ways to avoid re-renders without memoisation.** Pass expensive parts as `children` to a stateful wrapper, and keep fast-changing state (like an input's value) in the small component that uses it.

## Say it (about 45 seconds)
"A component re-renders when its state changes, its parent re-renders, or a context it reads changes. That's usually fine, since React only touches the DOM that differs, so I measure first, in a production build. Then I fix structure: keep state local, pass expensive parts as children, and remove Effects that set state, which React says cause most performance problems. Where a component is genuinely expensive and gets the same props often, `memo` skips it, but only if every prop is stable, which is what `useMemo` and `useCallback` are for. With React Compiler 1.0 that memoisation is automatic, so for new code I'd rely on it and keep the Hooks for cases where I need precise control, like an Effect dependency."
