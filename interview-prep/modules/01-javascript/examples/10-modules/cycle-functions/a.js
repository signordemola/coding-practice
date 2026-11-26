import { isEven } from "./b.js";
export function isOdd(n) {
  return n !== 0 && isEven(n - 1);
}
