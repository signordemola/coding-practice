import { a } from "./a.js";
// b.js is evaluated FIRST (it's a's dependency), so a is still uninitialised here.
export const readA = a; // ReferenceError: Cannot access 'a' before initialization
export const b = 1;
