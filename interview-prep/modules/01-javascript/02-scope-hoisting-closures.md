# 02. Scope, hoisting and closures

**Sources (MDN, read in full, snapshot of 25 Nov 2026):**
- [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) · [`var`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var) · [Hoisting (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting)
- [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)
- [Execution model](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) (closures section)

**Run the checks:**
- `node interview-prep/modules/01-javascript/examples/02-scope-closures.js`
- `node interview-prep/modules/01-javascript/examples/02-sloppy-globals.cjs` (old sloppy-mode behaviour)

**Replaces:** old guide J3 (closures), J6 (hoisting and scoping) and the closure parts of J9.

## Explain

### Scopes
- **Global scope**, **function scope**, **block scope** (`{ }` of `if`, `for`, `switch`, `try`, a plain block, a static block) and **module scope**.
- `var` only knows function and global scope. It ignores blocks.
- `let` and `const` are block-scoped. MDN prefers `const` when you don't reassign.
- In a classic script, a top-level `var` becomes a property of `globalThis`; a top-level `let` doesn't.
- In a module (ES or CommonJS), top-level declarations stay in the module. They don't touch the global object.

### Hoisting: the four kinds (MDN glossary)
"Hoisting" isn't a spec term. MDN splits it into four behaviours:

| Kind | Example | What you get if you use it before its line |
|---|---|---|
| 1. Value hoisting | function declarations, `import` | It works: the function is ready |
| 2. Declaration hoisting with `undefined` | `var` | `undefined`, no error |
| 3. Scope "tainting" (TDZ) | `let`, `const`, `class` | ReferenceError |
| 4. Side effects run first | `import` | The imported module has already run |

- Function **expressions** and arrow functions are just values in a `const`/`let`/`var`, so they follow that keyword's rules.

### The Temporal Dead Zone (TDZ)
- From the start of a block until the `let`/`const`/`class` line runs, the name exists but can't be used. Using it throws `ReferenceError: Cannot access 'x' before initialization`.
- Even `typeof x` throws in the TDZ (normally `typeof` is safe on undeclared names).
- "Temporal" means it's about **when** code runs, not where it's written. A function defined above a `let` can read it, as long as it's **called** after the `let` line.
- A `let` inside a block hides an outer variable of the same name for the **whole** block, even lines above it. So `const x = 1; { console.log(x); const x = 2; }` throws.

### Redeclaring
- `let` can't be redeclared in the same scope (SyntaxError). `var` can.
- The cases of a `switch` share **one** block, so `let a` in two cases is a SyntaxError. Wrap each case in `{ }`.

### Accidental globals
- `var x = y = 1` declares only `x`. `y` is assigned without a declaration, so in sloppy code it becomes a global. In strict code (all modules and classes) it throws ReferenceError.

### Closures
- A **closure** is a function plus references to the variables around where it was **created** (its lexical environment). MDN: closures are created every time a function is created.
- **Lexical scoping:** where a variable is written in the source decides who can see it.
- The inner function keeps those variables alive **after** the outer function has returned. The execution model page: bindings can outlive their execution context.
- A closure sees the variable, not a snapshot. If the variable changes later, the closure sees the new value.
- Closures reach **every** outer scope: block, function, module and global (the scope chain).

**What closures are used for (MDN):**
- Associating data with a function: a closure is like an object with one method.
- Function factories: `makeAdder(5)`, `makeSizer(12)`.
- Private state: the "module pattern" (an IIFE returning functions). Classes with `#private` fields now do this natively.
- Event callbacks that need data from where they were set up.

### The loop mistake
- With `var` in a loop, every callback closes over the **same** variable. By the time they run, the loop has finished, so all of them see the last value.
- With `let`, each iteration gets a **new** binding, so each callback keeps its own value.
- MDN's fixes, oldest to newest: a function factory, an IIFE per iteration, `let`/`const`, then `for...of` or `forEach`.

### Performance note (MDN)
- Each function instance carries its own closure, so don't create functions inside functions when you don't need the closure.
- Put shared methods on the prototype instead of creating them in every constructor call (see topic 04).

## Worked examples (checked in the example files)

```js
early();                 // "works": function declarations are fully hoisted
function early() { return "works"; }

function varDemo() {
  const before = x;      // undefined, no error
  var x = 5;
  return [before, x];    // [undefined, 5]
}

{ tdz; let tdz = 1; }    // ReferenceError
typeof neverDeclared;    // "undefined"
{ typeof inTdz; let inTdz = 1; } // ReferenceError: even typeof

function makeAdder(x) { return (y) => x + y; }
makeAdder(5)(2);         // 7
makeAdder(10)(2);        // 12: same code, different environment

function makeCounter() {
  let count = 0;
  return { increment: () => ++count, value: () => count };
}
// Two counters don't share count; nothing outside can touch it.

const withVar = [];
for (var j = 0; j < 3; j++) withVar.push(() => j);
withVar.map((f) => f()); // [3, 3, 3]: one shared j

const withLet = [];
for (let k = 0; k < 3; k++) withLet.push(() => k);
withLet.map((f) => f()); // [0, 1, 2]: a new k each time

for (var t = 0; t < 3; t++) setTimeout(() => console.log(t)); // 3, 3, 3
```

## Traps
- "Functions are hoisted" is only true for **declarations**. `const book = () => {}` can't be called before its line.
- `const` stops **reassignment**, not mutation: `const b = {}; b.x = 1` is fine.
- `var` in a `for` loop is still visible after the loop (`i` is 3 afterwards).
- Inside `switch`, two `let`s with the same name in different cases are a SyntaxError.
- Closures capture variables, not values: change the variable later and the closure sees it.
- A closure keeps everything it references alive. That's the root of many memory leaks (topic 12).

## Practice questions

**Q1. What is hoisting?**
Before code in a scope runs, declarations are registered. Function declarations are ready to call; `var` exists as `undefined`; `let`, `const` and `class` exist but throw until their line runs (the TDZ). `import`s are ready and their modules have already run.

**Q2. What's the Temporal Dead Zone, and why "temporal"?**
The time between entering a block and running the `let`/`const`/`class` line. Using the name then throws a ReferenceError, even with `typeof`. It's "temporal" because it depends on when the code runs: a function written above the `let` can use it if it's called after.

**Q3. Predict:**
```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));
```
`3, 3, 3`. One `i` is shared by every callback, and the loop finished before any timer ran. With `let`, `0, 1, 2`.

**Q4. What is a closure? Give a real use.**
A function plus the variables around where it was created, which stay alive after the outer function returns. Use: private state, like a counter only its returned functions can change, or a debounce helper keeping its timer between calls.

**Q5. Predict:**
```js
const x = 1;
{ console.log(x); const x = 2; }
```
ReferenceError. The inner `const x` covers the whole block, so the `console.log` refers to the inner `x`, which is still in the TDZ.

**Q6. `var` vs `let` vs `const`?**
`var`: function-scoped, hoisted as `undefined`, can be redeclared, makes a global property at a script's top level. `let`: block-scoped, TDZ, no redeclaring. `const`: like `let` but can't be reassigned. Default to `const`, use `let` when you reassign, avoid `var`.

**Q7. How did people make private state before classes had `#private`?**
The module pattern: an IIFE that declares variables and returns an object of functions that close over them. MDN's counter example (`privateCounter`, `changeBy`) is the classic version.

**Q8. Why can `var x = y = 1` be a bug?**
Only `x` is declared. `y` is assigned without a declaration, so sloppy code creates a global `y`; strict code throws.

## Say it (about 45 seconds)
"Declarations are set up before a scope runs. Function declarations are ready to call, `var` starts as undefined, and `let`, `const` and `class` are in the Temporal Dead Zone, so using them early throws, even with typeof. `var` is function-scoped; `let` and `const` are block-scoped, which is why `var` in a loop with setTimeout prints 3, 3, 3: one shared variable. A closure is a function plus the variables around where it was created; it keeps them alive after the outer function returns, and it sees their current value, not a copy. I use that for private state and helpers like debounce, and I keep in mind that whatever a closure references stays in memory."
