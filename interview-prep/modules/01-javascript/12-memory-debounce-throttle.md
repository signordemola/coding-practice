# 12. Memory, leaks, debounce and throttle

**Sources:**
- MDN (read in full, snapshot of 25 Nov 2026): [Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management) · [Debounce (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Debounce) · [Throttle (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Throttle) · [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) · [`addEventListener`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) (memory issues) · [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) (removing listeners)
- Chrome DevTools: [Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems) (last updated 6 Nov 2024)

**Run the checks:** `node --expose-gc interview-prep/modules/01-javascript/examples/12-memory-debounce-throttle.js`
(`--expose-gc` is a Node debugging flag that lets the file force garbage collection, so you can **see** a listener and a timer keeping data alive. Without it, the memory part is skipped.)

**Replaces:** old guide J4 (leaks) and J8 (throttle and debounce). The React parts (effect cleanup, Strict Mode) move to module 03.

## Explain: memory

### Life cycle
Allocate → use → release. JavaScript allocates for you (literals, `new`, `createElement`, methods that return new strings or arrays) and releases with a **garbage collector (GC)**. That automation can give "the false impression" you don't need to think about memory (MDN).

### How the GC decides
- Whether memory is still "needed" is undecidable in general, so collectors approximate it.
- **Reference counting** (free when nothing points at it) fails on cycles. **No modern engine uses it.**
- **Mark-and-sweep** is what every modern engine uses: start from the **roots** (the global object), mark everything **reachable**, collect the rest. Cycles aren't a problem: two objects pointing at each other but unreachable from a root are collected.
- Generational, incremental, concurrent and parallel GC are implementation improvements of mark-and-sweep, not a different rule.
- You **can't** trigger GC from JavaScript (Node's `--expose-gc` is for debugging only). To free something, make it **unreachable**.
- "Reference" includes closures: a function keeps the scope it closes over alive.

### So what's a leak?
Chrome's definition: a bug that makes a page use more and more memory over time. In mark-and-sweep terms (my wording): something you no longer need is still **reachable** from a root. Common ways that happens:

| Cause | Why it stays reachable | Source |
|---|---|---|
| A listener on a long-lived target (`window`, `document`) that's never removed | the target holds the listener, the listener's closure holds its data | checked in the example file; MDN's `addEventListener` notes anonymous listeners can't be removed |
| A `setInterval` never cleared | the running timer holds its callback and what it closes over | checked in the example file (my inference from reachability, not a doc statement) |
| **Detached DOM nodes**: removed from the page but still held in a variable or array | the JS reference keeps the whole subtree | Chrome DevTools page |
| A cache (`Map`, object) that only grows | the cache holds every key and value strongly | MDN `WeakMap` and memory pages |
| Re-racing a forever-pending promise | handlers pile up on it | MDN `Promise` page |
| `abort` listeners on `AbortSignal.any()` / `timeout()` signals never removed | the listener keeps the signal alive | MDN `AbortSignal` page |

### Fixes
- Remove listeners when the feature goes away. Easiest: add them with `{ signal }` and call `controller.abort()` once.
- Clear intervals and timeouts.
- Drop references to removed DOM nodes.
- Bound caches (a size limit or expiry), or key them weakly:
  - **`WeakMap`/`WeakSet`** for data attached to objects (DOM nodes, instances): the entry goes when the object goes.
  - **`WeakRef`** values in a `Map` for big results keyed by strings (MDN's cache example), with a **`FinalizationRegistry`** to remove empty entries. MDN: avoid these "where possible": when (or whether) cleanup callbacks run isn't guaranteed. Use `try...finally` for cleanup that must happen.

### Finding leaks (Chrome DevTools page)
1. **Task Manager** (Shift+Esc), with the "JavaScript memory" column: a live value that keeps rising means objects are being created or growing.
2. **Performance panel** with "Memory" ticked: force a GC at the start and end. A JS heap that ends higher than it started may mean a leak.
3. **Heap snapshot** (Memory panel): type `Detached` in the class filter to find detached DOM trees, then look at what's retaining them.
4. **Allocation timeline**: blue bars show new allocations, which are leak candidates.
5. **Allocation sampling**: which functions allocate most.
6. Frequent GC shows as memory going up and down quickly; it causes pauses.

Chrome also separates a leak (gets worse over time) from **bloat** (uses more memory than needed from the start; test on your users' typical devices).

## Explain: debounce and throttle (MDN glossary)

Both limit how often a function runs when it's called very often (typing, scrolling, resizing).

**Debounce:** wait until calls **stop** for a set time, then run once.
- Calls closer together than the interval form one batch. The batch ends (the **trailing edge**) when no call has happened for the interval.
- Usually runs on the trailing edge only. Use: search-as-you-type, autosave, validating an input after the user pauses.

**Throttle:** run **at most once per interval**, even while calls keep coming.
- The batch is measured from the **first** call. Usually runs on the **leading edge** (straight away), then ignores calls until the interval passes.
- Use: syncing with something that changes constantly, like a scroll position. The effect still updates continuously while scrolling, just not more often than needed.

**The difference in one line (MDN):** under continuous calls, throttling still runs at a maximum rate; debouncing waits indefinitely until the calls stop.

```js
function debounce(fn, ms) {
  let timer;                      // kept between calls by the closure
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

function throttle(fn, ms) {
  let last = -Infinity;
  return (...args) => {
    const now = performance.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}
```
These are minimal trailing-edge debounce and leading-edge throttle versions, checked in the example file (five quick "keystrokes" → one search with the last value; a scroll event every 5 ms for 130 ms → 3 to 5 runs at a 40 ms interval). Libraries add leading/trailing options and cancel/flush.

**The classic mistake:** creating a new debounced function on every call (for example, inside a React component's body on every render). Each one has its own timer, so nothing is debounced. The example file shows all three calls running. Create it once.

Debouncing doesn't stop out-of-order responses: combine it with "latest request wins" cancellation (topic 06).

## Traps
- Thinking garbage collection makes leaks impossible.
- "Reference counting can't handle cycles, so cycles leak in JS": not with mark-and-sweep.
- Removing a listener with a different function reference.
- Clearing an interval in one code path but not on errors or early returns (use `finally`, or one cleanup function).
- An unbounded `Map` cache in a long-running server process.
- Throttle when you meant debounce: a throttled search still fires during typing.

## Practice questions

**Q1. How does garbage collection work in JavaScript?**
Modern engines use mark-and-sweep: starting from the roots (the global object), they mark everything reachable and free the rest. So an object is collected once nothing reachable refers to it; cycles of unreachable objects are collected too. You can't force it; you make things unreachable.

**Q2. Name three common causes of memory leaks in a web app and how to find them.**
Listeners on `window`/`document` never removed, intervals never cleared, and detached DOM nodes still referenced from JavaScript (also: caches that only grow). Find them with Chrome's Task Manager and Performance memory graph (rising after forced GC), then a heap snapshot filtered by "Detached", or the allocation timeline.

**Q3. How do you remove several listeners at once?**
Register them all with the same `signal` from an `AbortController`, then call `abort()`.

**Q4. When is a `WeakMap` the right cache, and when isn't it?**
Right when the key is an object and the cached value should die with it. Wrong for string keys (not allowed) or when you want values to be freed under memory pressure; MDN uses a `Map` of `WeakRef`s for that, with a `FinalizationRegistry` to clean up entries.

**Q5. Debounce vs throttle, with an example of each?**
Debounce waits until calls stop, then runs once: search-as-you-type. Throttle runs at most once per interval while calls continue: updating something from the scroll position.

**Q6. Write a debounce function and explain why it works.**
(The code above.) A closure keeps `timer` between calls; each call cancels the previous timer and starts a new one, so the function only runs once the calls stop for `ms`.

**Q7. Your debounced search still calls the API on every keystroke. What might be wrong?**
A new debounced function is being created per keystroke (each with its own timer), for example inside a render function. Create it once and reuse it.

## Say it (about 45 seconds)
"Engines use mark-and-sweep: anything reachable from the roots stays, everything else is collected, including cycles. So a leak is something I no longer need that's still reachable: a listener on window that's never removed, an interval never cleared, a removed DOM node still held in a variable, or a cache that only grows. I clean up listeners with one AbortController signal, clear timers, use WeakMap for data tied to objects, and check with DevTools: memory rising after forced GC, then a heap snapshot filtered by Detached. Debounce waits until calls stop, like search-as-you-type; throttle caps the rate, like a scroll handler. Both keep their timer in a closure, so I create them once."
