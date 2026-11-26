// Topic 04: refs — values that don't re-render, DOM access, ref as a prop (React 19),
// ref callback cleanup, and flushSync.
import { click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, StrictMode, useRef, useState, type ReactNode, type Ref } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}

// --- 1. Changing ref.current doesn't re-render; it changes immediately ---------------------
let renders = 0;
function RefCounter() {
  const ref = useRef(0);
  renders++;
  return (
    <button
      onClick={() => {
        ref.current = ref.current + 1;
        assert.equal(ref.current, ref.current); // readable right away, unlike state
      }}
    >
      {/* 🔴 reading ref.current during render: the screen never updates */}
      {ref.current}
    </button>
  );
}
{
  const { container } = await render(<RefCounter />);
  const before = renders;
  await act(async () => click(container.querySelector("button")));
  await act(async () => click(container.querySelector("button")));
  assert.equal(renders, before); // no re-render
  assert.equal(container.querySelector("button")!.textContent, "0"); // stale text
}

// --- 2. A DOM ref is null during the first render and set during commit --------------------
const seenDuringRender: (HTMLInputElement | null)[] = [];
let focusRef: { current: HTMLInputElement | null } = { current: null };
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  seenDuringRender.push(inputRef.current);
  focusRef = inputRef;
  return (
    <>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus</button>
    </>
  );
}
{
  const { container } = await render(<Form />);
  assert.equal(seenDuringRender[0], null); // no DOM yet while rendering
  assert.equal(focusRef.current, container.querySelector("input")); // attached after commit
  await act(async () => click(container.querySelector("button")));
  assert.equal(document.activeElement, container.querySelector("input"));
}

// --- 3. React 19: `ref` is a normal prop for function components (no forwardRef) ------------
function MyInput({ ref }: { ref: Ref<HTMLInputElement> }) {
  return <input ref={ref} className="mine" />;
}
let parentRef: { current: HTMLInputElement | null } = { current: null };
function MyForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  parentRef = inputRef;
  return <MyInput ref={inputRef} />;
}
{
  const { container } = await render(<MyForm />);
  assert.equal(parentRef.current, container.querySelector(".mine"));
}

// --- 4. Ref callbacks for lists, with a cleanup function (React 19) --------------------------
const refLog: string[] = [];
function Cats({ ids }: { ids: string[] }) {
  const nodes = useRef(new Map<string, HTMLLIElement>());
  return (
    <ul>
      {ids.map((id) => (
        <li
          key={id}
          ref={(node) => {
            if (!node) return;
            nodes.current.set(id, node);
            refLog.push(`set ${id}`);
            return () => {
              nodes.current.delete(id);
              refLog.push(`clean ${id}`);
            };
          }}
        >
          {id}
        </li>
      ))}
    </ul>
  );
}
{
  const { root } = await render(
    <StrictMode>
      <Cats ids={["a", "b"]} />
    </StrictMode>,
  );
  // Strict Mode runs ref callbacks an extra time in development (set → clean → set).
  assert.deepEqual(refLog, ["set a", "set b", "clean a", "clean b", "set a", "set b"]);
  refLog.length = 0;
  await act(async () =>
    root.render(
      <StrictMode>
        <Cats ids={["a"]} />
      </StrictMode>,
    ),
  );
  // An inline ref callback is a new function each render, so React re-attaches it: clean then set.
  assert.ok(refLog.includes("clean b"));
  assert.ok(!refLog.includes("set b"));
}

// --- 5. flushSync: update the DOM synchronously before reading it -----------------------------
const scrolledTo: string[] = [];
function Todos({ useFlush }: { useFlush: boolean }) {
  const [todos, setTodos] = useState(["first"]);
  const listRef = useRef<HTMLUListElement>(null);
  function add() {
    const next = [...todos, `todo ${todos.length + 1}`];
    if (useFlush) flushSync(() => setTodos(next));
    else setTodos(next);
    scrolledTo.push(listRef.current!.lastChild!.textContent ?? ""); // "scroll" to the last item
  }
  return (
    <>
      <button onClick={add}>Add</button>
      <ul ref={listRef}>
        {todos.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </>
  );
}
for (const useFlush of [false, true]) {
  scrolledTo.length = 0;
  const { container, root } = await render(<Todos useFlush={useFlush} />);
  await act(async () => click(container.querySelector("button")));
  assert.deepEqual(scrolledTo, [useFlush ? "todo 2" : "first"]); // without flushSync it lags one behind
  await act(async () => root.unmount());
}

console.log("04 refs and the DOM: all checks passed");
