// Topic 05: useReducer, context, and reducer + context together.
import { click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, createContext, memo, useContext, useReducer, useState, type Dispatch, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}

// --- 1. A reducer is a pure function you can test without React ---------------------------
type Step = "service" | "time" | "details" | "pay";
type Flow = { step: Step; serviceId: string | null; startsAt: string | null };
type FlowAction =
  | { type: "service_picked"; serviceId: string }
  | { type: "time_picked"; startsAt: string }
  | { type: "back" };
function flowReducer(state: Flow, action: FlowAction): Flow {
  switch (action.type) {
    case "service_picked": {
      return { ...state, serviceId: action.serviceId, step: "time" };
    }
    case "time_picked": {
      return { ...state, startsAt: action.startsAt, step: "details" };
    }
    case "back": {
      return { ...state, step: state.step === "details" ? "time" : "service" };
    }
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
const start: Flow = { step: "service", serviceId: null, startsAt: null };
const actions: FlowAction[] = [
  { type: "service_picked", serviceId: "lash-fill" },
  { type: "time_picked", startsAt: "2026-12-01T09:00:00Z" },
  { type: "back" },
];
// react.dev: a reducer "accumulates actions over time into state", like Array.reduce.
const end = actions.reduce(flowReducer, start);
assert.deepEqual(end, { step: "time", serviceId: "lash-fill", startsAt: "2026-12-01T09:00:00Z" });
assert.deepEqual(start, { step: "service", serviceId: null, startsAt: null }); // never mutated

function Booking() {
  const [flow, dispatch] = useReducer(flowReducer, start);
  return (
    <>
      <p>{flow.step}</p>
      <button onClick={() => dispatch({ type: "service_picked", serviceId: "lash-fill" })} />
    </>
  );
}
{
  const { container } = await render(<Booking />);
  await act(async () => click(container.querySelector("button")));
  assert.equal(container.querySelector("p")!.textContent, "time");
}

// --- 2. Context: default value, nearest provider wins, providers nest -----------------------
const LevelContext = createContext(0);
function Section({ children }: { children: ReactNode }) {
  const level = useContext(LevelContext);
  return <LevelContext value={level + 1}>{children}</LevelContext>; // React 19: <Context> is the provider
}
function Heading() {
  const level = useContext(LevelContext);
  return <h6 data-level={level} />;
}
{
  const { container } = await render(
    <>
      <Heading />
      <Section>
        <Heading />
        <div>
          <Section>
            <Heading />
          </Section>
        </div>
      </Section>
    </>,
  );
  const levels = [...container.querySelectorAll("h6")].map((h) => h.dataset["level"]);
  assert.deepEqual(levels, ["0", "1", "2"]); // default, then each Section adds one (through the <div>)
}

// --- 3. memo doesn't stop context updates -------------------------------------------------------
const ThemeContext = createContext("light");
let memoChildRenders = 0;
const ThemedChild = memo(function ThemedChild() {
  memoChildRenders++;
  return <p className="theme">{useContext(ThemeContext)}</p>;
});
function ThemeApp() {
  const [theme, setTheme] = useState("light");
  return (
    <ThemeContext value={theme}>
      <button onClick={() => setTheme("dark")} />
      <ThemedChild />
    </ThemeContext>
  );
}
{
  const { container } = await render(<ThemeApp />);
  const before = memoChildRenders;
  await act(async () => click(container.querySelector("button")));
  assert.equal(memoChildRenders, before + 1); // re-rendered because its context changed
  assert.equal(container.querySelector(".theme")!.textContent, "dark");
}

// --- 4. Reducer + context: state and dispatch available anywhere below --------------------------
type Task = { id: number; text: string; done: boolean };
type TaskAction = { type: "added"; id: number; text: string } | { type: "toggled"; id: number };
function tasksReducer(tasks: Task[], action: TaskAction): Task[] {
  switch (action.type) {
    case "added":
      return [...tasks, { id: action.id, text: action.text, done: false }];
    case "toggled":
      return tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
  }
}
const TasksContext = createContext<Task[] | null>(null);
const TasksDispatchContext = createContext<Dispatch<TaskAction> | null>(null);
function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, dispatch] = useReducer(tasksReducer, [{ id: 1, text: "Confirm deposit", done: false }]);
  return (
    <TasksContext value={tasks}>
      <TasksDispatchContext value={dispatch}>{children}</TasksDispatchContext>
    </TasksContext>
  );
}
function useTasks() {
  const tasks = useContext(TasksContext);
  if (!tasks) throw new Error("useTasks must be used inside <TasksProvider>");
  return tasks;
}
function useTasksDispatch() {
  const dispatch = useContext(TasksDispatchContext);
  if (!dispatch) throw new Error("useTasksDispatch must be used inside <TasksProvider>");
  return dispatch;
}
function TaskList() {
  return (
    <ul>
      {useTasks().map((t) => (
        <li key={t.id}>{`${t.text}${t.done ? " ✓" : ""}`}</li>
      ))}
    </ul>
  );
}
function DeepToggle() {
  const dispatch = useTasksDispatch(); // no props passed down to get here
  return <button onClick={() => dispatch({ type: "toggled", id: 1 })} />;
}
{
  const { container } = await render(
    <TasksProvider>
      <TaskList />
      <section>
        <div>
          <DeepToggle />
        </div>
      </section>
    </TasksProvider>,
  );
  await act(async () => click(container.querySelector("button")));
  assert.equal(container.querySelector("li")!.textContent, "Confirm deposit ✓");
}
// Using the custom hook outside the provider fails loudly instead of silently getting null.
{
  const container = newContainer();
  const root = createRoot(container, { onUncaughtError: () => {} });
  let caught: unknown;
  function Probe() {
    try {
      useTasks();
    } catch (e) {
      caught = e;
    }
    return null;
  }
  await act(async () => root.render(<Probe />));
  assert.match(String(caught), /inside <TasksProvider>/);
}

console.log("05 reducer and context: all checks passed");
