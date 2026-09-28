---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "I wrote the one test owed for R-1.9 (v2) in `tests/acceptance/opportunities/R-1.9.spec.ts` and removed its entry from `tests/acceptance/not-testable.yaml`."
opened: 2026-09-28T19:50:41.062Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.282 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I wrote the one test owed for R-1.9 (v2) in `tests/acceptance/opportunities/R-1.9.spec.ts` and removed its entry from `tests/acceptance/not-testable.yaml`.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I wrote the one test owed for R-1.9 (v2) in `tests/acceptance/opportunities/R-1.9.spec.ts` and removed its entry from `tests/acceptance/not-testable.yaml`. It now has a test file and no entry. I could not type-check or run it: the permission mode here would not approve running `tsc`, and there is no app in this workspace to run against. I checked the types by reading them against `surface.d.ts`.

**Why it can be tested now.** When the entry was written, only the proposal deadline could be read back, and the contract did not say how an invalid date is given to `save_draft`. The contract stage has since added both:
- **New observations:** the edit screens now show the dates as a calendar day, or empty when the opportunity has none. Code With Us and Team With Us show `proposal_deadline`, `assignment_date`, `start_date` and `completion_date`; Sprint With Us shows the first two. The view screens gained the same observations for their own dates.
- **Stated input:** the three create screens now say `save_draft` takes `title` and the program's dates as `YYYY-MM-DD`. Any key left out leaves that field blank, and the value is sent as entered. The contract names `2000-01-01` as invalid for all four dates.

**What the test does.** The criterion's full statement is the `describe` title. Inside it are six tests: Code With Us, Sprint With Us and Team With Us, each once with the dates left out and once with every date the program holds set to `2000-01-01`. Each test:
1. Signs in as `persona.publicSectorStaff` and saves a draft with a title and those dates.
2. Checks the form shows no field error.
3. Checks the draft got an identifier and appears in the author's dashboard table.
4. Opens the program's edit screen and checks the proposal deadline and assignment date, plus the start date where the program has one, are fourteen days from the day of saving.
5. Where the program has a completion date, checks it is empty.

"Fourteen days from the day of saving" is worked out in Pacific time. It is taken just before and just after saving, so a save that crosses midnight passes on either day. The contract doesn't fix how dates are displayed, so the check is that the expected day of the month and year both appear. A draft that kept `2000-01-01` would fail that.

**One judgement call.** In the invalid case the test also enters `2000-01-01` as the completion date and expects it to come back empty. I read "its completion date is left empty" as covering an invalid completion date too. If the later ruling disagrees, the check to change is the completion date in the invalid cases.

The Sprint With Us cases check only the proposal deadline and assignment date. The contract says its start and completion dates belong to its phases, so the criterion's start-date and completion-date clauses are checked on Code With Us and Team With Us, which hold all four dates.

**Needed but not found:** nothing. No criterion in this run is recorded as untestable, and I did not change any file outside `tests/acceptance`.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

The question is whether R-1.9.spec.ts follows from R-1.9 v2 and nothing else. It does. Six tests cover the three programs, once with the dates missing and once with all dates set to the contract-named invalid value. They assert that the draft is stored (it gets an identifier and appears in the author's table), that no field error is raised, that the proposal deadline, assignment date and start date are fourteen days from the day of saving in Pacific time, and that the completion date is empty. Every clause of the criterion is asserted, so removing its not-testable entry is correct. Sprint With Us is checked on only two dates, which the contract justifies by assigning its start and completion dates to its phases. Both clauses are still asserted on Code With Us and Team With Us. Reading an entered invalid completion date as one that must come back empty is faithful to 'left empty'. No selectors, routes or storage details leak in. The runner's typecheck reports no errors under acceptance/opportunities; its only two errors are in adapters/new, which this proposal does not touch. The open missing-test/R-1.9 closes when this test first runs at v2, so no condition is needed for it. A type error in this spec, or a contract statement that an entered completion date is kept, would change the ruling.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `224a3b163a257c21046f522e93c67db45f77cebd`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
