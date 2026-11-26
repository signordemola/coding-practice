# Mercor — Applied Engineer, Evaluations Role

**Pay (from the listing):** $100–120/hr. Talent network, remote, independent contractor, own schedule. Paid weekly through Stripe or Wise. The listing names no location limit; it says Mercor can't support H-1B or STEM OPT candidates. **Status:** application 2 of 4 steps done (checked 26 Nov 2026): resume ✓, work authorization ✓. **Left:** General Interview and "Open source contributor". **Deadline:** none shown.

The public link for this listing (`list_AAABlzI3p6G_LDaGWuNNEa6l`) used to be called "Open Source Applied Engineer Talent Network". Same listing, new title.

## What the work is (from the listing)

You build evaluations for AI coding agents (the listing names Claude Code and Codex):

1. Find repositories with enough real work in them, and pick completed pull requests.
2. Study each problem, its reference solution, and the repo's architecture, tests and conventions.
3. Write the task prompt and build the evaluation: automated tests, shell commands, and LLM grading prompts.
4. Check the evaluation against the reference solution **and** against deliberately wrong solutions. Find missing checks, wrong grades, and criteria that only accept one way of solving it.
5. Run it many times across models and harnesses. When an agent fails, work out whether the cause is the agent's code, the environment or the grading.
6. Improve it through review, and write down findings and grading decisions.

**What they want:**
- Strong programming fundamentals and real experience in large, complex codebases. Languages they write evals for include TypeScript/JavaScript, Python, Java, Kotlin, Go, Ruby, PHP, C++ and Rust.
- Reading unfamiliar code, and judging whether two different implementations both solve the problem.
- Writing meaningful tests, including edge cases and regression tests.
- Patience for repeated investigation.
- Practical use of AI coding tools, with the judgment to check their output and catch mistakes.
- Git, test runners, CI.
- Clear written and spoken English; owning a task and asking when requirements are unclear.
- The listing says experience can come from open-source, private or company repos, and that learning a repo and judging well matters more than a big public contribution history.

## Why it fits (real facts only)

- TypeScript and Python are on their list; I work in both.
- Tests: my open-source booking engine is written tests-first with Vitest, strict TypeScript and CI on two Node versions.
- Reading code and reviewing AI output: I use AI coding tools daily and check what they produce; my micro1 certification is in evaluating AI responses.
- Open source: one open pull request to schedule-x (#1393), plus my own public repos.
- Gaps to be honest about: I haven't contributed to big open-source projects, and I haven't built evaluation harnesses before.

## Step 1: General Interview (Mercor AI interview)

**Format, from Mercor's help pages** ([AI interview FAQ](https://talent.docs.mercor.com/support/ai-interview), [prepare for your AI interview](https://talent.docs.mercor.com/how-to/prepare-for-ai-interview), read 26 Nov 2026):
- Spoken interview with Mercor's AI; it asks follow-ups based on your answers and your resume. Most interviews take about **20 minutes**.
- You only take each interview once; the result is reused by every application that needs it.
- **Practice Interview:** free, unlimited, not shared with companies. Do one first.
- **Retakes:** up to 3 in total, but hiring managers can see your retake count, and a retake resets the application's progress. Mercor asks you to save retakes for technical problems.
- Chrome (latest). Camera and mic on, full face visible, quiet room; headphones recommended. Screen sharing may be required (whole screen only).
- If the AI interrupts during a pause, you can say you weren't finished. Keep answers brief; long silences make it jump in.
- **AI tool rule:** grammar and wording checks are allowed. Don't use an LLM to write your answers, rate model outputs, write explanations, or evaluate code.

**What it will probably ask (my guess from the listing, not official):** the projects on your CV, how you test, how you debug, how you review code, how you use AI tools and catch their mistakes.

**Answers to prepare (60–90 seconds each, in your own words):**

1. **"Walk me through a project."** Trigger → data → processing → external services → failure cases → trade-off. Use the booking flow (form → server validation → database → Stripe → webhook with signature check and duplicate handling → email → scheduled reminder).
2. **"How do you test?"** Tests first for the rules that can't break (no double booking, money in minor units, time zones), unit tests for pure logic, a regression test for every bug fixed, CI on every push. See the testing section of the [Open Source role page](micro1-open-source-contributions.md#4-software-testing-questions).
3. **"A bug you found and fixed."** Cause → how you reproduced it → fix → the test that proves it. **[YOU FILL]** with a real one.
4. **"How do you use AI coding tools?"** For research, first drafts and explaining unfamiliar code; then you read every line, run the tests, and check against the official docs. One real example where the tool was wrong and how you caught it. **[YOU FILL]**
5. **"Two solutions both pass the tests. Are they both correct?"** Not necessarily: tests can miss cases. Check edge cases (empty, duplicates, time zones, concurrency), behaviour the tests don't cover, side effects, and performance. If one is wrong, add the missing test.
6. **"How would you judge whether a grading test is fair?"** It should fail a wrong solution, pass every correct one (not only the reference's exact style), test behaviour not implementation details, and be deterministic (no reliance on time, randomness or network).

## Step 2: "Open source contributor"

I couldn't see what this step contains without opening it. It's probably questions or a form about your open-source work. Prepare:
- **Links:** github.com/signordemola, the booking-engine repo, the schedule-x PR #1393.
- **The schedule-x PR in 3 sentences:** what was broken (the custom event modal didn't reposition when its size changed), how you reproduced it, why your change is small and safe. Say it's still open, waiting for review. Don't call it merged.
- **Your booking-engine in 3 sentences:** what it does, how it's tested, one design decision (integer minor units, half-up rounding).
- Don't claim "extensive" open-source work. Say what's true.

## Practice for the work itself (optional, when you have time)

- Pick a small closed PR in a TypeScript repo you know (schedule-x is fine). Without looking at the fix: read the issue, write a test that fails before the fix and passes after. Then try a deliberately wrong fix: does your test catch it?
- Study: [JS 13: explaining flows](../modules/01-javascript/13-explain-flows.md), [TS module](../modules/02-typescript/README.md), module 05 (testing) once it's built.

## Checklist

- [ ] Practice Interview done once on Mercor
- [ ] Answers 1–6 practised out loud
- [ ] Links and PR summary ready for the Open source contributor step
- [ ] Camera, mic, Chrome, quiet room checked
