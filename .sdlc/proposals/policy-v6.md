---
gate: G-POL
question: "Correct the three turn budgets the runner cannot honour?"
recommendation: "Yes: bind-adapter 999, build 400, review 200. policy-v5 set bind-adapter to 1200, which the runner reads as a token budget and ignores, so the stage ran with the 40-turn default and hit its cap; 999 is the largest value that is readable as a turn count. build 3000000 and review 1000000 are the pre-migration leftovers policy-v3's third condition said would be converted in a proposal of their own."
opened: 2026-09-11T02:45:15.175Z
---

# Correct the three turn budgets the runner cannot honour?

**Recommendation.** Yes: bind-adapter 999, build 400, review 200. policy-v5 set bind-adapter to 1200, which the runner reads as a token budget and ignores, so the stage ran with the 40-turn default and hit its cap; 999 is the largest value that is readable as a turn count. build 3000000 and review 1000000 are the pre-migration leftovers policy-v3's third condition said would be converted in a proposal of their own.

Why this proposal exists. policy-v5 was approved on evidence that was correct about the problem and wrong about the remedy: the stage had genuinely exhausted its budget, but 1200 is not a number the runner can act on. agentic-sdlc 2d9585e makes that refusable rather than silent - checks now fails on any budget at or above 1000, and the runner honours an accepted budget as written rather than halving it at 400 as it used to. This project's checks fail on all three values today, which is the new check doing its job. Sizing. bind-adapter: the surface is 79 pages and 680 actions and observations; 999 turns is about 1.5 per member including navigation, and is the ceiling rather than an estimate, because no larger number is expressible. If 999 is not enough the answer is to split the stage, not to raise the cap again. build and review: neither stage is implemented yet, so these are placeholders chosen to be fail-closed rather than measured; both are raised by the same one-line route once a real run has a turn count to cite.
