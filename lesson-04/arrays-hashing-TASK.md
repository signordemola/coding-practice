# Arrays and hashing (M8 timed drill, interview pull-in)

**Why:** the micro1 Senior Frontend interview (24 Nov 2026) gave an arrays-and-hashing coding exercise (counting / simulation). These come up in most platform coding tests.
**The one big idea:** a `Map` or `Set` is a lookup table. Checking it is O(1), so one pass through the array (O(n)) usually beats nested loops (O(n²)).
**You write all the code.** Codex and Copilot only ask questions and give hints in order (see `AGENTS.md`). No solutions in this repo.

## Rules
- Work through the parts in order. Remove the part's `{ todo: ... }` in `arrays-hashing.test.ts` when you start it.
- **Timed:** give each part 10–15 minutes, talking out loud as if in an interview: restate the problem, give an example, start simple, then improve.
- Before coding each part, write one line: the data structure you'll use and the time cost (Big-O) you expect.
- Don't edit the given expectations. Add your own tests in Part 8.

## Part 1: Count each service (frequency count)
`countServices(bookings)` returns a `Map` from service name to how many times it appears.

## Part 2: Any double booking? (duplicates)
`hasDuplicate(ids)` returns `true` if any id appears more than once.

## Part 3: Group bookings by date
`groupByDate(bookings)` returns a `Map` from date to the bookings on that date, keeping their original order.

## Part 4: Two services that add up to a gift card (two-sum)
`twoSum(prices, target)` returns the indexes `[i, j]` (with `i < j`) of two prices that add up to `target`, or `null` if none do. If several pairs work, return the one whose second index `j` is smallest.

## Part 5: Most booked services (top K)
`topK(bookings, k)` returns the `k` most frequent services, most frequent first. Ties: the service that appears **first** in the input comes first.

## Part 6: First one-time client
`firstUnique(ids)` returns the first id that appears exactly once, or `null`.

## Part 7: Process booking requests (simulation)
`processRequests(requests)` goes through slot requests in order. The first request for a slot is `"accepted"`; any later request for the same slot is `"rejected"`. Return the results in order.

## Part 8: Your own edge cases
Add at least two tests nobody gave you: empty input, one item, all the same, very large input, ids that look alike (`1` vs `"1"`).

## Done when
- All parts pass with no `todo` left, and `pnpm check` is green.
- For each part you can say, without looking: the data structure, why, and the Big-O.
- One spoken answer: "Why is a `Map` better than a plain object for counting?" Scored with the rubric in `AGENTS.md`.
