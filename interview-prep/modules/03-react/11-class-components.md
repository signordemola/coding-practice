# 11. Class components and their lifecycle (older code)

Interviews still ask about the lifecycle in class terms, and older codebases use classes. react.dev recommends function components for new code.

**Sources (react.dev, read in full for the methods listed):**
[`Component`](https://react.dev/reference/react/Component): `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`, `componentDidCatch`, `static getDerivedStateFromError`, `setState`, `shouldComponentUpdate`, `render`, the Error Boundary section · [`StrictMode`](https://react.dev/reference/react/StrictMode)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/11-class-components.tsx`)

**Replaces:** the class parts of old guide R2 and J11. `this` and binding in JavaScript are module 01, topic 03.

## Explain

### The three lifecycle methods and their Hook equivalent
| Class | When | Hook equivalent |
|---|---|---|
| `componentDidMount()` | After the component is added to the screen. Start fetching, subscriptions, DOM work | Effect setup |
| `componentDidUpdate(prevProps, prevState, snapshot)` | After a re-render with new props/state; **not** on the first render. Compare with `prevProps`/`prevState`, or risk loops | Effect re-run when dependencies change |
| `componentWillUnmount()` | Before removal. **Mirror** what `componentDidMount` set up | Effect cleanup |

- react.dev: defining these three together is, for many cases, **equivalent to one `useEffect`**. `useLayoutEffect` is closer if the code must run before paint. If `componentDidMount` reads props, you usually need `componentDidUpdate` for their changes and `componentWillUnmount` for cleanup (checked: the class and the Effect produce the same connect/disconnect log).
- Strict Mode in development: `componentDidMount` → `componentWillUnmount` → `componentDidMount` (checked), like the Effect double-run.
- Calling `setState` straight away in `componentDidMount` causes an extra render before paint. Allowed, but react.dev says avoid it when you can.

### Other methods worth knowing
- `render()` must be pure.
- `setState(next | updater, callback?)` **doesn't change `this.state` in the running code**, only from the next render. Use the updater form to build on queued updates (checked: two `count + 1` calls then `prev => prev.count + 10` gives 11). The callback runs after commit.
- `shouldComponentUpdate(nextProps, nextState)` returns `false` to skip a re-render, which also skips `componentDidUpdate` (checked). react.dev: it only exists as a performance optimisation, so fix the real bug first. (`memo`, topic 06, is the function-component equivalent; I didn't read the `PureComponent` page.)
- Error Boundaries: `static getDerivedStateFromError` + `componentDidCatch` (topic 10).
- `UNSAFE_componentWillMount`, `UNSAFE_componentWillReceiveProps`, `UNSAFE_componentWillUpdate`: legacy; avoid.

### Binding `this` in class handlers
A method passed as `onClick={this.handleClick}` loses `this` unless it's bound. The check uses an arrow class field, `handleClick = () => {...}`. Module 01, topic 03 covers all the options and their cost.

## Traps
- `componentDidUpdate` without a `prevProps` comparison (infinite loops).
- `componentDidMount` that subscribes without a matching `componentWillUnmount`.
- Reading `this.state` right after `setState`.
- Using `shouldComponentUpdate` to "fix" a bug.

## Practice questions

**Q1. Map the class lifecycle to Hooks.** `componentDidMount` + `componentDidUpdate` + `componentWillUnmount` together ≈ one `useEffect`: the setup runs after mount and when dependencies change; the cleanup runs before the next run and on unmount.

**Q2. Why does `componentDidUpdate` need a comparison?** It runs after every update. If it sets state or fetches unconditionally, it triggers another update, and so on.

**Q3. Predict:** `this.setState({ count: this.state.count + 1 })` twice, then `console.log(this.state.count)`, starting at 0.
Logs 0; the next render shows 1.

**Q4. Why does my `componentDidMount` run twice in development?** Strict Mode mounts, unmounts and remounts to check that `componentWillUnmount` cleans up properly.

## Say it (about 30 seconds)
"Class components have `componentDidMount` for setup after the first render, `componentDidUpdate` for reacting to prop or state changes, where I compare with the previous props, and `componentWillUnmount` to clean up. React's docs say those three together are equivalent to a single `useEffect`, which is why Hooks feel simpler: one Effect per synchronisation, with the cleanup next to the setup. `setState` is a snapshot like `useState`, so I use the updater form, and Error Boundaries are the one thing that still needs a class."
