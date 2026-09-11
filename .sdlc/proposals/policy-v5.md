---
gate: G-POL
question: "Raise the bind-adapter turn budget from 200?"
recommendation: "Yes: bind-adapter 1200. The 2026-09-10 19:29 run hit the cap (error_max_turns) with nothing committed, as did the run before it. tests/generated/surface.d.ts and the returned adapter's own bindings file put the surface at 79 pages and 680 actions and observations; 200 turns is 3.4 members per turn including navigation, which no browser session can meet."
opened: 2026-09-11T02:31:01.327Z
---

# Raise the bind-adapter turn budget from 200?

**Recommendation.** Yes: bind-adapter 1200. The 2026-09-10 19:29 run hit the cap (error_max_turns) with nothing committed, as did the run before it. tests/generated/surface.d.ts and the returned adapter's own bindings file put the surface at 79 pages and 680 actions and observations; 200 turns is 3.4 members per turn including navigation, which no browser session can meet.

Evidence. .sdlc/runs/2026-09-11.md records two bind-adapter failures, the second reported by the runner as error_max_turns. The returned proposal returned/bind-adapter-old carries tests/adapters/old/bindings.yaml naming every page, action and observation of the contract exactly once: 79 pages, 680 members. Resume is not a route: the stage's workspace is a fresh archive each run, and sdlc resume answers 'cannot continue a blind-adapter stage; run it again'. So the budget is the only lever. Sizing. Binding a member means opening its page, finding the control by role or label, and writing the method. At roughly 1.5 turns per member plus per-page navigation, 680 members needs of the order of 1000 turns; 1200 is that with headroom and is still a fail-closed cap rather than an open budget. Precedent. policy-v3's second condition set exactly this route: a cap found too low is raised by a one-line proposal citing the run that hit it, not by an in-flight edit to config.yaml. No other budget moves.

## Ruling

**Verdict:** approve
**By:** agent:tech-lead

Evidence verifies against the repo: journal 058 records the bind-adapter run ending at 201 turns against the 200 cap with error_max_turns and nothing committed, and tests/generated/surface.d.ts declares exactly 79 page interfaces and 680 actions and observations once the 79 open() navigation members and the two Surface session members are excluded, matching the cited figure. At 200 turns that is 3.4 members per turn before navigation, so the stage cannot complete; at roughly 1.5 turns per member the 680 members need on the order of 1000 turns, making 1200 headroom on a cap that stays fail-closed rather than an open budget. The route was pre-authorised by policy-v3's second condition, which requires a cap found too low to be raised by a one-line proposal citing the run that hit it rather than by an in-flight config edit. The diff is smaller than the reason for it and nothing beyond the evidence moves: bind-adapter is the only budget changed, and gates, rungs, triage, egress and the skills lockfile are untouched. constitution.md is not in the diff, so no platform article changes and the escalation trigger for platform articles does not fire; tier is STANDARD and no stage confidence below threshold is reported. The five check warnings are pre-existing superseded-requirement warnings on acceptance tests this diff does not touch. One corroborating claim fails verification: the preceding run (journal 057) failed at one turn and zero cost on an expired OAuth session, an authentication failure, not a second cap hit. That does not touch the claim the change rests on, so it is corrected by condition rather than by return.

**Conditions:**
- Correct the record on the preceding run: journal 057 failed at one turn on an expired OAuth session, an authentication failure and not a second error_max_turns. The proposal page and any run record wording that calls it a cap hit are amended to say so, since a miscounted cap hit inflates the evidence for the next raise.
- If a bind-adapter run reaches 1200 turns, the next proposal cites measured turns per member from that run's own transcript rather than the 1.5 estimate used here, and reports how many of the 680 members were bound before the cap. A second raise argued from the same estimate will be returned.
- policy-v3's third condition still stands unmet: build 3000000 and review 1000000 remain in the pre-migration unit and are converted in a proposal of their own, not folded into a later bind-adapter budget change.
