type BookingStatus = "pending" | "paid";

interface Booking {
  id: string;
  status: BookingStatus;
  deposit: number;
}

type BookingSlot = [start: Date, end: Date];

const payloads: unknown[] = [
  { id: "bk_101", status: "pending", deposit: 0 },
  { id: "bk_102", status: "pending", deposit: "45" },
  { id: "bk_103", status: "cancelled", deposit: 45 },
  null,
  { id: 104, status: "paid", deposit: 90 },
];

const isBooking = (value: unknown): value is Booking => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  if (!("id" in value) || !("status" in value) || !("deposit" in value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.deposit !== "number" ||
    (value.status !== "pending" && value.status !== "paid")
  ) {
    return false;
  }

  if (value.deposit < 0 || !Number.isFinite(value.deposit)) {
    return false;
  }

  return true;
};

const describeBooking = (booking: unknown): string => {
  if (!isBooking(booking)) {
    return "Invalid booking payload";
  }
  return `Booking ${booking.id}: ${booking.status}, deposit ${booking.deposit.toFixed(2)}`;
};

const printPayloads = (values: unknown[]): void => {
  for (const value of values) {
    console.log(describeBooking(value));
  }
};

const slot: BookingSlot = [
  new Date("2026-11-20T09:00:00Z"),
  new Date("2026-11-20T10:00:00Z"),
];

const durationInMinutes = (currentSlot: BookingSlot): number =>
  (currentSlot[1].getTime() - currentSlot[0].getTime()) / 60_000;

printPayloads(payloads);
console.log(`Slot duration: ${durationInMinutes(slot)} minutes`);
