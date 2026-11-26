// Topic 02: updating objects and arrays immutably, and structuring state
// (derived values, no mirrored props, ids instead of copies).
import { click, newContainer } from "./setup-dom.ts";
import assert from "node:assert/strict";
import { act, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

async function render(ui: ReactNode) {
  const container = newContainer();
  const root = createRoot(container);
  await act(async () => root.render(ui));
  return { container, root };
}

// --- 1. Mutating state and setting the same object: React ignores it ----------------------
function Position() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <>
      <p>{pos.x}</p>
      <button
        id="mutate"
        onClick={() => {
          pos.x = 5; // 🔴 mutation
          setPos(pos); // same object (Object.is) → update ignored
        }}
      />
      <button id="replace" onClick={() => setPos({ ...pos, x: 7 })} />
    </>
  );
}
{
  const { container } = await render(<Position />);
  const x = () => container.querySelector("p")!.textContent;
  await act(async () => click(container.querySelector("#mutate")));
  assert.equal(x(), "0"); // the screen didn't change (even though pos.x is now 5 in memory)
  await act(async () => click(container.querySelector("#replace")));
  assert.equal(x(), "7"); // new object → re-render
}

// --- 2. Spread is shallow: nested objects need copying all the way up ----------------------
{
  const person = { name: "Ada", artwork: { title: "Blue Nana", city: "Hamburg" } };
  const shallow = { ...person };
  shallow.artwork.city = "New Delhi"; // 🔴 still the same inner object
  assert.equal(person.artwork.city, "New Delhi");

  const original = { name: "Ada", artwork: { title: "Blue Nana", city: "Hamburg" } };
  const next = { ...original, artwork: { ...original.artwork, city: "Lagos" } }; // ✅ copy each level
  assert.equal(original.artwork.city, "Hamburg");
  assert.equal(next.artwork.city, "Lagos");
  assert.notEqual(next.artwork, original.artwork);
}

// --- 3. Arrays: a copied array still shares its items ---------------------------------------
{
  const initial = [{ id: 1, title: "Big Bellies", seen: false }];
  const myList = initial.map((a) => a); // two "separate" lists that share the same item objects
  const yourList = initial.map((a) => a);
  const myNext = [...myList];
  myNext[0]!.seen = true; // 🔴 mutates the shared item
  assert.equal(yourList[0]!.seen, true); // the other list changed too: react.dev's bug

  const fresh = [{ id: 1, title: "Big Bellies", seen: false }];
  const theirs = [...fresh];
  const mine = fresh.map((a) => (a.id === 1 ? { ...a, seen: true } : a)); // ✅ copy the changed item
  assert.equal(mine[0]!.seen, true);
  assert.equal(theirs[0]!.seen, false);

  // Non-mutating equivalents from react.dev's table.
  const arr = ["a", "b", "c"];
  assert.deepEqual([...arr.slice(0, 1), "x", ...arr.slice(1)], ["a", "x", "b", "c"]); // insert
  assert.deepEqual(arr.filter((v) => v !== "b"), ["a", "c"]); // remove
  assert.deepEqual([...arr].reverse(), ["c", "b", "a"]); // copy first, then reverse
  assert.deepEqual(arr, ["a", "b", "c"]); // original untouched
}

// --- 4. Mirroring a prop in state ignores later prop changes --------------------------------
function Mirrored({ messageColor }: { messageColor: string }) {
  const [color] = useState(messageColor); // 🔴 only the FIRST value is used
  return <p className="mirrored">{color}</p>;
}
function Direct({ messageColor }: { messageColor: string }) {
  const color = messageColor; // ✅ just use the prop
  return <p className="direct">{color}</p>;
}
{
  const { container, root } = await render(
    <>
      <Mirrored messageColor="blue" />
      <Direct messageColor="blue" />
    </>,
  );
  await act(async () =>
    root.render(
      <>
        <Mirrored messageColor="red" />
        <Direct messageColor="red" />
      </>,
    ),
  );
  assert.equal(container.querySelector(".mirrored")!.textContent, "blue");
  assert.equal(container.querySelector(".direct")!.textContent, "red");
}

// --- 5. Store the id, derive the item: edits show up everywhere ------------------------------
type Item = { id: number; title: string };
function Menu({ storeObject }: { storeObject: boolean }) {
  const [items, setItems] = useState<Item[]>([
    { id: 0, title: "pretzels" },
    { id: 1, title: "seaweed" },
  ]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null); // 🔴 duplicates an item
  const [selectedId, setSelectedId] = useState<number | null>(null); // ✅ essential state only
  const selected = storeObject ? selectedItem : (items.find((i) => i.id === selectedId) ?? null);
  return (
    <>
      <button
        id="choose"
        onClick={() => {
          setSelectedItem(items[0] ?? null);
          setSelectedId(0);
        }}
      />
      <button id="edit" onClick={() => setItems(items.map((i) => (i.id === 0 ? { ...i, title: "PRETZELS" } : i)))} />
      <p>{selected?.title}</p>
    </>
  );
}
for (const storeObject of [true, false]) {
  const { container } = await render(<Menu storeObject={storeObject} />);
  await act(async () => click(container.querySelector("#choose")));
  await act(async () => click(container.querySelector("#edit")));
  assert.equal(container.querySelector("p")!.textContent, storeObject ? "pretzels" : "PRETZELS");
}

// --- 6. Contradictory booleans vs one status ---------------------------------------------------
type Status = "typing" | "sending" | "sent";
const isSending = (s: Status) => s === "sending";
const isSent = (s: Status) => s === "sent";
for (const s of ["typing", "sending", "sent"] as const) {
  assert.ok(!(isSending(s) && isSent(s))); // impossible to be both
}

console.log("02 state updates: all checks passed");
