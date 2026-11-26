// Topic 01: the event loop — nextTick vs promises vs setImmediate vs timers, and blocking.
// Run all: node interview-prep/modules/04-node-rest/examples/run-all.js
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs";

// Runs a small script in a fresh Node process and returns what it printed.
function run(code: string, inputType: "commonjs" | "module") {
  const r = spawnSync(process.execPath, [`--input-type=${inputType}`, "-e", code], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim().split("\n").join(" ");
}

// --- 1. The nodejs.org example: nextTick queue, then promise microtasks, then setImmediate ---
const orderScript = `
  const baz = () => console.log("baz");
  const foo = () => console.log("foo");
  const zoo = () => console.log("zoo");
  console.log("start");
  setImmediate(baz);
  new Promise((resolve) => resolve("bar")).then((v) => { console.log(v); process.nextTick(zoo); });
  process.nextTick(foo);
`;
assert.equal(run(orderScript, "commonjs"), "start foo bar zoo baz");
// In an ES module the script itself is already running inside the promise microtask queue,
// so the resolved promise's callback runs before the nextTick (nodejs.org explains why).
assert.equal(run(orderScript, "module"), "start bar foo zoo baz");

// --- 2. setTimeout(0) vs setImmediate --------------------------------------------------------
// Inside an I/O callback, setImmediate (check phase) always runs before a 0 ms timer.
async function orderInsideIo() {
  return new Promise<string>((resolve) => {
    readFile(import.meta.filename, () => {
      const seen: string[] = [];
      setTimeout(() => {
        seen.push("timeout");
        if (seen.length === 2) resolve(seen.join(" "));
      }, 0);
      setImmediate(() => {
        seen.push("immediate");
        if (seen.length === 2) resolve(seen.join(" "));
      });
    });
  });
}
for (let i = 0; i < 20; i++) assert.equal(await orderInsideIo(), "immediate timeout");
// (In the main module the order is not deterministic, so there's nothing to assert there.)

// --- 3. A timer is a threshold, not an exact time: a busy loop delays it --------------------------
function busyFor(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    // blocking: nothing else on the event loop can run
  }
}
{
  const scheduled = performance.now();
  const fired = new Promise<number>((resolve) => setTimeout(() => resolve(performance.now() - scheduled), 10));
  busyFor(150); // synchronous work longer than the timer's threshold
  const delay = await fired;
  assert.ok(delay >= 150, `timer fired after ${delay.toFixed(0)} ms`); // waited for the loop to be free
}

// --- 4. Partitioning: split work with setImmediate so other callbacks get a turn ------------------
async function sumBlocking(n: number) {
  let sum = 0;
  for (let i = 1; i <= n; i++) sum += i;
  return sum;
}
function sumPartitioned(n: number, chunk = 100_000) {
  return new Promise<number>((resolve) => {
    let sum = 0;
    let i = 1;
    function step() {
      const end = Math.min(n, i + chunk - 1);
      for (; i <= end; i++) sum += i;
      if (i > n) resolve(sum);
      else setImmediate(step); // yield to the event loop between chunks
    }
    step();
  });
}
{
  const n = 30_000_000;
  let tickedDuringBlocking = false;
  const t1 = setTimeout(() => (tickedDuringBlocking = true), 0);
  const a = await sumBlocking(n); // one long synchronous run
  const tickedBeforeResult = tickedDuringBlocking;
  clearTimeout(t1);

  let ticks = 0;
  const interval = setInterval(() => ticks++, 0);
  const b = await sumPartitioned(n);
  clearInterval(interval);

  assert.equal(a, b);
  assert.equal(tickedBeforeResult, false); // the timer couldn't run until the loop finished
  assert.ok(ticks > 0, "timers ran between partitioned chunks");
}

// --- 5. Recursive nextTick starves I/O: the loop never reaches the poll/check phases --------------
{
  let immediateRan = false;
  setImmediate(() => (immediateRan = true));
  let n = 0;
  await new Promise<void>((resolve) => {
    function again() {
      n++;
      if (n < 100_000) process.nextTick(again);
      else resolve();
    }
    process.nextTick(again);
  });
  assert.equal(immediateRan, false); // 100,000 nextTicks ran before a single setImmediate
}

console.log("01 event loop: all checks passed");
