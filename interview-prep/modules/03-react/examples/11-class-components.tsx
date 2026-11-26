// Topic 11: class components — the lifecycle methods, how they map to useEffect,
// setState's snapshot behaviour, and Strict Mode's extra mount cycle.
import { click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, Component, StrictMode, useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}

// --- 1. Mount, update, unmount --------------------------------------------------------------
const classLog: string[] = [];
class ChatRoomClass extends Component<{ roomId: string }> {
  override componentDidMount() {
    classLog.push(`connect ${this.props.roomId}`);
  }
  override componentDidUpdate(prevProps: { roomId: string }) {
    if (prevProps.roomId !== this.props.roomId) {
      // compare, or risk loops / needless work
      classLog.push(`disconnect ${prevProps.roomId}`);
      classLog.push(`connect ${this.props.roomId}`);
    }
  }
  override componentWillUnmount() {
    classLog.push(`disconnect ${this.props.roomId}`);
  }
  override render() {
    return <h1>{this.props.roomId}</h1>;
  }
}
// The same behaviour with one Effect (react.dev: the three methods together ≈ useEffect).
const hookLog: string[] = [];
function ChatRoomHook({ roomId }: { roomId: string }) {
  useEffect(() => {
    hookLog.push(`connect ${roomId}`);
    return () => void hookLog.push(`disconnect ${roomId}`);
  }, [roomId]);
  return <h1>{roomId}</h1>;
}
{
  const a = await render(<ChatRoomClass roomId="general" />);
  const b = await render(<ChatRoomHook roomId="general" />);
  await act(async () => a.root.render(<ChatRoomClass roomId="travel" />));
  await act(async () => b.root.render(<ChatRoomHook roomId="travel" />));
  await act(async () => a.root.unmount());
  await act(async () => b.root.unmount());
  const expected = ["connect general", "disconnect general", "connect travel", "disconnect travel"];
  assert.deepEqual(classLog, expected);
  assert.deepEqual(hookLog, expected);
}

// --- 2. Strict Mode: didMount → willUnmount → didMount in development -------------------------
{
  classLog.length = 0;
  await render(
    <StrictMode>
      <ChatRoomClass roomId="music" />
    </StrictMode>,
  );
  assert.deepEqual(classLog, ["connect music", "disconnect music", "connect music"]);
}

// --- 3. setState doesn't change this.state in the running code; use the updater form ------------
const seenInHandler: number[] = [];
class Counter extends Component<object, { count: number }> {
  override state = { count: 0 };
  handleClick = () => {
    // arrow field: `this` stays bound (module 01, topic 03)
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
    seenInHandler.push(this.state.count); // still 0
    this.setState((prev) => ({ count: prev.count + 10 })); // updater sees the queued result
  };
  override render() {
    return <button onClick={this.handleClick}>{this.state.count}</button>;
  }
}
{
  const { container } = await render(<Counter />);
  await act(async () => click(container.querySelector("button")));
  assert.deepEqual(seenInHandler, [0]);
  assert.equal(container.textContent, "11"); // 0+1 (twice from the same snapshot) then +10
}

// --- 4. shouldComponentUpdate(false) skips render AND componentDidUpdate -----------------------
let skipRenders = 0;
let skipUpdates = 0;
class Frozen extends Component<{ value: number }> {
  override shouldComponentUpdate() {
    return false;
  }
  override componentDidUpdate() {
    skipUpdates++;
  }
  override render() {
    skipRenders++;
    return <p>{this.props.value}</p>;
  }
}
function Host() {
  const [v, setV] = useState(1);
  return (
    <>
      <button onClick={() => setV(v + 1)} />
      <Frozen value={v} />
    </>
  );
}
{
  const { container } = await render(<Host />);
  await act(async () => click(container.querySelector("button")));
  assert.equal(skipRenders, 1);
  assert.equal(skipUpdates, 0);
  assert.equal(container.querySelector("p")!.textContent, "1"); // stale on purpose: perf-only escape hatch
}

console.log("11 class components: all checks passed");
