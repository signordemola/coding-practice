---
name: session
description: Run one study session in the coding-practice repo, following PROGRESS.md and the learning loop in SYLLABUS.md. Use when I say "start", "session", "let's study", "next lesson" or "continue". Not for weekly reviews (use weekly-review) or a standalone bug hunt or code-reading drill.
---

# Study session

Goal of every session: I understand one main module well enough to build it, break it, fix it and explain it out loud, plus one Track A module, with my weak spots re-tested from memory.

## 0. Prepare (silently)
- Read `PROGRESS.md`, the relevant section of `SYLLABUS.md`, and the `real-apps/` file(s) linked to today's module.
- Check `node -v` if the module needs Temporal (Node 26+).

## 1. Open (3 lines)
Say: where we are, today's plan (main module + Track A module), what's due in the review queue, and which Track R practice is due this week. Then follow that plan.

## 2. Review queue (from memory)
Ask 2–3 questions on modules due today or marked Shaky. No notes. Grade Solid / Shaky / Not done. Reschedule: next gap about 1 → 3 → 7 → 21 days; back to 1 day if Shaky.

## 3. Teach the main module (learning loop)
1. **Explain back first:** ask me what I already think the idea is. Correct gaps.
2. **Learn:** open the official docs page, then cover:
   - the idea in plain English (stack-agnostic first)
   - a short TypeScript example
   - where it shows up in real apps and in interviews
   - where it appears in `real-apps/` (or say it doesn't)
   - the common trap
   - "Say:" 1–2 sentences I could use in an interview
   - official links used
3. **Break:** show a short snippet with a realistic bug in this module's area. I find it, give the root cause in one sentence, and fix it with a test. Don't hint for the first few minutes.
4. **Build:** create the exercise pair in the right folder (`<name>.ts` + `<name>-TASK.md`, acceptance checks, verify commands). Booking, payments or community-app example. I write the solution.
5. **Speak:** one interview question answered out loud in full sentences, using the Trigger → Data → Processing → External → Failure → Trade-off order (or the bug-story order for a bug: symptom → reproduction → hypothesis → evidence → root cause → fix → test → prevention). My answers tend to be too short: push for detail and one real example.

## 4. Track A module
Shorter: explain back → teach with an app example → 2 check questions → a small exercise if useful.

## 5. Check-in
3 interview-style questions on today's modules + 1 real-app question from `real-apps/` (or a STAR question using real work only). One at a time; wait for each answer. Grade Solid / Shaky / Not done and show what a strong spoken answer would add.

## 6. Track R slot (if due this week)
- Postmortem: give me one public postmortem or bug write-up relevant to the current track. I write 5 lines: trigger, root cause, fix, lesson, where it could happen in my apps. Check it.
- Open-source issue (every 2–3 weeks): help me find a fresh issue in my domain (no assignee, no linked PR, checked live) and plan the reproduction. I fix it and open the PR myself.
- Bug hunts and code reading use their own skills (`$bug-hunt`, `$code-reading`).

## 7. Review my build (when I say it's done)
What works, bugs, edge cases I missed, improvements. Run the type-check and the file.

## 8. Close
Run the "Done means" checklist in `AGENTS.md`. List the files you changed. Tell me what's next session in one line.
