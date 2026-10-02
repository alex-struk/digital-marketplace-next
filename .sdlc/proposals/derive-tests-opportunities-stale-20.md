---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "R-1.33 now has a complete test and no entry left in `tests/acceptance/not-testable.yaml`."
opened: 2026-10-02T18:43:50.128Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** R-1.33 now has a complete test and no entry left in `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-1.33 now has a complete test and no entry left in `tests/acceptance/not-testable.yaml`. I could not run the type-checker or the tests: running `tsc` and `python3` needed approval nobody could give, so the file has been read through but never compiled or run.

**What changed.** R-1.33 was the only criterion handed back this run. It already had a test file, plus an entry for its last clause: "but no screen of the application offers a way to add one". That clause was blocked because nothing on the edit screens reported whether a note control was offered. The contract has now added the `note_control_offered` observation on `opportunity-cwu-edit` and `opportunity-swu-edit`, read on the History tab. With that in place, I added four tests to `tests/acceptance/opportunities/R-1.33.spec.ts`, one for each combination of:
- **Reader:** the administrator, or the opportunity's author (`persona.publicSectorStaff`).
- **Opportunity:** the Code With Us one (`seed.opportunities.cwuWithPrivateNote`) or the Sprint With Us one (`seed.opportunities.swuOpenWithSubmittedProposal`).

**How each new test works.**
- It first reads the history through `opportunity-history-request` and checks it is shown. On the Code With Us opportunity it also checks the seeded private note and its file are there. This way "no control" cannot simply mean the tab never appeared.
- It then opens the edit page and requires `noteControlOffered()` to read exactly `false`. An empty or unreadable value fails, so a missing observation can't pass as "no control offered".

I also replaced the file's header comment, which pointed to the not-testable entry, with a description of how the clause is now tested. The earlier tests are unchanged:
- Notes with files are added through `add_note_by_request` by the author on a published Sprint With Us and a published Code With Us opportunity, and by an administrator on a cancelled Code With Us one.
- The seeded private note and its file are shown to the administrator and the author.
- They are withheld from a staff member who is not the author, a signed-in vendor, and someone not signed in.

**Entry removed.** I deleted the R-1.33 entry from `tests/acceptance/not-testable.yaml`. It was the last entry in the file, and what remains reads cleanly when viewed. A criterion is either tested or recorded as untestable, never both.

**One thing to check.** The earlier tests attach their file with `uploadFile({ name, content })`, the same shape the existing `files/R-8.24` test uses. The convention for naming a test file is `{ file: ... }`. I kept `name` to stay consistent with the passing suite. If the harness adapter only accepts `file`, both tests need the same fix.

**Totals.** One criterion was owed and one now has a test. None remain untestable. No surface action or observation was missing for this criterion. I touched nothing outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether the four new R-1.33 tests follow from the criterion and nothing else. They do. The criterion's last clause says no screen of the application offers a way to add a private note. Each new test requires `noteControlOffered()` to read exactly `false` on the History tab of the Code With Us and Sprint With Us edit screens. It asks the two readers who can see that tab, the administrator and the opportunity's author, so a hidden tab can't fake the answer. Before that, each test confirms the history is shown, so a tab that never appeared cannot pass as 'no control'. Every assertion comes from what the criterion says. The tests reach the application only through contract surface names (`opportunity-cwu-edit`, `opportunity-swu-edit`, `note_control_offered`, `opportunity-history-request`), with no selector, route, table or status code. The earlier tests already assert the remaining clauses: notes with files are accepted from the author and an administrator at more than one point in the opportunity's life, they appear in the history, and they are hidden from a staff member who is not the author, a vendor, and someone not signed in. With the last clause now asserted, removing the R-1.33 entry from `tests/acceptance/not-testable.yaml` is correct. The runner's typecheck on this revision passed with no diagnostics. `missing-test/R-1.33` is not settled by this ruling and I attach nothing for it: a test asserting its clause now exists, so a test is still owed and should not be withdrawn, and the first run of that test at the current version closes it. Changes that would reverse this ruling: a run showing the adapter cannot bind `noteControlOffered`, which would put the criterion back on the binding stage, or evidence that the `uploadFile({ name, content })` shape the earlier tests use is not what the harness accepts.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `5104ff4a7808f9b58e35006f552b7c4aaf54e7d6`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
