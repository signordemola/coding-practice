// Topic 05: run-to-completion, microtasks vs tasks, promises, async/await.
// Run: node interview-prep/modules/01-javascript/examples/05-event-loop-async.js
// Each block records log lines into an array, then asserts the exact order.
import assert from "node:assert/strict";

const tick = () => new Promise((r) => setTimeout(r, 0)); // let the task queue drain
const wait = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));

// --- 1. The classic order quiz ------------------------------------------------
{
  const log = [];
  log.push("A");
  setTimeout(() => log.push("B"), 0); // task (macrotask)
  Promise.resolve().then(() => log.push("C")); // microtask
  log.push("D");
  await tick();
  assert.deepEqual(log, ["A", "D", "C", "B"]);
}

// --- 2. MDN: microtasks drain before the timer, chains keep queueing ----------
{
  const log = [];
  wait(0).then(() => log.push(4));
  Promise.resolve()
    .then(() => log.push(2))
    .then(() => log.push(3));
  log.push(1);
  await wait(5);
  assert.deepEqual(log, [1, 2, 3, 4]);
}

// --- 3. The executor runs synchronously; .then never does --------------------
{
  const log = [];
  const promise = new Promise((resolve) => {
    log.push("executor runs now");
    resolve();
  }).then(() => log.push("then callback"));
  log.push("after constructor");
  await promise;
  assert.deepEqual(log, ["executor runs now", "after constructor", "then callback"]);
}

// --- 4. Run-to-completion: two thens on one promise can't interleave ----------
{
  const log = [];
  let i = 0;
  const p = Promise.resolve();
  const a = p.then(() => {
    i += 1;
    log.push(i);
  });
  const b = p.then(() => {
    i += 1;
    log.push(i);
  });
  await Promise.all([a, b]);
  assert.deepEqual(log, [1, 2]); // registration order, each fully finished
}

// --- 5. An async function runs synchronously up to its first await ------------
{
  const log = [];
  async function foo(name) {
    log.push(`${name} start`);
    await null;
    log.push(`${name} end`);
  }
  const done = Promise.all([foo("First"), foo("Second")]);
  log.push("sync code after calls");
  await done;
  assert.deepEqual(log, [
    "First start",
    "Second start",
    "sync code after calls",
    "First end",
    "Second end",
  ]);
}

// No await → the whole body runs synchronously (but it still returns a promise).
{
  const log = [];
  async function noAwait() {
    log.push("body");
    return 1;
  }
  const result = noAwait();
  log.push("after call");
  assert.ok(result instanceof Promise);
  assert.deepEqual(log, ["body", "after call"]);
  assert.equal(await result, 1);
}

// --- 6. MDN's queueMicrotask interleaving example ------------------------------
{
  const log = [];
  let i = 0;
  queueMicrotask(function test() {
    i++;
    log.push(`microtask ${i}`);
    if (i < 3) queueMicrotask(test);
  });
  const fn = (async () => {
    log.push("async function start");
    for (let j = 1; j < 3; j++) {
      await null;
      log.push(`async function resume ${j}`);
    }
    await null;
    log.push("async function end");
  })();
  queueMicrotask(() => log.push("queueMicrotask() after calling async function"));
  log.push("script sync part end");
  await fn;
  assert.deepEqual(log, [
    "async function start",
    "script sync part end",
    "microtask 1",
    "async function resume 1",
    "queueMicrotask() after calling async function",
    "microtask 2",
    "async function resume 2",
    "microtask 3",
    "async function end",
  ]);
}

// --- 7. How a then handler decides the next promise's state ------------------
{
  // Returning a value → fulfilled with it.
  assert.equal(await Promise.resolve(1).then((v) => v + 1), 2);
  // Returning a promise → waits for it and adopts its result.
  assert.equal(await Promise.resolve(1).then((v) => wait(1, v * 10)), 10);
  // Throwing → rejected.
  await assert.rejects(
    Promise.resolve().then(() => {
      throw new Error("boom");
    }),
    /boom/,
  );
  // No matching handler → passes through unchanged (rejections skip then(onFulfilled)).
  await assert.rejects(Promise.reject(new Error("skip")).then((v) => v), /skip/);
  // A rejection handler that returns normally "fixes" the chain.
  assert.equal(await Promise.reject(new Error("x")).catch(() => "recovered"), "recovered");
  // Chaining after catch keeps going.
  const log = [];
  await Promise.resolve()
    .then(() => {
      throw new Error("Something failed");
    })
    .catch(() => log.push("Do that"))
    .then(() => log.push("Do this, no matter what happened before"));
  assert.deepEqual(log, ["Do that", "Do this, no matter what happened before"]);
}

// --- 8. The floating promise bug (forgot to return) ----------------------------
{
  const list = [];
  await Promise.resolve()
    .then(() => {
      wait(5).then(() => list.push("data")); // NOT returned: nobody waits for it
    })
    .then(() => assert.deepEqual(list, [])); // runs too early
  const list2 = [];
  await Promise.resolve()
    .then(() => wait(5).then(() => list2.push("data"))) // returned (arrow implicit return)
    .then(() => assert.deepEqual(list2, ["data"]));
  await wait(10);
}

