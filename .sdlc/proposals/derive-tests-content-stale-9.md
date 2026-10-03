---
gate: G3
question: "Do these tests follow from the content criteria and from nothing else?"
recommendation: "R-7.29 now has a full test, and its entry is gone from `tests/acceptance/not-testable.yaml`."
opened: 2026-10-03T00:19:51.857Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the content criteria and from nothing else?

**Recommendation.** R-7.29 now has a full test, and its entry is gone from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-7.29 now has a full test, and its entry is gone from `tests/acceptance/not-testable.yaml`. I couldn't confirm that the file type-checks: running `tsc` needed approval nobody could give, so it was never run. The method I added, `pageMessages()`, is declared on the screen's page in `tests/generated/surface.d.ts`, and everything else in the file is unchanged.

**What changed.** The test file `tests/acceptance/content/R-7.29.spec.ts` was already there. Each of its three tests runs only against an instance started in its own setting, which the tag selects:
- **`@service_page_absent`:** the Sprint With Us opportunity screen's scope section is empty while the rest of the opportunity is shown.
- **`@evaluation_instructions_absent_swu` and `@evaluation_instructions_absent_twu`:** the Sprint With Us and Team With Us evaluation instruction screens show an empty instructions body while the screen still loads.

The criterion's outcome also says the scope section is empty "with nothing said about why", and no test checked that part. The entry in `not-testable.yaml` named exactly that clause, owed to `contract`. The contract has now added `page_messages` to the Sprint With Us opportunity screen: the text of every notice, alert or error the screen shows outside its sections. It is empty for `seed.opportunities.closedSprintWithUs` opened by `persona.vendor` when the page is present. So in the `@service_page_absent` test, I now read `surface.opportunitySwuView.pageMessages()` directly and assert it is empty, next to the existing check on the scope section. I updated the `derived` date in the header to 2026-10-03.

**Not testable:** nothing is left for R-7.29.

**Missing from the surface:** nothing that the criterion as stated needs. One thing could be added: the evaluation instruction screens have no messages observation like `page_messages`. The criterion only mentions those screens in a note ("a panel can be shown a blank instruction screen and told nothing"), not in its given/when/then, so I recorded nothing for it. If ratify promotes that note to a stated outcome, the contract would need a `page_messages` on both evaluation instruction screens.

I touched no file outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-7.29 tests follow from the criterion and nothing else? Approve. The criterion's outcome is that the opportunity is shown in full and the scope section is empty 'with nothing said about why'. The one new assertion reads opportunitySwuView.pageMessages() on the service_page_absent instance and requires it to be empty, which is exactly that clause. The observation exists in the contract (spec/contract/surface.yaml page_messages, documented as empty under the default so any message under service_page_absent is one the missing page caused) and in tests/generated/surface.d.ts. It leaks no selector, route or status, and the runner's typecheck of acceptance/content passed with no diagnostics. With the clause asserted, every clause of the given/when/then has a test, so removing the R-7.29 entry from not-testable.yaml is correct. The evaluation-instruction tests are unchanged, and the writer rightly added no message assertion there because the criterion names those screens only in a note. No file outside tests/acceptance changed. missing-test/R-7.29 stays open until this test runs, which a ruling cannot settle. This would change to a return if page_messages were shown to cover text inside the screen's sections, or were not empty under the default configuration, because the assertion would then not isolate the missing page.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `63fdbf25345ebbdac7d778b36831976ff2b4f116`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/content/`, which this proposal answers for.

    No diagnostics.
