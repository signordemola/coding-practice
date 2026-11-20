# Stage 1: fill the practice gaps

The files in this folder cover closures, promises, the event loop, and arrays. This task adds practice for the missing parts of Stage 1.

## Requirements

- Create `values-and-scope.ts`.
- Demonstrate strict and loose equality, truthy and falsy values, and the difference between `||` and `??` with `0`, an empty string, `false`, `null`, `undefined`, and `NaN`.
- Show block scope with `let` and `const`. Show how `var` differs in scope and hoisting. Keep new code on `const` and `let` unless `var` is the point of the example.
- Complete Parts 2 and 3 of the deposit exercise: fix the detached method with `bind` and an arrow wrapper, then check the instance prototype.
- Add one successful promise and one rejected promise to the booking fetch example. Use `Promise.allSettled` to report both outcomes.
- Keep strict TypeScript types. Do not use `any` or type assertions.

## Acceptance checks

- `0`, an empty string, and `false` stay unchanged with `??` and use the fallback with `||`.
- `null` and `undefined` compare loosely equal and strictly unequal.
- The bound method and arrow wrapper both describe the same booking.
- The prototype check confirms that the instance inherits from `BookingSummary.prototype`.
- The rejected promise does not prevent reporting the successful result.

## Verify

Run these commands from the repository root:

```bash
pnpm exec tsc --noEmit --strict lesson-01/values-and-scope.ts
pnpm exec tsc --noEmit --strict lesson-01/deposit.ts
pnpm exec tsc --noEmit --strict lesson-01/fetch-bookings.ts
node lesson-01/values-and-scope.ts
node lesson-01/deposit.ts
node lesson-01/fetch-bookings.ts
```
