---
gate: G3
question: "Does slice 13 (An organization can qualify for Sprint With Us and Team With Us) do what its criteria say?"
recommendation: "I made no changes to the application in this revision."
opened: 2026-10-03T19:07:20.177Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Does slice 13 (An organization can qualify for Sprint With Us and Team With Us) do what its criteria say?

**Recommendation.** I made no changes to the application in this revision.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made no changes to the application in this revision. The ruling says the backend and screen code already match R-3.25 to R-3.28. It traces every failure to the test adapter's bindings, and all four of its conditions are addressed to the bind-adapter stage, not to this one. Nothing under `app/` or `docs/decisions/` was named for correction, so I left the slice as it was submitted.

Before deciding that, I checked the evidence against the ruling's reading. The outline in `.sdlc/evidence/slice-13/R-3.25.txt` shows the Sprint With Us tab doing what the criterion asks. Each requirement is one list item in the list named "Sprint With Us requirements", reading "Met …" or "Not met …". The tab also has the "not qualified" note and a link to the terms page. The adapter was wrong in four ways, none of them in the application:
- **R-3.25:** it read only the label line, so the Met or Not met status beside it was lost.
- **R-3.28:** it read service-area approvals only from checkboxes. The Team With Us tab draws those only after "Edit service areas" is pressed; before that, approvals are list items under "Approved service areas".
- **R-3.26:** it was blocked by the same empty read.
- **R-3.27:** its binding describes an earlier build where the terms page did not exist.

I considered changing the markup to suit the adapter, such as putting the status badge on the same text line as the label. I decided against it: the markup already matches the catalogue and the contract, and the fix the ruling asks for is on the adapter's side.

The workspace had no installed dependencies, so the first `npm --prefix app run check` failed because the TypeScript compiler (`tsc`) was missing. After installing dependencies with `npm ci`, the check passed:
- **First package:** 16 tests.
- **Backend:** 570 tests.
- **Frontend:** 384 tests.

The one error line in the output comes from a test that deliberately simulates a failed mail delivery.

The slice can't be approved until bind-adapter applies the four fixes and the acceptance tests are run again (verify); only that run will produce a passing result. The rest of the slice is in place for the next one: the qualification tabs, the terms pages with one-time acceptance, the administrator's service-area approvals and the qualified marks.
