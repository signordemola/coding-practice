// Tests for arrays-hashing.ts. Run from the repo root: node --test lesson-04/arrays-hashing.test.ts
// Each part is marked `todo`, so unfinished parts are reported but don't fail the run.
// When you start a part, delete its `{ todo: ... }` option so its tests count for real.
// Add your own edge-case tests in Part 8; don't edit the existing expectations.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  countServices,
  firstUnique,
  groupByDate,
  hasDuplicate,
  processRequests,
  topK,
  twoSum,
} from "./arrays-hashing.ts";

describe("Part 1: count each service", { todo: "Part 1" }, () => {
  test("counts repeated services", () => {
    const counts = countServices(["lash", "brow", "lash", "nails", "lash"]);
    assert.equal(counts.get("lash"), 3);
    assert.equal(counts.get("brow"), 1);
    assert.equal(counts.get("nails"), 1);
    assert.equal(counts.size, 3);
  });
  test("empty input gives an empty map", () => {
    assert.equal(countServices([]).size, 0);
  });
});

describe("Part 2: any double booking?", { todo: "Part 2" }, () => {
  test("finds a repeat", () => {
    assert.equal(hasDuplicate(["c1", "c2", "c1"]), true);
  });
  test("no repeats", () => {
    assert.equal(hasDuplicate(["c1", "c2", "c3"]), false);
  });
  test("empty input has no duplicates", () => {
    assert.equal(hasDuplicate([]), false);
  });
  test("1 and '1' are different ids", () => {
    assert.equal(hasDuplicate([1, "1"]), false);
  });
});

describe("Part 3: group bookings by date", { todo: "Part 3" }, () => {
  test("groups and keeps order", () => {
    const groups = groupByDate([
      { id: "b1", date: "2026-11-24" },
      { id: "b2", date: "2026-11-25" },
      { id: "b3", date: "2026-11-24" },
    ]);
    assert.deepEqual(groups.get("2026-11-24")?.map((b) => b.id), ["b1", "b3"]);
    assert.deepEqual(groups.get("2026-11-25")?.map((b) => b.id), ["b2"]);
    assert.equal(groups.size, 2);
  });
});

describe("Part 4: two-sum", { todo: "Part 4" }, () => {
  test("finds the pair", () => {
    assert.deepEqual(twoSum([30, 50, 20], 70), [1, 2]);
  });
  test("smallest second index wins", () => {
    assert.deepEqual(twoSum([10, 60, 40, 30], 70), [0, 1]);
  });
  test("can't use the same price twice", () => {
    assert.equal(twoSum([35], 70), null);
  });
  test("same price at two indexes is fine", () => {
    assert.deepEqual(twoSum([35, 10, 35], 70), [0, 2]);
  });
  test("no pair gives null", () => {
    assert.equal(twoSum([10, 20], 100), null);
  });
});

describe("Part 5: top K", { todo: "Part 5" }, () => {
  test("most frequent first", () => {
    assert.deepEqual(topK(["lash", "brow", "lash", "nails", "lash", "brow"], 2), ["lash", "brow"]);
  });
  test("ties: first appearance comes first", () => {
    assert.deepEqual(topK(["nails", "brow", "brow", "nails"], 2), ["nails", "brow"]);
  });
  test("k larger than the number of services", () => {
    assert.deepEqual(topK(["lash"], 3), ["lash"]);
  });
});

describe("Part 6: first one-time client", { todo: "Part 6" }, () => {
  test("finds the first unique id", () => {
    assert.equal(firstUnique(["a", "b", "a", "c"]), "b");
  });
  test("none unique gives null", () => {
    assert.equal(firstUnique(["a", "a"]), null);
  });
  test("empty input gives null", () => {
    assert.equal(firstUnique([]), null);
  });
});

describe("Part 7: process booking requests", { todo: "Part 7" }, () => {
  test("first request wins, repeats are rejected", () => {
    assert.deepEqual(processRequests(["10:00", "11:00", "10:00", "10:00"]), [
      "accepted",
      "accepted",
      "rejected",
      "rejected",
    ]);
  });
  test("empty input", () => {
    assert.deepEqual(processRequests([]), []);
  });
});

describe("Part 8: my own edge cases", { todo: "Part 8" }, () => {
  test.todo("add at least two tests nobody gave you");
});
