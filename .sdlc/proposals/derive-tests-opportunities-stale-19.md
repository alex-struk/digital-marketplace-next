---
gate: G3
question: "Do these tests follow from the opportunities criteria and from nothing else?"
recommendation: "R-1.33 (v2) now has a test at `tests/acceptance/opportunities/R-1.33.spec.ts`."
opened: 2026-10-02T18:18:52.278Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the opportunities criteria and from nothing else?

**Recommendation.** R-1.33 (v2) now has a test at `tests/acceptance/opportunities/R-1.33.spec.ts`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

R-1.33 (v2) now has a test at `tests/acceptance/opportunities/R-1.33.spec.ts`. One clause it can't assert yet stays recorded in `tests/acceptance/not-testable.yaml`. Nothing was run and nothing was type-checked: there are no `node_modules` here and no target to run against.

**What the test covers.** It works through the history-by-request page (`opportunityHistoryRequest`) and has seven `test()` cases, each titled with the criterion's own statement plus the case:

- **Adding a note (three cases).** Each case signs in, stores a fresh file through `fileUpload`, then adds a note of exactly 1,000 characters with that file through `addNoteByRequest`. It checks `requestAccepted`, then reads the history again and expects a `NOTE_ADDED` entry with the note's text and the file's name and identifier. The three cases are:
  - the author (`persona.publicSectorStaff`) on a published Sprint With Us opportunity, `seed.opportunities.swuOpenWithSubmittedProposal`;
  - the author on a published Code With Us opportunity, `seed.opportunities.cwuWithPrivateNote`;
  - an administrator on a cancelled Code With Us opportunity, `seed.opportunities.cwuCancelled`. Cancelled is final, so this case stands for "any point in the opportunity's life".
- **Who sees the seeded note (four cases).** These read `seed.opportunities.cwuWithPrivateNote` and its attached file, `seed.stored_files.opportunityNoteAttachment`:
  - an administrator and the author both see the note, its text, and the file's name and identifier;
  - a signed-in vendor, and a reader who is not signed in, see none of them.

The contract comment says the old service hands the history to a reader with no session. So the signed-out case is where the old system and the criterion should part, and it is expected to fail on the old system.

**What is still not testable.** I rewrote the out-of-date entry dated 2026-09-29, as the contract stage asked. It is now a clause entry beside the test, owned by `contract`, for the clause "but no screen of the application offers a way to add one":
- **Reason (`blocked:`):** `add_note` has been taken off both edit pages, but that is a fact about the contract, not something a test run sees on the target. A target that did show a note control would still pass every test written today.
- **Missing:** an observation on `opportunity-cwu-edit` and `opportunity-swu-edit` (for example `note_control_offered`), read on the History tab as an administrator and as the author, that says whether any control for adding a note is offered.

**Gaps and assumptions the contract stage should know about:**
- **Note-control observation:** this is the one observation I needed and did not find, as described above.
- **Non-author staff reader:** the visibility tests never sign in as a staff member who is not the author. `persona.publicSectorStaffOther` cannot sign in on the oracle's session route, so "only the author" is checked only against a vendor and a signed-out reader. A test with that persona would only run on sandbox-idp targets, if the contract wants one.
- **Note request fields:** the contract describes the input to `add_note_by_request` only as "the note's text and a list of stored file identifiers". I passed `{ text, attachments: [fileId] }`; if the adapter expects other field names, the adding cases will fail on that rather than on the service.

I changed nothing outside `tests/acceptance`.

## Ruling

**Verdict:** return
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: do the R-1.33 tests follow from the criterion and from nothing else? Ruling: return. The added-note cases (author on published SWU and CWU, administrator on cancelled CWU, 1,000-character note with a freshly stored file, read back from the history) and the visibility cases (administrator and author shown; vendor and signed-out reader withheld) each follow from the criterion's text, and NOTE_ADDED is the entry kind the contract's history-request page itself names, not an implementation leak. The not-testable clause entry for 'no screen of the application offers a way to add one' is real: it names the missing observation on both edit screens. But 'visible only to the author and administrators' is never asserted against the reader the word 'only' most directly excludes: a public sector staff member who is not the author. Only a vendor and a signed-out reader are checked, so a target that showed private notes to all government staff passes every case. No clause entry records that gap. The writer omitted it because persona.publicSectorStaffOther cannot sign in on the oracle's session route. But the persona is defined and signs in on sandbox-idp targets, and an oracle sign-in limit is settled at calibration (oracle-cannot), not by leaving the clause unasserted. A clause the writer could assert and did not is a return. A revision that adds that case (or records the clause with a real reason) and is otherwise unchanged would be approved.

**Conditions:**
- Add a case to tests/acceptance/opportunities/R-1.33.spec.ts that signs in as persona.publicSectorStaffOther (a public sector staff member who is not the author of seed.opportunities.cwuWithPrivateNote) and expects the seeded private note's text, its file's name and its file's identifier to be withheld from the history, in the same way as the vendor and signed-out cases. The criterion says the note is visible only to the author and administrators, and a non-author staff reader is the case 'only' most directly excludes. That the oracle cannot sign this persona in is settled at calibration, not by omitting the assertion. If you judge the clause genuinely cannot be asserted through the surface, instead add a not-testable.yaml entry for R-1.33 with clause 'visible only to the author and administrators' (as it applies to non-author staff), naming what the surface lacks.

### Runner-owned typecheck evidence

Proposal revision: `b8cf064fc45922fd35a5f72a3204300d2a66a956`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `acceptance/opportunities/`, which this proposal answers for.

    No diagnostics.
