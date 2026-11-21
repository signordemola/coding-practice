---
name: bug-hunt
description: Create or grade a bug-hunt exercise (Track R) in lesson-r-debugging/. Use when I say "bug hunt", "give me a bug", "debugging drill", or when a bug hunt is due this week. Not for teaching a new module.
---

# Bug hunt

Goal: practise the real debugging loop on realistic code: reproduce → failing test → root cause in one sentence → smallest fix → explain.

## Create
1. Pick the bug class: from the "gaps to check" in `real-apps/` and the module taught most recently (time, double booking, duplicates, webhooks, jobs, caching, auth, ranking). Prefer classes I graded Shaky.
2. Write `lesson-r-debugging/<name>.ts`: 40–120 lines of realistic, generic code (a salon booking service, a payment webhook handler, a community feed). Plant 1–3 bugs that come from real-world causes, not typos. It must type-check under `--strict` and run.
3. Write `lesson-r-debugging/<name>-TASK.md` with:
   - **Symptom only**, as a user or support ticket would report it. Never name the cause or the line.
   - How to run it, and what "fixed" looks like (acceptance checks).
   - Rules: 20 minutes, no hints unless I ask; write a failing test (a small assertion script is fine) before fixing.
4. Keep the answer out of the repo. Record the planted bugs only in your head for this chat, or in the session note after I finish.

## Grade (when I say I'm done or stuck)
- Reproduced it? Failing test before the fix? Root cause in one sentence? Smallest correct fix? Any new bug introduced? Explained it in the bug-story order (symptom → reproduction → hypothesis → evidence → root cause → fix → test → prevention)?
- If I'm stuck: give one hint at a time, starting with "where to look", never the fix.
- Then reveal any bug I missed and why it matters in a real app.
- Log it in the Track R table in `PROGRESS.md` (date, type, what, result, notes).
