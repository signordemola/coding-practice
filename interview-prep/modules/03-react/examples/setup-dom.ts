// Gives Node a browser-like DOM (jsdom) so React DOM can render, then exposes small helpers.
// Import this FIRST in every example: ES modules evaluate imports in order, so the globals
// exist before react-dom loads.
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" });
const g = globalThis as Record<string, unknown>;
for (const key of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLFormElement",
  "Node", "Event", "MouseEvent", "SubmitEvent", "FormData", "MutationObserver", "getComputedStyle",
  "requestAnimationFrame", "cancelAnimationFrame"] as const) {
  const value = (dom.window as unknown as Record<string, unknown>)[key];
  if (value === undefined) continue;
  // defineProperty: Node has its own read-only `navigator` global, which plain assignment can't replace.
  Object.defineProperty(g, key, {
    value: key === "getComputedStyle" ? (value as (...a: unknown[]) => unknown).bind(dom.window) : value,
    configurable: true,
    writable: true,
  });
}
// Tells React that tests wrap updates in act() (see react.dev reference/react/act).
g["IS_REACT_ACT_ENVIRONMENT"] = true;

export function newContainer(): HTMLDivElement {
  const div = document.createElement("div");
  document.body.append(div);
  return div;
}

export function click(el: Element | null): void {
  if (!el) throw new Error("click: element not found");
  el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

/** Collects console.error/console.warn output while `fn` runs (React reports warnings there). */
export async function captureConsole(fn: () => unknown): Promise<string[]> {
  const messages: string[] = [];
  const original = { error: console.error, warn: console.warn };
  console.error = (...args: unknown[]) => void messages.push(args.map(String).join(" "));
  console.warn = (...args: unknown[]) => void messages.push(args.map(String).join(" "));
  try {
    await fn();
  } finally {
    console.error = original.error;
    console.warn = original.warn;
  }
  return messages;
}
