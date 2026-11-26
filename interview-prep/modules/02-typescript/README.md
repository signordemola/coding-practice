# Module 02: TypeScript

**Why this module second:** TypeScript is on almost every role I apply for (see `../../roles/`), and three TypeScript questions came up in the micro1 Backend interview (19 Nov 2026). Those are marked ★.

**How it was built (26 Nov 2026):**
- The TypeScript handbook and reference pages listed in each topic were read **in full** from the website's own source repository (`microsoft/TypeScript-Website`, commit `bfee36f`, 25 Nov 2026). The pages don't carry their own dates, so that commit is the date.
- **The handbook is older than the compiler.** Several pages still describe pre-6.0 defaults (strict off, ES5 target, "classic" resolution). The [TypeScript 6.0 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html) and the [TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) (8 Jul 2026) were used for current behaviour, and topic 12 checks it against the real compiler.
- Node's [TypeScript page](https://nodejs.org/api/typescript.html) was read from the `nodejs/node` repository (26 Nov 2026) for how this repo runs `.ts` files.
- **Every type claim is checked by the compiler, every runtime claim by running it.** `examples/` has one `.ts` file per topic:
  - lines that must **not** compile carry `// @ts-expect-error TSxxxx`. `run-all.js` proves each one hides exactly that error code;
  - lines that must compile are type-checked by tsc 7.0.2 with **this repo's strict tsconfig** (including `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`);
  - then Node runs each file and its asserts must pass.
- Error codes on the pages are the ones tsc 7.0.2 reported in these files. Where the handbook shows a different code, the page says so.
- Run on **Node 22.23.4** (my build workspace). Type stripping has been on by default since v22.18.0, so nothing here needs Node 26, but run it on your Mac to confirm.
- Anything that's my own reasoning or a community pattern (not from these docs) is marked.

## How to use it
1. Read a topic page.
2. Open its example file. For every `@ts-expect-error` line, say **why** it fails before reading the comment.
3. Close both. Answer the practice questions out loud, then check.
4. Say the "Say it" answer in your own words, timed.
5. Before an interview, do the mock round below.

**Run every check** (from the repo root, after `pnpm install`):
`node interview-prep/modules/02-typescript/examples/run-all.js`

## Topics

| # | Topic | Main sources | Example file |
|---|---|---|---|
| 01 | [What TypeScript does: checking, inference, erasure, `strict`](01-basics-strict.md) | The Basics; tsconfig strict flags | `01-basics-strict.ts` |
| 02 | [Everyday types: unions, literals, `as const`, assertions](02-everyday-types.md) | Everyday Types | `02-everyday-types.ts` |
| 03 | [★ `type` vs `interface`](03-type-vs-interface.md) | Everyday Types; Object Types | `03-type-vs-interface.ts` |
| 04 | [Narrowing, discriminated unions, `never` exhaustiveness](04-narrowing.md) | Narrowing | `04-narrowing.ts` |
| 05 | [Functions and generics](05-functions-generics.md) | More on Functions; Generics | `05-functions-generics.ts` |
| 06 | [Object types: readonly, index signatures, excess properties, tuples](06-object-types.md) | Object Types | `06-object-types.ts` |
| 07 | [Types from types: `keyof`, `typeof`, conditional, mapped, template literal](07-type-manipulation.md) | Type Manipulation (7 pages) | `07-type-manipulation.ts` |
| 08 | [Utility types](08-utility-types.md) | Utility Types | `08-utility-types.ts` |
| 09 | [★ Classes: `implements` vs `extends`, visibility, `abstract`](09-classes.md) | Classes | `09-classes.ts` |
| 10 | [★ `any` vs `unknown` vs `never` vs `void`](10-unknown-any-never-void.md) | More on Functions; Type Compatibility | `10-unknown-any-never-void.ts` |
| 11 | [Structural typing and compatibility](11-compatibility.md) | Type Compatibility; Understanding Errors | `11-compatibility.ts` |
| 12 | [Modules, Node type stripping, tsconfig, TypeScript 6 and 7](12-modules-tooling.md) | Modules; Type Declarations; tsconfig; 6.0 notes; 7.0 post; Node docs | `12-modules-tooling.ts`, `12-not-erasable.tsc-only.ts`, `lib-shapes.ts` |

## Mock round (20 questions, about 15 minutes)
Answer each out loud in under a minute. The topic number is where the answer lives.

1. What does TypeScript do, and what does it never change at runtime? (01)
2. Is `const b = req.body as Booking` safe? What would you do instead? (01, 10)
3. What does `strictNullChecks` change? Is `strict` on by default today? (01, 12)
4. Why does `id.toUpperCase()` fail on `string | number`? Fix it. (02)
5. What does `as const` do? When do you need it? (02)
6. ★ `type` vs `interface`: the key difference and when you use each. (03)
7. What happens when an interface extends with a conflicting property, vs an intersection? (03)
8. Five ways TypeScript narrows. What's the `typeof null` trap? (04)
9. ★ What's a discriminated union? How do you make a `switch` exhaustive? (04)
10. Why a generic instead of `any`? Write `getProperty<T, K extends keyof T>`. (05)
11. Overloads or a union parameter? Why can't a union argument match overloads? (05)
12. When does TypeScript report an excess property, and when doesn't it? (06)
13. Is `readonly` deep? Does it exist at runtime? (06, 08)
14. What does `infer` do? Write `ReturnType` yourself. (07)
15. What's a mapped type? Make every property optional and readonly. (07)
16. Type the create-booking payload and a status-label map with utility types. (08)
17. ★ `implements` vs `extends`. What doesn't `implements` give you? (09)
18. `private` vs `#private`. (09)
19. ★ `any` vs `unknown`; then `never` and `void`. (10)
20. What's structural typing? How do you stop two string IDs being mixed up? (11)

Bonus (this repo's setup): how does Node run a `.ts` file, what syntax can't it run, and why `import type`? (12)

## What moved here from the old guides

| Old | New | Changes after checking against the handbook and the compiler |
|---|---|---|
| `interview-bank/study-guide.md` T1 (`interface` vs `type`) | 03 | Kept the table. Added the conflict behaviour (extends errors, `&` becomes `never`), the handbook's rule of thumb, and the exact wording of the performance note. |
| T2 (`extends` vs `implements`) | 09 | Kept the `PaymentProvider` idea; now a run example with a fake. Added the handbook's two `implements` surprises, override rules, `noImplicitOverride`, visibility table. |
| T3 (`unknown` vs `any`) | 10 | Replaced `parseAmount` with a predicate that requires integer minor units. Added `never`, `void`, `object`/`{}` and the assignability table. |
| `roles/micro1-open-source-contributions.md` section 2 | 03, 04, 05, 08, 09, 10 | Same facts, now with examples and checks. The role page now points here. |

Part C of the old guide can be deleted.

## Not covered (yet)
`satisfies`, `using` declarations, decorators (not runnable under type stripping anyway), enums in depth, declaration merging beyond interfaces (namespaces, module augmentation), writing `.d.ts` files, project references and build mode, JSX/TSX (module 03), variance annotations beyond the basics. These need pages I haven't read; add them if an interview asks.
