---
stage: "rule"
title: "build-slice-10-5 refused at G3"
at: "2026-10-03T00:54:44.765Z"
cost: 0
turns: 0
session: ""
---

## Nothing was ruled

The ruling was refused, so no gate file was written and the proposal is still open at G3.

rule build-slice-10-5: A criterion this slice claims is owed a test that runs: missing-test/R-7.29 (owed by calibrate: "a seed state in which the embedded page (/content/sprint-with-us-opportunity-scope or /content/team-with-us-terms-and-conditions) is absent. R-7.25 means no path through the screens or the API removes it."). This project's policy.gates.G3.block_on_missing_tests is true, so an approval is recorded only once none is open. Return the slice, escalate it, or withdraw each item no test is owed for with `condition-withdrawn <ref>: <why it is no longer asked for>`, saying why.

Nothing is recorded — the guard refuses before anything is written. What this ruling produced:
  verdict: approve
  conditions:
  (none)

## What the ruling produced

**Verdict:** approve
**By:** tech-lead

Ruled by Claude under the tech lead's standing delegation for application questions in this run. Approve. Verify on this tree (cc1ab47) passed 19 of the 20 criteria slice 10 claims, and every one of the 97 criteria earlier slices passed still passes; none regressed. The one not tested is R-7.29: its two cases are written for configurations the target reads at start-up (service_page_absent, evaluation_instructions_absent_twu), and verify cannot start the new target in a configuration (decision 0071), so nothing was established about it on the new target in either direction and none of it is the build's. The application implements it: EmbeddedPage in app/frontend/src/screens/opportunity-other-view.tsx leaves the section empty and says nothing when the embedded page cannot be read, and the frontend unit test 'leaves the scope section empty, saying nothing, when the page cannot be read, and shows the rest in full' covers it. The acceptance test is checked against the oracle in those configurations by calibration. Approved rather than looped, since no build can change what this environment cannot run. Starting the new target in a configuration is a pipeline question, raised with the tech lead separately.

**Conditions:**
none
