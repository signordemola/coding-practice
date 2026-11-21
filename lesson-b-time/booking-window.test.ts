// Tests for booking-window.ts. These happy-path tests pass today, which is why the bugs shipped.
// Run from the repo root: node --test lesson-b-time/booking-window.test.ts

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { businessDay, groupByBusinessDay, isBookableMonth } from "./booking-window.ts";

describe("booking-window: existing tests (passing)", () => {
  test("midday bookings land on the right day", () => {
    assert.equal(businessDay(new Date("2026-03-10T17:00:00.000Z"), "America/New_York"), "2026-03-10");
  });

  test("groups midday bookings by day", () => {
    const grouped = groupByBusinessDay(
      [
        { id: "a", start: new Date("2026-03-10T15:00:00.000Z") },
        { id: "b", start: new Date("2026-03-10T18:00:00.000Z") },
        { id: "c", start: new Date("2026-03-11T15:00:00.000Z") },
      ],
      "America/New_York",
    );
    assert.deepEqual([...grouped.entries()], [
      ["2026-03-10", ["a", "b"]],
      ["2026-03-11", ["c"]],
    ]);
  });

  test("mid-month: current and next month are bookable, others aren't", () => {
    const now = new Date("2026-03-15T12:00:00.000Z");
    assert.equal(isBookableMonth("2026-03", now, "Europe/London"), true);
    assert.equal(isBookableMonth("2026-04", now, "Europe/London"), true);
    assert.equal(isBookableMonth("2026-05", now, "Europe/London"), false);
    assert.equal(isBookableMonth("2026-02", now, "Europe/London"), false);
  });

  test("December rolls over to January", () => {
    assert.equal(isBookableMonth("2027-01", new Date("2026-12-15T12:00:00.000Z"), "Europe/London"), true);
  });

  test("rejects an unknown time zone", () => {
    assert.throws(() => businessDay(new Date(), "Nowhere/Land"), RangeError);
  });
});

describe("booking-window: your reproductions", () => {
  // Write one failing test per ticket BEFORE you change booking-window.ts.
  // Each test should fail for the reason the ticket describes, then pass after your fix.
});
