---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "## Rebinding of the \"old\" adapter\n\nAll the calibration findings are fixed in `tests/adapters/old/index.ts`, but none of it has been run yet."
opened: 2026-09-14T23:15:00.587Z
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** ## Rebinding of the "old" adapter

All the calibration findings are fixed in `tests/adapters/old/index.ts`, but none of it has been run yet.

## Rebinding of the "old" adapter

All the calibration findings are fixed in `tests/adapters/old/index.ts`, but none of it has been run yet. The workspace has no TypeScript compiler or Playwright install, and installing them into the scratchpad needed approval I didn't have. So nothing was typechecked or run as a test. I re-read every changed section instead, and fixed one strict-mode type error that way. I also tried the new code's key assumptions about the page against the running target at http://localhost:3000.

### Required fields the input never names
This was behind about thirty of the findings. The Code With Us form's '3. Details' step requires 'Acceptance Criteria*' and 'Evaluation Criteria*', and no test input carries them. Signed in as the administrator, I walked the whole form: Publish only becomes enabled once both are filled.

- **New step:** the create forms' save draft, submit for review and publish now walk every step and fill each required field (label ending in `*`) that is empty and that the test never named. A field the test did name, even as blank, is never touched.
- **Values:** dates follow the form's order, a week apart and at least two weeks out, so deadline, award and start stay valid. Empty choosers get the first option no one else has picked, so a second evaluator isn't the first again. An unanswered yes/no question is answered "No".
- **Publish still disabled:** Publish and Submit for Review return quietly, so the test can read the refusal.
- **Save Draft:** it now fails loudly, quoting the page, if it never reaches the new record's address. On Sprint With Us a title-only draft is refused by the service (a 400 and an "Unable to Save Draft Opportunity" alert). The old version swallowed that and returned as if it had saved.

### Phases, resources and questions
- **Sprint With Us phases:** choosing a starting phase shows that phase and every later one, each folded under its name. `addPhase` picks the phase, unfolds it, and maps `startDate`, `completionDate` and `maxBudget` to that phase's own date and budget fields. It ticks `capabilities` in the same section, and the part-time/full-time mark if one is given.
- **Team With Us resources:** the form opens with an empty "Resource 1". `addResource` now takes `order` (counted from 0) as the slot number and otherwise fills the first empty slot before adding a new one. `addResourceQuestion` works the same way.
- **Enum-style values:** choosers now also try the value in plain words, so "FULL_STACK_DEVELOPER" finds "Full Stack Developer".

### Opportunity edit pages and attachments
- **Actions menu:** a missing or disabled entry there — Publish, Cancel, Delete, Submit for Review — now ends the action quietly as the refusal. On the seeded draft the menu offers only Publish, Edit and Delete.
- **Addenda:** `addAddendum` returns when there is no Addenda tab. Otherwise it confirms the "Publish Addendum?" dialog.
- **Attachments:** the draft's form is read-only until "Edit" is chosen from the Actions menu; after that, '4. Attachments' offers "Add Attachment". The attachment action now chooses Edit when it has to.

### Proposals
- **Individual proponent:** choosing Individual now fills the required legal name and address fields the input left blank.
- **Terms dialog:** it is only reachable through the top-bar Submit, which enables once those fields and the proposal text are filled. When Submit is disabled, the terms actions fill what's missing first.
- **Disqualify:** if the dialog's Disqualify is still disabled, the dialog is cancelled and nothing happens.

