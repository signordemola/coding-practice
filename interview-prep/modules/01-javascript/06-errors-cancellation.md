# 06. Errors, `finally` and cancellation

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [`try...catch`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch)
- [`Error: cause`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
- [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) · [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) · [`AbortSignal.timeout()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) · [`AbortSignal.any()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)

**Run the checks:** `node interview-prep/modules/01-javascript/examples/06-errors-cancellation.js`

**Replaces:** the "lost errors" and "race conditions" parts of old guide J2, and the retry part of J9.

## Explain

### `try` / `catch` / `finally`
- Three forms: `try…catch`, `try…finally`, `try…catch…finally`. The parts must be blocks `{ }`.
- An error thrown anywhere inside `try`, including in functions it calls, jumps to `catch`.
- **The catch binding:**
  - It's optional: `catch { … }` when you don't need the error.
  - It can be destructured: `catch ({ name, message })`.
  - It exists only inside the `catch` block (you can't redeclare the same name there).
  - It's writable, so you can normalise it: `if (!(e instanceof Error)) e = new Error(e)`. You can `throw` any value, so don't assume `e.message` exists.
- **`finally` always runs** before control leaves the statement, whether the `try` finished, threw or returned.
  - A `return`, `throw`, `break` or `continue` in `try`/`catch` is **held** until `finally` finishes. The return **value** is worked out **before** `finally` runs.
  - A control-flow statement **in** `finally` overrides the held one: a `return` in `finally` replaces an earlier return or swallows a throw. MDN: keep `finally` for cleanup only.
- Nested `try`: an error is caught once, by the nearest `catch`, unless rethrown.
- "Conditional catch": check `instanceof` in the `catch` and **rethrow** anything you didn't expect, so real bugs aren't silenced.

### Async errors
- With promises, a rejection goes to the nearest `.catch` (topic 05).
- With `async`/`await`, a rejected `await` **throws** inside the function, so normal `try/catch` works. But only for promises you **await inside the `try`**: `return p` inside `try` leaves the block before `p` rejects. (Shown in the example file; it follows from MDN's `await` page.)
- `await p.catch(() => fallback)` gives a default without `try`, but only if the function returns a rejected promise; a function that throws synchronously before returning skips the `.catch`.

### Error causes
- `new Error("Higher-level message", { cause: originalError })` wraps an error with context and keeps the original on `.cause`.
- `cause` can be **any value**, including structured data for code to read: `{ cause: { code: "NonInteger", values: [p, q] } }`. Don't assume it's an `Error`.
- Use `cause` for **one** failure with added context. `AggregateError` is for several unrelated failures (it's what `Promise.any` rejects with). `SuppressedError` is for an error that happened while handling another one (MDN lists it; it isn't in Node 22, so the example file doesn't use it).

### Cancellation: `AbortController` and `AbortSignal`
Promises can't be cancelled themselves. You cancel the **operation** underneath, with a signal.
- `const controller = new AbortController()`; pass `controller.signal` to the operation (`fetch(url, { signal })`); call `controller.abort(reason?)` to cancel.
- `fetch` then rejects with a `DOMException` named **`AbortError`**. Aborting after the response arrived but before the body was read makes reading the body throw `AbortError`.
- A signal is **single-use**: once aborted, every later operation using it fails straight away. Make a new controller per request.
- `signal.aborted`, `signal.reason`, `signal.throwIfAborted()`, and an `abort` event.
- **`AbortSignal.timeout(ms)`** aborts with a **`TimeoutError`**, so you can tell a timeout from a user cancel. The time is "active" time (it pauses when a page is in the back-forward cache or a worker is suspended), and you can't cancel it.
- **`AbortSignal.any([a, b])`** aborts when any input does, with that input's reason.
- The same signal works for **event listeners**: `addEventListener(type, fn, { signal })`, and one `abort()` removes them all (topic 11).

**Writing your own abortable function (MDN pattern):**
1. `signal.throwIfAborted()` at the start.
2. Start the work.
3. On `abort`: stop the work (`clearTimeout`, close the stream…) and `reject(signal.reason)`.
4. On success: remove your `abort` listener. `{ once: true }` only removes it if the event actually fires, and a long-lived signal would otherwise keep the listener and everything it references alive.

Callers usually ignore `AbortError` (they cancelled on purpose) and show every other error.

### "Latest request wins"
For search-as-you-type or switching dates: abort the previous request before starting a new one, so a slow old response can't overwrite a newer one.

```js
let controller;
async function loadSlots(date) {
  controller?.abort();                 // cancel the previous request
  controller = new AbortController();
  try {
    const res = await fetch(`/api/slots?date=${date}`, { signal: controller.signal });
    return await res.json();
  } catch (err) {
    if (err.name === "AbortError") return; // stale: ignore
    throw err;
  }
}
```
(The example file runs the same logic with a local abortable function instead of `fetch`: only the last of three calls finishes.)

### Retries (from the old guide, J9)
- Retry only operations that are **safe to repeat** (reads, or writes protected by an idempotency key). Never blindly retry a charge.
- Back off between attempts (500 ms, 1 s, 2 s…).
- These are general engineering practice, not MDN statements; idempotency keys are covered with Stripe in module 08a.

## Worked examples (checked in the example file)

```js
function safeWrite() {
  try { return events.push("write"); }   // value computed now
  finally { events.push("close"); }      // runs before the function returns
}

function doIt() {
  const order = ["z"];
  try { order.push("try"); return order.sort(); }
  finally { order.push("finally"); return order; }  // overrides the first return
}
doIt(); // ["try", "z", "finally"]

function swallow() {
  try { throw "try"; } catch { throw "catch"; } finally { return "finally"; }
}
swallow(); // "finally": the thrown "catch" is lost

try { connect(); }
catch (err) { throw new Error("Connecting to database failed.", { cause: err }); }

await fetch(url, { signal: AbortSignal.timeout(5000) });          // TimeoutError after 5 s
await fetch(url, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]) });
```

## Traps
- `catch (e) { console.log(e) }` and carrying on: the failure is hidden. Handle it or rethrow.
- `return` or `throw` inside `finally`.
- `try { return promise; } catch {}` doesn't catch the rejection; `return await promise` does.
- Reusing an aborted signal for the next request.
- Treating `AbortError` as a real failure and showing an error message when the user just navigated away.
- `{ once: true }` on an `abort` listener as your only cleanup.

## Practice questions

**Q1. When does `finally` run, and what can go wrong in it?**
Always, before control leaves the `try` statement: after a normal finish, a throw or a return. A `return` or `throw` inside `finally` overrides whatever was pending, which can hide errors. Keep it for cleanup like closing a file or releasing a lock.

**Q2. Predict:** `swallow()` above. What does it return?
`"finally"`. The `throw "catch"` is held until `finally` runs, and `finally`'s `return` replaces it.

**Q3. How do you add context to an error without losing the original?**
`throw new Error("Saving booking failed", { cause: err })`. The original stays on `.cause` for logging and debugging.

**Q4. How do you cancel a fetch? How do you tell a timeout from a user cancel?**
Pass `signal` from an `AbortController` and call `abort()`. The fetch rejects with `AbortError`. For timeouts use `AbortSignal.timeout(ms)`, which rejects with `TimeoutError`; combine both with `AbortSignal.any`.

**Q5. A search box shows results for "sal" after you typed "salon". Why, and how do you fix it?**
The "sal" request finished after the "salon" one and overwrote it (a race). Abort the previous request when a new one starts (and debounce the input, topic 12), or ignore responses that aren't from the latest request.

**Q6. Why doesn't this catch the error?**
```js
async function save() {
  try { return db.insert(row); } catch (e) { log(e); }
}
```
`return db.insert(row)` hands the promise back without waiting, so the `try` block has already finished when it rejects. Use `return await db.insert(row)`.

**Q7. You write a function that accepts a `signal`. What must it do?**
Reject straight away if the signal is already aborted; listen for `abort`, stop the work and reject with `signal.reason`; and remove the listener when the work finishes normally.

## Say it (about 45 seconds)
"I let errors travel to the place that can handle them, and I only catch what I expect: I check the type and rethrow the rest. When I rethrow with a clearer message I pass the original as `cause`. `finally` is for cleanup; I never return from it, because that swallows errors. In async code I await inside the `try`, otherwise the rejection escapes. Promises can't be cancelled, so I cancel the operation with an AbortController: abort the previous request when a new one starts, use `AbortSignal.timeout` for time limits so I can tell a timeout from a user cancel, and ignore AbortError in the UI."
