| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-03T02:08:57.101Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

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

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the old adapter bind every surface action and observation on the two evaluation-instructions pages, and nothing else? Ruling: approve. The diff touches only tests/adapters/old/index.ts; nothing under tests/acceptance changed and bindings.yaml is unchanged. It fixes what calibration flagged for R-7.29 (adapter-wrong: instructionsBody and visibleToEvaluatorsOnly both read the whole content column, so the left menu, header, dates and status leaked into the instructions body and an empty body could never be observed). instructionsBody now anchors on the opportunity heading, finds the header block carrying the 'Status' label (falling back to the block above the one holding 'Begin Evaluation'), and returns only the text after that header, skipping blocks that are just links to another tab of the same screen. So a missing or unreadable embedded page reads as empty, which is what R-7.29's 'scope section is empty' clause needs. It returns empty when the reader is refused ('Not Found') or is not on the Instructions tab, and throws unbound only when the tab is open but has no header to anchor on, which is a real binding failure rather than a convenient one. visibleToEvaluatorsOnly now has its own reader, the left-menu Instructions link, returning its name when shown and empty otherwise. Both are reading and locating only: neither asserts anything or decides pass or fail. The runner typecheck on revision 0eb77f3 passed with no diagnostics under adapters/old/, so the author's inability to run tsc leaves no gap. This would change to a return if the reader were shown to still include header text, or to report unbound where the page does render the header.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `0eb77f319a24956dbd2f5cbe64f8508b59964b27`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
