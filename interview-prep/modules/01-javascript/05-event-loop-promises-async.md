# 05. The event loop, promises and async/await

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [JavaScript execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model)
- [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) · [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [`async function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) · [`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)

**Run the checks:** `node interview-prep/modules/01-javascript/examples/05-event-loop-async.js`
(It prints one `PromiseRejectionHandledWarning`. That's expected; check 14 explains it.)

**Replaces:** old guide J2 (async problems), J5 (execution order), J7 (callback hell). The Stripe webhook walk-through moves to topic 13.

## Explain

### Engine and host
- The **engine** (V8 in Chrome and Node) runs the language. The **host** (the browser, Node, Deno) adds everything that touches the outside world: timers, I/O, the DOM, `fetch`.

### An agent: heap, stack, queue
MDN's model: each "agent" (roughly a thread) has three things.
- **Heap:** where objects live.
- **Call stack** of execution contexts (frames): last in, first out. A frame holds the function's variables, `this`, and where to return to.
- **Job queue**, which HTML calls the **event loop**: first in, first out.

### How a job runs
1. Take a job from the queue and call its callback. That pushes the first frame.
2. Function calls push frames; returns pop them.
3. The job is done when the stack is **empty**. Then take the next job.

**Run to completion:** a job is never interrupted by another job. Once a function starts, nothing else touches the data it's using until it finishes. (Unlike threads in C.)
- Downside: a long job blocks clicks and scrolling. Keep jobs short and split big work into several jobs.

**Never blocking:** I/O finishes later through a callback (a `.then` handler, a `setTimeout` callback, an event handler), which becomes a new job. Legacy exceptions are `alert()` and synchronous XHR.

### Tasks vs microtasks
- HTML splits jobs into **tasks** (timers, events, I/O) and **microtasks** (promise callbacks, `await` continuations, `queueMicrotask`).
- After each task, the **whole** microtask queue is drained before the next task. A microtask that queues another microtask runs before any timer.
- Microtasks from promises and from `queueMicrotask` share one queue, in the order they were scheduled.

### Promises
- A promise represents the eventual result of an operation that's **already running**. (Not lazy: for laziness, use a function.)
- States: **pending** → **fulfilled** (with a value) or **rejected** (with a reason). **Settled** = not pending.
- **Resolved** is different: the promise is locked to follow something. `resolve(otherPromise)` resolves it immediately, but it's still pending until `otherPromise` settles.
- Handlers attached after settling still run, so there's no race between finishing and attaching.
- The executor in `new Promise((resolve, reject) => …)` runs **synchronously**. `.then` callbacks never do, even on an already-resolved promise.

### What `.then` returns
`then(onFulfilled, onRejected)` returns a **new** promise. Its state comes from the handler that ran:
- returns a value → fulfilled with that value;
- returns a promise (or thenable) → follows it;
- throws → rejected with the error;
- no matching handler → same state as before (a rejection skips `then(onFulfilled)` until it meets a rejection handler).

Consequences:
- `catch(f)` is `then(null, f)`. A catch that returns normally "fixes" the chain, so steps after it run. To keep the failure, rethrow.
- **Always return** promises from `then` callbacks. A promise started but not returned is "floating": the next step runs early and its errors aren't caught.
- One `catch` at the end handles errors from every step, including thrown exceptions.
- Nest only to **scope** a catch: an inner `.catch` that swallows failures of optional steps, while critical failures reach the outer one.
- Each `then` costs a tick, so do synchronous work in one handler.

### Unhandled rejections
- Browsers fire `unhandledrejection` on `window` (and `rejectionhandled` if a handler is attached later).
- Node uses `process.on("unhandledRejection", (reason, promise) => …)`. Adding that listener stops the default logging, so you must actually deal with each one.

### Combinators

| Method | Fulfils when | Rejects when | Empty input |
|---|---|---|---|
| `Promise.all` | **all** fulfil (array in input order) | the **first** rejection | fulfils `[]` |
| `Promise.allSettled` | **all** settle (`{status, value}` / `{status, reason}`) | never | fulfils `[]` |
| `Promise.any` | the **first** fulfilment | **all** reject (`AggregateError`) | rejects |
| `Promise.race` | the first to **settle**, whichever way | | |

- They all start nothing: the operations are already running. When `all` rejects early, the others keep going; their results are just ignored.
- Handlers stay attached to inputs even after the result settles. Racing the same forever-pending promise in a loop piles up handlers (a leak); cancel the operation with `AbortController` instead.
- Also: `Promise.resolve`, `Promise.reject`, `Promise.withResolvers()` (gives `{ promise, resolve, reject }`), `Promise.try()` (wraps a callback's result, sync or async, in a promise). MDN lists `Promise.allKeyed()` / `Promise.allSettledKeyed()` (take an object of promises) as experimental.
- **Concurrency is not parallelism.** One thread runs one job at a time; real parallel work needs workers.

### async / await
- An `async function` always returns a **new** promise: fulfilled with the return value, rejected with an uncaught error.
- Code up to and including the first `await` runs **synchronously**. With no `await` at all, the whole body runs synchronously (it still returns a promise).
- Code after each `await` behaves like it's inside a `.then`. `await` pauses only that function; the caller carries on.
- `await x` treats `x` like `Promise.resolve(x)`: native promises are used directly, thenables are followed, other values are wrapped. Even an already-fulfilled value waits for the next microtask.
- `await` is only valid in async functions and at the top level of modules.
- MDN: `return await p` is at least as fast as `return p` and gives a better stack trace (the caller appears in it), so it's "almost always preferable". It also matters inside `try`: only an awaited rejection is caught there (topic 06).

### Sequential vs concurrent
- `await a(); await b();`: `b` doesn't start until `a` finishes. Only right when `b` needs `a`'s result.
- Start both, then wait: `await Promise.all([a(), b()])`.
- **Don't** do `const p1 = a(); const p2 = b(); [await p1, await p2]`. If `p2` rejects while you're still waiting on `p1`, it's an **unhandled rejection**, even if the caller has `.catch`. `Promise.all` wires both in at once.
- `forEach` with an async callback doesn't wait. Use `for...of` with `await` (in order) or `Promise.all(items.map(…))` (together).
- Sequential composition: `fns.reduce((p, f) => p.then(f), Promise.resolve(x))`, or a `for...of` loop with `await`.

### Wrapping old callback APIs
Wrap at the **lowest level**, once, then only use the promise version:
```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```
MDN warns about APIs that call back **sometimes synchronously, sometimes asynchronously** ("Zalgo"). Promises avoid this: callbacks are always async, always in order.

## Worked examples (all checked in the example file)

```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
// A, D, C, B: sync code, then microtasks, then the timer task
```

```js
wait(0).then(() => console.log(4));
Promise.resolve().then(() => console.log(2)).then(() => console.log(3));
console.log(1);
// 1, 2, 3, 4: the chain's second microtask still beats the timer
```

```js
new Promise((resolve) => { console.log("executor"); resolve(); })
  .then(() => console.log("then"));
console.log("after");
// executor, after, then
```

```js
async function foo(name) {
  console.log(`${name} start`);
  await null;
  console.log(`${name} end`);
}
foo("First"); foo("Second"); console.log("sync");
// First start, Second start, sync, First end, Second end
```

MDN's `queueMicrotask` example gives, in order: `async function start`, `script sync part end`, `microtask 1`, `async function resume 1`, `queueMicrotask() after calling async function`, `microtask 2`, `async function resume 2`, `microtask 3`, `async function end`. The example file reproduces it exactly.

```js
await Promise.reject(new Error("x")).catch(() => "recovered");   // "recovered"
await Promise.resolve()
  .then(() => { throw new Error("Something failed"); })
  .catch(() => console.log("Do that"))
  .then(() => console.log("Do this, no matter what happened before"));
```

## Traps
- Forgetting to `return` inside `.then`: the chain moves on early and errors escape.
- Forgetting `await`: you get a Promise object, and a `try/catch` around it catches nothing.
- `async` callbacks in `forEach`.
- `[await p1, await p2]` with two already-started promises: unhandled rejection risk.
- A `.catch` in the middle that doesn't rethrow turns a failure into success.
- Assuming `Promise.all` cancels the others when one fails. It doesn't.
- Mixing `.then` chains and `await` in one function: legal, but pick one style for readability. (My style rule, from the old guide.)
- A long synchronous loop freezes the page: nothing else (clicks, timers, promise callbacks) runs until it ends.

## Practice questions

**Q1. Explain the event loop.**
One thread runs one job at a time on the call stack. When an async operation finishes, its callback is queued as a job. When the stack is empty, the next job runs. Promise callbacks are microtasks: after each task, all microtasks run before the next task, which is why a resolved promise's `.then` beats a zero-delay `setTimeout`.

**Q2. Predict:**
```js
setTimeout(() => console.log(1));
Promise.resolve().then(() => console.log(2));
queueMicrotask(() => console.log(3));
(async () => { console.log(4); await null; console.log(5); })();
console.log(6);
```
`4, 6, 2, 3, 5, 1`. Sync first (4, 6). Microtasks in scheduling order: the `then` (2), `queueMicrotask` (3), then the `await` continuation (5, scheduled when the async function hit `await`, after 2 and 3 were queued). The timer last (1).

**Q3. What does `.then` return, and how is its state decided?**
A new promise. It fulfils with whatever the handler returns, follows a returned promise, rejects if the handler throws, and passes the old state through if there was no matching handler.

**Q4. `Promise.all` vs `allSettled` vs `any` vs `race`?**
`all`: every result, or the first failure. `allSettled`: every outcome, never rejects. `any`: the first success, or an `AggregateError` if all fail. `race`: whatever settles first. Use `all` when one failure should stop the flow, `allSettled` when you need every outcome (send an email and an SMS; one failing shouldn't undo a paid booking).

**Q5. Is `async`/`await` blocking?**
No. `await` pauses only that async function; the rest of the program keeps running. The code after `await` is queued as a microtask when the awaited promise settles.

**Q6. Why might this cause an unhandled rejection even with `.catch` on the caller?**
```js
async function load() {
  const a = fetchA(); const b = fetchB();
  return [await a, await b];
}
```
If `b` rejects while the function is still awaiting `a`, nothing is listening to `b` yet. Use `await Promise.all([fetchA(), fetchB()])`.

**Q7. What's callback hell, and how do you get out of it?**
Each async step nested inside the previous one's callback, with error handling repeated at every level. Flatten it with promises or `async`/`await`, give each step a small named function, handle errors once, run independent steps with `Promise.all`, and wrap old callback APIs into promises once.

**Q8. Two `.then`s on the same resolved promise both do `i += 1; log(i)`. Can they interleave?**
No. Each job runs to completion, so the output is always 1 then 2.

**Q9. How would you run 3 steps where step 2 needs step 1, and steps 3a/3b are independent?**
`const r1 = await step1(); const r2 = await step2(r1); await Promise.allSettled([step3a(r2), step3b(r2)]);` (or `all` if either failing should fail the whole thing).

**Q10. `return p` vs `return await p` in an async function?**
Both resolve to the same value. MDN prefers `return await p`: it's at least as fast, puts the caller in the stack trace, and inside a `try` it lets the `catch` handle a rejection.

## Say it (about 60 seconds)
"JavaScript runs one job at a time on a call stack, and each job runs to completion. Async work finishes later through callbacks that are queued as jobs. There are two queues: tasks, like timers and events, and microtasks, like promise callbacks and await continuations. After each task, all microtasks run, so a resolved promise beats a zero-delay timer. A promise is the future result of something already running; `then` returns a new promise whose state comes from the handler, so I always return inside `then` and put one `catch` at the end. `await` only pauses its own function. I run dependent steps in order and independent ones with `Promise.all`, or `allSettled` when I need every outcome, and I never put async callbacks in `forEach`."
