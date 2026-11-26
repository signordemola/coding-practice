// Topic 10: Suspense + lazy, use(promise), transitions, useDeferredValue, Error Boundaries.
import { captureConsole, click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import {
  act,
  Component,
  lazy,
  Suspense,
  use,
  useDeferredValue,
  useState,
  useTransition,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container, { onUncaughtError: () => {}, onCaughtError: () => {} });
  await act(async () => root.render(ui));
  return { container, root };
}
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

// --- 1. lazy + Suspense: fallback while the code loads -------------------------------------
const chunk = deferred<{ default: () => ReactNode }>();
let loads = 0;
const Calendar = lazy(() => {
  loads++;
  return chunk.promise; // like import("./Calendar.js"): resolves to a module with .default
});
{
  const { container } = await render(
    <Suspense fallback={<p>Loading calendar...</p>}>
      <Calendar />
    </Suspense>,
  );
  assert.equal(container.textContent, "Loading calendar...");
  assert.equal(loads, 1); // load() called on first render, not before
  await act(async () => chunk.resolve({ default: () => <p>Calendar</p> }));
  assert.equal(container.textContent, "Calendar");
}

// --- 2. use(promise) suspends until it resolves (promise created OUTSIDE render and reused) -------
const slotsRequest = deferred<string[]>();
function Slots({ slotsPromise }: { slotsPromise: Promise<string[]> }) {
  const slots = use(slotsPromise);
  return <p>{slots.join(", ")}</p>;
}
{
  const { container } = await render(
    <Suspense fallback={<p>Loading slots...</p>}>
      <Slots slotsPromise={slotsRequest.promise} />
    </Suspense>,
  );
  assert.equal(container.textContent, "Loading slots...");
  await act(async () => slotsRequest.resolve(["09:00", "10:00"]));
  assert.equal(container.textContent, "09:00, 10:00");
}

// --- 3. A Transition keeps already-shown content instead of flashing the fallback --------------
const pages: Record<string, ReturnType<typeof deferred<string[]>>> = {};
function pageFor(day: string) {
  return (pages[day] ??= deferred<string[]>());
}
function Picker({ withTransition }: { withTransition: boolean }) {
  const [day, setDay] = useState("mon");
  const [isPending, startTransition] = useTransition();
  return (
    <>
      <button
        onClick={() => {
          if (withTransition) startTransition(() => setDay("tue"));
          else setDay("tue");
        }}
      />
      <span className="pending">{String(isPending)}</span>
      <Suspense fallback={<p>Loading...</p>}>
        <Slots slotsPromise={pageFor(day).promise} />
      </Suspense>
    </>
  );
}
for (const withTransition of [false, true]) {
  for (const k of Object.keys(pages)) delete pages[k];
  pageFor("mon").resolve(["mon 09:00"]);
  const { container, root } = await render(<Picker withTransition={withTransition} />);
  assert.match(container.textContent, /mon 09:00/);
  await act(async () => click(container.querySelector("button")));
  if (withTransition) {
    assert.match(container.textContent, /mon 09:00/); // old content stays visible
    assert.equal(container.querySelector(".pending")!.textContent, "true");
  } else {
    assert.match(container.textContent, /Loading\.\.\./); // fallback replaces visible content
  }
  await act(async () => pageFor("tue").resolve(["tue 11:00"]));
  assert.match(container.textContent, /tue 11:00/);
  assert.equal(container.querySelector(".pending")!.textContent, "false");
  await act(async () => root.unmount());
}

// --- 4. useDeferredValue: first render with the old value, then the new one -------------------
const seen: string[] = [];
function Search({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  seen.push(`${query}/${deferredQuery}`);
  return <p>{deferredQuery}</p>;
}
{
  const { container, root } = await render(<Search query="a" />);
  await act(async () => root.render(<Search query="ab" />));
  assert.deepEqual(seen, ["a/a", "ab/a", "ab/ab"]); // urgent render keeps old value, background render catches up
  assert.equal(container.textContent, "ab");
}

// --- 5. Error Boundaries catch rendering errors, not event-handler errors ----------------------
class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true }; // pure: just say "show the fallback"
  }
  override componentDidCatch(error: unknown, info: ErrorInfo) {
    caughtLog.push(`${String(error)} | stack has Thrower: ${String(info.componentStack?.includes("Thrower"))}`);
  }
  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
const caughtLog: string[] = [];
function Thrower(): ReactNode {
  throw new Error("render failed");
}
{
  const messages = await captureConsole(async () => {
    const { container } = await render(
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Thrower />
      </ErrorBoundary>,
    );
    assert.equal(container.textContent, "Something went wrong");
  });
  assert.deepEqual(caughtLog, ["Error: render failed | stack has Thrower: true"]);
  void messages;
}
{
  let handlerError: unknown;
  const onError = (e: ErrorEvent) => {
    handlerError = e.error;
    e.preventDefault();
  };
  window.addEventListener("error", onError);
  const messages = await captureConsole(async () => {
    const { container } = await render(
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <button
          onClick={() => {
            throw new Error("click failed");
          }}
        >
          Pay
        </button>
      </ErrorBoundary>,
    );
    await act(async () => click(container.querySelector("button")));
    assert.equal(container.textContent, "Pay"); // the boundary did NOT switch to the fallback
  });
  window.removeEventListener("error", onError);
  assert.match(String(handlerError), /click failed/); // the error escaped to the window instead
  void messages;
}

console.log("10 suspense, transitions and error boundaries: all checks passed");
