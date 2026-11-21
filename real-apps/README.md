# Real apps

Generic notes on the production apps I've built for clients. They are the anchor for the whole syllabus: every concept should connect back to something I actually built, debugged or would fix.

| File | App | Main tracks |
| --- | --- | --- |
| `app-1-studio-booking.md` | Booking app for a studio: services, slots, deposits, balances, reminders, staff admin | B, C, D, E, F, H |
| `app-2-community.md` | Community app: posts, replies, votes, moderation, feeds | B, C, D, F, G, H, J |

## Codex's role with these files
1. **Interviewer.** Each session, ask one practice question from these files. Push for full spoken answers in the Trigger → Data → Processing → External → Failure → Trade-off order, with real detail.
2. **Teacher.** When a "gap to check" appears, teach the concept behind it from official docs (the matching syllabus module), then show how the fix would look in a generic example.
3. **Bug-hunt author.** Turn the gaps into bug-hunt exercises (Track R): a small, realistic file with the same class of bug, in a new generic setting. Never copy client code.
4. **Comparer.** Ask cross-app questions, for example: "App 1 uses a date library and App 2 uses `Intl` only. When would you pick each?" or "Both apps prevent duplicates. Compare the two approaches."
5. **Honest-gaps coach.** Train me to talk about weaknesses well: "here's the gap, why it exists, the risk, and how I'd fix it". Never present a planned feature as live.

## Rules (this repo is public)
- No client names, brands, domains, prices, limits, emails or code. Describe patterns in my own words.
- Don't phrase gaps as "my live app has this bug". Phrase them as "gaps to check in any app like this".
- Real facts only. If these notes don't say something, ask me rather than inventing it.

## Adding another app
Create `app-N-<type>.md` with the same sections: Stack · one section per main flow (Trigger → Data → Processing → External → Failure → Trade-off) · Gaps to check · Practice questions. Then add it to the table above and link its gaps to syllabus modules.