### Organizations
- **Saving:** Save Changes confirms the "Save Changes?" dialog. Saving service areas sets each box from the input, then confirms "Are you sure?".
- **Invitations:** `addTeamMembers` finds addresses nested under a user record.
- **Admin rights:** the Team tab shows members by name only, and seed users carry no name. Member actions now look the name up by user id in the organization's membership list (`/api/affiliations`, which the Team tab itself draws on).
  - A disabled box (the owner's) counts as the refusal and is never clicked.
  - Granting admin raises a "Please Confirm" dialog. `acceptOrgAdminTerms` completes it when it's open. When it isn't, the agreement is remembered for the next tick, which then completes the dialog itself.
- **Readings:**
  - `organizationTab` keeps the top-bar controls.
  - `fieldError` reads the "Unable to Add Unregistered Team Members" alert, list items included.
  - The organization list's "—" owner placeholder reads as empty.

### Profiles and content
- **Admin box:** a vendor's profile has none, so toggling returns quietly. On a public sector profile the tick saves at once and shows "Admin Permissions Updated"; the action now waits for that save.
- **Profile save:** a disabled Save Changes ends the action quietly as the refusal.
- **Content publish:** Publish, once enabled, raises "Publish Page?" confirmed by "Publish Page". The press is retried if no dialog appears and reported if one never does. The confirm now uses that label and waits for the page to leave /content/create.

### Not changed
- **Not binding faults:** the reviewer called four failures sound page behaviour: the second test of R-2.34, the edit test of R-1.35, the first test of R-6.17 and the public sector staff test of R-3.21. They are untouched.
- **`bindings.yaml`:** every member these findings touch was already bound, and no page's route failed to resolve.
- **Target state:** my probes left nothing behind. Every dialog was cancelled, the one Admin box I ticked was put back, and the title-only draft was refused, so no record was created.

## Ruling

**Verdict:** approve
**By:** agent:reviewer

The question is whether this adapter binds every surface action and observation on old, and nothing else. Approve. The diff changes only tests/adapters/old/index.ts and the proposal's own .sdlc records. Nothing under tests/acceptance differs from main, and the runner's typecheck passed with no errors under adapters/old. Every change answers an adapter-wrong condition from calibrate-triage-old-4 or old-5. Those are: filling required fields the input never names ('Acceptance Criteria*', 'Evaluation Criteria*', the individual proponent's details); confirming 'Save Changes?', 'Are you sure?' and 'Publish Addendum?'; ending quietly when an Actions-menu entry, the Addenda tab, the dialog's Disqualify or a profile's Save Changes is missing or disabled; choosing Edit before attaching a file; making Save Draft fail loudly when it never reaches the record; mapping the phase and resource keys and 'order'; reading the alert's list items in fieldError; reading the '—' owner placeholder as empty; and waiting for the Admin tick to save. The four failures left untouched are the ones those triages called page behaviour, not binding faults. The adapter still decides nothing about whether a test passes. Each quiet return ends an action and leaves the verdict to an observation the test reads: fieldError must be non-empty in R-3.12, R-4.12 and R-1.16, and the status must be unchanged in R-1.28, so a return that never reached the page cannot make those pass. The auto-fill has two guards that keep it from deciding a refusal. First, a field whose label the test named is never touched, because labels are compared with punctuation and case stripped. Second, hidden fields are skipped. So the four weights in R-1.15 and the phase fields in R-1.16 stay exactly as the tests set them, and the phases nobody opened stay blank. The one API read, memberName's GET /api/affiliations on the target, only turns a user id into the name the Team row shows. The receipt says plainly that nothing was executed. It asserts no test outcome, and the next calibration run is the check on it. Tier is STANDARD and no residual risk is marked unaccepted, so there is nothing to escalate. The ruling would change to return if a revision touched tests/acceptance, or if the auto-fill started writing into a field the test named, including through a null value, which entriesOf drops and so never records as named. It would also change if a quiet return were reachable on a path where the test's following observation reads empty by default.

**Conditions:**
- Note, not blocking: addPhase's PHASES list has 'Proof of Concept' but no 'Prototype', while R-1.16's first test calls addPhase({ phase: 'Prototype' }). That test will stop with 'unbound: no phase named "Prototype"'. If calibration reports it, map 'Prototype' to 'Proof of Concept' in phaseNamed.
- Note, not blocking: namedLabels is keyed by label, not by slot. Naming 'Question' or 'Service Area' for one slot stops the auto-fill for the same label in every other slot. That errs toward a blank field and a refusal rather than a false pass. If a positive test with two resources or questions fails on a disabled Publish, key the set by label and slot.
- Note, not blocking: the adapter now depends on two assumptions that were checked by hand against the running target but not executed as tests. First, a blank chooser is detected by its placeholder in aria-describedby. Second, a field's accessible name is parsed from the start of its ariaSnapshot line. If the next calibration shows required fields still blank on a form, check these two first.

### Runner-owned typecheck evidence

Proposal revision: `04cbe411d524ec86a5f52874d0b443cf21a2f50d`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/old/`, which this proposal answers for.

    No diagnostics.
