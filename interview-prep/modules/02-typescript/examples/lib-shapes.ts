// Helper module for topic 12 (imported by 12-modules-tooling.ts; not run on its own).
export interface Shape {
  kind: "circle" | "square";
  size: number;
}
export type Unit = "cm" | "in";
export function area(s: Shape): number {
  return s.kind === "circle" ? Math.PI * s.size ** 2 : s.size ** 2;
}