// --- 9. Promise concurrency helpers --------------------------------------------
{
  const ok = (ms, v) => wait(ms, v);
  const fail = (ms, msg) => wait(ms).then(() => Promise.reject(new Error(msg)));

  assert.deepEqual(await Promise.all([ok(10, "a"), ok(5, "b")]), ["a", "b"]); // input order
  await assert.rejects(Promise.all([ok(10, "a"), fail(5, "first failure")]), /first failure/);
  assert.deepEqual(await Promise.all([]), []); // empty input fulfils

  const settled = await Promise.allSettled([ok(5, "a"), fail(5, "nope")]);
  assert.deepEqual(
    settled.map((r) => r.status),
    ["fulfilled", "rejected"],
  );
  assert.equal(settled[1].reason.message, "nope");

  assert.equal(await Promise.any([fail(1, "x"), ok(5, "first success")]), "first success");
  await assert.rejects(Promise.any([fail(1, "x"), fail(2, "y")]), (err) => {
    assert.ok(err instanceof AggregateError);
    assert.deepEqual(
      err.errors.map((e) => e.message),
      ["x", "y"],
    );
    return true;
  });
  await assert.rejects(Promise.any([]), AggregateError); // empty input rejects

  assert.equal(await Promise.race([ok(10, "slow"), ok(1, "fast")]), "fast");
  await assert.rejects(Promise.race([ok(10, "slow"), fail(1, "fast failure")]), /fast failure/);
}

// --- 10. Sequential vs concurrent timing (MDN async function examples) --------
{
  const timeIt = async (fn) => {
    const start = performance.now();
    await fn();
    return performance.now() - start;
  };
  const sequential = await timeIt(async () => {
    await wait(40);
    await wait(40); // second timer starts only after the first finished
  });
  const concurrent = await timeIt(async () => {
    await Promise.all([wait(40), wait(40)]); // both timers run at once
  });
  assert.ok(sequential >= 75, `sequential took ${sequential}`);
  assert.ok(concurrent < 75, `concurrent took ${concurrent}`);
}

// --- 11. async inside forEach doesn't wait --------------------------------------
{
  const sent = [];
  const sendReminder = (id) => wait(5).then(() => sent.push(id));
  [1, 2, 3].forEach(async (id) => {
    await sendReminder(id);
  });
  assert.deepEqual(sent, []); // forEach returned immediately
  await wait(20);
  const sent2 = [];
  for (const id of [1, 2, 3]) await wait(1).then(() => sent2.push(id)); // in order
  assert.deepEqual(sent2, [1, 2, 3]);
  const all = await Promise.all([1, 2, 3].map((id) => wait(1, id * 2))); // in parallel
  assert.deepEqual(all, [2, 4, 6]);
}

// --- 12. Sequential composition with reduce (MDN) -------------------------------
{
  const steps = [(x) => wait(1, x + 1), (x) => x * 2, (x) => wait(1, x - 3)];
  const result = await steps.reduce((p, f) => p.then(f), Promise.resolve(5));
  assert.equal(result, 9); // (5 + 1) * 2 - 3
}

// --- 13. await details -----------------------------------------------------------
{
  // Non-promise values are wrapped, identity kept.
  const obj = {};
  assert.equal(await 20, 20);
  assert.equal(await obj, obj);
  // Thenables are followed.
  assert.equal(await { then: (resolve) => resolve("resolved!") }, "resolved!");
  // A rejected await throws inside the async function.
  let caught;
  try {
    await Promise.reject(new Error("rejected!"));
  } catch (e) {
    caught = e.message;
  }
  assert.equal(caught, "rejected!");
  // async functions return a NEW promise, even when returning a promise.
  const p = Promise.resolve(1);
  const asyncReturn = async () => p;
  assert.equal(Promise.resolve(p), p);
  assert.notEqual(asyncReturn(), p);
}

// --- 14. [await p1, await p2] → unhandled rejection; Promise.all doesn't ------
{
  const unhandled = [];
  const onUnhandled = (reason) => unhandled.push(reason.message);
  process.on("unhandledRejection", onUnhandled);

  async function bad() {
    const p1 = wait(30, "1");
    const p2 = wait(10).then(() => Promise.reject(new Error("failed")));
    return [await p1, await p2]; // p2 rejects while we're still awaiting p1
  }
  await bad().catch(() => {}); // the caller "handles" errors...
  assert.deepEqual(unhandled, ["failed"]); // ...but Node still reported one
  // Node also prints "PromiseRejectionHandledWarning" when this file runs: that's the
  // late handler being attached after the rejection was already reported. Expected.

  unhandled.length = 0;
  async function good() {
    return Promise.all([wait(30, "1"), wait(10).then(() => Promise.reject(new Error("failed")))]);
  }
  await good().catch(() => {});
  await wait(5);
  assert.deepEqual(unhandled, []); // wired into the chain at once
  process.off("unhandledRejection", onUnhandled);
}

// --- 15. Wrapping an old callback API at the lowest level --------------------
{
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const start = Date.now();
  await delay(10);
  assert.ok(Date.now() - start >= 9);
}

// --- 16. Promise.withResolvers (in Node 22+) -----------------------------------
{
  const { promise, resolve } = Promise.withResolvers();
  setTimeout(() => resolve("later"), 1);
  assert.equal(await promise, "later");
}

// --- 17. Practice question Q2 from the topic page -------------------------------
{
  const log = [];
  setTimeout(() => log.push(1));
  Promise.resolve().then(() => log.push(2));
  queueMicrotask(() => log.push(3));
  (async () => {
    log.push(4);
    await null;
    log.push(5);
  })();
  log.push(6);
  await tick();
  assert.deepEqual(log, [4, 6, 2, 3, 5, 1]);
}

// --- 18. Promise.try: on MDN, not in Node 22, so only checked where it exists ------
if (typeof Promise.try === "function") {
  assert.equal(await Promise.try(() => 1), 1);
  await assert.rejects(
    Promise.try(() => {
      throw new Error("sync throw becomes a rejection");
    }),
    /sync throw/,
  );
  console.log("  (Promise.try checked on this Node version)");
} else {
  console.log(`  (Promise.try not available on Node ${process.versions.node}: skipped)`);
}

console.log("05-event-loop-async: all checks passed");
