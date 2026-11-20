# Stage 2 practice: booking functions

The starter program has four logic bugs. Fix them without changing the function names or parameter types.

## Requirements

- `calculateBalance` returns the booking price minus the deposit.
- `calculateDeposit` uses a rate of `0.3` when the caller omits the rate or passes `undefined`.
- `totalDeposits` returns the sum of all supplied deposits. It returns `0` when it receives no deposits.
- `formatBookingLabel` includes the service when one is supplied. It returns only the booking ID when the service is omitted.
- Keep strict TypeScript types. Do not use `any` or type assertions.

## Expected output

```text
Balance: 80
Default deposit: 30
Undefined rate deposit: 30
Custom rate deposit: 40
Deposit total: 100
Empty deposit total: 0
Label with service: bk_204: Haircut
Label without service: bk_204
```

## Verify

```bash
pnpm install
pnpm exec tsc --noEmit --strict lesson-02/booking-functions.ts
node lesson-02/booking-functions.ts
```
