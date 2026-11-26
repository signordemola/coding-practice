# Interview prep

One place for everything I study before platform interviews (micro1, Mercor, Turing, OpenTrain and similar).

- **`modules/`**: one in-depth module per skill. Built one at a time, in the order the skills are most shared across the roles I apply for.
- **`roles/`**: one page per role I've applied to. Each covers what the role asks, the interview format, what I answered on the form, the deadline, and which modules to study.

## How each module is built
- **Official docs, read in full, never from memory:** MDN, typescriptlang.org, react.dev, nodejs.org, postgresql.org, docs.python.org, fastapi.tiangolo.com, vercel.com/docs, nextjs.org, docs.stripe.com, code.visualstudio.com, owasp.org, and so on.
- **Sources on every point:** each section names its source page and that page's last-updated date (for MDN, which has no per-page dates, the date of the source snapshot). Anything that is my reasoning rather than a doc statement is marked as such.
- **Code is run, not assumed:** where a module has code, its `examples/` folder asserts every behaviour it describes. For TypeScript, the compiler also checks every "this doesn't compile" claim and its error code.
- **Format:** explanation, worked examples, common traps, then practice questions with answers to say out loud.
- **Real facts only:** nothing here claims experience I don't have.

## Modules (in order of how many roles share them)

| # | Module | Status |
|---|---|---|
| 01 | [JavaScript](modules/01-javascript/README.md): 13 topics, runnable checks, practice questions, mock round | Done (26 Nov 2026) |
| 02 | [TypeScript](modules/02-typescript/README.md): 12 topics, compiler-checked examples, practice questions, mock round | Done (26 Nov 2026) |
| 03 | React / frontend | Not started |
| 04 | Node.js + REST APIs | Not started |
| 05 | Algorithms, data structures + testing | Not started |
| 06 | SQL / PostgreSQL | Not started |
| 07 | Python + FastAPI | Not started |
| 08 | Role-specific skills and tools: [08a Vercel + Next.js deployment](modules/08-vercel-nextjs-deployment/README.md) (done 25 Nov 2026) · AI response evaluation · AWS · Docker · VS Code and my coding tools | 08a done |
| 09 | Industry standards: checklists from a simple app to a large-scale app (security, testing, CI/CD, observability, accessibility, performance, data, scaling) | Not started |

## Roles

| Role | Platform | Status | Page |
|---|---|---|---|
| Vercel Specialist | micro1 | Interview pending (finish by 27 Nov, 8 pm WAT) | [roles/micro1-vercel-specialist.md](roles/micro1-vercel-specialist.md) |
| Software Engineer, Open Source Contributions | micro1 | Interview pending (finish by 27 Nov, 8 pm WAT) | [roles/micro1-open-source-contributions.md](roles/micro1-open-source-contributions.md) |

More role pages are added as roles come up. Older roles are still covered in `../interview-bank/study-guide.md`.

## Relationship to the rest of the repo
- **Replacing the old guide:** this folder will replace `interview-bank/study-guide.md`. As each module is built, the matching part of the old guide is checked against the docs and moved here. The old guide is retired once everything has moved.
- **Learning stays where it was:** `SYLLABUS.md` and the `lesson-NN/` folders are unchanged. They're where I write code; this folder is where I read and rehearse.
- **Privacy:** role pages include my rates, form answers and interview results. That's my choice for this public repo. No client names, emails or phone numbers go here.
