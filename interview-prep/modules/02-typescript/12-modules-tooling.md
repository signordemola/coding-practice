# 12. Modules, Node type stripping, tsconfig, and what changed in TypeScript 6 and 7

**Sources (read in full unless marked):**
- [Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html) and [Type Declarations](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html) (handbook)
- tsconfig reference: [`verbatimModuleSyntax`](https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax), [`erasableSyntaxOnly`](https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly), [`isolatedModules`](https://www.typescriptlang.org/tsconfig/#isolatedModules), [`moduleDetection`](https://www.typescriptlang.org/tsconfig/#moduleDetection), [`allowImportingTsExtensions`](https://www.typescriptlang.org/tsconfig/#allowImportingTsExtensions), [`noUncheckedSideEffectImports`](https://www.typescriptlang.org/tsconfig/#noUncheckedSideEffectImports), [`skipLibCheck`](https://www.typescriptlang.org/tsconfig/#skipLibCheck)
- [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) (TypeScript blog, 8 Jul 2026; read through the web fetcher, so a summary of the page rather than every line)
- [Node.js: Modules: TypeScript](https://nodejs.org/api/typescript.html) (read from the `nodejs/node` repository, 26 Nov 2026)

**Run the checks:** `node interview-prep/modules/02-typescript/examples/run-all.js` (this topic: `examples/12-modules-tooling.ts`, `examples/12-not-erasable.tsc-only.ts`, `examples/lib-shapes.ts`)

## Explain

### Modules in TypeScript
- A file with a top-level `import` or `export` is a **module**; otherwise it's a **script** sharing the global scope. `export {}` turns a file into a module. This repo sets `moduleDetection: "force"`, so every non-`.d.ts` file is a module.
- The handbook splits the topic into three concerns: **syntax** (what you write), **module resolution** (how `"./x"` finds a file) and **output format** (what's emitted).
- Type-only imports: `import type { Shape } from "./lib-shapes.ts"` or inline `import { area, type Shape }`. They tell single-file tools (Babel, swc, esbuild, Node) what to delete.
- Namespaces are TypeScript's older module format; the handbook recommends ES modules.

### Declaration files
- `.ts` = code (emits `.js`); `.d.ts` = types only.
- Types for packages: bundled in the package, or from DefinitelyTyped (`npm i -D @types/react`), found automatically in `node_modules/@types`. `declare module "untyped-lib";` makes a module `any`.
- `skipLibCheck` skips checking `.d.ts` files (faster; the docs suggest fixing duplicate type copies instead when you can).

### How this repo runs TypeScript: Node type stripping
From the Node docs:
- Node runs `.ts` files that contain **only erasable syntax**. It **replaces types with whitespace** (so line numbers match and no source maps are needed) and does **no type checking**. That's why `pnpm typecheck` (tsc) is a separate step.
- History: added in v22.6.0, on by default in v23.6.0 / v22.18.0, stable in v25.2.0 / v24.12.0; Node 26 removed `--experimental-transform-types`.
- Node **ignores `tsconfig.json`**: no `paths`, no downlevelling. (For `paths`, use package.json subpath imports starting with `#`.)
- Module system: `.ts` follows `package.json` `"type"`, like `.js`; `.mts` is always ESM; `.cts` always CommonJS; `.tsx` is unsupported.
- **File extensions are mandatory**: `import "./file.ts"`. `allowImportingTsExtensions` lets tsc accept that.
- **Refused syntax** (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`): `enum`, `namespace` with runtime code, constructor parameter properties, import aliases (`import x = …`). A `namespace` with only types is fine. Decorators are a parser error.
- **`type` is required on type-only imports.** Without it, Node treats the import as a value import, and loading fails (checked: "does not provide an export named 'Shape'").
- Node won't strip types in files under `node_modules` (to discourage publishing TypeScript source).
- Node recommends TypeScript 5.8+ with `target: esnext`, `module: nodenext`, `rewriteRelativeImportExtensions`, `erasableSyntaxOnly` and `verbatimModuleSyntax` (`noEmit` if you only run `.ts` files).

### The tsconfig flags that make tsc match Node

| Flag | Effect |
|---|---|
| `erasableSyntaxOnly` | tsc errors (1294) on enums, namespaces with values, parameter properties, `import =`/`export =`, angle-bracket assertions |
| `verbatimModuleSyntax` | imports without `type` are kept exactly; a type imported without `type` is an error (1484). Replaces `importsNotUsedAsValues`/`preserveValueImports` |
| `isolatedModules` | flags code a single-file transpiler can't handle (e.g. re-exporting a type without `type`) |
| `allowImportingTsExtensions` | allows `"./x.ts"` imports (only with `noEmit` or `emitDeclarationOnly`) |
| `noUncheckedSideEffectImports` | errors when `import "./polyfill"` can't be resolved |

### ★ What changed in TypeScript 6.0 and 7.0 (the handbook pages are older)
**6.0 (transition release) changed the defaults:**
- `strict: true`; `module: esnext`; `target`: the current ES year (es2025); `noUncheckedSideEffectImports: true`; `rootDir`: the tsconfig folder; **`types: []`**. So Node globals like `process` need `"types": ["node"]` (the notes say this also speeds up builds).

**6.0 deprecated, and 7.0 removed** (now hard errors, checked with tsc 7.0.2):
- `target: es5` (the lowest is ES2015) and `downlevelIteration`.
- `moduleResolution: node`/`node10` and `classic`. Use `nodenext` for Node, `bundler` for bundlers.
- `module: amd`, `umd`, `systemjs`, `none`; `outFile`.
- `baseUrl` (tsc 7 suggests `"paths": {"*": ["./*"]}`).
- `esModuleInterop: false`, `allowSyntheticDefaultImports: false`, `alwaysStrict: false`.
- `module Foo {}` (write `namespace`); import `asserts` (write `with`).
- `tsc file.ts` while a `tsconfig.json` is present (TS5112; use `--ignoreConfig`).

**7.0 (8 Jul 2026), per the blog post:**
- The compiler is a **native port in Go**, about 10× faster (the post reports typical 8–12× on full builds), with parallel parsing, checking and emitting (`--checkers`, `--builders`, `--singleThreaded`).
- Installed the same way: `npm i -D typescript`, then `tsc`. Editors use a new language server; VS Code has the TypeScript Native Preview extension.
- **No programmatic API in 7.0** (planned for 7.1). Tools that need it (the post mentions typescript-eslint) use `@typescript/typescript6`, which provides `tsc6`.
- Code that compiles cleanly on 6.0 (with `stableTypeOrdering`, without `ignoreDeprecations`) should behave the same on 7.0.
- Editor support for embedded languages (Vue, Svelte, Astro, MDX, Angular templates) wasn't there yet.

**Checked by running tsc 7.0.2 with an empty `tsconfig.json`:** implicit `any` is an error (strict on), `process` isn't found (types empty), and `Set.prototype.union` is typed (ES2025 lib).

## Worked example (checked in `examples/12-*`)

```ts
import { area, type Shape } from "./lib-shapes.ts"; // area stays, Shape is erased
import type { Unit } from "./lib-shapes.ts";         // whole line erased

// In 12-not-erasable.tsc-only.ts (tsc errors; Node would refuse to load the file):
import { Unit } from "./lib-shapes.ts";   // 1484: must use `import type`
enum Direction { Up, Down }               // 1294
class Point { constructor(public x: number) {} } // 1294
```
Instead of an enum, in a type-stripping project:
```ts
const Status = { Pending: "pending", Confirmed: "confirmed" } as const;
type Status = (typeof Status)[keyof typeof Status]; // "pending" | "confirmed"
```
(This `as const` object pattern is my suggestion, built from topics 02 and 07; it isn't on these pages. It's checked in `12-modules-tooling.ts`.)

## Traps
- Forgetting `type` on a type-only import in a type-stripping project: runtime error.
- Importing `./file` without `.ts` under Node.
- Expecting `paths` aliases to work under Node type stripping.
- Following an older tutorial's tsconfig with `target: es5`, `baseUrl` or `moduleResolution: node`: these fail in TypeScript 7.
- Upgrading to TS 6/7 and suddenly "missing" `process`/`describe`: add `"types": ["node"]` (or the test runner's types).
- Assuming Node checks your types: it never does.

## Practice questions

**Q1. How does Node run a `.ts` file? What can't it run?**
It strips the types (replacing them with whitespace) and runs the JavaScript, with no type checking and no tsconfig. It refuses syntax that needs code generation: enums, namespaces with values, parameter properties, import aliases.

**Q2. Why `import type`?**
So single-file tools know the import can be deleted. Under Node type stripping a missing `type` becomes a real import of something that doesn't exist at runtime, and loading fails. `verbatimModuleSyntax` makes tsc enforce it.

**Q3. What does `erasableSyntaxOnly` do?** Makes tsc reject every TypeScript feature that emits code, so files are safe to run with type stripping.

**Q4. What changed in TypeScript 6 and 7?**
6.0 changed defaults (strict on, ESNext modules, current-year target, `types: []`) and deprecated old options such as ES5, `baseUrl` and `moduleResolution: node`. 7.0 is the Go port, about 10× faster, with those deprecations removed and no programmatic API until 7.1.

**Q5. `moduleResolution`: what should you use?** `nodenext` for code run by Node; `bundler` for code built by a bundler. `node10`/`classic` are gone in 7.0.

**Q6. What's in a `.d.ts` file, and where do library types come from?** Only types. They ship with the package or come from `@types/*` (DefinitelyTyped).

## Say it (about 45 seconds)
"In my practice repo, Node runs TypeScript directly by stripping the types, so there's no build step, but also no type checking; tsc runs separately as a check. That means only erasable syntax: no enums, namespaces with values or parameter properties, and type-only imports must say `import type`. `erasableSyntaxOnly` and `verbatimModuleSyntax` make tsc enforce that. I keep up with the compiler too: TypeScript 6 made strict mode and modern targets the default and deprecated ES5, `baseUrl` and the old node resolution; TypeScript 7 is the native Go port, about ten times faster, and those old options are now errors."
