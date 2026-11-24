// Track B (Time) · bug hunt. Read booking-window-TASK.md first.
// This module is "in production". Users have reported bugs (see the TASK file).
// Find them, reproduce them with a failing test, and fix them with the smallest correct change.

export type Booking = {
  id: string;
  /** UTC instant. */
  start: Date;
};

function assertTimeZone(timeZone: string): void {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    throw new RangeError(`Unknown time zone: ${timeZone}`);
  }
}

/** The calendar day ("YYYY-MM-DD") an instant falls on, as seen in the given IANA time zone. */
export function businessDay(instant: Date, timeZone: string): string {
  assertTimeZone(timeZone);
  return instant.toISOString().slice(0, 10);
}

/** Groups bookings by the business's calendar day, for the studio's daily report. */
export function groupByBusinessDay(bookings: Booking[], timeZone: string): Map<string, string[]> {
  const byDay = new Map<string, string[]>();
  for (const booking of bookings) {
    const day = businessDay(booking.start, timeZone);
    const ids = byDay.get(day) ?? [];
    ids.push(booking.id);
    byDay.set(day, ids);
  }
  return byDay;
}

function addMonths(month: string, count: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) throw new RangeError(`Invalid month: ${month}`);
  const total = Number(match[1]) * 12 + (Number(match[2]) - 1) + count;
  const year = Math.floor(total / 12);
  const monthNumber = (total % 12) + 1;
  return `${year}-${String(monthNumber).padStart(2, "0")}`;
}

/**
 * Clients may book in the current month or the next month, where "current"
 * means the month the client is in right now, in their own time zone.
 * `month` is "YYYY-MM".
 */
export function isBookableMonth(month: string, now: Date, clientTimeZone: string): boolean {
  assertTimeZone(clientTimeZone);
  addMonths(month, 0); // validates the format
  const current = now.toISOString().slice(0, 7);
  return month === current || month === addMonths(current, 1);
}
