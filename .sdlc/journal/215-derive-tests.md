---
stage: "derive-tests"
title: "derive tests"
at: "2026-09-29T00:17:30.426Z"
cost: 0.5172628
turns: 15
session: "7dab0e7d-ad86-408b-8d36-b8407dc7777a"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

I rewrote the R-5.13 test (v1) in `tests/acceptance/evaluation/R-5.13.spec.ts`. That was the only criterion in this run, so one criterion got a test and none went to `not-testable.yaml`. I couldn't run the type check: the command needed approval and no one was there to give it. The test uses only calls that already type-check in the existing R-1.41 test, so I don't expect errors, but it hasn't been compiled or run.

**What was wrong with the old test.** The ruling said the old test failed while reading a proposal's history before it ever tried to finalise. That was true. The old test counted history entries on all three proposals as a stand-in for "no proponent was screened in or out". It also had a second case where the chair saved a draft consensus before the attempt. Neither step is part of the criterion, so I dropped both, along with the attempt from the opportunity's management screen.

**What the new test does.** It has one test, titled with the criterion's own words, because the criterion states one outcome:

- **Starting state:** the seeded opportunity `seed.opportunities.swuConsensusOneOutstanding`. It is at consensus, the chair's consensus is submitted for the first two proponents, and nothing has been started for the third, who is still under review.
- **Attempt:** it signs in as `persona.administrator`, reads the opportunity's status, then tries to finalise from `evaluationConsensusListSwu` using `finalizeConsensusScores()` followed by `confirmFinalizeConsensus()`. If the screen won't offer or confirm the finalise, that counts as a refusal, not a test failure.
- **Check:** after a five-second pause, `opportunitySwuView.status()` must read the same as before the attempt.

**Choices worth knowing about:**
- **No error-message check.** The criterion says only "refused", not that a message appears. Requiring `notAllConsensusesSubmittedError()` would fail an app that refuses by simply not offering the finalise.
- **No per-proposal check.** The "so that no proponent is left neither screened in nor screened out" clause is the reason for the rule, not a separate outcome. The only per-proposal observation is the history the ruling objected to, so I didn't add a `not-testable.yaml` entry for that clause.
- **Weakness:** because the check is "status unchanged", a finalise button that does nothing at all would also pass. Nothing in the criterion gives a control case to rule that out.

**Missing surface:** none. The contract had everything this test needed. I changed nothing outside `tests/acceptance`.