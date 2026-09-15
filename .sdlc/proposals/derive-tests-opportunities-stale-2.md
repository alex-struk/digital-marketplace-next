---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I rewrote the tests for all 11 opportunities criteria, and none of them went to `not-testable.yaml`."
opened: 2026-09-15T05:39:59.568Z
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote the tests for all 11 opportunities criteria, and none of them went to `not-testable.yaml`.

I rewrote the tests for all 11 opportunities criteria, and none of them went to `not-testable.yaml`. I couldn't run or typecheck any of it: there's no adapter or target here, and no TypeScript compiler installed. What I did check is that the 11 files contain nothing the separation check refuses (no selector, locator, route or raw address).

**What changed and why.** Every file had been written against an older spec version, so all 11 now carry the new header. Nine of them had redo notes, and I followed those:

- **R-1.10, R-1.11, R-1.12, R-1.14 (form validation):** a rejection now means nothing was published. Each test reads the open opportunities before the attempt, waits five seconds, and requires the list to be unchanged. If the form won't even offer publishing, that also counts as refused. A reason is only required in R-1.10, and only where a value was too long; the test waits for it rather than reading it at once. No reason is required for a field left blank, or in the other three files. Dates are now counted in Pacific time, so "yesterday" can't slip into "today" depending on the machine's clock.
- **R-1.3 and R-1.21:** these no longer depend on a permissions statement that ordinary staff aren't shown. "Not an administrator" is now read from the account type on the person's own profile, which needs no id.
- **R-1.21:** also waits for "incomplete" on the tab where the draft is managed. That tab is my best guess at where the message appears. The other half — not naming the missing field — can't be checked there, because the tab shows the form's own labels, including "Location".
- **R-1.24:** before triggering closure, it now confirms the administrator can open each opportunity and two proponents can open their own proposals. The third proposal belongs to an account no persona signs in as.
- **R-1.39:** after each filter, it keeps re-reading the list until the expected item is there and the excluded one is gone in the same reading.
- **R-1.55:** starts from the fact, recorded in two evaluation tests from this same spec version, that a new draft lists its creator as chair. From there it builds each faulty panel exactly, for both Sprint With Us and Team With Us (10 tests). A panel the form won't let you assemble counts as refused, and the panel must read the same afterwards. The duplicate-member case must always show its reason. The Team With Us draft gets a resource before saving, and the test requires the draft to have an id before touching the panel.

Two criteria changed version:

- **R-1.1 (v3):** the announcement test now looks for a message naming the closed opportunity sent to any of the panel's evaluators. The observables notes say messages sent at closure never arrived on the reference target, so this test is expected to fail there. That failure would be a real finding, not a broken test.
- **R-1.17 (v2):** no test enters a question position any more. I added one test that a 101st question is refused, and one that questions are listed in the order they were added. The 101st-question test adds 100 questions through the form, so it has a 20-minute timeout.

**Parts of criteria the tests don't reach:**

- **R-1.1, Code With Us:** no Code With Us opportunity past its deadline is seeded, so the author announcement is never exercised. Its author is also an evaluator on both seeded panels, so a message to evaluators can't be told apart from one to the author.
- **R-1.1, other evaluators:** evaluators other than the one visibly addressed may be blind copies, which `mail` can't read.
- **R-1.14:** only the proposal deadline can be checked for 4:00 p.m.; no observation returns the assignment, start or completion date.
- **R-1.55, two chairs:** no observation names that reason. The test rests on the panel never being saved with two chairs.

**Contract additions that would close those gaps:**

- **R-1.1:** a seeded Code With Us opportunity past its deadline with a submitted proposal, and a `mail` accessor that reads one message's To and Bcc.
- **R-1.21:** an observation on `opportunity-cwu-edit` (and its Sprint With Us and Team With Us siblings) for the message shown when submitting for review is refused.
- **R-1.14:** observations of the assignment, start and completion dates on the opportunity views.
- **R-1.55:** a two-chairs error on `evaluation-panel-swu` and `evaluation-panel-twu`.
- **R-1.3 and R-1.21:** a clear administrator-rights observation on `user-profile-self`, so this doesn't rest on how the account type is worded.
