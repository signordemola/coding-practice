# Module 01: JavaScript

**Why this module first:** JavaScript is the skill most shared across the roles I apply for (see `../../roles/` and the interview log in `interview-bank/study-guide.md`). Gaps flagged in past interviews are marked ★.

**How it was built (25–26 Nov 2026):**
- Every MDN page listed in the topics below was read **in full** from MDN's own source repository (`mdn/content`, snapshot of 25 Nov 2026). MDN pages don't carry their own "last updated" date, so the snapshot is the date.
- One Chrome DevTools page (memory problems, last updated 6 Nov 2024) and this repo's `real-apps/` notes were also used.
- **Every code claim is checked by running it:** `examples/` has one file per topic that asserts each behaviour. Anything that's my own reasoning rather than a doc statement says so.
- Checked on **Node 22.23.4**, because that's what my build workspace has. The repo targets Node 26. Two methods on MDN aren't in Node 22 (`Map.prototype.getOrInsert`, `Promise.try`): their checks are skipped on older Node and run automatically on newer Node. `Promise.allKeyed` is marked experimental on MDN and is only described. Run `run-all.js` on your machine (Node 26) to confirm everything.

## How to use it
1. Read a topic page.
2. Run its example file and read the asserts: each one is a fact you should be able to predict.
3. Close the page. Answer the practice questions out loud, then check.
4. Say the "Say it" answer in your own words, timed.
5. Before an interview, do the mock round below.

**Run every example:** `node interview-prep/modules/01-javascript/examples/run-all.js`
The DOM events page is the only one that needs a browser: open `examples/11-dom-events.html`.

## Topics

| # | Topic | Main MDN pages | Example file |
|---|---|---|---|
| 01 | [Values, types, coercion, equality](01-values-types-equality.md) | Data structures; Equality comparisons | `01-values-equality.js` |
| 02 | [Scope, hoisting, closures](02-scope-hoisting-closures.md) | `let`, `var`, Hoisting; Closures | `02-scope-closures.js`, `02-sloppy-globals.cjs` |
| 03 | [★ `this`, call/apply/bind, arrow functions](03-this-bind-arrow.md) | `this`; `bind()`; Arrow functions | `03-this-bind-arrow.js`, `03-this-sloppy.cjs` |
| 04 | [★ Prototypes and classes (incl. older syntax)](04-prototypes-classes.md) | Inheritance and the prototype chain; Classes | `04-prototypes-classes.js` |
| 05 | [The event loop, promises, async/await](05-event-loop-promises-async.md) | Execution model; Using promises; `Promise`; `async function`; `await` | `05-event-loop-async.js` |
| 06 | [Errors, `finally`, cancellation](06-errors-cancellation.md) | `try...catch`; `Error.cause`; `AbortController`/`AbortSignal` | `06-errors-cancellation.js` |
| 07 | [★ Arrays: copying vs mutating, `sort`, grouping](07-arrays.md) | `Array`; `sort()`; `Object.groupBy()` | `07-arrays.js` |
| 08 | [★ Map, Set, WeakMap (the hashing tools)](08-map-set-weak.md) | Keyed collections; `Map`; `Set`; `WeakMap` | `08-map-set-weak.js` |
| 09 | [Copying: shallow, deep, `structuredClone`](09-copying.md) | Shallow/Deep copy; `structuredClone()`; Structured clone algorithm | `09-copying.js` |
| 10 | [Modules: ESM, CommonJS, the module graph](10-modules.md) | Modules; Module graph; Across platforms; On the web | `10-modules.js` + `10-modules/` |
| 11 | [DOM events: bubbling, capture, delegation](11-dom-events.md) | Events; Event bubbling; `addEventListener()`; `closest()` | `11-event-listeners.js`, `11-dom-events.html` |
| 12 | [Memory, leaks, debounce, throttle](12-memory-debounce-throttle.md) | Memory management; Debounce; Throttle (+ Chrome DevTools) | `12-memory-debounce-throttle.js` |
| 13 | [★ Explaining a flow end to end](13-explain-flows.md) | (uses `real-apps/` and module 08a) | none |

