---
gate: G1
question: "Is this the contract the tests will act through?"
recommendation: "I added the seeded private note the build ruling asked for and supplied what both owed missing tests needed."
opened: 2026-10-02T16:15:47.649Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Is this the contract the tests will act through?

**Recommendation.** I added the seeded private note the build ruling asked for and supplied what both owed missing tests needed.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the seeded private note the build ruling asked for and supplied what both owed missing tests needed. The oracle started with the new seed loaded, and I took it down again afterwards.

**R-1.33: seeded private note, as the ruling asked.** The new seed file is `tests/seed/016-opportunity-note-and-cancellation.sql`. It adds `opportunities.cwuWithPrivateNote`: a published Code With Us opportunity whose author is `users.staffOne`. Its proposal deadline is in 2030, so the process that closes lapsed opportunities leaves it alone. Its history holds a note by the author with one file attached, `stored_files.opportunityNoteAttachment`. The rows are the same ones the old service writes when it accepts a note: a history row with the event `NOTE_ADDED` and no status, plus a row linking the file to that event. The tests read the history through a new request page, `opportunity-history-request`. It offers:
- an action, `add_note_by_request`;
- observations `history_shown`, `history_entries`, `request_accepted`, `refusal_messages` and `refusal_status`.

**Defect found in the old service.** Running against the oracle, the history came back to:
- the administrator: note and attachment included;
- the author: note and attachment included;
- a signed-in vendor: no history at all;
- a request with no session: the full history, private note and attachment included.

The cause is in the old code. When nobody is signed in, it removes the author from the record. It then checks whether the record's author equals the signed-in person, and two empty values count as equal. The page's comment and the manifest describe this, so a signed-out reading is where R-1.33 separates the old application from the criterion. That is a defect in the old application, not a problem with the seed. The schemas the service returns already cover these reads and updates, so `openapi.yaml` is unchanged.

**R-1.20: status changes the permitted path does not allow (owed missing test).** I added a page, `opportunity-status-request`. Its action, `request_status_change`, takes `{ status }`, and its observations are `request_accepted`, `refusal_status`, `refusal_messages` and `stored_status`. The old service has no single "set status" operation, so the page maps each target status to the operation that leads to it:

| Target status | Operation | Programs |
|---|---|---|
| `UNDER_REVIEW` | submit for review | all |
| `PUBLISHED` | publish | all |
| `CANCELED` | cancel | all |
| `EVAL_CC` | start the code challenge | Sprint With Us |
| `EVAL_SCENARIO` | start the team scenario | Sprint With Us |
| `EVAL_C` | start the challenge | Team With Us |

Code With Us has no operation that moves an opportunity into evaluation; it gets there only when its deadline passes. So the "draft straight to an evaluation stage" case must be asked of Sprint With Us or Team With Us. I also seeded `opportunities.cwuCancelled`, an opportunity already cancelled by the administrator. Against the oracle, asking either the cancelled one or the seeded awarded Code With Us opportunity to publish again was refused. Both refusals came back as 401 with "You do not have permission to perform this action.", and the cancelled one still read `CANCELED` afterwards.

**R-6.17: deactivated accounts receive nothing (owed missing test).** The owed item asked for another kind of notification an active vendor receives, and for an action that sends it without going through the organization screens. I named one in `observables.yaml` under `email.received_by_an_active_vendor`: the announcement "A New Code With Us Opportunity Has Been Posted". It is sent when the administrator publishes a Code With Us opportunity, either through `opportunity-cwu-edit.publish` on the seeded draft or through `opportunity-cwu-create.publish`. Both accounts the test needs already exist:
- `users.vendorOne` is active with notices on, so it should receive the announcement.
- `users.vendorDeactivated` has notices on and is already deactivated, so no test has to deactivate anyone first.

The same entry also notes that deactivating an account through the screens sends that account a notice at that moment. A test that deactivates someone itself should judge only messages sent afterwards.

**Oracle run.** It came up on the first attempt with the compose override unchanged. All 78 migrations ran, and the seed records are visible through the application itself. I ran `oracle down` before finishing.

**Other changes.** `tests/seed/manifest.yaml` now lists the new seed file, both new opportunity handles and the new stored file, with a few counts and wording updated to match. Personas, the OpenAPI document and the compose override are unchanged, and no page was removed.

re-address missing-test/R-1.20 to derive-tests: added page opportunity-status-request (request_status_change taking { status }; request_accepted, refusal_status, refusal_messages, stored_status) and seed.opportunities.cwuCancelled
re-address missing-test/R-6.17 to derive-tests: added email.received_by_an_active_vendor in observables.yaml — the new-opportunity announcement, sent by opportunity-cwu-edit.publish (on seed.opportunities.draftOfOtherStaff) or opportunity-cwu-create.publish as persona.administrator, with users.vendorOne as the active recipient and users.vendorDeactivated as the seeded deactivated account

## Ruling

**Verdict:** approve
**By:** agent:product-owner
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: is this the contract the tests will act through for R-1.33, R-1.20 and R-6.17? Ruling: approve. The new seed 016 adds opportunities.cwuWithPrivateNote. It is a published Code With Us opportunity with a 2030 deadline. Its history holds a NOTE_ADDED row by its author, users.staffOne, with stored_files.opportunityNoteAttachment linked through cwuOpportunityNoteAttachments, which is what the service writes when it accepts a note. The seed also adds opportunities.cwuCancelled, which was published and then cancelled by the administrator. Every new id is unique against the existing seed files. The author and administrator ids match users.staffOne and users.administratorOne in the manifest. That settles the contract revision request build-slice-9-3#3. The opportunity-history-request page exposes history_shown and history_entries, which separate 'answered with no history' from a refusal, and that is the observation R-1.33 turns on. The opportunity-status-request page maps each target status to the named operation the old service uses, and the page states plainly that Code With Us has no operation into evaluation, so the 'draft straight to evaluation' case is correctly sent to Sprint With Us or Team With Us. The oracle run refused the awarded and cancelled cases and left the status unchanged. For R-6.17, the new-opportunity announcement is a sound 'any other kind' of notification: the seed already records users.vendorDeactivated in seed-notices-do-not-receive as 'setting on, but deactivated', with users.vendorOne in the receiving group, and draftOfOtherStaff is a seeded Code With Us draft the administrator can publish. The caveat about the notice sent at the moment of deactivation is correct and needed. The page records that the old service shows the full history, private note and attachment included, to a request with no session. That is a defect in the old application, not in the seed. It is expected to come back at calibration as defect-in-old R-1.33, and the contract stating it in advance is the honest handling. No criterion's wording or confidence changes. The missing-test items for R-1.20 and R-6.17 stay open until their tests run. The NoteForm removal (build-slice-9-3#6, owed by build) and the add_note surface removal (request/build-slice-9-3#2, owed by design) are not settled here and stay open. What would change the ruling: seed rows that differ from what the old service's addCWUOpportunityNote writes, or observations that cannot tell 'no history shown' apart from 'refused'.

**Conditions:**
none
