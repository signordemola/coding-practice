# 01. The Node.js event loop, and not blocking it

**Sources (nodejs.org Learn, from `nodejs/learn` commit `ea10f2a`, 1 Nov 2026, read in full):**
[The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) ·
[Understanding process.nextTick()](https://nodejs.org/en/learn/asynchronous-work/understanding-processnexttick) ·
[Understanding setImmediate()](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate) ·
[Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop) (the closing npm-risks section skimmed)

**Run the checks:** `node interview-prep/modules/04-node-rest/examples/run-all.js` (this topic: `examples/01-event-loop.ts`)

The browser event loop (tasks vs microtasks) is module 01, topic 05. This page is Node's version.

## Explain

### One JavaScript thread, many clients
- Node runs your JavaScript on **one thread** (the event loop). Non-blocking I/O works by handing operations to the operating system kernel and running your callback when it reports completion.
- Some work goes to libuv's **Worker Pool** (threadpool) instead: `dns.lookup()`, almost all `fs` APIs (not the `Sync` ones), CPU-heavy crypto (`pbkdf2`, `scrypt`, `randomBytes`, `generateKeyPair`) and async `zlib`.
- The rule of thumb from the guide: **Node is fast when the work for each client at any moment is small.** One slow callback delays *every* client. That's a performance problem and a security one: "evil input" can cause a denial of service.

### The phases (simplified)
| Phase | Runs |
|---|---|
| **timers** | `setTimeout`/`setInterval` callbacks whose threshold has passed |
| pending callbacks | some deferred system callbacks (e.g. certain TCP errors) |
| idle, prepare | internal |
| **poll** | new I/O events and their callbacks; Node waits here when there's nothing else |
| **check** | `setImmediate` callbacks |
| close callbacks | e.g. `socket.on('close')` after `destroy()` |

- Each phase has a FIFO queue. The process exits when there are no pending timers or I/O.
- Since libuv 1.45 (Node 20), timers run after the poll phase each iteration (and once before the loop starts).
- **A timer is a threshold, not an exact time.** A 10 ms timer waits for any running code to finish (checked: a 150 ms busy loop delays it to ≥150 ms).

### `process.nextTick` vs promises vs `setImmediate` vs `setTimeout`
- `process.nextTick` isn't part of the loop. Its queue runs **after the current operation, before the loop continues**, in any phase.
- Then the promise microtask queue, then the next phases.
- nodejs.org's example prints `start foo bar zoo baz` in CommonJS but `start bar foo zoo baz` in an ES module, because the module itself is already running inside the promise microtask queue (both checked).
- `setTimeout(fn, 0)` vs `setImmediate`: the order is **not deterministic in the main module**, but **inside an I/O callback `setImmediate` always runs first** (checked 20 times).
- Recursive `nextTick` **starves I/O**: the loop never reaches poll or check (checked: 100,000 nextTicks before one `setImmediate`).
- The guide admits the names "should be swapped", and recommends **`setImmediate` in all cases**, as it's easier to reason about. `nextTick` is for "after this code, before anything else", like emitting an event after the constructor returns so listeners can attach.

### Don't block the event loop
- Keep every callback (including code after `await`) quick; think about its **complexity** in terms of input size, and **bound input sizes** (reject over-long input).
- **ReDoS:** some regular expressions take exponential time on a mismatch. Avoid nested quantifiers `(a+)*`, overlapping alternatives `(a|a)*` and backreferences; use `indexOf` for plain substring checks. The guide's example `/(\/.+)+$/` hangs on `"///…/\n"`.
- **Synchronous core APIs don't belong in a server:** `fs.*Sync`, `crypto.pbkdf2Sync`/`randomFillSync`/sync `randomBytes`, `zlib.inflateSync`/`deflateSync`, `child_process.*Sync`.
- **JSON:** `JSON.parse`/`stringify` are O(n) but slow for big inputs. The guide measured a 50 MB string: 0.7 s to stringify, 1.3 s to parse. Cap request body sizes (topic 04).
- **Heavy computation:**
  - **partition** it: do a chunk, then `setImmediate(next)` so other callbacks get a turn (checked: timers run between chunks, but not during the one-shot loop);
  - or **offload** it to other threads or processes (a C++ addon, child processes, cluster), paying a serialisation cost;
  - don't spawn a child process per request (fork bomb).
  - The guide's honest advice: if your server is mostly heavy computation, consider whether Node is the right tool.
- **The Worker Pool can be blocked too:** keep task times similar (e.g. stream large files instead of one huge `readFile`).

### A note on the source's age
"Don't Block the Event Loop" says its list of sync APIs is "complete as of Node.js v9", and it doesn't mention `worker_threads`. I haven't read the `worker_threads` docs for this module, so they're not covered.

## Traps
- `fs.readFileSync` or `bcrypt`/`pbkdf2Sync` inside a request handler.
- A validation regex with nested quantifiers.
- Parsing unbounded JSON bodies.
- Assuming `setTimeout(fn, 0)` runs "next".
- Using `process.nextTick` in a loop.

## Practice questions

**Q1. Node is single-threaded; how does it handle thousands of connections?** JavaScript runs on one thread, but I/O is handed to the operating system (and some work to libuv's thread pool). The loop just runs short callbacks when results arrive, so as long as each callback is quick, many clients share the thread.

**Q2. Name the main event loop phases.** Timers, pending callbacks, poll (I/O), check (`setImmediate`), close callbacks.

**Q3. Order: `setTimeout(0)`, `setImmediate`, `process.nextTick`, `Promise.then`, in a CommonJS script.** `nextTick`, then the promise callback, then timeout and immediate in an order that isn't guaranteed in the main module. Inside an I/O callback, immediate comes before timeout.

**Q4. What blocks the event loop, and how would you find out?** Long synchronous work: big loops, sync fs/crypto/zlib, huge JSON, catastrophic regexes. One sign is timers firing late; I'd profile the slow handler. (The profiling guide isn't covered here.)

**Q5. How do you run CPU-heavy work without blocking requests?** Partition it with `setImmediate` between chunks, or offload it to another thread or process; or move it out of the request path entirely.

## Say it (about 40 seconds)
"Node runs JavaScript on a single event loop, and hands I/O to the operating system or libuv's thread pool, so one thread can serve many clients as long as each callback is short. The loop goes through phases: timers, poll for I/O, check for `setImmediate`, close callbacks. `process.nextTick` and promise callbacks run in between, before the loop moves on. The danger is blocking: a big synchronous loop, sync file or crypto calls, a huge JSON parse or a bad regex stops every request. So I bound input sizes, avoid sync APIs in servers, and split or offload heavy work."
