// Topic 06: re-rendering and memoization — when children re-render, memo, useMemo,
// useCallback, why "always new" props break memo, and the children pattern.
import { click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, memo, StrictMode, useCallback, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}
const counts: Record<string, number> = {};
const count = (name: string) => void (counts[name] = (counts[name] ?? 0) + 1);

// --- 1. By default a parent re-render re-renders every child, props changed or not ----------
function Plain({ label }: { label: string }) {
  count("plain");
  return <p>{label}</p>;
}
const Memoized = memo(function Memoized({ label }: { label: string }) {
  count("memo");
  return <p>{label}</p>;
});
function Page1() {
  const [note, setNote] = useState("");
  return (
    <>
      <button onClick={() => setNote(note + "x")} />
      <Plain label="same" />
      <Memoized label="same" />
    </>
  );
}
{
  const { container } = await render(<Page1 />);
  await act(async () => click(container.querySelector("button")));
  assert.equal(counts["plain"], 2); // re-rendered although its props didn't change
  assert.equal(counts["memo"], 1); // memo skipped it: props equal by Object.is
}

// --- 2. A new function or object each render breaks memo; useCallback/useMemo keep them stable ---
const SlotGrid = memo(function SlotGrid({ onPick, filter }: { onPick: (t: string) => void; filter: { day: string } }) {
  count("grid");
  return <button className="slot" onClick={() => onPick(filter.day)} />;
});
function Page2({ stable }: { stable: boolean }) {
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState("");
  const inlinePick = (t: string) => setPicked(t); // new function every render
  const stablePick = useCallback((t: string) => setPicked(t), []); // same function until deps change
  const inlineFilter = { day: "Mon" }; // new object every render
  const stableFilter = useMemo(() => ({ day: "Mon" }), []);
  return (
    <>
      <button className="type" onClick={() => setNote(note + "x")} />
      <SlotGrid onPick={stable ? stablePick : inlinePick} filter={stable ? stableFilter : inlineFilter} />
      <p className="picked">{picked}</p>
    </>
  );
}
for (const stable of [false, true]) {
  counts["grid"] = 0;
  const { container, root } = await render(<Page2 stable={stable} />);
  await act(async () => click(container.querySelector(".type")));
  await act(async () => click(container.querySelector(".type")));
  assert.equal(counts["grid"], stable ? 1 : 3); // memo only works when every prop is stable
  await act(async () => click(container.querySelector(".slot")));
  assert.equal(container.querySelector(".picked")!.textContent, "Mon");
  await act(async () => root.unmount());
}

// --- 3. memo still re-renders for the component's own state ----------------------------------
const Toggle = memo(function Toggle() {
  const [on, setOn] = useState(false);
  count("toggle");
  return <button className="toggle" onClick={() => setOn(!on)}>{String(on)}</button>;
});
{
  const { container } = await render(<Toggle />);
  await act(async () => click(container.querySelector(".toggle")));
  assert.equal(counts["toggle"], 2);
}

// --- 4. The children pattern: a wrapper's state change doesn't re-render JSX passed in -------------
function Expensive() {
  count("expensive");
  return <p>expensive</p>;
}
function HoverBox({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className={hovered ? "on" : "off"}>
      <button className="hover" onClick={() => setHovered(!hovered)} />
      {children}
    </div>
  );
}
{
  const { container } = await render(
    <HoverBox>
      <Expensive />
    </HoverBox>,
  );
  await act(async () => click(container.querySelector(".hover")));
  await act(async () => click(container.querySelector(".hover")));
  assert.equal(counts["expensive"], 1); // the children element was created by the parent, so it's unchanged
}

// --- 5. useMemo caches a calculation between renders; recalculates when a dependency changes ----
let filterRuns = 0;
function filterTodos(todos: string[], tab: string) {
  filterRuns++;
  return todos.filter((t) => tab === "all" || t.startsWith(tab));
}
function TodoList({ todos, tab }: { todos: string[]; tab: string }) {
  const [note, setNote] = useState("");
  const visible = useMemo(() => filterTodos(todos, tab), [todos, tab]);
  return (
    <>
      <button className="note" onClick={() => setNote(note + "x")} />
      <p className="visible">{visible.join(",")}</p>
    </>
  );
}
{
  const todos = ["a1", "b1", "a2"];
  const { container, root } = await render(<TodoList todos={todos} tab="all" />);
  await act(async () => click(container.querySelector(".note")));
  assert.equal(filterRuns, 1); // unrelated state change: cached result reused
  await act(async () => root.render(<TodoList todos={todos} tab="a" />));
  assert.equal(filterRuns, 2); // dependency changed: recalculated
  assert.equal(container.querySelector(".visible")!.textContent, "a1,a2");
}
// In Strict Mode, React calls the useMemo calculation twice in development (to catch impurity).
{
  filterRuns = 0;
  await render(
    <StrictMode>
      <TodoList todos={["x"]} tab="all" />
    </StrictMode>,
  );
  assert.equal(filterRuns, 2);
}

// --- 6. A custom arePropsEqual that skips function props shows stale values ------------------------
const Buggy = memo(
  function Buggy({ onClick }: { onClick: () => void }) {
    return <button className="buggy" onClick={onClick} />;
  },
  () => true, // 🔴 "props are always equal" — ignores the new onClick
);
const clicksSeen: number[] = [];
function Page3() {
  const [n, setN] = useState(0);
  return (
    <>
      <button className="inc" onClick={() => setN(n + 1)} />
      <Buggy onClick={() => clicksSeen.push(n)} />
    </>
  );
}
{
  const { container } = await render(<Page3 />);
  await act(async () => click(container.querySelector(".inc")));
  await act(async () => click(container.querySelector(".inc")));
  await act(async () => click(container.querySelector(".buggy")));
  assert.deepEqual(clicksSeen, [0]); // still the first render's closure: n is 2 by now
}

console.log("06 performance: all checks passed");
