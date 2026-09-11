---
gate: G-POL
question: "Correct the three turn budgets the runner cannot honour?"
recommendation: "Yes: bind-adapter 999, build 400, review 200. policy-v5 set bind-adapter to 1200, which the runner reads as a token budget and ignores, so the stage ran with the 40-turn default and hit its cap; 999 is the largest value that is readable as a turn count. build 3000000 and review 1000000 are the pre-migration leftovers policy-v3's third condition said would be converted in a proposal of their own."
opened: 2026-09-11T02:45:15.175Z
---

# Correct the three turn budgets the runner cannot honour?

**Recommendation.** Yes: bind-adapter 999, build 400, review 200. policy-v5 set bind-adapter to 1200, which the runner reads as a token budget and ignores, so the stage ran with the 40-turn default and hit its cap; 999 is the largest value that is readable as a turn count. build 3000000 and review 1000000 are the pre-migration leftovers policy-v3's third condition said would be converted in a proposal of their own.

Why this proposal exists. policy-v5 was approved on evidence that was correct about the problem and wrong about the remedy: the stage had genuinely exhausted its budget, but 1200 is not a number the runner can act on. agentic-sdlc 2d9585e makes that refusable rather than silent - checks now fails on any budget at or above 1000, and the runner honours an accepted budget as written rather than halving it at 400 as it used to. This project's checks fail on all three values today, which is the new check doing its job. Sizing. bind-adapter: the surface is 79 pages and 680 actions and observations; 999 turns is about 1.5 per member including navigation, and is the ceiling rather than an estimate, because no larger number is expressible. If 999 is not enough the answer is to split the stage, not to raise the cap again. build and review: neither stage is implemented yet, so these are placeholders chosen to be fail-closed rather than measured; both are raised by the same one-line route once a real run has a turn count to cite.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead

Every load-bearing claim verifies in this repo: journal 059 ends at 41 turns with error_max_turns, which is the 40-turn default and proves 1200 was discarded rather than honoured, while journal 058 ended at 201 against a 200 cap, showing sub-threshold budgets are applied as written; tests/generated/surface.d.ts declares 79 page interfaces and 761 method members, i.e. 680 actions and observations once the 79 open() navigators and two session members are excluded, matching the cited surface exactly, so at roughly 1.5 turns per member 999 is the expressible ceiling rather than padded headroom. The build and review conversions are the separate proposal policy-v3's third condition required and policy-v5 recorded as still unmet, and they tighten a dead unit into a fail-closed turn count rather than loosening anything. Scope matches the evidence: one config line plus the proposal page and run record, with gates, rungs, triage, egress and the skills lockfile untouched. constitution.md is not in the diff so no platform article changes and that escalation trigger does not fire; tier is STANDARD and no stage confidence below threshold is reported. The five check warnings are pre-existing superseded-requirement warnings on tests this diff does not touch. The pipeline-side claims about the 1000 threshold could not be checked here and the lockfile pins b7f642f rather than the cited 2d9585e, but the 41-turn run evidences the same behaviour from this project's side, so the gap does not touch the change.

**Conditions:**
- policy-v5's first condition is still unmet and carries forward: the policy-v5 proposal page still reads 'as did the run before it' and has not been amended since its ruling. Journal 057 failed at one turn and zero cost on an expired OAuth session, an authentication failure and not a cap hit, and the page is corrected to say so before the next budget proposal is opened.
- The next bind-adapter run under 999 reports how many of the 680 members it bound before it ended, whether or not it hits the cap, so the split-or-raise decision has measured data. If 999 is exhausted, the answer is the stage split this proposal commits to; a further raise argued from the same 1.5-turns-per-member estimate will be returned.
- build 400 and review 200 are unmeasured placeholders and are acknowledged as such. Either is raised only by its own one-line proposal citing a real run's turn count, never folded into a bind-adapter budget change.
