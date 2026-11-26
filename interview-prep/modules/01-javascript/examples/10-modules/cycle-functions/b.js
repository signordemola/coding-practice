import { isOdd } from "./a.js";
// Function declarations are initialised during LINKING, before any module body runs,
// so calling isOdd here works even though a.js hasn't run yet.
export const fiveIsEven = isEven(5);
export function isEven(n) {
  return n === 0 || isOdd(n - 1);
}
