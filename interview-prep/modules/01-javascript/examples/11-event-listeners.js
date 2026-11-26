// Topic 11, part 1: addEventListener rules that don't need a page.
// Node has EventTarget and Event built in, so these run with plain `node`.
// (Bubbling, capture and delegation need a DOM tree: see 11-dom-events.html.)
// Run: node interview-prep/modules/01-javascript/examples/11-event-listeners.js
import assert from "node:assert/strict";

const fire = (target, type = "ping", init = {}) => target.dispatchEvent(new Event(type, init));

// Several listeners for one event all run, in the order added.
{
  const t = new EventTarget();
  const log = [];
  t.addEventListener("ping", () => log.push("A"));
  t.addEventListener("ping", () => log.push("B"));
  fire(t);
  assert.deepEqual(log, ["A", "B"]);
}

// The same function reference is only added once; identical-looking anonymous functions are different.
{
  const t = new EventTarget();
  let calls = 0;
  const handler = () => calls++;
  t.addEventListener("ping", handler);
  t.addEventListener("ping", handler); // ignored: already registered
  fire(t);
  assert.equal(calls, 1);

  let anon = 0;
  for (let i = 0; i < 3; i++) t.addEventListener("ping", () => anon++); // 3 different functions
  fire(t);
  assert.equal(anon, 3);
}

// removeEventListener needs the SAME function (and the same capture flag).
{
  const t = new EventTarget();
  let calls = 0;
  const onPing = () => calls++;
  t.addEventListener("ping", onPing);
  t.removeEventListener("ping", () => onPing()); // a new function: removes nothing
  fire(t);
  assert.equal(calls, 1);
  t.removeEventListener("ping", onPing); // the same reference: removed
  fire(t);
  assert.equal(calls, 1);

  const bound = { name: "x", handle() {} };
  const fn = bound.handle.bind(bound);
  t.addEventListener("ping", fn);
  t.removeEventListener("ping", bound.handle.bind(bound)); // bind makes a new function each time
  // Keep the bound reference if you'll need to remove it later.
  t.removeEventListener("ping", fn);

  let captured = 0;
  const onCapture = () => captured++;
  t.addEventListener("ping", onCapture, { capture: true });
  t.removeEventListener("ping", onCapture); // capture defaults to false: no match
  fire(t);
  assert.equal(captured, 1);
  t.removeEventListener("ping", onCapture, { capture: true });
  fire(t);
  assert.equal(captured, 1);
}

// once: removed automatically after the first call.
{
  const t = new EventTarget();
  let calls = 0;
  t.addEventListener("ping", () => calls++, { once: true });
  fire(t);
  fire(t);
  assert.equal(calls, 1);
}

// signal: abort() removes every listener registered with that signal.
{
  const t = new EventTarget();
  const controller = new AbortController();
  let calls = 0;
  t.addEventListener("ping", () => calls++, { signal: controller.signal });
  t.addEventListener("pong", () => calls++, { signal: controller.signal });
  fire(t, "ping");
  controller.abort();
  fire(t, "ping");
  fire(t, "pong");
  assert.equal(calls, 1);
}

// `this` in a regular-function listener is the target (= event.currentTarget); arrows don't get it.
{
  const t = new EventTarget();
  let seenThis;
  let seenCurrent;
  t.addEventListener("ping", function (e) {
    seenThis = this;
    seenCurrent = e.currentTarget;
  });
  fire(t);
  assert.equal(seenThis, t);
  assert.equal(seenCurrent, t);
}

// A listener can be an object with handleEvent(): `this` is then that object.
{
  class Something {
    name = "Something Good";
    seen = [];
    constructor(target) {
      target.addEventListener("click", this);
      target.addEventListener("dblclick", this);
    }
    handleEvent(event) {
      this.seen.push(`${this.name}: ${event.type}`);
    }
  }
  const t = new EventTarget();
  const s = new Something(t);
  fire(t, "click");
  fire(t, "dblclick");
  assert.deepEqual(s.seen, ["Something Good: click", "Something Good: dblclick"]);
}

// Passing a class method directly loses its `this` (it gets the target instead).
{
  class Widget {
    name = "widget";
    onClick() {
      return this.name;
    }
  }
  const w = new Widget();
  const t = new EventTarget();
  let result;
  t.addEventListener("click", function (e) {
    result = w.onClick.call(this, e); // what happens when you pass w.onClick directly
  });
  fire(t, "click");
  assert.equal(result, undefined); // this was the EventTarget, which has no .name
}

// preventDefault only works on cancelable events, and does nothing in a passive listener.
{
  const t = new EventTarget();
  t.addEventListener("submit", (e) => e.preventDefault());
  const cancelable = new Event("submit", { cancelable: true });
  assert.equal(t.dispatchEvent(cancelable), false); // dispatchEvent returns false when cancelled
  assert.equal(cancelable.defaultPrevented, true);

  const t2 = new EventTarget();
  t2.addEventListener("submit", (e) => e.preventDefault(), { passive: true });
  const ev = new Event("submit", { cancelable: true });
  t2.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, false); // ignored in a passive listener
}

// A listener added while the event is being dispatched doesn't run for that dispatch.
{
  const t = new EventTarget();
  const log = [];
  t.addEventListener("ping", () => {
    log.push("first");
    t.addEventListener("ping", () => log.push("added during dispatch"));
  });
  fire(t);
  assert.deepEqual(log, ["first"]);
}

// Listener return values are ignored: get data in and out with closures.
{
  const t = new EventTarget();
  let someString = "Data";
  const seen = [];
  t.addEventListener("ping", () => {
    seen.push(someString);
    someString = "Data Again";
  });
  fire(t);
  fire(t);
  assert.deepEqual(seen, ["Data", "Data Again"]);
}

console.log("11-event-listeners: all checks passed");
