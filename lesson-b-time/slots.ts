// Track B (Time) · B1–B3 build exercise. Read slots-TASK.md first.
// You write the implementation. Keep the exported names and types unchanged:
// the tests in slots.test.ts import them.

/** A booked appointment, stored as two UTC instants (ISO 8601 strings). */
export type Booking = {
  start: string;
  end: string;
};

export type SlotRequest = {
  /** IANA time zone of the business, e.g. "America/New_York". */
  businessTimeZone: string;
  /** A calendar day in the business's zone, "YYYY-MM-DD". */
  date: string;
  /** Wall-clock opening time in the business's zone, "HH:MM" (24-hour). */
  opensAt: string;
  /** Wall-clock closing time in the business's zone, "HH:MM". Must be after opensAt. */
  closesAt: string;
  /** Length of the service in minutes (elapsed time). */
  durationMinutes: number;
  /** Gap between candidate start times, in wall-clock minutes from opensAt. */
  stepMinutes: number;
  /** Free time required before and after every existing booking. */
  bufferMinutes: number;
  /** Existing bookings that block time. */
  booked: Booking[];
  /** The current instant, ISO 8601. Passed in so the function is testable. */
  now: string;
  /** A slot must start at least this many minutes after `now`. */
  minNoticeMinutes: number;
};

/** An available slot as two UTC instants, formatted with Date#toISOString(). */
export type Slot = {
  start: string;
  end: string;
};

export function generateSlots(request: SlotRequest): Slot[] {
  throw new Error("Not implemented: see slots-TASK.md");
}

/**
 * Shows an instant as wall-clock time in a viewer's zone: "YYYY-MM-DD HH:MM" (24-hour).
 * Example: toViewerWallTime("2026-03-02T20:00:00.000Z", "Pacific/Auckland") === "2026-03-03 09:00"
 */
export function toViewerWallTime(instant: string, timeZone: string): string {
  throw new Error("Not implemented: see slots-TASK.md");
}
