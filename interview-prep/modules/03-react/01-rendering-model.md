# 01. The rendering model: purity, render and commit, state as a snapshot, position and keys

**Sources (react.dev, read in full):**
[Keeping Components Pure](https://react.dev/learn/keeping-components-pure) ·
[Render and Commit](https://react.dev/learn/render-and-commit) ·
[State as a Snapshot](https://react.dev/learn/state-as-a-snapshot) ·
[Queueing a Series of State Updates](https://react.dev/learn/queueing-a-series-of-state-updates) ·
[Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) ·
[Rendering Lists](https://react.dev/learn/rendering-lists) ·
[`useState` reference](https://react.dev/reference/react/useState) (caveats)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/01-rendering-model.tsx`)

## Explain

### Components must be pure
- React assumes every component is a pure function: it **minds its own business** (doesn't change objects or variables that existed before rendering) and gives the **same output for the same inputs**.
- What you read while rendering is props, state and context. Treat all three as read-only.
- Changing something you created during the same render is fine ("local mutation").
- Side effects go in **event handlers** first; `useEffect` is the last resort (topic 03).
- Why React cares: components can run on the server, React can skip rendering ones whose inputs didn't change, and it can stop and restart a render part-way.
- **Strict Mode** calls your component functions twice in development to expose impure code. react.dev's example: a component that increments a module-level `guest` shows `#2, #4, #6` instead of `#1, #2, #3` (checked). It has no effect in production.

### Trigger → render → commit
1. **Trigger:** the initial render (`createRoot(node).render(<App />)`), or a state update in the component or an ancestor.
2. **Render:** "Rendering is React calling your components." On updates React calls the component whose state changed, then **every component it returns, recursively**. react.dev: don't optimise this early (topic 06).
3. **Commit:** React changes the DOM. On re-renders it applies only the minimal changes. If an `<input>` is in the same place as last time, React leaves it alone, so text the user typed survives a parent re-render (checked).
4. Then the browser paints.

### State is a snapshot
- Setting state **doesn't change the variable in the current render**. It asks for a new render.
- Each render has its own state values and its own event handlers, which "see" that render's values, even in code that runs later (`setTimeout`, after `await`). react.dev's example: send a message to Alice, switch to Bob before the delay ends, and the alert still says Alice (checked).
- Three `setNumber(number + 1)` calls in one click add **1**, not 3: each call says "set to 0 + 1".

### Updates are queued and batched
- React waits until **all the code in the event handler has run**, then re-renders once (**batching**). Three set calls → one render (checked).
- It doesn't batch across separate intentional events: each click is handled on its own.
- **Updater functions** (`setNumber(n => n + 1)`) go into a queue; during the next render React runs them in order, each getting the previous result.
- A plain value means "replace with this". So `setNumber(number + 5); setNumber(n => n + 1)` → 6, and adding `setNumber(42)` at the end → 42.
- Updaters run during rendering, so they must be pure; Strict Mode runs them twice.
- If the new value is `Object.is`-equal to the current one, React skips re-rendering the component and its children (`useState` caveats).

### State belongs to a position in the tree
- React keeps state **inside React**, tied to where the component sits in the tree, not to the JSX tag.
- **Same component, same position → state kept.** Even if two different `return` branches each render `<Counter />`, it's the same counter to React, because the position is the same (checked: Sarah inherits Taylor's score).
- **Different type at that position → state destroyed**, for the whole subtree. Swapping a parent `<section>` for a `<div>` resets the counter inside it (checked).
- **Don't define components inside other components.** Each render makes a new function, so React sees a different component and resets its state (checked: the `<input>` is recreated on every parent render).
- To reset on purpose: render in a different position, or give a **`key`**. A key becomes part of the position, instead of the order within the parent. `<Chat key={contact.id} />` gives each contact a fresh form.
- Keys are only unique among siblings, not globally.

### Keys in lists
- Every element directly inside `map()` needs a key; otherwise React warns.
- Keys tell React which item is which when items move, get inserted or get deleted.
- Use IDs from the data (database IDs, or `crypto.randomUUID()` when you create the item). Keys must not change, so don't generate them while rendering.
- **Index as key** is what React uses if you give none. It goes wrong when the list is reordered, inserted into or deleted from. The example ticks "Apple", deletes it, and the tick moves to "Banana" (checked). `key={Math.random()}` recreates every row each render and loses input.
- Components don't receive `key` as a prop. Pass the ID separately if they need it.
- Several nodes per item: `<Fragment key={id}>` (the short `<>` can't take a key).

### Reconciliation in one line (the old guide's follow-up)
The pages above add up to this: React compares the new tree with the previous one, by position, type and key. Same type in the same place is updated and keeps its state; a different type is replaced; keys identify list items. Then it changes only the DOM nodes that differ. (react.dev doesn't use the word "reconciliation" on these pages; that summary is mine.)

## Worked examples (checked in `examples/01-rendering-model.tsx`)

```jsx
<button onClick={() => {
  setNumber(number + 5);   // queue: "replace with 5"
  setNumber(n => n + 1);   // queue: n => n + 1
}} />                      // next render: 6

{isPlayerA ? <Counter key="Taylor" person="Taylor" /> : <Counter key="Sarah" person="Sarah" />}
// different keys → different counters → each switch starts at 0
```

## Traps
- Reading state right after setting it and expecting the new value.
- `setX(x + 1)` several times in one handler; use the updater form.
- A module-level variable changed during render (shows up as doubled values in Strict Mode).
- Component definitions nested inside components.
- Index keys on lists that change order; random keys.
- Expecting conditional JSX branches to reset state: it's the position that counts.

## Practice questions

**Q1. What does "rendering" mean in React?**
React calling your components to work out what the screen should show. The commit is the separate step where React changes the DOM, and only where something differs.

**Q2. Predict:** `setCount(count + 1); setCount(count + 1); console.log(count);` with `count = 0`.
It logs `0` and the next render shows `1`. Each call uses this render's `count`, and the variable doesn't change until the next render.

**Q3. How do you add 3 in one click?** `setCount(c => c + 1)` three times. Updaters are queued and each gets the previous result.

**Q4. Why does Strict Mode render my component twice, and what should I do?** In development it calls component functions twice to expose impure rendering. Make the component pure; don't try to stop the double call. Production isn't affected.

**Q5. When does a component keep its state across renders?** As long as the same component type is rendered at the same position in the tree. A different type there, or a different key, resets it and everything below.

**Q6. Why not use the array index as a key?** If items are inserted, deleted or reordered, positions shift and state ends up attached to the wrong item. Use a stable ID from the data.

**Q7. How would you reset a form when the user switches to a different client?** Give it `key={client.id}`, so React treats each client's form as a different component.

## Say it (about 45 seconds)
"React assumes components are pure: same props, state and context give the same JSX, with no side effects during render. Rendering is React calling your components; the commit is when it updates the DOM, and only where something changed. State is a snapshot: setting it doesn't change the variable in the current render, it queues an update, and React batches all the updates from one event into a single re-render, which is why I use the updater form to build on the previous value. State is tied to a position in the tree, so the same component in the same place keeps its state, a different type resets it, and keys let me control that, both in lists, where I use stable IDs, and to reset things like a form when the record changes."
