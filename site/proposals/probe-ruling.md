| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-06T16:16:32.331Z |
| holder | agent:reviewer |

# Does the probe prove the runner?

**Recommendation.** Yes: the isolated session created app/PROBE.md and the post-check passed.



## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether the probe proves the runner, and it does on independently verified evidence rather than on the receipt's assertion: app/PROBE.md exists on main via commit f30c8ac with contents exactly as described (2026-09-06 / 'the runner works'), and .sdlc/journal/001-probe.md attests provenance with session c74ea0cb, cost 0.224672 and 2 turns, matching the run-log line 'run probe: ok, cost 0.224672, turns 2' for the same execution. The receipt also states what could not be checked, flagging that the date came from the session's stated current date rather than a clock read and scoping that caveat to clock-behaviour use, which this probe is not. All four checks (config, layout, constitution, egress) are green and were generated today at 09:16, so none are stale; the diff touches only .sdlc/proposals/probe-ruling.md and one appended run-log line, reaching no application code or protected path. Tier is STANDARD, no residual risk is left unaccepted, and this is the first agent-held ruling against human_sample_per_week: 5, so no escalation trigger fires. One overstatement does not reach the evidence-only refusal but is recorded as a condition: the recommendation's clause 'the post-check passed' has no recorded post-check result behind it anywhere in .sdlc — run-state.json is left at phase 'post-checks' for stage 'probe', which is a phase marker rather than an outcome, so that clause rests on 'run probe: ok' alone while the load-bearing claim about the isolated session is fully checkable.

**Conditions:**
- Record the post-check as a result artifact naming what it asserted and what it returned, rather than leaving run-state.json at phase 'post-checks' as the only trace; 'the post-check passed' currently rests on the run-log's 'run probe: ok' alone.
- Advance or close run-state.json for the probe run so a stalled phase marker is not later read as an in-flight run.
- Future evidence receipts state only what a named check covers, keeping verified claims and inferred ones distinct in the recommendation line.
- Carry forward the receipt's own caveat that the probe establishes runner liveness only, not clock behaviour, so it is not cited later as evidence of the latter.
