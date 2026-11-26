# 04. Refs and the DOM

**Sources (react.dev, read in full):**
[Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs) ·
[Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs) ·
[React 19 release post: `ref` as a prop, ref cleanup](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop) ·
[React 19.3 release post: Fragment refs](https://react.dev/blog/2026/09/09/react-19-3#fragment-refs) (described only)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/04-refs-dom.tsx`)

## Explain

### A ref is a box React doesn't track
- `useRef(initial)` returns `{ current: initial }`, the same object on every render.
- Changing `ref.current` **doesn't re-render**, and it changes **immediately** (unlike state's snapshot).
- react.dev: you could imagine `useRef` as `useState({ current })` without the setter; refs are like instance fields.
- **Don't read or write `ref.current` during rendering** (except lazy setup like `if (!ref.current) ref.current = new Thing()`). React doesn't know when it changes, so the screen won't follow it (checked: the button text stays 0).

| Refs | State |
|---|---|
| Changing doesn't re-render | Changing re-renders |
| Mutable, changes straight away | A snapshot per render |
| Don't use for what you render | Use for what you render |

**Use refs for:** timeout/interval IDs, DOM nodes, other objects not needed to calculate the JSX. react.dev's stopwatch keeps `startTime` and `now` in state (shown) and the interval ID in a ref.

### DOM refs
- `<input ref={inputRef} />`: React puts the node in `inputRef.current` during the **commit**. During the first render it's still `null` (checked). Before updating the DOM, React sets affected refs to `null`, then to the new nodes.
- So you usually use DOM refs **in event handlers** (focus, scroll, measure), or in an Effect when there's no event.
- **A list of refs:** you can't call `useRef` in a loop. Use a **ref callback**: `ref={node => { map.set(id, node); return () => map.delete(id); }}`. React 19 lets a ref callback return a cleanup, called when the node goes away (checked). Strict Mode runs ref callbacks an extra time in development.
- **React 19: `ref` is a normal prop** for function components: `function MyInput({ ref }) { return <input ref={ref} /> }`. `forwardRef` is no longer needed and will be deprecated. `useImperativeHandle` exposes only chosen methods (e.g. just `focus`).
- **React 19.3 Fragment refs:** a ref on `<Fragment>` gives a `FragmentInstance` for the group of DOM children (focus, listeners, observing), without a wrapper `<div>`. I read the release post but didn't run this.

### `flushSync`
State updates are queued, so `setTodos(next); list.lastChild.scrollIntoView()` scrolls to the item **before** the new one. Wrapping the update in `flushSync(() => setTodos(next))` makes React update the DOM synchronously first (checked both ways).

### Don't fight React over the DOM
Focusing, scrolling and measuring are safe. **Modifying** nodes React manages (removing them, adding children) can confuse React and crash on the next update. react.dev's example: remove a node manually, then toggle it with state → crash. It's safe to manage DOM that React has no reason to touch, like children of an always-empty `<div>`.

## Traps
- Rendering `ref.current` and expecting the screen to update.
- Reading a DOM ref during render (it's `null` the first time).
- `useRef` inside `map()`.
- Implicit returns in ref callbacks in React 19 TypeScript (`ref={n => (x = n)}` now looks like a cleanup; write `ref={n => { x = n; }}`).
- Removing React-managed nodes by hand.

## Practice questions

**Q1. Ref or state for an interval ID?** A ref: it's needed by handlers (to clear it) but never shown, and changing it shouldn't re-render.

**Q2. Why is `inputRef.current` `null` in the component body?** On the first render the DOM node doesn't exist yet; React sets the ref during the commit. Use it in an event handler or an Effect.

**Q3. How do you pass a ref to your own `<Input>` component in React 19?** Accept `ref` as a prop and put it on the `<input>`. No `forwardRef` needed.

**Q4. How do you keep refs to a dynamic list of items?** A ref callback on each item that adds the node to a `Map` and returns a cleanup that removes it.

**Q5. You add a todo and scroll to the last item, but it scrolls to the previous one. Why, and two fixes?** The state update hasn't reached the DOM yet. Wrap it in `flushSync` (react.dev's fix). Another option (my suggestion, not on the page): scroll in an Effect that runs after the list changes.

## Say it (about 30 seconds)
"A ref is a mutable box that survives re-renders but doesn't trigger them, so I use it for things I don't render, like timer IDs, and for DOM nodes I need to focus, scroll or measure. React fills DOM refs during the commit, so I read them in event handlers or Effects, not while rendering. In React 19, `ref` is just a prop on function components, and ref callbacks can return a cleanup, which is handy for lists of nodes. I avoid changing DOM that React manages, because it can't recover from that."
