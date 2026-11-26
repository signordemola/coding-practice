// Topic 12: syntax that Node's type stripping can't run, and how tsc catches it first.
// This file is type-checked by run-all.js but NOT run (Node would refuse to load it).
// With erasableSyntaxOnly (on in this repo), each of these is a compile error.
import type { Shape } from "./lib-shapes.ts";
// @ts-expect-error TS1484 — verbatimModuleSyntax: a type must be imported with `type`
import { Unit } from "./lib-shapes.ts";

// @ts-expect-error TS1294 — enums generate runtime code
enum Direction {
  Up,
  Down,
}

// @ts-expect-error TS1294 — a namespace with runtime values generates code
namespace Values {
  export const x = 1;
}

namespace TypesOnly {
  export type A = string; // fine: nothing to emit
}

class Point {
  // @ts-expect-error TS1294 — parameter properties generate `this.x = x`
  constructor(public x: number) {}
}

// @ts-expect-error TS1294 — old angle-bracket assertions; write `"x" as string` instead
const legacy = <string>(<unknown>"x");
export { Direction, Values, Point, legacy };
export type { TypesOnly, Shape, Unit };
