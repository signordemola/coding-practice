// Tests for slots.ts. Run from the repo root: node --test lesson-b-time/slots.test.ts
// Each part is marked `todo`, so unfinished parts are reported but don't fail the run.
// When you start a part, delete its `{ todo: ... }` option so its tests count for real.
// Add your own edge-case tests at the bottom; don't edit the existing expectations.

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateSlots, toViewerWallTime, type SlotRequest } from "./slots.ts";

/** A plain weekday request; each test overrides only what it needs. */
function request(overrides: Partial<SlotRequest>): SlotRequest {
  return {
    businessTimeZone: "America/New_York",
    date: "2026-03-03",
    opensAt: "09:00",
    closesAt: "12:00",
    durationMinutes: 60,
    stepMinutes: 30,
    bufferMinutes: 0,
    booked: [],
    now: "2026-03-01T00:00:00.000Z",
    minNoticeMinutes: 0,
    ...overrides,
  };
}

const starts = (request: SlotRequest): string[] => generateSlots(request).map((slot) => slot.start);

describe("Part 1: wall-clock hours in the business's zone become UTC instants", { todo: "Part 1" }, () => {
  test("New York in winter (UTC-5): 09:00–12:00, 60-minute service every 30 minutes", () => {
    assert.deepEqual(generateSlots(request({})), [
      { start: "2026-03-03T14:00:00.000Z", end: "2026-03-03T15:00:00.000Z" },
      { start: "2026-03-03T14:30:00.000Z", end: "2026-03-03T15:30:00.000Z" },
      { start: "2026-03-03T15:00:00.000Z", end: "2026-03-03T16:00:00.000Z" },
      { start: "2026-03-03T15:30:00.000Z", end: "2026-03-03T16:30:00.000Z" },
      { start: "2026-03-03T16:00:00.000Z", end: "2026-03-03T17:00:00.000Z" },
    ]);
  });

  test("London in winter (UTC+0): the service must end by closing time", () => {
    const slots = starts(
      request({ businessTimeZone: "Europe/London", opensAt: "09:00", closesAt: "10:30", durationMinutes: 30 }),
    );
    assert.deepEqual(slots, ["2026-03-03T09:00:00.000Z", "2026-03-03T09:30:00.000Z", "2026-03-03T10:00:00.000Z"]);
  });

  test("Auckland (UTC+13): the business's 3 March starts on 2 March in UTC", () => {
    const slots = starts(
      request({ businessTimeZone: "Pacific/Auckland", opensAt: "09:00", closesAt: "10:00", stepMinutes: 60 }),
    );
    assert.deepEqual(slots, ["2026-03-02T20:00:00.000Z"]);
  });

  test("toViewerWallTime shows one instant in two viewers' zones", () => {
    assert.equal(toViewerWallTime("2026-03-02T20:00:00.000Z", "Pacific/Auckland"), "2026-03-03 09:00");
    assert.equal(toViewerWallTime("2026-03-02T20:00:00.000Z", "America/Los_Angeles"), "2026-03-02 12:00");
  });
});

describe("Part 2: bookings, buffers and minimum notice", { todo: "Part 2" }, () => {
  const tenToEleven = { start: "2026-03-03T15:00:00.000Z", end: "2026-03-03T16:00:00.000Z" };

  test("a booking blocks overlapping slots; touching end-to-start is allowed", () => {
    assert.deepEqual(starts(request({ booked: [tenToEleven] })), [
      "2026-03-03T14:00:00.000Z",
      "2026-03-03T16:00:00.000Z",
    ]);
  });

  test("a 15-minute buffer applies before and after the booking", () => {
    assert.deepEqual(starts(request({ closesAt: "13:00", bufferMinutes: 15, booked: [tenToEleven] })), [
      "2026-03-03T16:30:00.000Z",
      "2026-03-03T17:00:00.000Z",
    ]);
  });

  test("slots must start at least minNoticeMinutes after now", () => {
    assert.deepEqual(starts(request({ now: "2026-03-03T14:20:00.000Z", minNoticeMinutes: 60 })), [
      "2026-03-03T15:30:00.000Z",
      "2026-03-03T16:00:00.000Z",
    ]);
  });
});

describe("Part 3: reject bad input with a RangeError (production-ready boundaries)", { todo: "Part 3" }, () => {
  const cases: Array<[string, Partial<SlotRequest>]> = [
    ["an unknown time zone", { businessTimeZone: "Mars/Olympus_Mons" }],
    ["a date that doesn't exist", { date: "2026-02-30" }],
    ["a badly formatted date", { date: "03/03/2026" }],
    ["a badly formatted time", { opensAt: "9am" }],
    ["closing time not after opening time", { opensAt: "12:00", closesAt: "12:00" }],
    ["a non-positive duration", { durationMinutes: 0 }],
    ["a non-positive step", { stepMinutes: -30 }],
    ["a negative buffer", { bufferMinutes: -5 }],
    ["a booking that ends before it starts", { booked: [{ start: "2026-03-03T16:00:00.000Z", end: "2026-03-03T15:00:00.000Z" }] }],
    ["an invalid now", { now: "yesterday" }],
  ];

  for (const [label, overrides] of cases) {
    test(`throws for ${label}`, () => {
      assert.throws(() => generateSlots(request(overrides)), RangeError);
    });
  }

  test("toViewerWallTime throws for an unknown zone or an invalid instant", () => {
    assert.throws(() => toViewerWallTime("2026-03-03T14:00:00.000Z", "Not/A_Zone"), RangeError);
    assert.throws(() => toViewerWallTime("not an instant", "Europe/London"), RangeError);
  });
});

describe("Part 4: daylight-saving days (New York, 2026)", { todo: "Part 4" }, () => {
  test("8 March, after clocks spring forward: 09:00 is UTC-4, not UTC-5", () => {
    assert.deepEqual(starts(request({ date: "2026-03-08", opensAt: "09:00", closesAt: "10:00" })), [
      "2026-03-08T13:00:00.000Z",
    ]);
  });

  test("1 November, after clocks fall back: 09:00 is UTC-5 again", () => {
    assert.deepEqual(starts(request({ date: "2026-11-01", opensAt: "09:00", closesAt: "10:00" })), [
      "2026-11-01T14:00:00.000Z",
    ]);
  });

  test("8 March night shift: wall times in the missing hour (02:00–02:59) are skipped", () => {
    const slots = starts(
      request({ date: "2026-03-08", opensAt: "01:00", closesAt: "04:00", durationMinutes: 30, stepMinutes: 30 }),
    );
    assert.deepEqual(slots, [
      "2026-03-08T06:00:00.000Z",
      "2026-03-08T06:30:00.000Z",
      "2026-03-08T07:00:00.000Z",
      "2026-03-08T07:30:00.000Z",
    ]);
  });

  test("1 November night shift: a repeated wall time (01:00) uses its earlier occurrence", () => {
    const slots = starts(
      request({ date: "2026-11-01", opensAt: "00:00", closesAt: "03:00", durationMinutes: 60, stepMinutes: 60 }),
    );
    assert.deepEqual(slots, ["2026-11-01T04:00:00.000Z", "2026-11-01T05:00:00.000Z", "2026-11-01T07:00:00.000Z"]);
  });
});

describe("Part 5: your own edge cases", () => {
  // Add at least two tests for cases nobody gave you. Ideas: a booking that crosses opening time,
  // two overlapping bookings, a buffer that pushes the last slot past closing, a 45-minute step.
});
