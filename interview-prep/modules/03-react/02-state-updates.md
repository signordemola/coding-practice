# 02. Updating state immutably, and choosing the state structure

**Sources (react.dev, read in full):**
[Updating Objects in State](https://react.dev/learn/updating-objects-in-state) ·
[Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state) ·
[Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) ·
[Sharing State Between Components](https://react.dev/learn/sharing-state-between-components) ·
[`useState` troubleshooting](https://react.dev/reference/react/useState#troubleshooting)

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/02-state-updates.tsx`)

**Replaces:** old guide R1 (values vs references, immutability) and R10 (bad state management). The JavaScript side of references and copying is module 01, topics 01 and 09.

## Explain

### Treat state as read-only
- Objects and arrays in state can technically be changed, but react.dev says to treat them **as if they were immutable**: replace them, don't mutate them.
- Mutating without calling the setter: React doesn't know, so nothing happens.
- Mutating and then calling the setter with **the same object**: `Object.is` says nothing changed, so React ignores it (`useState` troubleshooting; checked).
- Fix: create a new object, `setPosition({ ...position, x: 7 })`.
- Mutating an object you *just created* is fine (local mutation).

### Spread is shallow
- `{ ...person }` copies one level. Nested objects are still shared, so for `person.artwork.city` you copy each level on the way up:
  ```js
  setPerson({ ...person, artwork: { ...person.artwork, city: "Lagos" } });
  ```
- react.dev: objects aren't really "nested"; they're separate objects pointing at each other. Two parents can point at the same child.
- **Immer** (`use-immer`) lets you write `draft.artwork.city = "Lagos"`. The draft is a Proxy that records changes and produces a new object.

### Arrays
| Avoid (mutates) | Prefer (new array) |
|---|---|
| `push`, `unshift` | `[...arr, item]`, `concat` |
| `pop`, `shift`, `splice` | `filter`, `slice` |
| `arr[i] = x`, `splice` | `map` |
| `reverse`, `sort` | copy first: `[...arr].sort()` (module 01 also covers `toSorted`) |

- **Copying the array doesn't copy its items.** `const next = [...list]; next[0].seen = true` mutates the original item. react.dev's bug: two lists that share item objects both change. Use `map` and copy the item you change (checked).
- `slice` copies; `splice` mutates. Easy to mix up.

### Why not mutate (react.dev's reasons)
Debugging (old logs aren't overwritten), optimisations (`prev === next` is a cheap "nothing changed" check that `memo` relies on), new React features assume snapshots, undo/history is easy, and React needs no proxies or special wrappers. You can often "get away with" mutation, but react.dev strongly advises against it.

### Five rules for structuring state
1. **Group related state** that always changes together (`{ x, y }`). But then `setPosition({ x: 100 })` drops `y`: copy the other fields.
2. **Avoid contradictions.** `isSending` and `isSent` can both be true by mistake; one `status: "typing" | "sending" | "sent"` can't.
3. **Avoid redundant state.** If you can calculate it from props or state, calculate it during render (`fullName = first + " " + last`).
4. **Avoid duplication.** Store `selectedId`, not a copy of the selected item. With a copy, editing the item doesn't update the "selected" display (checked).
5. **Avoid deep nesting.** Flatten ("normalise") trees: each item stores `childIds`, and a map goes from id to item.

react.dev compares this to normalising a database.

### Don't mirror props in state
`useState(messageColor)` only uses the **first** value; later prop changes are ignored (checked). Use the prop directly. If you really want only the initial value, name the prop `initialColor` or `defaultColor` to make that clear.

### Lifting state up
To coordinate two components, move the state to their **closest common parent**, pass the value down as props, and pass handlers down so children can ask for changes. react.dev's Accordion replaces two `isActive` booleans with one `activeIndex`.
- **Single source of truth:** each piece of state has one owning component. This doesn't mean all state lives in one place.
- "Controlled" (driven by props) vs "uncontrolled" (own state) components: react.dev says these aren't strict terms. Form inputs are topic 07.

## Worked example: booking state (my own, following the rules above)
```js
// 🔴 contradictions and duplication
const [isPaid, setIsPaid] = useState(false);
const [isCancelled, setIsCancelled] = useState(false);
const [selectedSlot, setSelectedSlot] = useState(null);   // a copy of an item in slots
const [total, setTotal] = useState(0);                    // derivable

// ✅
const [status, setStatus] = useState("pending");          // "pending" | "paid" | "cancelled"
const [selectedSlotId, setSelectedSlotId] = useState(null);
const selectedSlot = slots.find((s) => s.id === selectedSlotId) ?? null;
const totalMinor = items.reduce((sum, i) => sum + i.priceMinor, 0);
```

## Traps
- `obj.x = 1; setObj(obj)`: ignored.
- A shallow copy, then changing a nested field or an array item.
- `sort()`/`reverse()` directly on state.
- Storing values you can calculate (`total`, `fullName`, `filteredList`).
- `useState(props.something)` and expecting it to follow the prop.
- Two booleans that should be one status.

## Practice questions

**Q1. Why doesn't this re-render?** `booking.status = "paid"; setBooking(booking);`
It's the same object, so `Object.is` says nothing changed and React ignores the update. Use `setBooking({ ...booking, status: "paid" })`.

**Q2. Update one slot's `held` flag in an array of slots.**
`setSlots(slots.map(s => s.id === id ? { ...s, held: true } : s))`. A new array and a new object for the changed item only.

**Q3. What's wrong with `const next = [...list]; next[0].seen = true; setList(next)`?**
The array is new but the item isn't, so the old state's item is mutated, and anything else pointing at it changes too.

**Q4. What's redundant state? Give an example.** Information you could calculate from existing props or state, like `fullName` or `total`. It goes out of sync; calculate it during render.

**Q5. Why store `selectedId` rather than the selected object?** The object duplicates an item in the list, so edits to the list don't reach it. The ID is the only essential state.

**Q6. Two sibling panels must open one at a time. How?** Lift the state to the common parent as `activeIndex`, pass `isActive` and an `onShow` handler to each panel.

## Say it (about 40 seconds)
"I treat state as read-only. React decides whether something changed by comparing references, so mutating an object and setting it again does nothing. I create new objects and arrays: spread for objects, copying each nested level I change, and `map`, `filter` and spread for arrays, remembering that copying an array doesn't copy its items. For structure I follow React's rules: group what changes together, use one status instead of contradicting booleans, store the minimum, like a selected ID, and calculate everything else during render. When two components need the same state, I lift it to their common parent, so each piece of state has one owner."
