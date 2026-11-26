# 08. Events: handlers, propagation, and React's delegation at the root

**Sources:**
- react.dev (read in full): [Responding to Events](https://react.dev/learn/responding-to-events)
- legacy.reactjs.org: [React v17.0 Release Candidate](https://legacy.reactjs.org/blog/2020/08/10/react-v17-rc.html) (10 Aug 2020), section "Changes to Event Delegation" and the other event changes. Read through the web fetcher, so a summary. I didn't find this explained on the current react.dev pages I read.

**Run the checks:** `node interview-prep/modules/03-react/examples/run-all.js` (this topic: `examples/08-events.tsx`)

**Replaces:** the React part of old guide J1. Native DOM events, bubbling and delegation are module 01, topic 11.

## Explain

### Writing handlers
- Pass the function, don't call it: `onClick={handleClick}` or `onClick={() => handleClick(id)}`, never `onClick={handleClick()}` (that runs during rendering; `useState` lists it as a cause of "Too many re-renders").
- Name handlers `handleSomething`; name handler props `onSomething`. Handlers are defined inside the component, so they can read props and state.
- Event handlers are **the best place for side effects** (react.dev); they don't need to be pure.

### Propagation
- Events **bubble** up through React components like DOM events. react.dev: all events propagate in React **except `onScroll`**, which only works on the tag you attach it to (checked).
- `e.stopPropagation()` stops parents' handlers (checked). `e.preventDefault()` stops the browser's default (a form submit reloading the page) (checked).
- **Capture phase:** `onClickCapture` handlers run first, going down, then the target's `onClick`, then bubbling `onClick`s (checked: div capture → button capture → button → div).
- **An alternative to propagation** (react.dev): the child calls the handler prop explicitly (`onClick={e => { e.stopPropagation(); onClick(); }}`), so the flow is visible in code.

### Where React actually listens: the root container (React 17+)
From the React 17 RC post:
- **Before 17:** one listener per event type on `document`.
- **17 and later:** listeners on the **root container** you pass to `createRoot`. The reason given: with several React versions on one page, `e.stopPropagation()` didn't work properly, because every version listened at the top. The post says this makes it safer to embed a tree managed by one React version inside another (both need 17+).
- Other 17 changes in the same post: `onScroll` no longer bubbles; `onFocus`/`onBlur` use the native `focusin`/`focusout` (and `onFocus` still bubbles in React); `onClickCapture` uses real browser capture listeners; **event pooling was removed**, so `e.persist()` isn't needed.

What the checks show, in practice:
- A native listener on the button that calls `stopPropagation()` stops React's `onClick` from running, because React was waiting at the root (checked).
- A native listener on the container can stop the event reaching `document`, but React has already handled it there (checked).
- React's `e.stopPropagation()` also stops the native event reaching `document` (checked).

So delegation is built in: you don't need to add your own delegated listeners for React-rendered elements. The interview point is mostly the history and the `document` vs root change. That conclusion is mine.

### Events vs Effects (topic 03)
Logic caused by a specific interaction goes in the handler. Logic that must run because the component is on screen goes in an Effect.

## Traps
- `onClick={handleClick()}`.
- Expecting `onScroll` on a parent to fire when a child scrolls.
- Mixing native listeners (added in Effects) with React handlers and being surprised by the order: React's handler runs when the event reaches the root container.
- Old code calling `e.persist()`: no longer needed.

## Practice questions

**Q1. How does React attach event handlers?** It doesn't attach one per element. Since React 17 it listens at the root container and dispatches to your handlers as the event propagates; before 17 it listened on `document`.

**Q2. Why did React move listeners from `document` to the root?** So that several React versions on one page don't interfere: with everything at `document`, an outer tree could still receive events a nested tree had stopped.

**Q3. Predict the order:** a `div` with `onClickCapture` and `onClick`, a `button` inside with `onClickCapture` and `onClick`, click the button.
div capture, button capture, button click, div click.

**Q4. Which React event doesn't bubble?** `onScroll`.

**Q5. `stopPropagation` vs `preventDefault`?** The first stops handlers further up from running; the second stops the browser's default action.

## Say it (about 30 seconds)
"In React I pass handlers as props, like `onClick={handleClick}`, and they're the right place for side effects caused by the user. Events propagate up through components like DOM events, except `onScroll`, with a capture phase via `onClickCapture`, and I can use `stopPropagation` and `preventDefault`. Under the hood React delegates: since React 17 it listens once at the root container rather than on `document`, which made nesting React apps and `stopPropagation` safer, and React 17 also removed event pooling."
