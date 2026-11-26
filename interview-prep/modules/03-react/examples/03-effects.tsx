// Topic 03: Effects — synchronising with outside systems, cleanup, Strict Mode's extra cycle,
// races, stale closures, and useEffectEvent.
import { click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { act, StrictMode, useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}

// A fake "chat server" that records what happens.
const events: string[] = [];
function createConnection(roomId: string) {
  return {
    connect: () => void events.push(`connect ${roomId}`),
    disconnect: () => void events.push(`disconnect ${roomId}`),
  };
}
function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);
  return <h1>Welcome to {roomId}</h1>;
}

// --- 1. Strict Mode (development): setup → cleanup → setup -----------------------------------
{
  events.length = 0;
  const { root } = await render(
    <StrictMode>
      <ChatRoom roomId="general" />
    </StrictMode>,
  );
  assert.deepEqual(events, ["connect general", "disconnect general", "connect general"]);

  // --- 2. Changing a dependency: stop syncing the old value, then start the new one ----------
  events.length = 0;
  await act(async () =>
    root.render(
      <StrictMode>
        <ChatRoom roomId="travel" />
      </StrictMode>,
    ),
  );
  assert.deepEqual(events, ["disconnect general", "connect travel"]);

  // --- 3. Unmount: the final cleanup -------------------------------------------------------------
  events.length = 0;
  await act(async () => root.unmount());
  assert.deepEqual(events, ["disconnect travel"]);
}

// Without Strict Mode (or in production) there's no extra cycle.
{
  events.length = 0;
  const { root } = await render(<ChatRoom roomId="music" />);
  assert.deepEqual(events, ["connect music"]);
  await act(async () => root.unmount());
}

// The extra cycle is development-only: run React's production build in a child process.
{
  const code = `
    import { JSDOM } from "jsdom";
    const dom = new JSDOM("<div id=r></div>");
    globalThis.window = dom.window; globalThis.document = dom.window.document;
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { flushSync } = await import("react-dom");
    const log = [];
    function C() { React.useEffect(() => { log.push("setup"); return () => log.push("cleanup"); }, []); return null; }
    const root = createRoot(document.getElementById("r"));
    flushSync(() => root.render(React.createElement(React.StrictMode, null, React.createElement(C))));
    await new Promise((r) => setTimeout(r, 50));
    console.log(JSON.stringify(log));`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: import.meta.dirname,
    env: { ...process.env, NODE_ENV: "production" },
    encoding: "utf8",
  });
  assert.equal(r.stdout.trim(), '["setup"]', r.stderr);
}

// --- 4. Race conditions: ignore stale responses in the cleanup ---------------------------------
const delays: Record<string, number> = { hell: 40, hello: 5 }; // the older request answers LAST
function fakeSearch(query: string) {
  return new Promise<string>((resolve) => setTimeout(() => resolve(`results for ${query}`), delays[query] ?? 1));
}
function Search({ query, safe }: { query: string; safe: boolean }) {
  const [results, setResults] = useState("");
  useEffect(() => {
    let ignore = false;
    void fakeSearch(query).then((r) => {
      if (!safe || !ignore) setResults(r);
    });
    return () => {
      ignore = true;
    };
  }, [query, safe]);
  return <p>{results}</p>;
}
for (const safe of [false, true]) {
  const { container, root } = await render(<Search query="hell" safe={safe} />);
  await act(async () => root.render(<Search query="hello" safe={safe} />));
  await act(async () => new Promise((r) => setTimeout(r, 80)));
  assert.equal(container.querySelector("p")!.textContent, safe ? "results for hello" : "results for hell");
  await act(async () => root.unmount());
}

// --- 5. Stale closure: an Effect with [] keeps the first render's values ------------------------
const ticksSeen: number[] = [];
function StaleTimer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      ticksSeen.push(count); // always 0: this closure is from the first render
      setCount(count + 1); // 🔴 always sets 1
    }, 5);
    return () => clearInterval(id);
    // (the lint rule would flag the missing `count` dependency here)
  }, []);
  return <p className="stale">{count}</p>;
}
function FixedTimer() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 5); // ✅ updater reads the latest
    return () => clearInterval(id);
  }, []);
  return <p className="fixed">{count}</p>;
}
{
  const { container, root } = await render(
    <>
      <StaleTimer />
      <FixedTimer />
    </>,
  );
  await act(async () => new Promise((r) => setTimeout(r, 60)));
  assert.equal(container.querySelector(".stale")!.textContent, "1");
  assert.ok(Number(container.querySelector(".fixed")!.textContent) > 3);
  assert.ok(ticksSeen.length > 3 && ticksSeen.every((c) => c === 0));
  await act(async () => root.unmount());
}

// --- 6. useEffectEvent: read the latest value without re-syncing -------------------------------
const notifications: string[] = [];
const connects: string[] = [];
function Room({ roomId, theme }: { roomId: string; theme: string }) {
  const onConnected = useEffectEvent(() => void notifications.push(`Connected! (${theme})`)); // not reactive
  useEffect(() => {
    connects.push(roomId);
    const t = setTimeout(() => onConnected(), 10); // "connected" arrives later
    return () => clearTimeout(t);
  }, [roomId]); // ✅ theme isn't a dependency, so changing it doesn't reconnect
  return null;
}
{
  const { root } = await render(<Room roomId="general" theme="light" />);
  await act(async () => root.render(<Room roomId="general" theme="dark" />)); // change theme before "connected"
  await act(async () => new Promise((r) => setTimeout(r, 30)));
  assert.deepEqual(connects, ["general"]); // no reconnect for a theme change
  assert.deepEqual(notifications, ["Connected! (dark)"]); // but it saw the LATEST theme
  await act(async () => root.unmount());
}

// --- 7. Derived values don't need an Effect (and the Effect version renders twice) ---------------
let effectRenders = 0;
function FullNameWithEffect({ first, last }: { first: string; last: string }) {
  const [fullName, setFullName] = useState("");
  useEffect(() => setFullName(`${first} ${last}`), [first, last]); // 🔴 redundant state + extra render
  effectRenders++;
  return <p className="effect">{fullName}</p>;
}
let derivedRenders = 0;
function FullNameDerived({ first, last }: { first: string; last: string }) {
  const fullName = `${first} ${last}`; // ✅ calculated during rendering
  derivedRenders++;
  return <p className="derived">{fullName}</p>;
}
{
  const { container } = await render(
    <>
      <FullNameWithEffect first="Ada" last="Okafor" />
      <FullNameDerived first="Ada" last="Okafor" />
    </>,
  );
  assert.equal(container.querySelector(".effect")!.textContent, "Ada Okafor");
  assert.equal(effectRenders, 2); // first render showed "" (stale), then a second render
  assert.equal(derivedRenders, 1);
}

// --- 8. A user action belongs in the event handler, not in an Effect ------------------------------
const purchases: string[] = [];
function BuyButton() {
  return <button onClick={() => purchases.push("POST /api/buy")}>Buy</button>; // ✅ caused by the click
}
{
  const { container } = await render(
    <StrictMode>
      <BuyButton />
    </StrictMode>,
  );
  assert.deepEqual(purchases, []); // visiting the page buys nothing
  await act(async () => click(container.querySelector("button")));
  assert.deepEqual(purchases, ["POST /api/buy"]); // once per click, even in Strict Mode
}

console.log("03 effects: all checks passed");
