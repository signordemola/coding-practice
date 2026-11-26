# 11. DOM events: listeners, bubbling, capture, delegation

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [Introduction to events](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events) · [Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)
- [`EventTarget.addEventListener()`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) · [`Element.closest()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)

**Run the checks:**
- `node interview-prep/modules/01-javascript/examples/11-event-listeners.js` (listener rules; Node has `EventTarget` built in)
- Open `examples/11-dom-events.html` in a browser (bubbling, capture, delegation need a page). Every line should say PASS. I ran it with jsdom 31 before committing; open it yourself in Chrome to see it live.

**Replaces:** old guide J1. React's own event system moves to module 03.

## Explain

### Events and listeners
- An event is a signal the system fires when something happens (a click, a key press, a page load, a form submit, a video ending, an error). You **register a handler** by attaching a listener.
- **`addEventListener(type, listener, options)` is the recommended way** (MDN):
  - several listeners for one event (handy when code from different libraries shares an element);
  - control over capture vs bubbling;
  - works on any `EventTarget`, not only elements.
- `el.onclick = fn` (an event handler property) allows **one** handler: a second assignment replaces the first.
- Inline `onclick="…"` attributes: MDN says **never** use them. They mix HTML and JS, don't scale to many elements, and many server security settings block inline JavaScript.

### `addEventListener` rules
- The same function reference is only added **once**; two identical-looking anonymous functions are two different listeners.
- `removeEventListener` needs the **same function reference** and the **same capture setting**. `removeEventListener("click", () => fn())` removes nothing. So does passing a fresh `fn.bind(x)`.
- A listener added **while** an event is being dispatched doesn't run for that dispatch.
- The listener gets one argument, the event object; its return value is ignored. Get data in or out with closures.
- **Options:**
  - `capture` (default false): run during the capture phase.
  - `once`: remove after the first call.
  - `passive`: promise not to call `preventDefault()`. The browser can then scroll straight away instead of waiting (avoids "jank"). It's **true by default** for `wheel`, `mousewheel`, `touchstart` and `touchmove` on `window`, `document`, `<html>` and `<body>`, so set `passive: false` explicitly if you need to cancel them. A `preventDefault()` in a passive listener does nothing.
  - `signal`: an `AbortSignal`. `controller.abort()` removes every listener added with that signal. One call cleans up many listeners.
- **`this` in a listener:** a regular function gets the element the listener is on (`this === event.currentTarget`). An arrow function gets the outer `this`. A listener can also be an object with a `handleEvent(event)` method, which then runs with `this` = that object.
- **Memory (MDN):** an anonymous function created inside a loop makes one function per element and can never be removed. A single named function is shared and removable.

### The event object
- `event.target`: the element the event **started on** (the innermost one clicked). It stays the same while the event travels.
- `event.currentTarget`: the element whose listener is **running now**. It changes as the event travels.
- Specialised events add fields, like `KeyboardEvent.key`.
- `event.preventDefault()`: stop the browser's **default action** (submitting a form, following a link).
- `event.stopPropagation()`: stop the event **travelling** to other elements. A different thing.

### Bubbling and capture
- **Bubbling:** the event runs on the target, then its parent, then each ancestor up to the document. Click a button inside a div inside body → button, div, body.
- **Capture:** the opposite order, outermost first. Off by default; turn it on per listener with `{ capture: true }`.
- Capture listeners on ancestors run first, then listeners on the target itself (the "target phase"), then bubbling listeners on the way up.
- History (MDN): Netscape only captured, Internet Explorer only bubbled, and the W3C standard kept both. Almost all handlers use bubbling.
- **Bubbling can cause bugs:** MDN's video example. Clicking the video (play) also triggers the box's "close" handler, because the video is inside the box. Fix: `event.stopPropagation()` in the video's handler.

### Delegation
- Put **one** listener on a parent and let events from its children bubble up to it, instead of one listener per child.
- Fewer listeners, and it works for children **added later**.
- Use `event.target` to find what was clicked. If the item has children (an icon, a `<span>`, a `<b>`), `event.target` may be the child: use **`event.target.closest(selector)`**, which returns the element itself or its nearest ancestor matching the selector, or `null`. Check the result is inside your container.
- (MDN's tile example uses `event.target` directly because its tiles have no children; `closest` is my addition for real markup, and the HTML example shows the difference.)

## Worked example (checked in `11-dom-events.html`)

```js
grid.addEventListener("click", (e) => {
  const slot = e.target.closest("[data-slot-id]"); // works even if a <b> inside was clicked
  if (!slot || !grid.contains(slot)) return;
  pick(slot.dataset.slotId);
});
```
Results from the page: a naive `e.target.dataset.slotId` gives `null` when the inner `<b>` is clicked; `closest` finds `"09:30"`. A slot added after setup is still handled.

```js
const controller = new AbortController();
window.addEventListener("resize", onResize, { signal: controller.signal });
window.addEventListener("keydown", onKey, { signal: controller.signal });
controller.abort(); // removes both
```

## Traps
- `stopPropagation()` to "fix" a bug: it also hides the event from every other listener higher up (analytics, a "click outside to close" handler). Prefer checking `event.target` in the outer handler. (The risk follows from how propagation works; the advice is from the old guide.)
- Confusing `preventDefault` and `stopPropagation`.
- Removing a listener with a new function, or a new `bind` result.
- Reading `e.target` in delegation when the item has child elements.
- An arrow-function listener that expects `this` to be the element.
- Expecting `preventDefault` to work in a passive touch or wheel listener on the document.

## Practice questions

**Q1. Explain bubbling and capture.**
An event first travels down from the document to the target (capture), then runs on the target, then travels back up (bubbling). Listeners run in the bubbling phase unless added with `{ capture: true }`. So for a button in a div, bubbling listeners run button, div, body; capture listeners run body, div, button.

**Q2. What is event delegation and why use it?**
One listener on a parent handles events from all its children through bubbling. It uses fewer listeners and covers children added later. I find the item with `event.target.closest(...)`.

**Q3. `target` vs `currentTarget`?**
`target` is where the event started and doesn't change. `currentTarget` is the element whose listener is running, which changes as the event bubbles. In a regular-function listener, `this` equals `currentTarget`.

**Q4. `preventDefault` vs `stopPropagation`?**
`preventDefault` stops the browser's default action, like a form submitting or a link navigating. `stopPropagation` stops the event reaching other elements' listeners. They're independent.

**Q5. Why doesn't this remove the listener?**
```js
el.addEventListener("click", () => save());
el.removeEventListener("click", () => save());
```
Each arrow is a new function, so the second call doesn't match the first. Keep a reference to the function, or add it with a `signal` and call `abort()`.

**Q6. What does `{ passive: true }` do, and why might your `preventDefault` stop working?**
It promises the listener won't cancel the event, so the browser can scroll without waiting for it. `touchstart`, `touchmove`, `wheel` and `mousewheel` listeners on window/document/html/body are passive by default, so `preventDefault` there is ignored unless you pass `passive: false`.

**Q7. Why are inline `onclick` attributes bad practice?**
They mix markup and code, need repeating on every element, and are often blocked by server security settings that disallow inline JavaScript. `addEventListener` (with delegation) is cleaner and scales.

**Q8. Clicking "play" on a video inside a modal also closes the modal. Why, and what are the fixes?**
The click bubbles from the video to the modal's backdrop listener. Fix by calling `stopPropagation()` in the video handler (MDN's fix), or in the backdrop handler only close when `event.target === event.currentTarget` (my alternative: it only closes on clicks on the backdrop itself).

## Say it (about 40 seconds)
"I use `addEventListener`: it allows several listeners and lets me choose capture or bubble. Events go down in the capture phase, run on the target, then bubble up, and listeners use bubbling by default. Delegation uses that: one listener on the parent, then `event.target.closest(...)` to find the item, which also covers items added later. `target` is where the event started, `currentTarget` is where the listener is. `preventDefault` stops the default action; `stopPropagation` stops the travel, and I use it sparingly. To clean up I keep the function reference or pass a `signal` and abort it, and I know touch and wheel listeners on the document are passive by default."
