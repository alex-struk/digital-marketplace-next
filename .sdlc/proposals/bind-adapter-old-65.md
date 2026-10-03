---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I fixed the R-7.29 finding."
opened: 2026-10-03T02:08:57.101Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I fixed the R-7.29 finding.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I fixed the R-7.29 finding. Both instructions pages now read only the embedded instructions body, and `visibleToEvaluatorsOnly` has its own reader. I checked the new reading logic by running it in the browser on the target. I could not type-check the file: every attempt to run `tsc` was refused as needing approval.

**What was wrong.** On `evaluation-instructions-swu` and `evaluation-instructions-twu`, both `instructionsBody` and `visibleToEvaluatorsOnly` called the same whole-page read. That read returned the left menu, the opportunity heading, dates, status and owner along with the instructions text. So a test that expects an empty body when the instructions page can't be read could never pass.

**What the page shows.** I signed in through the government session route and opened both seeded closed opportunities on `?tab=instructions`. The content column has three parts, in this order:
- a header: the "Sprint With Us: …" or "Team With Us: …" heading, the published and updated dates, then "Status" and "Created By";
- the embedded page, rendered as "Initial version". That matches the body `/api/content/<program>-evaluation-instructions` returns for both programs;
- a "Begin Evaluation" link to the Evaluation tab.

**`instructionsBody` now:**
- finds the opportunity heading by role and goes up to the header block holding the "Status" label (or, failing that, the block just below the one holding "Begin Evaluation");
- returns the text of whatever follows the header in that column, skipping any block that is only a link to another tab of the same screen;
- returns empty when that region has nothing in it, which is the case R-7.29 checks;
- also returns empty when the reader gets "Not Found" or ends up somewhere other than the Instructions tab. I opened the page as a vendor and it answers "Not Found", so a refused reader sees no instructions;
- throws `unbound:` only when the Instructions tab is open but has no opportunity heading or header to anchor on.

Run in the browser on the Sprint With Us opportunity, this logic returned exactly "Initial version". The Team With Us page has the same structure.

**`visibleToEvaluatorsOnly` now** reads the "Instructions" link in the left menu (the one pointing at `tab=instructions`). It returns the link's name when the reader is shown it, and empty when not: "Not Found" for a vendor, no such link otherwise. The contract places this observation on that tab. An administrator, opened on the same page, also sees the tab and the body.

`bindings.yaml` needed no change: both observations on both pages stay `bound`, spelled as in the contract. I touched nothing outside `tests/adapters/old/`. Every route involved resolved on the target, and I wrote no secret or environment value into any file.
