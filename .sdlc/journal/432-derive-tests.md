---
stage: "derive-tests"
title: "derive tests"
at: "2026-10-03T00:19:51.817Z"
cost: 0.380268
turns: 13
session: "a9bac84f-6554-4839-b43d-f435402d4ffe"
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

R-7.29 now has a full test, and its entry is gone from `tests/acceptance/not-testable.yaml`. I couldn't confirm that the file type-checks: running `tsc` needed approval nobody could give, so it was never run. The method I added, `pageMessages()`, is declared on the screen's page in `tests/generated/surface.d.ts`, and everything else in the file is unchanged.

**What changed.** The test file `tests/acceptance/content/R-7.29.spec.ts` was already there. Each of its three tests runs only against an instance started in its own setting, which the tag selects:
- **`@service_page_absent`:** the Sprint With Us opportunity screen's scope section is empty while the rest of the opportunity is shown.
- **`@evaluation_instructions_absent_swu` and `@evaluation_instructions_absent_twu`:** the Sprint With Us and Team With Us evaluation instruction screens show an empty instructions body while the screen still loads.

The criterion's outcome also says the scope section is empty "with nothing said about why", and no test checked that part. The entry in `not-testable.yaml` named exactly that clause, owed to `contract`. The contract has now added `page_messages` to the Sprint With Us opportunity screen: the text of every notice, alert or error the screen shows outside its sections. It is empty for `seed.opportunities.closedSprintWithUs` opened by `persona.vendor` when the page is present. So in the `@service_page_absent` test, I now read `surface.opportunitySwuView.pageMessages()` directly and assert it is empty, next to the existing check on the scope section. I updated the `derived` date in the header to 2026-10-03.

**Not testable:** nothing is left for R-7.29.

**Missing from the surface:** nothing that the criterion as stated needs. One thing could be added: the evaluation instruction screens have no messages observation like `page_messages`. The criterion only mentions those screens in a note ("a panel can be shown a blank instruction screen and told nothing"), not in its given/when/then, so I recorded nothing for it. If ratify promotes that note to a stated outcome, the contract would need a `page_messages` on both evaluation instruction screens.

I touched no file outside `tests/acceptance`.