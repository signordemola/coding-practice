// Topic 12: memory (reachability, leaks, weak references) plus debounce and throttle.
// Run: node --expose-gc interview-prep/modules/01-javascript/examples/12-memory-debounce-throttle.js
// --expose-gc is a Node debugging flag (MDN memory page): it lets this file force a garbage
// collection so we can SEE an object being kept alive. Real code never calls gc().
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";

// --- Part 1: a listener on a long-lived target keeps its closure alive -----------
if (typeof globalThis.gc !== "function") {
  console.log("  (memory checks skipped: run with node --expose-gc to see them)");
} else {
  // WeakRef lets us watch an object without keeping it alive ourselves.
  // We wait a tick before and after gc(): when I ran this, objects read through a WeakRef in the
  // current job weren't collected until the job had finished.
  const collect = async () => {
    await sleep(0);
    globalThis.gc();
    await sleep(0);
  };

  const appWideTarget = new EventTarget(); // think: window or document
  let ref;
  let onResize;
  (() => {
    const bigData = { rows: new Array(100_000).fill("row") };
    ref = new WeakRef(bigData);
    onResize = () => bigData.rows.length; // the closure captures bigData
    appWideTarget.addEventListener("resize", onResize);
  })(); // the function that created bigData has finished...

  await collect();
  assert.notEqual(ref.deref(), undefined); // ...but the listener still reaches it: retained

  appWideTarget.removeEventListener("resize", onResize);
  onResize = undefined; // drop our own reference too
  await collect();
  assert.equal(ref.deref(), undefined); // unreachable now, so collected

  // The same with a timer: a running interval keeps its callback (and what it closes over) alive.
  let timerRef;
  let intervalId;
  (() => {
    const cache = { entries: new Array(100_000).fill(0) };
    timerRef = new WeakRef(cache);
    intervalId = setInterval(() => cache.entries.length, 1_000);
  })();
  await collect();
  assert.notEqual(timerRef.deref(), undefined);
  clearInterval(intervalId);
  await collect();
  assert.equal(timerRef.deref(), undefined);

  // A Map cache holds keys strongly; a WeakMap doesn't.
  const strong = new Map();
  const weak = new WeakMap();
  let strongRef;
  let weakRef;
  (() => {
    const a = { id: "a" };
    const b = { id: "b" };
    strong.set(a, "metadata");
    weak.set(b, "metadata");
    strongRef = new WeakRef(a);
    weakRef = new WeakRef(b);
  })();
  await collect();
  assert.notEqual(strongRef.deref(), undefined); // the Map keeps it alive
  assert.equal(weakRef.deref(), undefined); // the WeakMap let it go
  strong.clear();

  console.log("  (memory checks ran with forced GC)");
}

// --- Part 2: a WeakRef cache (MDN example, network replaced by a local function) ---
function cached(getter) {
  const cache = new Map(); // string key → WeakRef of a big result
  return async (key) => {
    const hit = cache.get(key)?.deref();
    if (hit !== undefined) return hit;
    const value = await getter(key);
    cache.set(key, new WeakRef(value));
    return value;
  };
}
let fetches = 0;
const getReport = cached(async (id) => {
  fetches++;
  return { id, rows: [] };
});
const r1 = await getReport("2026-11");
const r2 = await getReport("2026-11");
assert.equal(r1, r2); // still alive (we hold r1), so served from cache
assert.equal(fetches, 1);

// --- Part 3: debounce and throttle ---------------------------------------------------
// Debounce: wait until calls STOP for `ms`, then run once with the latest arguments (trailing edge).
function debounce(fn, ms) {
  let timer; // kept alive by the closure
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Throttle: run at most once per `ms` while calls keep coming (leading edge).
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

{
  const searches = [];
  const search = debounce((q) => searches.push(q), 30);
  for (const q of ["s", "sa", "sal", "salo", "salon"]) {
    search(q);
    await sleep(5); // typing faster than 30 ms per key
  }
  assert.deepEqual(searches, []); // nothing yet: the user is still "typing"
  await sleep(50);
  assert.deepEqual(searches, ["salon"]); // one call, latest value
}

{
  const runs = [];
  const onScroll = throttle((y) => runs.push(y), 40);
  const start = performance.now();
  let y = 0;
  while (performance.now() - start < 130) {
    onScroll(y++);
    await sleep(5); // a scroll event every ~5 ms for ~130 ms
  }
  // Leading edge fires immediately, then about every 40 ms: 3–4 runs instead of ~25.
  assert.ok(runs.length >= 3 && runs.length <= 5, `throttled runs: ${runs.length}`);
  assert.equal(runs[0], 0); // the first call ran straight away
}

// The React-style mistake, in plain JS: making a NEW debounced function per call
// means each one has its own timer, so nothing is debounced.
{
  const calls = [];
  const handler = (q) => debounce((v) => calls.push(v), 20)(q); // new debounce every time
  handler("a");
  handler("ab");
  handler("abc");
  await sleep(40);
  assert.deepEqual(calls, ["a", "ab", "abc"]); // all three ran
}

console.log("12-memory-debounce-throttle: all checks passed");
