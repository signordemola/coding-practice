// Track B (Time) · Part 0 of slots-TASK.md: PREDICT before you run.
// Write your prediction for each numbered line in slots-TASK.md first, then run:
//   node lesson-03/predict.ts
// Don't change this file until you've compared your predictions with the output.

/** "YYYY-MM-DD HH:MM" wall-clock time of an instant in a zone (24-hour). */
function wall(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const get = (type: string): string => parts.find((part) => part.type === type)?.value ?? "??";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

const HOUR = 60 * 60 * 1000;
const instant = new Date("2026-03-08T06:30:00Z");

console.log("1", instant.toISOString());
console.log("2", wall(instant, "America/New_York"));
console.log("3", wall(instant, "Asia/Tokyo"));
console.log("4", new Date(Date.UTC(2026, 2, 8)).toISOString());

const noonBeforeDst = new Date("2026-03-07T17:00:00Z"); // 12:00 in New York
console.log("5", wall(noonBeforeDst, "America/New_York"));
console.log("6", wall(new Date(noonBeforeDst.getTime() + 24 * HOUR), "America/New_York"));

console.log("7", new Date("2026-03-08").toISOString());
console.log("8", new Date("2026-03-08T00:00").toISOString());
console.log("9", wall(new Date("2026-03-31T23:30:00-07:00"), "UTC").slice(0, 7));
