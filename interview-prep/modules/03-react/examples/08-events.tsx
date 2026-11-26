// Topic 08: events — propagation, capture, stopPropagation/preventDefault, and React's
// delegation at the root container (React 17+).
import { click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}

// --- 1. Bubbling and capture order ------------------------------------------------------------
const order: string[] = [];
{
  const { container } = await render(
    <div onClickCapture={() => order.push("div capture")} onClick={() => order.push("div bubble")}>
      <button onClickCapture={() => order.push("button capture")} onClick={() => order.push("button")} />
    </div>,
  );
  await act(async () => click(container.querySelector("button")));
  assert.deepEqual(order, ["div capture", "button capture", "button", "div bubble"]);
}

// --- 2. e.stopPropagation() stops parents' handlers --------------------------------------------
{
  const calls: string[] = [];
  const { container } = await render(
    <div className="toolbar" onClick={() => calls.push("toolbar")}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          calls.push("button");
        }}
      />
    </div>,
  );
  await act(async () => click(container.querySelector("button")));
  assert.deepEqual(calls, ["button"]);
}

// --- 3. Delegation: React listens on the ROOT CONTAINER, not on each element ----------------------
{
  const calls: string[] = [];
  const { container } = await render(<button onClick={() => calls.push("react onClick")} />);
  const button = container.querySelector("button")!;
  // A native listener that stops the event before it reaches the container...
  button.addEventListener("click", (e) => e.stopPropagation());
  await act(async () => click(button));
  assert.deepEqual(calls, []); // ...means React's handler never runs: it was waiting at the root
}
{
  // ...and since React 17 the root is the container you passed to createRoot, not `document`.
  const calls: string[] = [];
  const { container } = await render(<button onClick={() => calls.push("react onClick")} />);
  const onDocument = () => calls.push("document listener");
  document.addEventListener("click", onDocument);
  container.addEventListener("click", (e) => e.stopPropagation()); // native listener added on the container after React's
  await act(async () => click(container.querySelector("button")));
  assert.deepEqual(calls, ["react onClick"]); // React ran at the container; document never heard it
  document.removeEventListener("click", onDocument);
}
{
  // React's e.stopPropagation() also stops the native event going further up (to document).
  const calls: string[] = [];
  const { container } = await render(
    <button
      onClick={(e) => {
        e.stopPropagation();
        calls.push("react");
      }}
    />,
  );
  const onDocument = () => calls.push("document");
  document.addEventListener("click", onDocument);
  await act(async () => click(container.querySelector("button")));
  assert.deepEqual(calls, ["react"]);
  document.removeEventListener("click", onDocument);
}

// --- 4. onScroll doesn't bubble in React (react.dev: the only event that doesn't propagate) ---------
{
  const calls: string[] = [];
  const { container } = await render(
    <div className="outer" onScroll={() => calls.push("outer")}>
      <div className="inner" onScroll={() => calls.push("inner")} />
    </div>,
  );
  await act(async () => void container.querySelector(".inner")!.dispatchEvent(new Event("scroll")));
  assert.deepEqual(calls, ["inner"]);
}

// --- 5. preventDefault for the browser's default action (e.g. a form submit) ----------------------
{
  let defaultPrevented = false;
  const { container } = await render(
    <form
      onSubmit={(e) => {
        e.preventDefault();
        defaultPrevented = e.defaultPrevented;
      }}
    >
      <button type="submit" />
    </form>,
  );
  await act(async () => container.querySelector("form")!.requestSubmit());
  assert.equal(defaultPrevented, true);
}

// --- 6. Pass the handler, don't call it -------------------------------------------------------------
{
  const calls: string[] = [];
  const handleClick = () => calls.push("clicked");
  await render(<button onClick={() => handleClick()} />); // ✅ passes a function
  assert.deepEqual(calls, []);
  // <button onClick={handleClick()} /> would call it during rendering (and fails to type-check here,
  // because handleClick() returns a number, not a handler).
}

console.log("08 events: all checks passed");
