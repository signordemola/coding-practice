// Topic 09: the Rules of Hooks, custom Hooks (shared logic, not shared state), and `use`.
import { captureConsole, click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, createContext, use, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container, { onUncaughtError: () => {} });
  await act(async () => root.render(ui));
  return { container, root };
}

// --- 1. Hooks rely on call ORDER: a conditional Hook breaks between renders -----------------
function Conditional({ showExtra }: { showExtra: boolean }) {
  const [a] = useState("a");
  if (showExtra) {
    // 🔴 breaks the Rules of Hooks (the lint rule would flag this)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useState("extra");
  }
  return <p>{a}</p>;
}
{
  const container = newContainer();
  const root = createRoot(container, { onUncaughtError: () => {} });
  await act(async () => root.render(<Conditional showExtra={false} />));
  let error: unknown;
  const messages = await captureConsole(async () => {
    try {
      await act(async () => root.render(<Conditional showExtra={true} />));
    } catch (e) {
      error = e; // act() re-throws errors from rendering
    }
  });
  assert.match(String(error), /Rendered more hooks than during the previous render/);
  assert.ok(messages.some((m) => m.includes("React has detected a change in the order of Hooks")));
}

// --- 2. A custom Hook shares LOGIC; every call has its own state ----------------------------
function useCounter(start: number) {
  const [n, setN] = useState(start);
  return { n, inc: () => setN((x) => x + 1) };
}
function TwoCounters() {
  const a = useCounter(0);
  const b = useCounter(10);
  return (
    <>
      <button className="a" onClick={a.inc}>{a.n}</button>
      <button className="b" onClick={b.inc}>{b.n}</button>
    </>
  );
}
{
  const { container } = await render(<TwoCounters />);
  await act(async () => click(container.querySelector(".a")));
  assert.equal(container.querySelector(".a")!.textContent, "1");
  assert.equal(container.querySelector(".b")!.textContent, "10"); // not shared
}

// --- 3. A purpose-built Hook for an external store: useSyncExternalStore -------------------------
// react.dev's useOnlineStatus, with a fake store so the test controls it.
let online = true;
const listeners = new Set<() => void>();
const onlineStore = {
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  getSnapshot: () => online,
  setOnline(value: boolean) {
    online = value;
    listeners.forEach((l) => l());
  },
};
function useOnlineStatus() {
  return useSyncExternalStore(onlineStore.subscribe, onlineStore.getSnapshot); // subscribe declared outside
}
function StatusBar() {
  return <h1>{useOnlineStatus() ? "✅ Online" : "❌ Disconnected"}</h1>;
}
{
  const { container, root } = await render(<StatusBar />);
  assert.equal(listeners.size, 1);
  await act(async () => onlineStore.setOnline(false));
  assert.equal(container.textContent, "❌ Disconnected");
  await act(async () => root.unmount());
  assert.equal(listeners.size, 0); // unsubscribed on unmount
}

// --- 4. `use` is the exception: it may be called conditionally ----------------------------------
const ThemeContext = createContext("light");
function MaybeThemed({ show }: { show: boolean }) {
  if (show) {
    const theme = use(ThemeContext); // ✅ allowed inside an if
    return <p>{theme}</p>;
  }
  return null;
}
{
  const { container, root } = await render(
    <ThemeContext value="dark">
      <MaybeThemed show={false} />
    </ThemeContext>,
  );
  await act(async () =>
    root.render(
      <ThemeContext value="dark">
        <MaybeThemed show={true} />
      </ThemeContext>,
    ),
  );
  assert.equal(container.textContent, "dark");
}

// --- 5. "Lifecycle" Hooks like useMount hide missing dependencies ---------------------------------
const connected: string[] = [];
function useMount(fn: () => void) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fn, []); // 🔴 react.dev: avoid wrappers like this — the linter can't see inside
}
function ChatRoom({ roomId }: { roomId: string }) {
  useMount(() => void connected.push(roomId));
  return null;
}
{
  const { root } = await render(<ChatRoom roomId="general" />);
  await act(async () => root.render(<ChatRoom roomId="travel" />));
  assert.deepEqual(connected, ["general"]); // never reconnected to "travel": a real bug
}

console.log("09 hooks rules and custom hooks: all checks passed");
