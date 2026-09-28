| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-28T19:23:58.912Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.282 (Claude Code)) |

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** I rewrote all four criteria in the opportunities domain as tests.

**Worked by:** claude claude-opus-5-5 (2.1.282 (Claude Code))

I rewrote all four criteria in the opportunities domain as tests. Three of them also have their own `.spec.ts` rewritten against the ruling. R-1.9 has one partial-clause entry in `not-testable.yaml`. Nothing has been run: the workspace has no application, and I was not allowed to run the TypeScript type check (`tsc --noEmit`), so the four files have only been checked by reading them.

**R-1.9 (v2).** A member of public sector staff saves a Code With Us draft with only a title. The test checks that the draft is stored: it has an identifier, the form shows no error, and it appears in the author's own dashboard list. It then checks the proposal deadline shown on the opportunity's page.
- **What the ruling fixed:** the expected day is now worked out in Pacific time (America/Vancouver), not in the test runner's own time zone. It is taken both just before and just after saving, so a save that crosses midnight Pacific accepts either day. The check looks for that day of the month as a whole number, plus the year.
- **Partial entry:** it names the clause about the assignment date, the start date, the completion date being left empty, and the "invalid" half of the rule. The reason starts with `blocked:`. No page shows an assignment, start or completion date; only `proposal_deadline` is observable. Nothing says how to hand `save_draft` a date that is present but invalid. Owner is `contract`.

**R-1.16 (v1).** Two tests, one for each half of the statement.
- **Implementation phase (what the ruling fixed):** an administrator publishes a Sprint With Us opportunity that names only a prototype phase, and the test no longer demands a refusal message. If the publish produced an opportunity, its phases must include an implementation phase. If it did not, the title must be absent from the administrator's dashboard. Either way, no Sprint With Us opportunity ended up published without one.
- **Inception without prototype:** kept as before — inception plus implementation, no prototype, is refused. The dates now use Pacific days.

**R-1.27 (v1).** Uses the seeded awarded opportunities for Code With Us and Sprint With Us, looked at by a visitor and by an administrator. In both cases the award is established by the winner, Northern Pines, being named.
- **Visitor:** the winner is named. No contact details and no score appear anywhere the visitor can reach: the opportunity page, the award summary tab on the management screen, or the winning proposal.
- **Administrator (what the ruling fixed):** contact details and score no longer have to be on the opportunity's own page. It is enough that each appears somewhere the administrator sees the award: the opportunity page, the award summary tab, or the winning proposal (its proponent, its proposal tab and its score).
- **How contact details are recognised:** off the opportunity page they are matched by the owner's email from the seed. I took that address from the seeded organization's own row. It is the organization's contact email, but the handle list names it only as the owner's email.
- **How the score is recognised:** by the proposal's score observation, or, for Code With Us, by the seeded score of 91 appearing in the summary.

**R-1.29 (v2).** The old file was at v1. The criterion now states only what is withheld, so the single test checks that a signed-out visitor and a vendor see neither name on the seeded published Code With Us opportunity. It asserts nothing about what administrators or the authors see, since the criterion does not promise that. It first confirms the page actually opened, so empty names cannot come from a page that never loaded.

**What the contract should add:**
- `assignment_date`, `start_date` and `completion_date` observations on the three opportunity view (or edit) screens.
- A stated input shape for `save_draft` that can carry an invalid date.
- A single observation on the edit screens for the award summary's contact details and score. `summary_tab` is free text, which is why the R-1.27 test has to match seeded values in it.

Nothing asked me to change any read-only path, and I changed none.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.282 (Claude Code))

Question: do these four opportunities tests follow from their criteria and from nothing else? Return. R-1.29 asserts only what its criterion withholds, from two readers who are neither an administrator nor the authors, after confirming the page opened. R-1.27 asserts the winner's name for both readers, contact details and score withheld everywhere a visitor can reach, and each shown somewhere an administrator sees the award, which matches its statement. R-1.9 asserts the stored draft, no validation error and the fourteen-day proposal deadline in Pacific days, and its partial not-testable entry is real: the contract's opportunity view screens name proposal_deadline and no assignment, start or completion date, and nothing gives save_draft a present-but-invalid date. The typecheck failure is in adapters/new only; nothing under acceptance/opportunities was reported. The defect is R-1.16's second test. Its criterion's then-clause says the submission is rejected with a message saying a prototype phase must follow an inception phase, but the test only asserts that some field error is present (R-1.16.spec.ts line 109). Any validation error would pass it, and it does not establish the opportunity was not published. The field_error observation returns text, so the message's content can be asserted; with no not-testable clause entry, the test's first pass would close the criterion with that clause owed by nobody. The earlier redo instruction to keep that test as written does not override the criterion. The first R-1.16 test also swallows read failures in both branches, so an unreadable dashboard passes it; the rewrite should not let a read failure count as the rule holding. This ruling becomes an approval once the inception test asserts that the refusal names a prototype phase having to accompany or follow the inception phase and that the opportunity did not end up published, with the other three tests unchanged.

**Conditions:**
- R-1.16 (inception without prototype): assert that the error shown says a prototype phase must accompany or follow the inception phase (for example, field_error mentions both prototype and inception), not only that some error is present; and assert that the opportunity did not end up published. This supersedes the earlier redo instruction to keep this test as written.
- R-1.16 (implementation phase): do not let a failed read count as the rule holding. If neither an opportunity identifier nor the dashboard can be read, the test must fail rather than pass on an empty string.

### Runner-owned typecheck evidence

Proposal revision: `4f35343a2e2e81764389a2afd117159fb2ee3cf3`
Typecheck: **failed**; exit code: 2.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    

Diagnostics elsewhere in the suite, which this proposal does not answer for:

    adapters/new/: 2 diagnostics
