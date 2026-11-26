// Topic 01: the rendering model — purity, render vs commit, state as a snapshot, batching,
// and how position + key decide whether state survives.
// Run all: node interview-prep/modules/03-react/examples/run-all.js
import { click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, StrictMode, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}

// --- 1. Purity: Strict Mode calls components twice in development, exposing impure renders ---
let guest = 0;
function ImpureCup() {
  guest = guest + 1; // 🔴 changes a variable that existed before rendering
  return <h2>Tea cup for guest #{guest}</h2>;
}
{
  const { container } = await render(
    <StrictMode>
      <ImpureCup />
      <ImpureCup />
      <ImpureCup />
    </StrictMode>,
  );
  const texts = [...container.querySelectorAll("h2")].map((h) => h.textContent);
  assert.deepEqual(texts, ["Tea cup for guest #2", "Tea cup for guest #4", "Tea cup for guest #6"]); // react.dev's example
}
function PureCup({ guest }: { guest: number }) {
  return <h2>Tea cup for guest #{guest}</h2>;
}
{
  const { container } = await render(
    <StrictMode>
      <PureCup guest={1} />
      <PureCup guest={2} />
    </StrictMode>,
  );
  assert.equal(container.textContent, "Tea cup for guest #1Tea cup for guest #2"); // same input, same output
}

// --- 2. Render vs commit: React only touches DOM nodes that changed -------------------------
{
  const { container, root } = await render(<Clock time="10:00" />);
  const input = container.querySelector("input")!;
  input.value = "typed by the user"; // the user types (not React state)
  await act(async () => root.render(<Clock time="10:01" />)); // parent re-renders with new props
  assert.equal(container.querySelector("h1")!.textContent, "10:01");
  assert.equal(container.querySelector("input"), input); // same DOM node kept...
  assert.equal(input.value, "typed by the user"); // ...so its value survives
}
function Clock({ time }: { time: string }) {
  return (
    <>
      <h1>{time}</h1>
      <input />
    </>
  );
}

// --- 3. State is a snapshot; updates are queued and batched ---------------------------------
let renders = 0;
const log: number[] = [];
function Counter() {
  const [number, setNumber] = useState(0);
  renders++;
  return (
    <>
      <p>{number}</p>
      <button
        id="plus3"
        onClick={() => {
          setNumber(number + 1);
          setNumber(number + 1);
          setNumber(number + 1); // number is 0 in this render's handler every time
          log.push(number); // still the old value right after setting
        }}
      />
      <button
        id="updaters"
        onClick={() => {
          setNumber((n) => n + 1);
          setNumber((n) => n + 1);
          setNumber((n) => n + 1);
        }}
      />
      <button
        id="mix"
        onClick={() => {
          setNumber(number + 5); // "replace with number+5"
          setNumber((n) => n + 1); // then n => n + 1
        }}
      />
      <button
        id="mix42"
        onClick={() => {
          setNumber(number + 5);
          setNumber((n) => n + 1);
          setNumber(42); // replaces everything queued before it
        }}
      />
      <button id="same" onClick={() => setNumber(number)} />
    </>
  );
}
{
  const { container } = await render(<Counter />);
  const p = () => Number(container.querySelector("p")!.textContent);
  const before = renders;
  await act(async () => click(container.querySelector("#plus3")));
  assert.equal(p(), 1); // not 3
  assert.deepEqual(log, [0]);
  assert.equal(renders - before, 1); // three set calls, ONE re-render (batching)
  await act(async () => click(container.querySelector("#updaters")));
  assert.equal(p(), 4); // 1 + 3: updater functions see the queued result
  await act(async () => click(container.querySelector("#mix")));
  assert.equal(p(), 10); // 4 + 5 = 9, then + 1
  await act(async () => click(container.querySelector("#mix42")));
  assert.equal(p(), 42);
  const beforeSame = renders;
  await act(async () => click(container.querySelector("#same")));
  assert.ok(renders - beforeSame <= 1); // Object.is-equal value: React bails out (may still call the component once)
  assert.equal(p(), 42);
}