The arrays-and-hashing **coding problems** stay in `lesson-04/`. Topics 07 and 08 teach the tools without solving those problems, so the drill stays a real test.

## Mock round (20 questions, about 15 minutes)
Answer each out loud in under a minute. The topic number is where the answer lives.

1. `==` vs `===`, and one surprising `==` result. (01)
2. Why does `[NaN].indexOf(NaN)` return -1 but `includes` find it? (01)
3. What's the Temporal Dead Zone? (02)
4. Predict `for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))`. Fix it two ways. (02)
5. What's a closure? Give a real use. (02)
6. What decides `this`? Go through the cases. (03)
7. `call` vs `apply` vs `bind`. (03)
8. Why shouldn't an arrow function be an object method? (03)
9. What does `new` do, step by step? (04)
10. Rewrite a small class as a constructor function with a prototype method. (04)
11. Explain the event loop, tasks vs microtasks. (05)
12. Predict the order: `setTimeout` 1, `then` 2, `queueMicrotask` 3, async fn logging 4 / `await` / 5, sync 6. (05)
13. `Promise.all` vs `allSettled` vs `any` vs `race`. (05)
14. Why can `[await p1, await p2]` cause an unhandled rejection? (05)
15. How do you cancel a fetch, and tell a timeout from a user cancel? (06)
16. Which array methods mutate? Predict `[1, 30, 4, 21, 100000].sort()`. (07)
17. Why use a `Map` instead of an object for counting? (08)
18. Shallow vs deep copy; what can't `structuredClone` copy? (09)
19. Event delegation: how, and why `closest()`? (11)
20. Three causes of memory leaks and how you'd find them. Debounce vs throttle. (12)

Then one flow from topic 13 in the six-part order.

## What moved here from the old guide (`interview-bank/study-guide.md`, Part B)

| Old | New | Changes after checking against MDN |
|---|---|---|
| J1 events and delegation | 11 | Added passive-by-default touch/wheel listeners, `once`/`signal`, `handleEvent`, same-capture rule for removal. React's root delegation moves to module 03 (not checked yet). |
| J2 async challenges | 05, 06, 13 | Kept the order quiz. Added `.then` state rules, the `[await p1, await p2]` trap, Node's `unhandledRejection`. The Stripe walk-through now uses my real-app notes. |
| J3 closures | 02 | Stale closures in React move to module 03. |
| J4 memory leaks | 12 | Leak causes now sourced (Chrome DevTools, MDN) or marked as my inference; added the forced-GC demo. React cleanup moves to module 03. |
| J5 execution order | 05, 13 | Same advice; timing now checked by running. |
| J6 hoisting and scoping | 02 | Added MDN's four kinds of hoisting, `typeof` in the TDZ, `switch` case blocks, implicit globals. |
| J7 callback hell | 05 | Added MDN's "wrap at the lowest level" and the Zalgo warning. |
| J8 throttle and debounce | 12 | Definitions now follow MDN's leading/trailing edge wording. |
| J9 closures in async | 05, 06, 12 | Memoise/retry kept as general practice, marked as not from MDN. |
| J10 modules and block scope | 10 | Added load/link/evaluate, cycles, top-level await reordering, CJS interop details. |
| J11 `this` and binding | 03 | Added sloppy-mode substitution, bind details, class field timing. Class components move to module 03. |
| J12 prototypes and classes | 04 | Added the two meanings of "prototype", `for...in` vs `Object.keys`, class evaluation order. |

Part B of the old guide can be deleted once modules 03 (React) takes the React parts.

## Not covered (yet)
Iterators and generators, `Proxy`/`Reflect`, regular expressions, `Intl` and `Temporal` (dates and time are taught in `lesson-03/`), typed arrays, workers. Add them only if an interview asks.
