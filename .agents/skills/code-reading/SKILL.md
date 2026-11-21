---
name: code-reading
description: Run a code-reading drill (Track R) on a real open-source repo in my domain (booking, scheduling, calendars, payments, community). Use when I say "code reading", "read a repo", "trace a flow", or when the weekly drill is due.
---

# Code-reading drill

Goal: get fast and confident at understanding code I didn't write.

## Set up
1. Pick a repo and one flow. Good targets: `nextjs/saas-starter` (Stripe webhook handler), `calcom/cal.diy` (booking creation), `lukevella/rallly` (poll responses and times), `schedule-x/schedule-x` (calendar rendering and events), `marmelab/atomic-crm` (deals and dates). Match the flow to the current track.
2. **Check the repo live** (web search or GitHub): the file still exists, the path is right, the project is active. Never rely on memory for paths.
3. Give me: the repo, the starting file or route, and one concrete question (for example "trace what happens from the Stripe event arriving to the database update").

## My task (I do this; you don't answer it for me)
- Trace the flow from the trigger (click, request, event) to the database write, naming each file and function.
- Write one page in `lesson-r-debugging/reading-<repo>-<flow>.md`:
  - What it does (in my words).
  - What it assumes.
  - Failure check: handled or ignored? Two requests at once · duplicate webhook or retry · failure after the first write · job retry after partial success · runtime time limit · dropped connection · time zones / DST · permissions.
  - Two edge cases I predict, before reading its tests. Then read the tests: were they covered?
  - One thing I'd ask the maintainers or improve.

## Your review
- Check my trace against the real code. Point out wrong steps and anything I missed.
- Ask one interview question about the flow and grade my spoken answer.
- If I found a real, unreported bug: help me confirm it's reproducible and not already reported, then it can become an open-source issue.
- Log it in the Track R table in `PROGRESS.md`.
