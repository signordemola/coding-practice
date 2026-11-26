// Topic 06: try/catch/finally, error causes, AbortController / AbortSignal.
// Run: node interview-prep/modules/01-javascript/examples/06-errors-cancellation.js
import assert from "node:assert/strict";

// --- try / catch / finally -----------------------------------------------------
// Optional binding and destructuring in catch.
function isValidJSON(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}
assert.equal(isValidJSON('{"a":1}'), true);
assert.equal(isValidJSON("{a:1}"), false);

try {
  throw new TypeError("oops");
} catch ({ name, message }) {
  assert.equal(name, "TypeError");
  assert.equal(message, "oops");
}

// You can throw anything, so normalise before using .message.
try {
  throw "Oops; this is not an Error object";
} catch (e) {
  if (!(e instanceof Error)) e = new Error(e);
  assert.equal(e.message, "Oops; this is not an Error object");
}

// finally runs before the function returns; the return VALUE was computed before finally.
const events = [];
function safeWrite() {
  events.push("open");
  try {
    return events.push("write"); // evaluated now (returns 2)
  } finally {
    events.push("close"); // runs before the return completes
  }
}
assert.equal(safeWrite(), 2);
assert.deepEqual(events, ["open", "write", "close"]);

// A return in finally OVERRIDES the earlier return or throw. Avoid it.
function doIt() {
  const order = ["z"];
  try {
    order.push("try");
    return order.sort();
  } finally {
    order.push("finally");
    return order; // shown only to prove the rule
  }
}
assert.deepEqual(doIt(), ["try", "z", "finally"]);

function swallow() {
  try {
    throw "try";
  } catch {
    throw "catch";
  } finally {
    return "finally"; // the "catch" throw is lost
  }
}
assert.equal(swallow(), "finally");

// Nested: an inner try without catch still runs finally, then the outer catch.
const nested = [];
try {
  try {
    throw new Error("oops");
  } finally {
    nested.push("finally");
  }
} catch (ex) {
  nested.push(`outer ${ex.message}`);
}
assert.deepEqual(nested, ["finally", "outer oops"]);

// Catch only what you expect; rethrow the rest.
function parsePositiveInt(text) {
  const n = Number(text);
  if (!Number.isInteger(n) || n <= 0) throw new RangeError(`Not a positive integer: ${text}`);
  return n;
}
function readQuantity(text) {
  try {
    return parsePositiveInt(text);
  } catch (e) {
    if (e instanceof RangeError) return 1; // the one error we expected
    throw e; // anything else is a real bug
  }
}
assert.equal(readQuantity("3"), 3);
assert.equal(readQuantity("-2"), 1);

// try/catch only catches an async rejection if you AWAIT inside the try.
async function failsLater() {
  await null;
  throw new Error("async failure");
}
async function withoutAwait() {
  try {
    return failsLater(); // returned, not awaited: the try block is already finished
  } catch {
    return "caught";
  }
}
async function withAwait() {
  try {
    return await failsLater();
  } catch {
    return "caught";
  }
}
await assert.rejects(withoutAwait(), /async failure/);
assert.equal(await withAwait(), "caught");

// --- Error cause ------------------------------------------------------------------
function connect() {
  throw new Error("ECONNREFUSED");
}
try {
  try {
    connect();
  } catch (err) {
    throw new Error("Connecting to database failed.", { cause: err });
  }
} catch (wrapped) {
  assert.equal(wrapped.message, "Connecting to database failed.");
  assert.equal(wrapped.cause.message, "ECONNREFUSED"); // the original is kept
}

// cause can be structured data for code to read.
try {
  throw new Error("RSA key generation requires integer inputs.", {
    cause: { code: "NonInteger", values: [1.5, 3] },
  });
} catch (e) {
  assert.equal(e.cause.code, "NonInteger");
}

// AggregateError groups several unrelated failures.
const agg = new AggregateError([new Error("a"), new Error("b")], "Multiple operations failed");
assert.equal(agg.errors.length, 2);

// --- AbortController / AbortSignal --------------------------------------------------
// Abort a fetch-like operation. (Node's fetch supports signal too; we use a local
// abortable function so the file doesn't need the network.)
function myCoolPromiseAPI({ signal }) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted(); // already aborted → reject straight away
    const timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", onAbort); // clean up on success
      resolve("Operation completed");
    }, 50);
    function onAbort() {
      clearTimeout(timeoutId);
      reject(signal.reason);
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

{
  const controller = new AbortController();
  const promise = myCoolPromiseAPI({ signal: controller.signal });
  controller.abort();
  await assert.rejects(promise, (err) => err.name === "AbortError");
  assert.equal(controller.signal.aborted, true);

  // A signal is single-use: once aborted, anything new using it fails immediately.
  await assert.rejects(myCoolPromiseAPI({ signal: controller.signal }), { name: "AbortError" });
}

// Your own abort reason.
{
  const controller = new AbortController();
  controller.abort(new Error("user left the page"));
  assert.equal(controller.signal.reason.message, "user left the page");
}

// Timeouts reject with a TimeoutError, so you can tell them apart from user aborts.
await assert.rejects(myCoolPromiseAPI({ signal: AbortSignal.timeout(5) }), {
  name: "TimeoutError",
});

// Combine signals: whichever aborts first wins, and its reason is kept.
{
  const user = new AbortController();
  const combined = AbortSignal.any([user.signal, AbortSignal.timeout(1000)]);
  const p = myCoolPromiseAPI({ signal: combined });
  user.abort();
  await assert.rejects(p, { name: "AbortError" });
}
{
  const user = new AbortController();
  const combined = AbortSignal.any([user.signal, AbortSignal.timeout(5)]);
  await assert.rejects(myCoolPromiseAPI({ signal: combined }), { name: "TimeoutError" });
}

// "Latest request wins": cancel the previous call when a new one starts.
{
  let controller;
  const results = [];
  async function loadSlots(date) {
    controller?.abort();
    controller = new AbortController();
    try {
      await myCoolPromiseAPI({ signal: controller.signal });
      results.push(date);
    } catch (err) {
      if (err.name !== "AbortError") throw err; // a stale request, ignore it
    }
  }
  await Promise.all([loadSlots("Mon"), loadSlots("Tue"), loadSlots("Wed")]);
  assert.deepEqual(results, ["Wed"]);
}

// One abort() removes every listener registered with that signal.
{
  const target = new EventTarget();
  const controller = new AbortController();
  let calls = 0;
  target.addEventListener("ping", () => calls++, { signal: controller.signal });
  target.addEventListener("ping", () => calls++, { signal: controller.signal });
  target.dispatchEvent(new Event("ping"));
  controller.abort();
  target.dispatchEvent(new Event("ping"));
  assert.equal(calls, 2);
}

console.log("06-errors-cancellation: all checks passed");