// An async handler still sees its own render's value (the "send to Alice" example).
const alerts: string[] = [];
function Sender() {
  const [to, setTo] = useState("Alice");
  return (
    <>
      <button
        id="send"
        onClick={async () => {
          await new Promise((r) => setTimeout(r, 10));
          alerts.push(`You said Hello to ${to}`);
        }}
      />
      <button id="bob" onClick={() => setTo("Bob")} />
    </>
  );
}
{
  const { container } = await render(<Sender />);
  await act(async () => {
    click(container.querySelector("#send"));
    click(container.querySelector("#bob")); // change the recipient before the delay ends
    await new Promise((r) => setTimeout(r, 30));
  });
  assert.deepEqual(alerts, ["You said Hello to Alice"]);
}

// --- 4. State belongs to a POSITION in the tree ------------------------------------------------
function Score({ name }: { name: string }) {
  const [score, setScore] = useState(0);
  return (
    <button className="score" onClick={() => setScore((s) => s + 1)}>
      {name}:{score}
    </button>
  );
}
const scoreText = (c: HTMLElement) => c.querySelector(".score")!.textContent;
{
  // Same component, same position → state preserved, even across different JSX branches.
  const { container, root } = await render(<Score name="Taylor" />);
  await act(async () => click(container.querySelector(".score")));
  await act(async () => root.render(<Score name="Sarah" />));
  assert.equal(scoreText(container), "Sarah:1"); // Sarah "inherited" Taylor's score!

  // A key makes them different components → state reset.
  await act(async () => root.render(<Score key="Taylor" name="Taylor" />));
  assert.equal(scoreText(container), "Taylor:0");
  await act(async () => click(container.querySelector(".score")));
  await act(async () => root.render(<Score key="Sarah" name="Sarah" />));
  assert.equal(scoreText(container), "Sarah:0");

  // A different parent type at the same position resets the whole subtree below it.
  await act(async () =>
    root.render(
      <section>
        <Score key="x" name="A" />
      </section>,
    ),
  );
  await act(async () => click(container.querySelector(".score")));
  assert.equal(scoreText(container), "A:1");
  await act(async () =>
    root.render(
      <div>
        <Score key="x" name="A" />
      </div>,
    ),
  );
  assert.equal(scoreText(container), "A:0");
}

// Defining a component inside another creates a NEW component type every render → state resets.
function Parent() {
  const [, setTick] = useState(0);
  function NestedField() {
    const [text, setText] = useState("");
    return <input value={text} onChange={(e) => setText(e.target.value)} />;
  }
  return (
    <>
      <NestedField />
      <button id="rerender" onClick={() => setTick((t) => t + 1)} />
    </>
  );
}
{
  const { container } = await render(<Parent />);
  const first = container.querySelector("input");
  await act(async () => click(container.querySelector("#rerender")));
  assert.notEqual(container.querySelector("input"), first); // the input was destroyed and re-created
}

// --- 5. Keys in lists: index keys attach state to the wrong row -------------------------------
function Row({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <li>
      <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      {label}
    </li>
  );
}
function List({ items, useIndex }: { items: { id: string; label: string }[]; useIndex: boolean }) {
  return (
    <ul>
      {items.map((item, i) => (
        <Row key={useIndex ? i : item.id} label={item.label} />
      ))}
    </ul>
  );
}
async function checkedLabelsAfterDeletingFirst(useIndex: boolean) {
  const items = [
    { id: "a", label: "Apple" },
    { id: "b", label: "Banana" },
  ];
  const { container, root } = await render(<List items={items} useIndex={useIndex} />);
  await act(async () => click(container.querySelector("input"))); // tick Apple
  await act(async () => root.render(<List items={items.slice(1)} useIndex={useIndex} />)); // delete Apple
  return [...container.querySelectorAll("li")].filter((li) => li.querySelector("input")!.checked).map((li) => li.textContent);
}
assert.deepEqual(await checkedLabelsAfterDeletingFirst(true), ["Banana"]); // 🔴 index key: Banana is now ticked
assert.deepEqual(await checkedLabelsAfterDeletingFirst(false), []); // ✅ stable id: the tick left with Apple

console.log("01 rendering model: all checks passed");
