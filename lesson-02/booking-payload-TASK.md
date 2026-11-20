# Stage 2 practice: booking payload validator

The starter program contains unsafe validation. It starts, prints the first booking, then fails when it reaches invalid data.

Repair the program without changing `payloads`, `BookingStatus`, `Booking`, `BookingSlot`, or the expected output.

## Requirements

- Implement `isBooking` as a real type predicate.
- Accept only a non-null object with a string `id`, a status of `pending` or `paid`, and a finite non-negative number `deposit`.
- Remove the unsafe `as Booking` assertion.
- Print `Invalid booking payload` for each invalid value.
- Keep the tuple and print its duration.
- Do not use `any`.

## Expected output

```text
Booking bk_101: pending, deposit 45.00
Invalid booking payload
Invalid booking payload
Invalid booking payload
Invalid booking payload
Slot duration: 60 minutes
```

## Verify

```bash
pnpm install
pnpm exec tsc --noEmit --strict lesson-02/booking-payload.ts
node lesson-02/booking-payload.ts
```
