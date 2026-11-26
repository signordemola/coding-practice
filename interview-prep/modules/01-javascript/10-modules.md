# 10. Modules: ESM, CommonJS, the module graph

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [The module graph](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules/Module_graph)
- [Modules across platforms](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules/Modules_across_platforms) (Node, CommonJS, bundlers, TypeScript)
- [Using modules on the web](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules/Modules_on_the_web)

**Run the checks:** `node interview-prep/modules/01-javascript/examples/10-modules.js` (its helper modules are in `examples/10-modules/`)

**Replaces:** old guide J10.

## Explain

### Script vs module
- A module is parsed in **strict mode**, may use `import`/`export`, and runs in **its own scope**. Nothing it declares is global unless exported (or put on `globalThis` on purpose).
- Classic scripts share one global scope, which caused name clashes, manual dependency ordering and no on-demand loading. Modules declare their dependencies, forming a **dependency graph**.
- How a host knows a file is a module: `<script type="module">`; in Node, a `.mjs` extension or `"type": "module"` in the nearest `package.json` (Node also guesses from `import`/`export` syntax; browsers don't); `new Worker(url, { type: "module" })`.

### Exporting and importing
- **Named:** `export const x = …` or `export { a, b }` (top level only, not inside functions). `import { a, b } from "./m.js"`.
- **Default:** one per module. `export default <expression>` (functions and classes can be anonymous declarations). Import it with any name, no braces: `import anything from "./m.js"`.
- **Rename:** `import { draw as drawSquare } from …`. MDN prefers renaming on the import side, since you may not control the exporting module.
- **Namespace object:** `import * as Square from "./square.js"`, then `Square.draw()`.
- **Re-export ("barrel"):** `export { Square } from "./shapes/square.js"`, `export * from …` (everything except the default; can expose more than you meant), `export * as ns from …`, `export { default } from …`.
- **Side-effect import:** `import "./polyfills.js"` runs it without importing anything.
- **JSON:** `import data from "./data.json" with { type: "json" }` (an *import attribute*). Text modules use `with { type: "text" }`; browsers also have `type: "css"`.
- **Dynamic:** `await import("./m.js")` returns a promise of the namespace object. Loads on demand (code splitting); works in classic scripts too; not in service workers.
- **`import.meta`:** host-defined. `import.meta.url` is the module's URL, so `new URL("../data.json", import.meta.url)` finds a file relative to the **module**, not the page or the current directory. Node adds `import.meta.dirname` and `import.meta.filename`.

### Imports are live, read-only bindings
- An import is a view of the exporter's variable. If the exporter changes an exported `let`, importers see the new value.
- The importer can't reassign it (like a `const`), but can change properties of an exported object.
- `export default someVariable` exports the **value at that moment**. `export { someVariable as default }` and `export default function f() {}` export **live** bindings.

### How a module graph runs (load → link → evaluate)
1. **Load:** the host resolves each specifier, fetches the file, and the engine parses it to find more `import`s. Repeats until every module is loaded. Each module is fetched **once**, cached by resolved URL and module type.
2. **Link:** depth-first, synchronous. Every import is connected to the binding it refers to. A missing export is a **SyntaxError here, before any code runs**. Function declarations are created now; `var` starts as `undefined`; `let`/`const`/`class`/`export default` stay uninitialised.
3. **Evaluate:** depth-first, dependencies in the order they appear in the source. Each module body runs **once** per environment. If it throws, the error is recorded and every later import of it gets the same error; effects that already happened aren't undone.

Consequences:
- **Imports are hoisted:** a module's dependencies run before its own body, wherever the `import` lines are written. (MDN still says to keep imports at the top.)
- **One instance per environment:** every importer shares the module's state. That's why a module can hold a shared database pool or config. There's no standard way to clear the cache; to get independent state, export a factory function.
- A different URL (like `./config.js?v=2`) is a **different instance** (MDN for browsers; I checked that Node behaves the same).

### Cycles
- `a.js` imports `b.js`, which imports `a.js`. Both load and link fine. `b.js` evaluates first (it's `a`'s dependency) while `a.js` hasn't run yet.
- If `b.js` **reads** one of `a`'s `const`/`let` exports during its own evaluation → ReferenceError ("Cannot access 'a' before initialization"). Reading it later (in a callback) is fine.
- Exported **function declarations** survive cycles because they're created at link time.
- MDN's fixes: merge the two modules, move the shared code to a third module, or move code from one to the other.

### Top-level `await`
- A module can `await` at the top level. Modules that import it (directly or indirectly) wait for it; **siblings that don't depend on it carry on**.
- It "taints" everything above it: in Node, `require()` can load an ES module only if its whole graph has no top-level await (`ERR_REQUIRE_ASYNC_MODULE`).
- **Adding top-level await can be a breaking change:** it can reorder sibling modules. MDN's example: `setup.js` sets a global and `display.js` reads it; once `setup.js`'s dependency awaits, `display.js` runs first and sees `undefined`. Fix: make `display.js` import `setup.js` explicitly.
- Deadlocks are possible (a module awaiting a dynamic import of a module that imports it).

### CommonJS (Node's older system)
- Each file is wrapped in a function that receives `exports`, `module`, `require`, `__dirname`, `__filename`. A module exports **one value**, `module.exports`. `require()` is **synchronous**.
- In an ES module those five names don't exist: use `import.meta.dirname`/`filename`, and `createRequire` if you really need `require`.
- Node ESM needs **file extensions** in relative specifiers (`"./square.js"`, not `"./square"`); bare names (`"lodash"`) resolve from `node_modules`; built-ins use `node:` (`"node:fs/promises"`).
- **Interop:**
  - ESM importing CJS: the default import is `module.exports`. Named imports only work if Node can spot them statically (`module.exports = { area }`), so the safe form is `import pkg from "./x.cjs"; const { area } = pkg;`.
  - CJS importing ESM: `await import()`, or `require()` if the graph has no top-level await.
  - A transpiled `export default` becomes `module.exports.default`, so native ESM has to write `const { default: area } = pkg`. MDN: avoid default exports in code that will be compiled to CJS, or add a named alias.
- Packages declare entry points with `"exports"` in `package.json` (it replaces `"main"`); conditional exports pick ESM or CJS files. Loading one package as both CJS and ESM can give you **two separate states**.

### Bundlers and TypeScript (the parts that come up in interviews)
- Writing `import`/`export` doesn't guarantee you ship ESM: transpilers may emit CommonJS (look for the `__esModule` marker). That's why extension-less imports sometimes "work".
- **Tree shaking:** static imports let a bundler drop unused exports. Publish ESM for that. `"sideEffects": false` in `package.json` lets it drop unused imports entirely.
- **Code splitting:** `import()` becomes a separate chunk loaded on demand. Avoid fully variable specifiers like `` import(`./shapes/${name}.js`) ``; list the options so the bundler knows the files.
- TypeScript: `module`/`moduleResolution` describe how the output will run (`"nodenext"` for Node, `"bundler"` for bundlers). You import `./square.js` even when the source is `square.ts`. `import type` is erased from the output. Module 02 (TypeScript) covers this properly.

### Isomorphic code
- Modules can still see globals, so code using `window` breaks in Node and code using `process` breaks in browsers.
- MDN's three approaches: split a pure "core" from small platform "bindings"; feature-detect (`typeof process !== "undefined"`); or polyfill with a dynamic import. `globalThis` exists everywhere.

## Worked examples (checked in the example file)

```js
// counter.js
export let count = 0;
export function increment() { count++; }

// main.js
import { count, increment } from "./counter.js";
increment();
count;            // 1: live binding
// count = 5;     // TypeError: imports are read-only

const again = await import("./counter.js");
// same namespace object as the static import: shared state

// cycle-bad/b.js (imported by a.js)
import { a } from "./a.js";
export const readA = a;   // ReferenceError: a.js hasn't run yet

import rectangle from "./rectangle.cjs";       // module.exports
import compiled from "./compiled-default.cjs"; // { default: [Function: area] }
compiled.default(4);                            // 16
```

## Traps
- Circular imports that read a value during startup.
- Huge barrel files (`export * from` everything): easy to create cycles and accidental exports. (The cycle risk follows from MDN's cycle section; the barrel advice is from the old guide.)
- Relying on sibling import order for side effects.
- Forgetting the `.js` extension in Node ESM, or `with { type: "json" }` for JSON.
- `fetch("../data.json")` inside a module resolves against the **page** URL, not the module. Use `new URL(…, import.meta.url)`.
- Default exports in code compiled to CommonJS.
- Opening an HTML file that uses modules from `file://`: module requests need CORS, so serve it over HTTP.

## Practice questions

**Q1. What's the difference between an ES module and a classic script?**
A module is strict, has its own scope, can use `import`/`export`, runs once per environment however often it's imported, and (in browsers) is deferred by default. A classic script runs in the global scope, so its top-level `var`s and functions become globals.

**Q2. What are live bindings?**
An import isn't a copy: it points at the exporter's variable. If the exporter changes it, importers see the change. Importers can't reassign it.

**Q3. In what order do modules run?**
Depth-first: each module's dependencies run first, in the order they're imported, then its own body. Each module runs once. Imports are hoisted, so their position in the file doesn't change this.

**Q4. `a.js` and `b.js` import each other and you get "Cannot access 'a' before initialization". Why, and how do you fix it?**
The module being imported first (`b.js`) runs before `a.js` and reads `a`'s `const` while it's still uninitialised. Fix by moving the shared code into a third module, merging the two, or only reading the value later (inside a function). Exported function declarations don't have this problem.

**Q5. CommonJS vs ES modules?**
CJS: `require`/`module.exports`, one exported value, loaded synchronously, `__dirname` available. ESM: `import`/`export`, named and default exports, live bindings, static so bundlers can tree-shake, top-level await, `import.meta`. Node supports both; ESM can import CJS (as a default import) and CJS can `import()` ESM or `require()` it if there's no top-level await.

**Q6. Why can adding a top-level `await` break an app?**
Every module that imports it becomes asynchronous and waits, while sibling modules don't. Code that relied on one sibling running before another can now run in a different order. It also stops `require()` from loading that graph.

**Q7. What does tree shaking need?**
Static `import`/`export` so the bundler can see which exports are used, code shipped as ESM, and no unexpected side effects (`"sideEffects": false` lets it drop unused imports completely).

**Q8. How do you keep a DB connection shared across a Node app?**
Create it in its own module and export it. Every importer gets the same instance, because the module is evaluated once. (Example from the old guide: `export const pool = new Pool(...)` in `db.js`.)

## Say it (about 45 seconds)
"Each ES module has its own strict scope; nothing is global unless it's exported and imported. Loading happens in three steps: the host fetches and parses the whole graph, the engine links every import to its export (a missing export fails before any code runs), and then modules run depth-first, dependencies first, each one exactly once. Imports are live, read-only bindings, and every importer shares one instance, which is why a module can hold a shared database pool. The things I watch for are cycles that read a value during startup, top-level await reordering sibling modules, default exports in code compiled to CommonJS, and missing file extensions in Node."
